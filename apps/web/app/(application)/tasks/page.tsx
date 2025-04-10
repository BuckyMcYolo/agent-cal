import { getQueryClient } from "@/lib/react-query/get-query-client"
import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import React from "react"

const Page = () => {
  const queryClient = getQueryClient()

  queryClient.prefetchQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks")
      return res.json()
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div>Test Tasks page</div>
    </HydrationBoundary>
  )
}

export default Page
