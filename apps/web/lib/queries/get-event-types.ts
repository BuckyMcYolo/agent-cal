import { apiClient } from "../utils/api-client"

export async function getEventTypes(params?: {
  orgId?: string
  userId?: string
  slug?: string
}) {
  const res = await apiClient["event-types"].$get({
    query: params || {},
  })
  if (res.ok) {
    const data = await res.json()
    return data
  }
  return null
}