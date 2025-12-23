"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect } from "react"
import { FormError } from "@/components/misc/form-error"
import { ValidationStatus } from "@/components/misc/validation-status"
import { useEnhancedForm } from "@/hooks/use-enhanced-form"
import { apiClient } from "@/lib/utils/api-client"
import {
  type EventTypeAvailabilityFormData,
  eventTypeAvailabilitySchema,
} from "@/lib/utils/form-validation"

// Scheduling type options
const SCHEDULING_TYPE_OPTIONS = [
  {
    value: "INDIVIDUAL" as const,
    label: "Individual",
    description: "Guests book with you directly",
    icon: "👤",
  },
  {
    value: "ROUND_ROBIN" as const,
    label: "Round Robin",
    description: "Distribute bookings evenly among team members",
    icon: "🔄",
  },
  {
    value: "COLLECTIVE" as const,
    label: "Collective",
    description: "All team members attend the meeting",
    icon: "👥",
  },
]

// Common timezone options
const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
]

const EventTypeSchedulingForm = () => {
  const params = useParams()
  const eventTypeId = params?.id as string
  const queryClient = useQueryClient()

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
      if (res.ok) return res.json()
      const errorData = await res.json()
      throw new Error(errorData.message || "Failed to fetch event type")
    },
    enabled: !!eventTypeId,
    retry: false,
  })

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
  } = useEnhancedForm<EventTypeAvailabilityFormData>({
    schema: eventTypeAvailabilitySchema,
    defaultValues: {
      timeZone: null,
      lockTimezone: false,
      schedulingType: "INDIVIDUAL",
      minimumBookingNotice: 60,
      availabilityScheduleId: null,
    },
    onSubmit: async (data) => {
      // Only submit the scheduling-related fields
      const { timeZone, lockTimezone, schedulingType, minimumBookingNotice } =
        data
      const res = await apiClient["event-types"][":id"].$put({
        param: { id: eventTypeId },
        json: {
          timeZone,
          lockTimezone,
          schedulingType,
          minimumBookingNotice,
        },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to update scheduling")
      }
      queryClient.invalidateQueries({ queryKey: ["event-type", eventTypeId] })
      queryClient.invalidateQueries({ queryKey: ["event-types"] })
      return res.json()
    },
    successMessage: "Scheduling updated successfully!",
    enableRealTimeValidation: true,
  })

  const watchedTimeZone = watch("timeZone")
  const watchedLockTimezone = watch("lockTimezone")
  const watchedSchedulingType = watch("schedulingType")

  useEffect(() => {
    if (eventType) {
      reset({
        timeZone: eventType.timeZone || null,
        lockTimezone: eventType.lockTimezone || false,
        schedulingType: eventType.schedulingType || "INDIVIDUAL",
        minimumBookingNotice: eventType.minimumBookingNotice || 60,
        availabilityScheduleId: eventType.availabilityScheduleId || null,
      })
    }
  }, [eventType, reset])

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading scheduling…</p>
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
            <p className="text-destructive font-medium">Failed to load</p>
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
    <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
      {submitError && (
        <FormError
          error={submitError}
          variant="form"
          onDismiss={clearSubmitError}
        />
      )}

      <form onSubmit={enhancedSubmit} className="space-y-6">
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Timezone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timeZone">Event Timezone</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("timeZone", value === "none" ? null : value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  value={watchedTimeZone || "none"}
                >
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Use guest's timezone</SelectItem>
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lock Timezone</p>
                  <p className="text-sm text-muted-foreground">
                    Force guests to book in the event's timezone
                  </p>
                </div>
                <Switch
                  checked={watchedLockTimezone}
                  onCheckedChange={(checked) =>
                    setValue("lockTimezone", checked, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Scheduling type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>How should this event be scheduled?</Label>
                <div
                  className="space-y-3"
                  role="radiogroup"
                  aria-label="Select scheduling type"
                >
                  {SCHEDULING_TYPE_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        "flex items-center justify-between p-3 lg:p-4 border border-border rounded-lg cursor-pointer transition-colors touch-manipulation",
                        watchedSchedulingType === option.value
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50 active:bg-muted/70"
                      )}
                      onClick={() =>
                        setValue("schedulingType", option.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      role="radio"
                      aria-checked={watchedSchedulingType === option.value}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setValue("schedulingType", option.value, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-lg flex-shrink-0">
                          {option.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 lg:w-4 lg:h-4 rounded-full border-2 transition-colors flex-shrink-0",
                          watchedSchedulingType === option.value
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        )}
                      >
                        {watchedSchedulingType === option.value && (
                          <div className="w-full h-full rounded-full bg-white scale-50" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Booking notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minimumBookingNotice">
                  Minimum booking notice (minutes)
                </Label>
                <Input
                  id="minimumBookingNotice"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="60"
                  className="text-base"
                  error={hasFieldError("minimumBookingNotice")}
                  {...register("minimumBookingNotice", { valueAsNumber: true })}
                />
                <FormError error={getFieldError("minimumBookingNotice")} />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}

export default EventTypeSchedulingForm
