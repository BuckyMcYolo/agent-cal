"use client"

import { authClient } from "@/lib/utils/auth-client"
import React from "react"

const Page = () => {
  const { data, isPending } = authClient.useSession()

  return <div>Page</div>
}

export default Page
