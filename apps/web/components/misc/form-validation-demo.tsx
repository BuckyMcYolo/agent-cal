"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Loader2 } from "lucide-react"
import type React from "react"
import { FormError } from "@/components/misc/form-error"
import { ValidationStatus } from "@/components/misc/validation-status"
import { useEnhancedForm } from "@/hooks/use-enhanced-form"
import {
  type EventTypeOverviewFormData,
  eventTypeOverviewSchema,
} from "@/lib/utils/form-validation"

/**
 * Demo component to showcase enhanced form validation features
 * This demonstrates:
 * - Real-time validation
 * - Error handling
 * - Unsaved changes warning
 * - Success feedback
 * - Field-specific error messages
 */
export const FormValidationDemo: React.FC = () => {
  const {
    register,
    enhancedSubmit,
    isSubmitting,
    submitError,
    getFieldError,
    hasFieldError,
    clearSubmitError,
    hasUnsavedChanges,
    canSubmit,
    formState,
    reset,
  } = useEnhancedForm<EventTypeOverviewFormData>({
    schema: eventTypeOverviewSchema,
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      length: 30,
      hidden: false,
      locationType: "VIRTUAL",
    },
    onSubmit: async (data) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate slug conflict error for testing
      if (data.slug === "test-conflict") {
        throw new Error(
          "This URL slug is already in use. Please choose a different one."
        )
      }

      console.log("Form submitted successfully:", data)
    },
    successMessage: "Demo form submitted successfully!",
    enableRealTimeValidation: true,
  })

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Enhanced Form Validation Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form-level error display */}
        {submitError && (
          <FormError
            error={submitError}
            variant="form"
            onDismiss={clearSubmitError}
          />
        )}

        <form onSubmit={enhancedSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="demo-title">Event Title *</Label>
            <Input
              id="demo-title"
              placeholder="e.g., 30 Minute Meeting"
              error={hasFieldError("title")}
              {...register("title")}
            />
            <FormError error={getFieldError("title")} />
            {!getFieldError("title") && (
              <p className="text-sm text-muted-foreground">
                Try leaving this empty or entering more than 255 characters
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="demo-slug">URL Slug *</Label>
            <Input
              id="demo-slug"
              placeholder="30-min-meeting"
              error={hasFieldError("slug")}
              {...register("slug")}
            />
            <FormError error={getFieldError("slug")} />
            {!getFieldError("slug") && (
              <p className="text-sm text-muted-foreground">
                Try entering "test-conflict" to simulate a unique constraint
                error
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="demo-length">Duration (minutes) *</Label>
            <Input
              id="demo-length"
              type="number"
              placeholder="30"
              error={hasFieldError("length")}
              {...register("length", { valueAsNumber: true })}
            />
            <FormError error={getFieldError("length")} />
            {!getFieldError("length") && (
              <p className="text-sm text-muted-foreground">
                Try entering a number that's not divisible by 15
              </p>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <ValidationStatus
              isValid={formState.isValid}
              isDirty={formState.isDirty}
              isSubmitting={isSubmitting}
              hasErrors={Object.keys(formState.errors).length > 0}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset()
                  clearSubmitError()
                }}
                disabled={isSubmitting || !hasUnsavedChanges}
              >
                Reset
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Submit Demo
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">
            Validation Features Demonstrated:
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Real-time validation with debounced feedback</li>
            <li>• Field-specific error messages</li>
            <li>• Form-level error handling</li>
            <li>• Unsaved changes detection</li>
            <li>• Success feedback via toast notifications</li>
            <li>• Unique constraint error simulation</li>
            <li>• Visual validation status indicator</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
