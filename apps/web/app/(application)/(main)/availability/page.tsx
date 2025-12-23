import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import AvailabilityList from "@/components/availability/availability-list"
import { apiClient } from "@/lib/utils/api-client"

const AvailabilityPage = async () => {
  const queryClient = new QueryClient()

  queryClient.prefetchQuery({
    queryKey: ["event-types"],
    queryFn: async () => {
      const res = await apiClient.availability.$get({
        query: {},
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
      <AvailabilityList />
    </HydrationBoundary>
  )
}

export default AvailabilityPage
