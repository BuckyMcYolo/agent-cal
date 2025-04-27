import TableSkeleton from "@/components/misc/loaders/table-skeleton"
import React from "react"

export default function Loading() {
  return (
    <TableSkeleton
      rowCount={3}
      columns={[
        { header: "Name" },
        { header: "Created" },
        { header: "Last Used" },
        { header: "Expires" },
        { header: "Permissions" },
        { header: "", rightAligned: true },
      ]}
    />
  )
}
