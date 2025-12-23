"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, usePathname } from "next/navigation"
import Link from "next/link"
import {
  Settings,
  Calendar,
  Zap,
  SlidersHorizontal,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const sidebarItems = [
  {
    title: "Overview",
    icon: Settings,
    href: "/overview",
  },
  {
    title: "Availability",
    icon: Calendar,
    href: "/availability",
  },
  {
    title: "Advanced",
    icon: Zap,
    href: "/advanced",
  },
  {
    title: "Scheduling",
    icon: SlidersHorizontal,
    href: "/scheduling",
  },
]

const EventTypeLayout = ({ children }: { children: React.ReactNode }) => {
  const params = useParams()
  const pathname = usePathname()
  const eventTypeId = params?.id as string
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const isActiveRoute = (href: string) => {
    const basePath = `/event-types/${eventTypeId}`
    const fullPath = `${basePath}${href}`
    return (
      pathname === fullPath || (href === "/overview" && pathname === basePath)
    )
  }

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  // Close dropdown when clicking outside on mobile
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const dropdown = document.getElementById("mobile-dropdown")
      const menuButton = document.getElementById("menu-button")

      if (isSidebarOpen && dropdown && menuButton) {
        if (
          !dropdown.contains(event.target as Node) &&
          !menuButton.contains(event.target as Node)
        ) {
          setIsSidebarOpen(false)
        }
      }
    }

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleOutsideClick)
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [isSidebarOpen])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
              <Link href="/event-types">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="font-semibold text-base text-foreground">
              Event Type
            </h1>
          </div>
          <Button
            id="menu-button"
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-8 w-8 p-0"
          >
            {isSidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isSidebarOpen && (
        <div id="mobile-dropdown" className="lg:hidden relative z-40">
          <div className="absolute top-0 left-0 right-0 bg-background border-b border-border shadow-lg">
            <nav className="p-4 space-y-2">
              {sidebarItems.map((item) => {
                const isActive = isActiveRoute(item.href)
                return (
                  <Link
                    key={item.href}
                    href={`/event-types/${eventTypeId}${item.href}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-all duration-150 touch-manipulation",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="">
        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-56 shrink-0 bg-background border-r border-border">
            <div className="p-2 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-7 w-7 p-0"
                >
                  <Link href="/event-types">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="min-w-0">
                  <h1 className="font-semibold text-base text-foreground truncate">
                    Event Types
                  </h1>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const isActive = isActiveRoute(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={`/event-types/${eventTypeId}${item.href}`}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-background min-h-screen">
              <div className="p-4 lg:p-6">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventTypeLayout
