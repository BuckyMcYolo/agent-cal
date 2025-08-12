import { useForm, UseFormProps, FieldValues, Path } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { parseApiError } from "@/lib/utils/form-validation"

interface UseEnhancedFormOptions<T extends FieldValues>
  extends UseFormProps<T> {
  schema: z.ZodSchema<T>
  onSubmit: (data: T) => Promise<any> | any
  onSuccess?: (data: T) => void
  onError?: (error: any) => void
  enableRealTimeValidation?: boolean
  successMessage?: string
}

export const useEnhancedForm = <T extends FieldValues>({
  schema,
  onSubmit,
  onSuccess,
  onError,
  enableRealTimeValidation = true,
  successMessage = "Changes saved successfully!",
  ...formOptions
}: UseEnhancedFormOptions<T>) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: enableRealTimeValidation ? "onChange" : "onSubmit",
    ...formOptions,
  })

  const { handleSubmit, formState, watch, clearErrors, setError } = form
  const { errors, isDirty, isValid } = formState

  // Watch all form values for real-time validation
  const watchedValues = watch()

  // Real-time validation effect
  useEffect(() => {
    if (enableRealTimeValidation && isDirty) {
      const validateField = async () => {
        try {
          await schema.parseAsync(watchedValues)
          setFieldErrors({})
        } catch (error) {
          if (error instanceof z.ZodError) {
            const newFieldErrors: Record<string, string> = {}
            error.errors.forEach((err) => {
              if (err.path.length > 0) {
                const fieldName = err.path.join(".")
                newFieldErrors[fieldName] = err.message
              }
            })
            setFieldErrors(newFieldErrors)
          }
        }
      }

      const timeoutId = setTimeout(validateField, 300) // Debounce validation
      return () => clearTimeout(timeoutId)
    }
  }, [watchedValues, schema, enableRealTimeValidation, isDirty])

  // Enhanced submit handler
  const enhancedSubmit = handleSubmit(async (data: T) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await onSubmit(data)

      // Show success message
      toast.success(successMessage)

      // Call success callback
      onSuccess?.(data)

      return result
    } catch (error) {
      const errorMessage = parseApiError(error)
      setSubmitError(errorMessage)

      // Handle specific field errors (e.g., unique constraint violations)
      if (errorMessage.includes("URL slug") || errorMessage.includes("slug")) {
        setError("slug" as Path<T>, {
          type: "manual",
          message: errorMessage,
        })
      }

      // Handle title conflicts (for auto-generated slugs)
      if (
        errorMessage.includes("similar title") ||
        errorMessage.includes("title already exists")
      ) {
        setError("title" as Path<T>, {
          type: "manual",
          message: errorMessage,
        })
      }

      // Handle validation errors from API
      if (
        errorMessage.includes("validation") ||
        errorMessage.includes("constraint")
      ) {
        // Try to extract field-specific errors if available
        const errorData = error as any
        if (errorData?.response?.data?.errors) {
          errorData.response.data.errors.forEach((err: string) => {
            // Map common validation errors to fields
            if (err.includes("length") || err.includes("15-minute")) {
              setError("length" as Path<T>, {
                type: "manual",
                message: err,
              })
            }
            if (err.includes("frequency")) {
              setError("limitBookingFrequency" as Path<T>, {
                type: "manual",
                message: err,
              })
            }
            if (err.includes("future")) {
              setError("limitFutureBookings" as Path<T>, {
                type: "manual",
                message: err,
              })
            }
          })
        }
      }

      // Show error toast
      toast.error(errorMessage)

      // Call error callback
      onError?.(error)

      throw error // Re-throw to allow caller to handle if needed
    } finally {
      setIsSubmitting(false)
    }
  })

  // Get field error message (combines form validation and real-time validation)
  const getFieldError = (fieldName: string): string | undefined => {
    const formError = errors[fieldName as keyof typeof errors]
    const realtimeError = fieldErrors[fieldName]

    if (formError?.message) {
      return String(formError.message)
    }

    return realtimeError
  }

  // Check if field has error
  const hasFieldError = (fieldName: string): boolean => {
    return !!(
      errors[fieldName as keyof typeof errors] || fieldErrors[fieldName]
    )
  }

  // Clear specific field error
  const clearFieldError = (fieldName: string) => {
    clearErrors(fieldName as Path<T>)
    setFieldErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }

  // Clear submit error
  const clearSubmitError = () => {
    setSubmitError(null)
  }

  return {
    ...form,
    enhancedSubmit,
    isSubmitting,
    submitError,
    fieldErrors,
    getFieldError,
    hasFieldError,
    clearFieldError,
    clearSubmitError,
    hasUnsavedChanges: isDirty && !isSubmitting,
    canSubmit: isValid && isDirty && !isSubmitting,
  }
}
