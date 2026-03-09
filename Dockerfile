FROM node:22-alpine AS base

# Install dependencies only when needed
# libc6-compat and openssl are often needed for Prisma and other native modules on Alpine
RUN apk add --no-cache libc6-compat openssl curl

# Set working directory
WORKDIR /app

# Step 1: Install dependencies
FROM base AS deps
# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Step 2: Build the application
FROM base AS builder
# Provide a placeholder DATABASE_URL for build-time prisma generate and next build
# This prevents crashes if the app initializes Prisma on import
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
# This must happen BEFORE npm run build
RUN npx prisma generate

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Step 3: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and migrations for runtime engine access
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to 0.0.0.0 to enable access from outside the container
ENV HOSTNAME="0.0.0.0"

# Optional: Add a healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]
