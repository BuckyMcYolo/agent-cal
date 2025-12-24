import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import APIKeysTable from "@/components/settings/developers/api-keys/api-keys-table"
import { requireAuth } from "@/lib/auth/require-auth"
import { apiClient } from "@/lib/utils/api-client"

const Page = async () => {
  await requireAuth()
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await apiClient["api-keys"].$get({
        query: { page: "1", perPage: "50" },
      })
      if (res.status === 200) {
        return await res.json()
      }
      throw new Error("Failed to fetch API keys")
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <APIKeysTable />
    </HydrationBoundary>
  )
}

export default Page
