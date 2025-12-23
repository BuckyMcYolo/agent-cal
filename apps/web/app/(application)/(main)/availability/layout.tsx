import type React from "react"

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <div>{children}</div>
    </div>
  )
}

export default Layout
