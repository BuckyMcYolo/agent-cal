import Notifications from "@/components/settings/notifications"
import { requireAuth } from "@/lib/auth/require-auth"

export default async function Page() {
  await requireAuth()
  return (
    <div>
      <Notifications />
    </div>
  )
}
