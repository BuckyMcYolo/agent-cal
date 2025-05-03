import OrgAPIKeysTable from "@/components/settings/developers/api-keys/organization/org-api-keys-table"
import { apiClient } from "@/lib/utils/api-client"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { authClient } from "@workspace/auth/client"
import { redirect } from "next/navigation"
import React from "react"

const Page = async () => {
  const { data } = await authClient.getSession()

  if (data?.user.role !== "admin") {
    redirect("/settings/developers/api-keys")
  }

  const queryClient = new QueryClient()

  queryClient.prefetchQuery({
    queryKey: ["api-keys-org"],
    queryFn: async () => {
      try {
        const res = await apiClient["api-keys"].org.$get({
          query: { page: "1", perPage: "10" },
        })
        if (res.status === 200) {
          const data = await res.json()
          return data
        } else {
          const data = await res.json()
          throw new Error(data.message)
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"
        throw new Error(errorMessage)
      }
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrgAPIKeysTable />
    </HydrationBoundary>
  )
}

export default Page
