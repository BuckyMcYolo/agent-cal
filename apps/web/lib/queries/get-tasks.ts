import { apiClient } from "../utils/api-client"

export async function getTasks() {
  const res = await apiClient.tasks.$get()
  if (res.ok) {
    const data = await res.json()
    return data
  }
  return null
}
