import { useQuery } from "@tanstack/react-query"
import { authClient } from "@workspace/auth/client"

export const useUser = () => {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await authClient.getSession({
        query: {
          disableCookieCache: true,
        },
      })
      return res.data?.user
    },
  })

  return { user, isLoading }
}
