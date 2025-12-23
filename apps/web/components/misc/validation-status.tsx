import { cn } from "@workspace/ui/lib/utils"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"
import type React from "react"

interface ValidationStatusProps {
  isValid: boolean
  isDirty: boolean
  isSubmitting: boolean
  hasErrors: boolean
  className?: string
}

export const ValidationStatus: React.FC<ValidationStatusProps> = ({
  isValid,
  isDirty,
  isSubmitting,
  hasErrors,
  className,
}) => {
  if (isSubmitting) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-muted-foreground",
          className
        )}
      >
        <Clock className="h-4 w-4 animate-pulse" />
        <span>Saving changes...</span>
      </div>
    )
  }

  if (!isDirty) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-muted-foreground",
          className
        )}
      >
        <CheckCircle className="h-4 w-4" />
        <span>No changes</span>
      </div>
    )
  }

  if (hasErrors || !isValid) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-destructive",
          className
        )}
      >
        <AlertCircle className="h-4 w-4" />
        <span>Please fix errors before saving</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-green-600",
        className
      )}
    >
      <CheckCircle className="h-4 w-4" />
      <span>Ready to save</span>
    </div>
  )
}
