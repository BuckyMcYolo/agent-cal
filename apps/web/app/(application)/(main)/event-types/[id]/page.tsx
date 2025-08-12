import React from "react"
import { redirect } from "next/navigation"

const Page = async ({ params }: { params: { id: string } }) => {
  redirect(`/event-types/${params.id}/overview`)
}

export default Page
