"use client"

import React, { useEffect } from "react"
import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/utils/api-client"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Loader2, AlertTriangle } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { useEnhancedForm } from "@/hooks/use-enhanced-form"
import {
  eventTypeAdvancedSchema,
  type EventTypeAdvancedFormData,
} from "@/lib/utils/form-validation"
import { FormError } from "@/components/misc/form-error"
import { ValidationStatus } from "@/components/misc/validation-status"

const EventTypeAdvancedForm = () => {
  const params = useParams()
  const eventTypeId = params?.id as string
  const queryClient = useQueryClient()

  // Fetch existing event type data
  const {
    data: eventType,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["event-type", eventTypeId],
    queryFn: async () => {
      const res = await apiClient["event-types"][":id"].$get({
        param: { id: eventTypeId },
      })
      if (res.ok) {
        return res.json()
      }
      const errorData = await res.json()
      throw new Error(errorData.message || "Failed to fetch event type")
    },
    enabled: !!eventTypeId,
    retry: false,
  })

  // Enhanced form with validation and error handling
  const {
    register,
    watch,
    setValue,
    reset,
    enhancedSubmit,
    isSubmitting,
    submitError,
    getFieldError,
    hasFieldError,
    clearSubmitError,
    hasUnsavedChanges,
    canSubmit,
    formState,
  } = useEnhancedForm<EventTypeAdvancedFormData>({
    schema: eventTypeAdvancedSchema,
    defaultValues: {
      limitBookingFrequency: false,
      dailyFrequencyLimit: null,
      weeklyFrequencyLimit: null,
      monthlyFrequencyLimit: null,
      limitFutureBookings: false,
      maxDaysInFuture: null,
      beforeEventBuffer: 0,
      afterEventBuffer: 0,
      requiresConfirmation: false,
      disableGuests: false,
      aiEmailAssistantEnabled: false,
      aiPhoneAssistantEnabled: false,
    },
    onSubmit: async (data) => {
      // Clean up null values for optional fields when toggles are off
      const cleanedData = {
        ...data,
        dailyFrequencyLimit: data.limitBookingFrequency
          ? data.dailyFrequencyLimit
          : null,
        weeklyFrequencyLimit: data.limitBookingFrequency
          ? data.weeklyFrequencyLimit
          : null,
        monthlyFrequencyLimit: data.limitBookingFrequency
          ? data.monthlyFrequencyLimit
          : null,
        maxDaysInFuture: data.limitFutureBookings ? data.maxDaysInFuture : null,
      }

      const res = await apiClient["event-types"][":id"].$put({
        param: { id: eventTypeId },
        json: cleanedData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(
          errorData.message || "Failed to update advanced settings"
        )
      }

      // Invalidate queries on success
      queryClient.invalidateQueries({ queryKey: ["event-type", eventTypeId] })
      queryClient.invalidateQueries({ queryKey: ["event-types"] })

      return res.json()
    },
    successMessage: "Advanced settings updated successfully!",
    enableRealTimeValidation: true,
  })

  // Removed unsaved changes leave-page warning and inline alert per design update

  // Watch form values for conditional rendering
  const watchedLimitBookingFrequency = watch("limitBookingFrequency")
  const watchedLimitFutureBookings = watch("limitFutureBookings")
  const watchedRequiresConfirmation = watch("requiresConfirmation")
  const watchedDisableGuests = watch("disableGuests")
  const watchedAiEmailAssistantEnabled = watch("aiEmailAssistantEnabled")
  const watchedAiPhoneAssistantEnabled = watch("aiPhoneAssistantEnabled")
  const watchedBeforeEventBuffer = watch("beforeEventBuffer")
  const watchedAfterEventBuffer = watch("afterEventBuffer")

  // Reset form when event type data loads
  useEffect(() => {
    if (eventType) {
      reset({
        limitBookingFrequency: eventType.limitBookingFrequency || false,
        dailyFrequencyLimit: eventType.dailyFrequencyLimit || null,
        weeklyFrequencyLimit: eventType.weeklyFrequencyLimit || null,
        monthlyFrequencyLimit: eventType.monthlyFrequencyLimit || null,
        limitFutureBookings: eventType.limitFutureBookings || false,
        maxDaysInFuture: eventType.maxDaysInFuture || null,
        beforeEventBuffer: eventType.beforeEventBuffer || 0,
        afterEventBuffer: eventType.afterEventBuffer || 0,
        requiresConfirmation: eventType.requiresConfirmation || false,
        disableGuests: eventType.disableGuests || false,
        aiEmailAssistantEnabled: eventType.aiEmailAssistantEnabled || false,
        aiPhoneAssistantEnabled: eventType.aiPhoneAssistantEnabled || false,
      })
    }
  }, [eventType, reset])

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">
              Loading advanced settings...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-destructive font-medium">
              Failed to load advanced settings
            </p>
            <p className="text-muted-foreground text-sm">
              {fetchError.message}
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Form-level error display */}
      {submitError && (
        <FormError
          error={submitError}
          variant="form"
          onDismiss={clearSubmitError}
        />
      )}

      <form onSubmit={enhancedSubmit} className="space-y-6">
        {/* Sticky action bar at top */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pb-4 border-b border-border pt-4 -mt-4 px-0">
          <ValidationStatus
            isValid={formState.isValid}
            isDirty={formState.isDirty}
            isSubmitting={isSubmitting}
            hasErrors={Object.keys(formState.errors).length > 0}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                clearSubmitError()
              }}
              disabled={isSubmitting || !hasUnsavedChanges}
              className="touch-manipulation min-h-[44px]"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="touch-manipulation min-h-[44px]"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="space-y-4 lg:space-y-6">
            {/* Booking Frequency Limits Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Booking limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Limit booking frequency</p>
                    <p className="text-sm text-muted-foreground">
                      Restrict how often guests can book this event type
                    </p>
                  </div>
                  <Switch
                    checked={watchedLimitBookingFrequency}
                    onCheckedChange={(checked) =>
                      setValue("limitBookingFrequency", checked, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                </div>
                <FormError error={getFieldError("limitBookingFrequency")} />

                {watchedLimitBookingFrequency && (
                  <div className="space-y-4 pt-2 border-t border-border">
                    <div className="space-y-2">
                      <Label htmlFor="dailyFrequencyLimit">
                        Daily limit (optional)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="dailyFrequencyLimit"
                          type="number"
                          min="1"
                          max="100"
                          placeholder="e.g., 5"
                          className="w-24 text-base"
                          error={hasFieldError("dailyFrequencyLimit")}
                          value={watch("dailyFrequencyLimit") || ""}
                          onChange={(e) => {
                            const value = e.target.value
                            setValue(
                              "dailyFrequencyLimit",
                              value === "" ? null : parseInt(value, 10),
                              { shouldValidate: true, shouldDirty: true }
                            )
                          }}
                        />
                        <span className="text-sm text-muted-foreground">
                          bookings per day
                        </span>
                      </div>
                      <FormError error={getFieldError("dailyFrequencyLimit")} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weeklyFrequencyLimit">
                        Weekly limit (optional)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="weeklyFrequencyLimit"
                          type="number"
                          min="1"
                          max="700"
                          placeholder="e.g., 10"
                          className="w-24 text-base"
                          error={hasFieldError("weeklyFrequencyLimit")}
                          value={watch("weeklyFrequencyLimit") || ""}
                          onChange={(e) => {
                            const value = e.target.value
                            setValue(
                              "weeklyFrequencyLimit",
                              value === "" ? null : parseInt(value, 10),
                              { shouldValidate: true, shouldDirty: true }
                            )
                          }}
                        />
                        <span className="text-sm text-muted-foreground">
                          bookings per week
                        </span>
                      </div>
                      <FormError
                        error={getFieldError("weeklyFrequencyLimit")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthlyFrequencyLimit">
                        Monthly limit (optional)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="monthlyFrequencyLimit"
                          type="number"
                          min="1"
                          max="3000"
                          placeholder="e.g., 20"
                          className="w-24 text-base"
                          error={hasFieldError("monthlyFrequencyLimit")}
                          value={watch("monthlyFrequencyLimit") || ""}
                          onChange={(e) => {
                            const value = e.target.value
                            setValue(
                              "monthlyFrequencyLimit",
                              value === "" ? null : parseInt(value, 10),
                              { shouldValidate: true, shouldDirty: true }
                            )
                          }}
                        />
                        <span className="text-sm text-muted-foreground">
                          bookings per month
                        </span>
                      </div>
                      <FormError
                        error={getFieldError("monthlyFrequencyLimit")}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Future Booking Limits Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Future booking window
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Limit future bookings</p>
                    <p className="text-sm text-muted-foreground">
                      Restrict how far in advance guests can book
                    </p>
                  </div>
                  <Switch
                    checked={watchedLimitFutureBookings}
                    onCheckedChange={(checked) =>
                      setValue("limitFutureBookings", checked, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                </div>
                <FormError error={getFieldError("limitFutureBookings")} />

                {watchedLimitFutureBookings && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label htmlFor="maxDaysInFuture">
                      Maximum days in future
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="maxDaysInFuture"
                        type="number"
                        min="1"
                        max="365"
                        placeholder="e.g., 30"
                        className="w-24 text-base"
                        error={hasFieldError("maxDaysInFuture")}
                        value={watch("maxDaysInFuture") || ""}
                        onChange={(e) => {
                          const value = e.target.value
                          setValue(
                            "maxDaysInFuture",
                            value === "" ? null : parseInt(value, 10),
                            { shouldValidate: true, shouldDirty: true }
                          )
                        }}
                      />
                      <span className="text-sm text-muted-foreground">
                        days
                      </span>
                    </div>
                    <FormError error={getFieldError("maxDaysInFuture")} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Buffer Times Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Buffer times
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="beforeEventBuffer">
                    Buffer time before event
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="beforeEventBuffer"
                      type="number"
                      min="0"
                      max="480"
                      placeholder="0"
                      className="w-24 text-base"
                      error={hasFieldError("beforeEventBuffer")}
                      value={watch("beforeEventBuffer") || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        setValue(
                          "beforeEventBuffer",
                          value === "" ? 0 : parseInt(value, 10),
                          { shouldValidate: true, shouldDirty: true }
                        )
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      minutes
                    </span>
                  </div>
                  <FormError error={getFieldError("beforeEventBuffer")} />
                  {!getFieldError("beforeEventBuffer") && (
                    <p className="text-sm text-muted-foreground">
                      Padding time before your event starts
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="afterEventBuffer">
                    Buffer time after event
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="afterEventBuffer"
                      type="number"
                      min="0"
                      max="480"
                      placeholder="0"
                      className="w-24 text-base"
                      error={hasFieldError("afterEventBuffer")}
                      value={watch("afterEventBuffer") || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        setValue(
                          "afterEventBuffer",
                          value === "" ? 0 : parseInt(value, 10),
                          { shouldValidate: true, shouldDirty: true }
                        )
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      minutes
                    </span>
                  </div>
                  <FormError error={getFieldError("afterEventBuffer")} />
                  {!getFieldError("afterEventBuffer") && (
                    <p className="text-sm text-muted-foreground">
                      Padding time after your event ends
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Booking Controls Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Booking controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Requires confirmation</p>
                    <p className="text-sm text-muted-foreground">
                      Manually approve each booking before it's confirmed
                    </p>
                  </div>
                  <Switch
                    checked={watchedRequiresConfirmation}
                    onCheckedChange={(checked) =>
                      setValue("requiresConfirmation", checked, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Disable guests</p>
                    <p className="text-sm text-muted-foreground">
                      Prevent bookers from adding additional guests
                    </p>
                  </div>
                  <Switch
                    checked={watchedDisableGuests}
                    onCheckedChange={(checked) =>
                      setValue("disableGuests", checked, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant Settings Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  AI assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI Email Assistant</p>
                    <p className="text-sm text-muted-foreground">
                      Allow AI to handle email-based booking requests
                    </p>
                  </div>
                  <Switch
                    checked={watchedAiEmailAssistantEnabled}
                    onCheckedChange={(checked) =>
                      setValue("aiEmailAssistantEnabled", checked, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI Phone Assistant</p>
                    <p className="text-sm text-muted-foreground">
                      Allow AI to handle phone-based booking requests
                    </p>
                  </div>
                  <Switch
                    checked={watchedAiPhoneAssistantEnabled}
                    onCheckedChange={(checked) =>
                      setValue("aiPhoneAssistantEnabled", checked, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

export default EventTypeAdvancedForm
