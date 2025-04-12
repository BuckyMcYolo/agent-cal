"use client"

import { getTasks } from "@/lib/queries/get-tasks"
import { apiClient } from "@/lib/utils/api-client"
import { useQuery } from "@tanstack/react-query"
import React from "react"

const TasksList = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await apiClient.tasks.$get()
      if (res.ok) {
        const data = await res.json()
        return data
      }
      return null
    },
  })

  const {
    data: task,
    isLoading: isTaskLoading,
    error: isTaskError,
  } = useQuery({
    queryKey: ["task", "897904d8-7a3b-4449-be07-5101b3952dff"],
    queryFn: async () => {
      const res = await apiClient.tasks[":id"].$get({
        param: {
          id: "897904d8-7a3b-4449-be07-5101b3952dff",
        },
      })
      if (res.ok) {
        const data = await res.json()
        return data
      }
      return null
    },
  })
  console.log("data", data)
  return (
    <div>
      {isLoading && <p>Loading Client side...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && data.length > 0 && (
        <ul>
          {data.map((task: any) => (
            <li key={task.id}>
              <p>{task.name}</p>
              <p>{task.done ? "Done" : "Not Done"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default TasksList
