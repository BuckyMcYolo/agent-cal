import { getQueryClient } from "@/lib/react-query/get-query-client"
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"
import { authClient } from "@/lib/utils/auth-client"
import React from "react"
import { Button } from "@workspace/ui/components/button"
import { apiClient } from "@/lib/utils/api-client"
import TasksList from "@/components/tasks/tasks-list"
import { getTasks } from "@/lib/queries/get-tasks"

const Page = async () => {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
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
