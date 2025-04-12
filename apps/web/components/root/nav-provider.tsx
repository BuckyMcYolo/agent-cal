"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { getQueryClient } from "../../lib/react-query/get-query-client"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export const NavProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      {children}
    </QueryClientProvider>
  )
}
