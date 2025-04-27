"use client"

import * as React from "react"
import {
  IconHelp,
  IconSearch,
  IconSettings,
  IconWebhook,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav/nav-main"
import { NavSettings } from "@/components/nav/nav-settings"
import { NavUser } from "@/components/nav/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import {
  BookOpen,
  Brain,
  Calendar,
  CalendarClock,
  ChartColumn,
  Key,
  ListCheck,
  Plug,
  SendToBack,
  Tags,
} from "lucide-react"
import Image from "next/image"
import LogoImage from "../../public/favicon.svg"

const data = {
  navMain: [
    {
      title: "Tasks (testing)",
      url: "/tasks",
      icon: <ListCheck size={18} />,
    },
    {
      title: "Event Types",
      url: "/event-types",
      icon: <Tags size={18} />,
    },
    {
      title: "Bookings",
      url: "/bookings",
      icon: <Calendar size={18} />,
    },
    {
      title: "Connectors",
      url: "/connectors",
      icon: <Plug size={18} />,
    },
    {
      title: "Agent Canvas",
      url: "/agent-canvas",
      icon: <SendToBack size={18} />,
    },
    {
      title: "Knowledge Base",
      url: "/knowledge-base",
      icon: <Brain size={18} />,
    },
    // {
    //   title: "Monitoring",
    //   url: "/monitoring",
    //   icon: <ChartColumn size={18} />,
    // },
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
