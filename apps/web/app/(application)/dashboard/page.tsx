import { AppSidebar } from "@/components/nav/app-sidebar"
import { ChartAreaInteractive } from "@/components/nav/chart-area-interactive"
import { DataTable } from "@/components/nav/data-table"
import { SectionCards } from "@/components/nav/section-cards"
import { SiteHeader } from "@/components/nav/site-header"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"

import data from "./data.json"

export default function Page() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <DataTable data={data} />
      </div>
    </div>
  )
}
