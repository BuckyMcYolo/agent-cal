import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"
import React from "react"
import { apiClient } from "@/lib/utils/api-client"
import EventTypesList from "@/components/event-types/event-types-list"

const Page = async () => {
  const queryClient = new QueryClient()

  queryClient.prefetchQuery({
    queryKey: ["event-types"],
    queryFn: async () => {
      const res = await apiClient["event-types"].$get({
        query: {
          slug: "default", // Adjust this as needed
        },
      })
      if (res.ok) {
        const data = await res.json()
        return data
      }
      return []
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EventTypesList />
    </HydrationBoundary>
  )
}

export default Page
