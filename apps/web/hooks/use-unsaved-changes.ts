import { useRouter } from "next/navigation"
import { useCallback, useEffect } from "react"

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean
  message?: string
}

export const useUnsavedChanges = ({
  hasUnsavedChanges,
  message = "You have unsaved changes. Are you sure you want to leave?",
}: UseUnsavedChangesOptions) => {
  const router = useRouter()

  // Handle browser navigation (back button, refresh, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    if (hasUnsavedChanges) {
      window.addEventListener("beforeunload", handleBeforeUnload)
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [hasUnsavedChanges, message])

  // Function to check for unsaved changes before navigation
  const checkUnsavedChanges = useCallback(
    (callback: () => void) => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(message)
        if (confirmed) {
          callback()
        }
        return confirmed
      } else {
        callback()
        return true
      }
    },
    [hasUnsavedChanges, message]
  )

  return { checkUnsavedChanges }
}
