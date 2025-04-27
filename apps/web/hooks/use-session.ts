import { useQuery } from "@tanstack/react-query"
import { authClient } from "@workspace/auth/client"

export const useSession = (disableCache?: boolean) => {
  const {
    data: session,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await authClient.getSession({
        query: {
          disableCookieCache: disableCache ?? true,
        },
      })
      return res.data?.session
    },
  })

  return { session, isLoading, error }
}
