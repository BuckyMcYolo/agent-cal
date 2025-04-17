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
  ArrowBigLeft,
  BookOpen,
  Brain,
  CalendarClock,
  ChartColumn,
  Key,
  ListCheck,
  Plug,
  SendToBack,
  Tags,
  User,
} from "lucide-react"
import Link from "next/link"
import { NavSecondary } from "./nav-secondary"
import Image from "next/image"
import LogoImage from "../../public/favicon.svg"

const data = {
  user: [
    {
      title: "Account",
      url: "/settings/account",
      icon: <User size={18} />,
    },
    {
      title: "Billing",
      url: "/settings/billing",
      icon: <BookOpen size={18} />,
    },
    {
      title: "Integrations",
      url: "/settings/integrations",
      icon: <Brain size={18} />,
    },
  ],
  documents: [
    {
      title: "Webhooks",
      url: "/settings/webhooks",
      icon: <IconWebhook size={18} />,
    },
    {
      title: "API Keys",
      url: "/settings/api-keys",
      icon: <Key size={18} />,
    },
  ],
  navSecondary: [
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

export function SettingsSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-2"
              variant={"default"}
            >
              <Link href="/event-types">
                <ArrowBigLeft className="!size-5" />
                <span className="text-lg font-semibold">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu> */}
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
                  className="h-6 w-6 rounded-sm shrink-0 transition-all duration-400 group-data-[collapsible=icon]:translate-x-1"
                />
                <span className="text-lg font-semibold">AgentCal</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu className="mt-6">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Link href="/event-types">
                <ArrowBigLeft className="h-4 w-4" />
                <span>Back to Calendar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-2 px-3">
          <h2 className="text-lg font-semibold text-accent-foreground">
            Settings
          </h2>
          <p className="text-xs text-muted-foreground">Manage your account</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavSecondary items={data.user} title="User Settings" />
        <NavSecondary items={data.documents} title="Developers" />
        <NavSettings items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
