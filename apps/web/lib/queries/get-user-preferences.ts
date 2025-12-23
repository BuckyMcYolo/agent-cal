import { apiClient } from "../utils/api-client"

export const getUserPreferences = async () => {
  try {
    const res = await apiClient["my-preferences"].$get()
    if (res.status === 200) {
      const data = await res.json()
      return data
    } else if (res.status === 404) {
      return {
        user: null,
        onboardingCompleted: false,
      }
    } else {
      const data = await res.json()
      console.error("Error fetching user preferences:", data.message)
      return {
        user: null,
        onboardingCompleted: false,
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    throw new Error(errorMessage)
  }
}
