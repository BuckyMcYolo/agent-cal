import SettingsSideBarProvider from "@/components/root/settings-sidebar-provider"

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <SettingsSideBarProvider>{children}</SettingsSideBarProvider>
}
