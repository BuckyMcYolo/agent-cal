import { Geist, Geist_Mono, Inter } from "next/font/google"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/root/theme-provider"
import { NavProvider } from "@/components/root/nav-provider"
import { Toaster } from "@workspace/ui/components/sonner"
import SideBarProvider from "@/components/root/main-sidebar-provider"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata = {
  title: "AgentCal",
  description: "Your AI powered scheduling assistant",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} ${inter.variable} font-sans antialiased `}
      >
        <Toaster richColors />
        <ThemeProvider>
          <NavProvider>{children}</NavProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
