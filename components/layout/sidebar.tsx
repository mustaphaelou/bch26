"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar";
import {
    DashboardSquare02Icon,
    Invoice02Icon,
    UserGroupIcon,
    Add01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const menuItems = [
    {
        title: "Tableau de Bord",
        url: "/",
        icon: DashboardSquare02Icon,
    },
    {
        title: "Bons de Commande",
        url: "/bons",
        icon: Invoice02Icon,
    },
    {
        title: "Nouveau BC",
        url: "/bons/nouveau",
        icon: Add01Icon,
    },
    {
        title: "Fournisseurs",
        url: "/fournisseurs",
        icon: UserGroupIcon,
    },
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar>
            <SidebarHeader className="border-b px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                        BC
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">BCH26</h2>
                        <p className="text-xs text-muted-foreground">
                            Gestion des Commandes
                        </p>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => {
                                const isActive =
                                    item.url === "/"
                                        ? pathname === "/"
                                        : pathname.startsWith(item.url);
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={isActive}>
                                            <Link href={item.url}>
                                                <HugeiconsIcon
                                                    icon={item.icon}
                                                    size={18}
                                                />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t px-4 py-3">
                <p className="text-xs text-muted-foreground text-center">
                    HAY 2010 Sarl © {new Date().getFullYear()}
                </p>
            </SidebarFooter>
        </Sidebar>
    );
}
