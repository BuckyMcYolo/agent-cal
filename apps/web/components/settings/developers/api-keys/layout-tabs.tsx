"use client"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import React from "react"
import { UserSession } from "@workspace/auth"
import { usePathname, useRouter } from "next/navigation"

const LayoutTabs = ({
  children,
  data,
}: {
  children: React.ReactNode
  data: UserSession | null
}) => {
  const router = useRouter()
  const pathname = usePathname()
  return (
    <Tabs
      defaultValue="user"
      onValueChange={(value) => {
        value === "user"
          ? router.push("/settings/developers/api-keys")
          : router.push("/settings/developers/api-keys/organization")
      }}
      value={
        pathname === "/settings/developers/api-keys"
          ? "user"
          : pathname === "/settings/developers/api-keys/organization"
            ? "org"
            : "user"
      }
    >
      {data?.user.role === "admin" && (
        <TabsList className="w-[320px] grid grid-cols-2">
          <TabsTrigger value="user">My API Keys</TabsTrigger>
          <TabsTrigger value="org">Organization Keys</TabsTrigger>
        </TabsList>
      )}
      <TabsContent value="user" className="pt-2">
        {children}
      </TabsContent>
      <TabsContent value="org" className="pt-2">
        {children}
      </TabsContent>
    </Tabs>
  )
}

export default LayoutTabs
