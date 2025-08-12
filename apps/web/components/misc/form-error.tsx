import React from "react"
import { AlertCircle, X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"

interface FormErrorProps {
  error?: string | null
  className?: string
  onDismiss?: () => void
  variant?: "field" | "form" | "inline"
}

export const FormError: React.FC<FormErrorProps> = ({
  error,
  className,
  onDismiss,
  variant = "field",
}) => {
  if (!error) return null

  const baseClasses = "flex items-start gap-2 text-sm"

  const variantClasses = {
    field: "text-destructive",
    form: "p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive",
    inline: "text-destructive",
  }

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span className="flex-1">{error}</span>
      {onDismiss && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-destructive hover:text-destructive/80"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

interface FormSuccessProps {
  message?: string | null
  className?: string
  onDismiss?: () => void
}

export const FormSuccess: React.FC<FormSuccessProps> = ({
  message,
  className,
  onDismiss,
}) => {
  if (!message) return null

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm",
        className
      )}
    >
      <div className="h-4 w-4 mt-0.5 flex-shrink-0 rounded-full bg-green-500 flex items-center justify-center">
        <div className="h-2 w-2 bg-white rounded-full" />
      </div>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-green-600 hover:text-green-700"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
