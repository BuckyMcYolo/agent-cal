import APIKeysTable from "@/components/settings/developers/api-keys/api-keys-table"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { authClient } from "@workspace/auth/client"

export default function Page() {
  const queryClient = new QueryClient()

  queryClient.prefetchQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await authClient.apiKey.list({
        fetchOptions: {
          onError(context) {
            throw new Error(context.error.message)
          },
        },
      })
      return res.data
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div>
        <APIKeysTable />
      </div>
    </HydrationBoundary>
  )
}
