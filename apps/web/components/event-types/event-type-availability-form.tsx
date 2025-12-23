"use client"

import { useEffect, } from "react"
import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/utils/api-client"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
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
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Loader2, AlertTriangle } from "lucide-react"
import { useEnhancedForm } from "@/hooks/use-enhanced-form"
import {
  eventTypeAvailabilitySchema,
  type EventTypeAvailabilityFormData,
} from "@/lib/utils/form-validation"
import { FormError } from "@/components/misc/form-error"
import { ValidationStatus } from "@/components/misc/validation-status"
import SchedulePreviewTable from "@/components/availability/schedule-preview-table"
import { Badge } from "@workspace/ui/components/badge"

const EventTypeAvailabilityForm = () => {
  const params = useParams()
  const eventTypeId = params?.id as string
  const queryClient = useQueryClient()

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

  const { data: availabilitySchedules, isLoading: isLoadingSchedules } =
    useQuery({
      queryKey: ["availability"],
      queryFn: async () => {
        const res = await apiClient.availability.$get({
          query: {},
        })
        if (res.ok) {
          return res.json()
        }
        throw new Error("Failed to fetch availability schedules")
      },
    })

  const watchedScheduleId = watch("availabilityScheduleId")

  // Fetch current availability schedule details if one is selected
  const { data: currentSchedule, isLoading: isLoadingCurrentSchedule } =
    useQuery({
      queryKey: ["availability-schedule", watchedScheduleId],
      queryFn: async () => {
        if (!watchedScheduleId) return null
        const res = await apiClient.availability[":id"].$get({
          param: { id: watchedScheduleId },
        })
        if (res.ok) {
          return res.json()
        }
        return null
      },
      enabled: !!watchedScheduleId,
    })

  useEffect(() => {
    if (eventType?.availabilityScheduleId) {
      setValue("availabilityScheduleId", eventType.availabilityScheduleId)
    }
  }, [eventType?.availabilityScheduleId])

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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Availability schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 lg:p-6">
            <div className="space-y-2">
              <Label htmlFor="availabilityScheduleId">Schedule</Label>
              {watchedScheduleId && (
                <Select
                  onValueChange={(value) => {
                    setValue("availabilityScheduleId", value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }}
                  value={watchedScheduleId}
                  disabled={isLoadingSchedules}
                >
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Select availability schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {availabilitySchedules?.map((schedule) => (
                      <SelectItem key={schedule.id} value={schedule.id}>
                        {schedule.name}{" "}
                        {schedule.isDefault ? (
                          <Badge
                            variant={"outline"}
                            className="border-primary text-primary h-4.5 text-[10px]"
                          >
                            Default
                          </Badge>
                        ) : null}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="mt-2">
              {isLoadingCurrentSchedule ? (
                <div className="border rounded-md overflow-hidden">
                  <div className="divide-y">
                    {Array.from({ length: 7 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-3 items-center p-4"
                      >
                        <div className="col-span-1">
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="col-span-2">
                          <Skeleton className="h-4 w-40" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              ) : currentSchedule ? (
                <SchedulePreviewTable
                  weeklySlots={currentSchedule.weeklySlots || []}
                  timeZone={currentSchedule.timeZone}
                  scheduleId={currentSchedule.id}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Select a schedule to preview its weekly hours
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

export default EventTypeAvailabilityForm
