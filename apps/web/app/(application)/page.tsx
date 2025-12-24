import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth/require-auth"

export default async function Page() {
  await requireAuth()
  return redirect("/bookings")
}
