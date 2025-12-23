import { redirect } from "next/navigation"

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  redirect(`/event-types/${id}/overview`)
}

export default Page
