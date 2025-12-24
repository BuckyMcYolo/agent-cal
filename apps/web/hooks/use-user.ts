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
      const sessionRes = await authClient.getSession({
        query: {
          disableCookieCache: disableCache ?? true,
        },
      })
      return sessionRes.data?.user
    },
  })

  return { user, isLoading, error }
}
