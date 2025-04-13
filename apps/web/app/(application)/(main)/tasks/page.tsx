import { getQueryClient } from "@/lib/react-query/get-query-client"
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"
import React from "react"
import { apiClient } from "@/lib/utils/api-client"
import TasksList from "@/components/tasks/tasks-list"

const Page = async () => {
  // const queryClient = getQueryClient()
  const queryClient = new QueryClient()

  queryClient.prefetchQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await apiClient.tasks.$get()
      if (res.ok) {
        const data = await res.json()
        return data
      }
      return null
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div>
        <TasksList />
      </div>
    </HydrationBoundary>
  )
}

export default Page
