import React from "react"
import Link from "next/link"
import { cn } from "@workspace/ui/lib/utils"

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <div>{children}</div>
    </div>
  )
}

export default Layout
