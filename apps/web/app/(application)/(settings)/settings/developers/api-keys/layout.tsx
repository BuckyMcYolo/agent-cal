import { authClient } from "@workspace/auth/client"
import LayoutTabs from "@/components/settings/developers/api-keys/layout-tabs"

export default async function ApiKeysLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data } = await authClient.getSession()
  return <LayoutTabs data={data}>{children}</LayoutTabs>
}
