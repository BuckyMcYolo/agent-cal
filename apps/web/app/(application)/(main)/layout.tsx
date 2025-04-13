import MainSideBarProvider from "@/components/root/main-sidebar-provider"

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <MainSideBarProvider>{children}</MainSideBarProvider>
}
