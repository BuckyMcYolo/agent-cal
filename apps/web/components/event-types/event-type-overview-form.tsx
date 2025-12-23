"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/utils/api-client"
import { sluggify } from "@/lib/utils/sluggify"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Switch } from "@workspace/ui/components/switch"
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
import { Loader2, AlertTriangle } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { useEnhancedForm } from "@/hooks/use-enhanced-form"
import {
  eventTypeOverviewSchema,
  type EventTypeOverviewFormData,
} from "@/lib/utils/form-validation"
import { FormError } from "@/components/misc/form-error"
import { ValidationStatus } from "@/components/misc/validation-status"

// Duration options in 15-minute increments
const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
]

// Location type options
const LOCATION_TYPE_OPTIONS = [
  {
    value: "VIRTUAL" as const,
    label: "Virtual",
    description: "Video conference (Zoom, Google Meet, etc.)",
    icon: "🖥️",
  },
  {
    value: "IN_PERSON" as const,
    label: "In Person",
    description: "Meet at a physical location",
    icon: "📍",
  },
  {
    value: "PHONE" as const,
    label: "Phone Call",
    description: "Audio call via phone",
    icon: "📞",
  },
]

const EventTypeOverviewForm = () => {
  const params = useParams()
  const eventTypeId = params?.id as string
  const queryClient = useQueryClient()
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)

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
      const res = await apiClient["event-types"][":id"].$put({
        param: { id: eventTypeId },
        json: data,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to update event type")
      }

      // Invalidate queries on success
      queryClient.invalidateQueries({ queryKey: ["event-type", eventTypeId] })
      queryClient.invalidateQueries({ queryKey: ["event-types"] })

      return res.json()
    },
    successMessage: "Event type updated successfully!",
    enableRealTimeValidation: true,
  })

  // Removed unsaved changes leave-page warning and inline alert per design update

  // Watch form values
  const watchedTitle = watch("title")
  const watchedSlug = watch("slug")
  const watchedHidden = watch("hidden")
  const watchedLocationType = watch("locationType")
  const watchedLength = watch("length")
  const watchedDescription = watch("description")

  // Auto-generate slug from title
  useEffect(() => {
    if (watchedTitle && !isSlugManuallyEdited) {
      const generatedSlug = sluggify(watchedTitle)
      setValue("slug", generatedSlug, { shouldValidate: true })
    }
  }, [watchedTitle, isSlugManuallyEdited, setValue])

  // Reset form when event type data loads
  useEffect(() => {
    if (eventType) {
      reset({
        title: eventType.title || "",
        slug: eventType.slug || "",
        description: eventType.description || "",
        length: eventType.length,
        hidden: eventType.hidden || false,
        locationType: eventType.locationType || "VIRTUAL",
      })
      setIsSlugManuallyEdited(false) // Reset slug editing state
    }
  }, [eventType])

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true)
    setValue("slug", e.target.value, { shouldValidate: true })
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading event type...</p>
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
              Failed to load event type
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
                setIsSlugManuallyEdited(false)
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

        <div className="grid grid-cols-1 gap-4 lg:gap-6">
          <div className="space-y-4 lg:space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Event details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 lg:p-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., 30 Minute Meeting"
                    error={hasFieldError("title")}
                    className="text-base" // Prevent zoom on iOS
                    value={watchedTitle || ""}
                    onChange={(e) => {
                      setValue("title", e.target.value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }}
                  />
                  <FormError error={getFieldError("title")} />
                  {!getFieldError("title") && (
                    <p className="text-sm text-muted-foreground">
                      The name of your event type that guests will see
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Event URL *</Label>
                  <div className="flex flex-col sm:flex-row">
                    <span className="inline-flex items-center px-3 py-2 sm:py-0 rounded-t-md sm:rounded-l-md sm:rounded-t-none border border-b-0 sm:border-b sm:border-r-0 border-border bg-muted text-muted-foreground text-sm">
                      agentcal.com/
                    </span>
                    <Input
                      id="slug"
                      className={cn(
                        "rounded-b-md sm:rounded-l-none sm:rounded-b-none sm:rounded-r-md text-base",
                        {
                          "border-destructive": hasFieldError("slug"),
                        }
                      )}
                      placeholder="30-min-meeting"
                      value={watchedSlug}
                      onChange={(e) => {
                        handleSlugChange(e)
                        // ensure dirtiness tracked for URL changes
                        setValue("slug", e.target.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }}
                    />
                  </div>
                  <FormError error={getFieldError("slug")} />
                  {!getFieldError("slug") && (
                    <p className="text-sm text-muted-foreground">
                      The URL where guests can book this event
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the meeting..."
                    className={cn("resize-none text-base", {
                      "border-destructive": hasFieldError("description"),
                    })}
                    rows={3}
                    value={watchedDescription || ""}
                    onChange={(e) => {
                      setValue("description", e.target.value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }}
                  />
                  <FormError error={getFieldError("description")} />
                  {!getFieldError("description") && (
                    <p className="text-sm text-muted-foreground">
                      A brief description shown to guests when booking
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length">Duration *</Label>
                  <Select
                    key={`length-${watchedLength}`}
                    onValueChange={(value) =>
                      setValue("length", parseInt(value, 10), {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    value={String(watchedLength || 30)}
                  >
                    <SelectTrigger
                      className={cn({
                        "border-destructive": hasFieldError("length"),
                      })}
                    >
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormError error={getFieldError("length")} />
                  {!getFieldError("length") && (
                    <p className="text-sm text-muted-foreground">
                      How long each booking will last
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Location Type *</Label>
                  <div
                    className="space-y-3"
                    role="radiogroup"
                    aria-label="Select location type"
                  >
                    {LOCATION_TYPE_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className={cn(
                          "flex items-center justify-between p-3 lg:p-4 border border-border rounded-lg cursor-pointer transition-colors touch-manipulation",
                          watchedLocationType === option.value
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50 active:bg-muted/70"
                        )}
                        onClick={() =>
                          setValue("locationType", option.value, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                        role="radio"
                        aria-checked={watchedLocationType === option.value}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setValue("locationType", option.value, {
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
                            watchedLocationType === option.value
                              ? "border-primary bg-primary"
                              : "border-muted-foreground"
                          )}
                        >
                          {watchedLocationType === option.value && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose how guests will meet with you
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {watchedHidden ? "Hidden" : "Public"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {watchedHidden
                        ? "This event type is hidden and cannot be booked"
                        : "This event type is visible and can be booked by guests"}
                    </p>
                  </div>
                  <Switch
                    checked={!watchedHidden}
                    onCheckedChange={(checked) =>
                      setValue("hidden", !checked, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    aria-label={
                      watchedHidden
                        ? "Make event type public"
                        : "Make event type hidden"
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

export default EventTypeOverviewForm
