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
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav/nav-documents"
import { NavMain } from "@/components/nav/nav-main"
import { NavSecondary } from "@/components/nav/nav-secondary"
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
  Calendar,
  FileText,
  Key,
  Layout,
  Link,
  Plug,
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
      title: "Dashboard",
      url: "#",
      icon: <IconDashboard size={18} />,
    },
    {
      title: "Tasks",
      url: "#",
      icon: <IconListDetails size={18} />,
    },
    {
      title: "Calendar",
      url: "#",
      icon: <Calendar size={18} />,
    },
    {
      title: "Event Types",
      url: "#",
      icon: <Link size={18} />,
    },
    {
      title: "Connectors",
      url: "#",
      icon: <Plug size={18} />,
    },
    {
      title: "Canvas",
      url: "#",
      icon: <Layout size={18} />,
    },
    {
      title: "Knowledge Base",
      url: "#",
      icon: <FileText size={18} />,
    },
  ],

  documents: [
    {
      name: "Webhooks",
      url: "#",
      icon: <WebhookIcon size={18} />,
    },
    {
      name: "API Keys",
      url: "#",
      icon: <Key size={18} />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
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
            <Separator className="mt-[11px]" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
