import { apiClient } from "@/lib/utils/api-client"
import { useQuery } from "@tanstack/react-query"
import { authClient } from "@workspace/auth/client"

export const useUser = ({
  disableCache = false,
}: {
  disableCache?: boolean
} = {}) => {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const [sessionRes, preferencesRes] = await Promise.all([
        authClient.getSession({
          query: {
            disableCookieCache: disableCache ?? true,
          },
        }),
        apiClient["my-preferences"].$get(),
      ])
      if (preferencesRes.ok) {
        const preferencesData = await preferencesRes.json()
        return { ...preferencesData, ...sessionRes.data?.user }
      } else {
        const data = await preferencesRes.json()
        throw new Error(data.message)
      }
    },
  })

  return { user, isLoading, error }
}
