import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import TasksList from "@/components/tasks/tasks-list"
import { apiClient } from "@/lib/utils/api-client"

const Page = async () => {
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
      <TasksList />
    </HydrationBoundary>
  )
}

export default Page
