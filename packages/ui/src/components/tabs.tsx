"use client"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@workspace/ui/lib/utils"
import * as React from "react"

// Create Context for the tabs
const TabsContext = React.createContext<{
  selectedTab: HTMLButtonElement | null
  setSelectedTab: React.Dispatch<React.SetStateAction<HTMLButtonElement | null>>
}>({
  selectedTab: null,
  setSelectedTab: () => {},
})

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [selectedTab, setSelectedTab] =
    React.useState<HTMLButtonElement | null>(null)

  return (
    <TabsContext.Provider value={{ selectedTab, setSelectedTab }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      />
    </TabsContext.Provider>
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const { selectedTab } = React.useContext(TabsContext)
  const [indicatorStyle, setIndicatorStyle] = React.useState({
    left: 0,
    width: 0,
  })

  // Update the indicator position when the selected tab changes
  React.useEffect(() => {
    if (selectedTab && listRef.current) {
      const listRect = listRef.current.getBoundingClientRect()
      const tabRect = selectedTab.getBoundingClientRect()

      setIndicatorStyle({
        left: tabRect.left - listRect.left,
        width: tabRect.width,
      })
    }
  }, [selectedTab])

  return (
    <div className="relative" ref={listRef}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn(
          "bg-accent text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
          className
        )}
        {...props}
      />

      {/* Sliding indicator */}
      {selectedTab && (
        <div
          className="absolute top-[2.5px] z-0 h-[calc(100%-5px)] rounded-md bg-background shadow-sm transition-all duration-200 ease-out"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
      )}
    </div>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const { setSelectedTab } = React.useContext(TabsContext)

  React.useEffect(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const observer = new MutationObserver(() => {
      if (trigger.getAttribute("data-state") === "active") {
        setSelectedTab(trigger)
      }
    })

    observer.observe(trigger, { attributes: true })

    // Initialize if this tab is active by default
    if (trigger.getAttribute("data-state") === "active") {
      setSelectedTab(trigger)
    }

    return () => observer.disconnect()
  }, [setSelectedTab])

  return (
    <TabsPrimitive.Trigger
      ref={triggerRef}
      data-slot="tabs-trigger"
      className={cn(
        "relative z-10 inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border-transparent bg-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer data-[state=active]:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
