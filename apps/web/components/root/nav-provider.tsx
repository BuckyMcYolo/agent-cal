"use client"

import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { AppSidebar } from "../nav/app-sidebar"
import { SiteHeader } from "../nav/site-header"
import { QueryClientProvider } from "@tanstack/react-query"
import { getQueryClient } from "../../lib/react-query/get-query-client"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export const NavProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </QueryClientProvider>
  )
}
