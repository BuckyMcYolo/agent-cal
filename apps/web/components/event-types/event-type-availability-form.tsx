"use client"

import React, { useEffect } from "react"
import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/utils/api-client"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Separator } from "@workspace/ui/components/separator"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Calendar,
  Clock,
  Globe,
  Users,
  Loader2,
  Info,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { useEnhancedForm } from "@/hooks/use-enhanced-form"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import {
  eventTypeAvailabilitySchema,
  type EventTypeAvailabilityFormData,
} from "@/lib/utils/form-validation"
import { FormError } from "@/components/misc/form-error"
import { ValidationStatus } from "@/components/misc/validation-status"

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

const EventTypeAvailabilityForm = () => {
  const params = useParams()
  const eventTypeId = params?.id as string
  const queryClient = useQueryClient()

  // Fetch existing event type data
  const {
    data: eventType,
    isLoading: isLoadingEventType,
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

  // Fetch availability schedules
  const { data: availabilitySchedules, isLoading: isLoadingSchedules } =
    useQuery({
      queryKey: ["availability-schedules"],
      queryFn: async () => {
        const res = await apiClient.availability.$get({
          query: {
            returnOrg: false,
          },
        })
        if (res.ok) {
          return res.json()
        }
        throw new Error("Failed to fetch availability schedules")
      },
    })

  // Fetch current availability schedule details if one is selected
  const { data: currentSchedule } = useQuery({
    queryKey: ["availability-schedule", eventType?.availabilityScheduleId],
    queryFn: async () => {
      if (!eventType?.availabilityScheduleId) return null
      const res = await apiClient.availability[":id"].$get({
        param: { id: eventType.availabilityScheduleId },
      })
      if (res.ok) {
        return res.json()
      }
      return null
    },
    enabled: !!eventType?.availabilityScheduleId,
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
  } = useEnhancedForm<EventTypeAvailabilityFormData>({
    schema: eventTypeAvailabilitySchema,
    defaultValues: {
      availabilityScheduleId: null,
      timeZone: null,
      lockTimezone: false,
      schedulingType: "INDIVIDUAL",
      minimumBookingNotice: 60,
    },
    onSubmit: async (data) => {
      const res = await apiClient["event-types"][":id"].$put({
        param: { id: eventTypeId },
        json: data,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(
          errorData.message || "Failed to update availability settings"
        )
      }

      // Invalidate queries on success
      queryClient.invalidateQueries({ queryKey: ["event-type", eventTypeId] })
      queryClient.invalidateQueries({ queryKey: ["event-types"] })

      return res.json()
    },
    successMessage: "Availability settings updated successfully!",
    enableRealTimeValidation: true,
  })

  // Unsaved changes warning
  useUnsavedChanges({
    hasUnsavedChanges,
    message:
      "You have unsaved changes to your availability settings. Are you sure you want to leave?",
  })

  const watchedScheduleId = watch("availabilityScheduleId")
  const watchedTimeZone = watch("timeZone")
  const watchedLockTimezone = watch("lockTimezone")
  const watchedSchedulingType = watch("schedulingType")
  const watchedMinimumBookingNotice = watch("minimumBookingNotice")

  // Reset form when event type data loads
  useEffect(() => {
    if (eventType) {
      reset({
        availabilityScheduleId: eventType.availabilityScheduleId || null,
        timeZone: eventType.timeZone || null,
        lockTimezone: eventType.lockTimezone || false,
        schedulingType: eventType.schedulingType || "INDIVIDUAL",
        minimumBookingNotice: eventType.minimumBookingNotice || 60,
      })
    }
  }, [eventType, reset])

  if (isLoadingEventType) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">
              Loading availability settings...
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
              Failed to load availability settings
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
    <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl lg:text-2xl font-semibold text-foreground">
          Availability Settings
        </h1>
        <p className="text-sm lg:text-base text-muted-foreground">
          Configure when and how guests can book this event type.
        </p>
      </div>

      <Separator />

      {/* Form-level error display */}
      {submitError && (
        <FormError
          error={submitError}
          variant="form"
          onDismiss={clearSubmitError}
        />
      )}

      {/* Unsaved changes warning */}
      {hasUnsavedChanges && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>You have unsaved changes</span>
        </div>
      )}

      <form onSubmit={enhancedSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Availability Schedule Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Availability Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 lg:p-6">
                <div className="space-y-2">
                  <Label htmlFor="availabilityScheduleId">Schedule</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue(
                        "availabilityScheduleId",
                        value === "none" ? null : value,
                        {
                          shouldValidate: true,
                        }
                      )
                    }
                    value={watchedScheduleId || "none"}
                    disabled={isLoadingSchedules}
                  >
                    <SelectTrigger className="text-base">
                      <SelectValue placeholder="Select availability schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Use default availability
                      </SelectItem>
                      {availabilitySchedules?.map((schedule) => (
                        <SelectItem key={schedule.id} value={schedule.id}>
                          {schedule.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Choose which availability schedule to use for this event
                    type
                  </p>
                </div>

                {/* Current Schedule Info */}
                {currentSchedule && (
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {currentSchedule.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Timezone: {currentSchedule.timeZone}
                        </p>
                        {currentSchedule.weeklySlots &&
                          currentSchedule.weeklySlots.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {currentSchedule.weeklySlots.length} time slots
                              configured
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timezone Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Timezone Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timeZone">Event Timezone</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("timeZone", value === "none" ? null : value, {
                        shouldValidate: true,
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
                  <p className="text-sm text-muted-foreground">
                    Set a specific timezone for this event type
                  </p>
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
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Scheduling Type Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Scheduling Type
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

            {/* Booking Notice Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Booking Notice
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
                    {...register("minimumBookingNotice", {
                      valueAsNumber: true,
                    })}
                  />
                  <FormError error={getFieldError("minimumBookingNotice")} />
                  {!getFieldError("minimumBookingNotice") && (
                    <p className="text-sm text-muted-foreground">
                      How far in advance guests must book this event
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Schedule:
                    </span>
                    <span className="text-sm font-medium">
                      {currentSchedule?.name || "Default"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Timezone:
                    </span>
                    <span className="text-sm font-medium">
                      {watchedTimeZone
                        ? TIMEZONE_OPTIONS.find(
                            (tz) => tz.value === watchedTimeZone
                          )?.label || watchedTimeZone
                        : "Guest's timezone"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Lock timezone:
                    </span>
                    <span className="text-sm font-medium">
                      {watchedLockTimezone ? "Yes" : "No"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Scheduling:
                    </span>
                    <span className="text-sm font-medium">
                      {
                        SCHEDULING_TYPE_OPTIONS.find(
                          (opt) => opt.value === watchedSchedulingType
                        )?.label
                      }
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Min notice:
                    </span>
                    <span className="text-sm font-medium">
                      {watchedMinimumBookingNotice} minutes
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 border-t border-border">
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
      </form>
    </div>
  )
}

export default EventTypeAvailabilityForm
