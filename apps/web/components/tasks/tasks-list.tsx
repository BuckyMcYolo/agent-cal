"use client"

import { getTasks } from "@/lib/queries/get-tasks"
import { apiClient } from "@/lib/utils/api-client"
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import React from "react"

const TasksList = () => {
  const { data, isLoading, error } = useSuspenseQuery({
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
    queryKey: ["task", data?.[0]?.id ?? ""],
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

      {isTaskLoading && (
        <p className="border-2">
          <Loader2 className="animate-spin" />
        </p>
      )}
      {isTaskError && <p>Error: {isTaskError.message}</p>}
      {task && (
        <div className="border-2 border-blue-500 p-4">
          <h2>Single Task</h2>
          <p>{task.id}</p>
          <p>{task.name}</p>
          <p>{task.done ? "Done" : "Not Done"}</p>
        </div>
      )}
    </div>
  )
}

export default TasksList
