"use client"

import * as React from "react"
import {
  IconDashboard,
  IconFileWord,
  IconHelp,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconWebhook,
} from "@tabler/icons-react"

import { NavSecondary } from "@/components/nav/nav-secondary"
import { NavMain } from "@/components/nav/nav-main"
import { NavSettings } from "@/components/nav/nav-settings"
import { NavUser } from "@/components/nav/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import {
  BookOpen,
  Brain,
  Calendar,
  ChartColumn,
  FileText,
  Key,
  Layout,
  Link,
  ListCheck,
  Plug,
  SendToBack,
  WebhookIcon,
  Workflow,
} from "lucide-react"
import { Separator } from "@workspace/ui/components/separator"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Tasks (testing)",
      url: "/tasks",
      icon: <ListCheck size={18} />,
    },
    {
      title: "Bookings",
      url: "/bookings",
      icon: <Calendar size={18} />,
    },
    {
      title: "Event Types",
      url: "/event-types",
      icon: <Link size={18} />,
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
    {
      title: "Monitoring",
      url: "/monitoring",
      icon: <ChartColumn size={18} />,
    },
  ],

  documents: [
    {
      title: "Webhooks",
      url: "#",
      icon: <IconWebhook size={18} />,
    },
    {
      title: "API Keys",
      url: "#",
      icon: <Key size={18} />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
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
              className="data-[slot=sidebar-menu-button]:!p-2"
              variant={"default"}
            >
              <a href="#">
                <BookOpen className="!size-5" />
                <span className="text-lg font-semibold">Booker</span>
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
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
