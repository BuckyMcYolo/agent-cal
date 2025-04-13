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
import { NavSecondary } from "../nav-secondary"

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
        <SidebarMenu>
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
        </SidebarMenu>
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
