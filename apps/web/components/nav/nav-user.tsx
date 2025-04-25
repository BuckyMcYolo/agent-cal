"use client"

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { Laptop, Loader2, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { authClient } from "@workspace/auth/client"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useRouter } from "next/navigation"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { setTheme, theme } = useTheme()

  const { data, isPending, error } = authClient.useSession()

  const router = useRouter()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {isPending ? (
                <>
                  <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight space-y-1">
                    <span className="truncate font-medium">
                      <Skeleton className="h-3 w-16" />
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      <Skeleton className="h-3 w-24" />
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Avatar className="h-8 w-8 rounded-lg grayscale">
                    <AvatarImage
                      src={data?.user.image || undefined}
                      alt={data?.user.name || undefined}
                    />
                    <AvatarFallback className="rounded-lg">
                      {data?.user.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {data?.user.name}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {data?.user.email}
                    </span>
                  </div>
                </>
              )}

              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={data?.user.image || undefined}
                    alt={data?.user.name}
                  />
                  <AvatarFallback className="rounded-lg">
                    {data?.user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {data?.user.name}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {data?.user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="cursor-default w-full"
              onClick={(e) => {
                e.preventDefault()
              }}
            >
              Theme
              <ToggleGroup
                size={"sm"}
                type="single"
                className="bg-background flex gap-1 items-center border border-muted-background rounded-xl px-1 ml-2 h-8 w-full"
                value={theme}
                onValueChange={(value) => setTheme(value)}
              >
                <ToggleGroupItem
                  className="h-6 w-6 p-1.5 rounded-md"
                  value="light"
                >
                  <Sun className="h-5 w-5" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  className="h-6 w-6 p-1.5 rounded-md"
                  value="dark"
                >
                  <Moon className="h-5 w-5" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  className="h-6 w-6 p-1.5 rounded-md"
                  value="system"
                >
                  <Laptop className="h-5 w-5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                authClient.signOut()
                router.replace("/sign-in")
              }}
            >
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
