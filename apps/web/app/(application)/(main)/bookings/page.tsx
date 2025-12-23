"use client"

import { authClient } from "@workspace/auth/client"

const Page = () => {
  const { data, isPending } = authClient.useSession()

  return <div>Page</div>
}

export default Page
