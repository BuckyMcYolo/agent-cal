import { apiClient } from "@/lib/utils/api-client"
import { QueryClient } from "@tanstack/react-query"
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
      const res = await apiClient["api-keys"].org.$get({
        query: { page: 1, perPage: 10 },
      })
      const data = await res.json()
      console.log("data", data)
      return data
    },
  })

  return <div>Page</div>
}

export default Page
