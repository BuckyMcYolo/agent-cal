import UserAccountSettings from "@/components/settings/account"
import { requireAuth } from "@/lib/auth/require-auth"

export default async function Page() {
  await requireAuth()
  return (
    <div>
      <UserAccountSettings />
    </div>
  )
}
