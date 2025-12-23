"use client"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { ChevronLeft } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useHeader } from "../root/header-provider"

export function SiteHeader() {
  const { config } = useHeader()
  const pathname = usePathname()
  const router = useRouter()

  const segments = pathname.split("/").filter(Boolean)
  const isNested = segments.length > 1
  const parent = segments.slice(0, -1).join("/")
  const parentHref = isNested ? `/${parent}` : "/"

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {isNested ? (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => {
              // if (parentHref && parentHref !== pathname) router.push(parentHref)
              // else
              router.back()
            }}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        ) : null}
        <div className="flex min-w-0 flex-1 items-center justify-between">
          <div className="min-w-0">
            {config.title ? (
              <div className="flex flex-col">
                <div className="truncate text-base font-semibold leading-none sm:text-lg">
                  {config.title}
                </div>
                {config.subtitle ? (
                  <div className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">
                    {config.subtitle}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {config.actions ? (
            <div className="flex shrink-0 items-center gap-2">
              {config.actions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
