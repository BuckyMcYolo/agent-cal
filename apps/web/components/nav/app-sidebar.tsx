"use client"

import { IconHelp, IconSearch, IconSettings } from "@tabler/icons-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { Key, LayoutDashboard } from "lucide-react"
import Image from "next/image"
import type * as React from "react"
import { NavMain } from "@/components/nav/nav-main"
import { NavSettings } from "@/components/nav/nav-settings"
import { NavUser } from "@/components/nav/nav-user"
import LogoImage from "../../public/favicon.svg"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      title: "API Keys",
      url: "/settings/developers/api-keys",
      icon: <Key size={18} />,
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "/settings/account",
      icon: <IconSettings size={18} />,
    },
    {
      title: "Get Help",
      url: "#",
      icon: <IconHelp size={18} />,
    },
    {
      title: "Search",
      url: "#",
      icon: <IconSearch size={18} />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-0 data-[state=collapsed]:!p-0"
              variant={"default"}
            >
              <a href="#">
                <Image
                  src={LogoImage}
                  alt="logo"
                  width={40}
                  height={40}
                  className="size-7 rounded-sm shrink-0 transition-all duration-400 group-data-[collapsible=icon]:translate-x-0.5"
                />
                <span className="text-lg font-semibold">AgentCal</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavSecondary items={data.documents} /> */}
        <NavSettings items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
