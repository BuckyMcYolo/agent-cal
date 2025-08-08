"use client"

import React, { useState, useEffect, use } from "react"
import { apiClient } from "@/lib/utils/api-client"
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Switch } from "@workspace/ui/components/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Clock,
  Edit3,
  Save,
  X,
  Plus,
  ArrowLeft,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  MoveLeft,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { useRouter } from "next/navigation"
// import { usePathname } from "next/navigation"
import { TimezoneSelect } from "@/components/misc/inputs/timezone-select"

interface WeeklyScheduleSlot {
  id: string
  scheduleId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface AvailabilitySchedule {
  id: string
  name: string
  timeZone: string
  ownerId: string
  organizationId?: string
  createdAt: string
  updatedAt: string
  isDefault: boolean
  weeklySlots: WeeklyScheduleSlot[]
}

interface DaySlot {
  id: string
  startTime: string
  endTime: string
}

interface DaySchedule {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  enabled: boolean
  slots: DaySlot[]
}

interface AvailabilityScheduleDetailProps {
  params: Promise<{ id: string }>
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4)
  const minute = (i % 4) * 15
  const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  return { value: timeString, label: timeString }
})

// Loading overlay component for save operations
const SaveLoadingOverlay = ({
  message = "Saving changes...",
}: {
  message?: string
}) => {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
      <div className="bg-card border border-border rounded-lg p-6 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <div className="space-y-1">
            <p className="font-medium">{message}</p>
            <p className="text-sm text-muted-foreground">
              Please wait while we update your schedule
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced loading component for the availability detail page
const AvailabilityDetailSkeleton = () => {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Header skeleton with improved animation */}
      <div className="bg-gradient-to-r from-muted/50 to-accent/50 rounded-xl p-6 border">
        <div className="flex items-start gap-4">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-9 w-64" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>

      {/* Weekly Schedule skeleton with staggered animation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map((day, index) => (
            <div
              key={day}
              className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-3 rounded-full" />
                <div className="w-28 font-semibold text-foreground">{day}</div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2 bg-background rounded-lg p-2 border">
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                  <div className="w-4 h-px bg-border" />
                  <span className="text-sm">to</span>
                  <div className="w-4 h-px bg-border" />
                </div>
                <div className="flex items-center gap-2 bg-background rounded-lg p-2 border">
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="ml-auto">
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Schedule Info skeleton with grid layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-secondary rounded-lg">
              <Calendar className="h-5 w-5 text-secondary-foreground" />
            </div>
            Schedule Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-sm">Loading schedule details...</span>
        </div>
      </div>
    </div>
  )
}

const AvailabilityScheduleDetail = ({
  params,
}: AvailabilityScheduleDetailProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [editedIsDefault, setEditedIsDefault] = useState<boolean | null>(null)
  const [editedTimeZone, setEditedTimeZone] = useState<string>("UTC")
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([])
  const nextSlotIdRef = React.useRef(0)
  const generateSlotId = () => `slot-${nextSlotIdRef.current++}`
  const queryClient = useQueryClient()
  const router = useRouter()
  // Unwrap route params Promise (Next.js 15 / React 19)
  const { id } = use(params)

  // Fetch the specific schedule by ID using real API call with enhanced error handling
  const { data: schedule } = useSuspenseQuery({
    queryKey: ["availability", id],
    queryFn: async () => {
      if (!id) {
        throw new Error("No schedule ID provided")
      }

      try {
        const res = await apiClient.availability[":id"].$get({
          param: { id },
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))

          // Enhanced error handling with specific status codes
          if (res.status === 404) {
            throw new Error("Schedule not found. It may have been deleted.")
          } else if (res.status === 403) {
            throw new Error("You don't have permission to view this schedule.")
          } else if (res.status === 401) {
            throw new Error("Please sign in to view this schedule.")
          } else if (res.status >= 500) {
            throw new Error("Server error. Please try again later.")
          } else {
            const data = await res.json()
            throw new Error(
              data.message || `Failed to fetch schedule (${res.status})`
            )
          }
        }

        const data = (await res.json()) as AvailabilitySchedule
        return data
      } catch (error) {
        // Handle network errors
        if (error instanceof TypeError && error.message.includes("fetch")) {
          throw new Error(
            "Network error. Please check your internet connection."
          )
        }

        // Re-throw other errors
        throw error
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (error instanceof Error) {
        const message = error.message.toLowerCase()
        if (
          message.includes("not found") ||
          message.includes("permission") ||
          message.includes("forbidden") ||
          message.includes("unauthorized")
        ) {
          return false
        }
      }

      // Retry up to 3 times for server errors and network issues
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Initialize local state when schedule data is loaded
  useEffect(() => {
    if (schedule) {
      setEditedName(schedule.name)
      setEditedIsDefault(schedule.isDefault)
      setEditedTimeZone(schedule.timeZone)

      // Convert API weekly slots to local DaySchedule format (support multiple slots per day)
      const scheduleByDay: DaySchedule[] = DAYS.map((_, dayIndex) => {
        const daySlots = schedule.weeklySlots
          .filter((slot) => slot.dayOfWeek === dayIndex)
          .map((slot) => ({
            id: generateSlotId(),
            startTime: normalizeToHHMM(slot.startTime) || "09:00",
            endTime: normalizeToHHMM(slot.endTime) || "17:00",
          }))
        return {
          dayOfWeek: dayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          enabled: daySlots.length > 0,
          slots: daySlots,
        }
      })

      setWeeklySchedule(scheduleByDay)
    }
  }, [schedule])

  // Prevent accidental navigation away when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing && hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isEditing, editedName, weeklySchedule, schedule])

  const updateScheduleMutation = useMutation({
    mutationFn: async (data: {
      name: string
      isDefault: boolean | null
      timeZone?: string
      weeklySchedule: DaySchedule[]
    }) => {
      // Convert local DaySchedule format to API format
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ] as const
      const timeSlots = data.weeklySchedule
        .filter((day) => day.enabled)
        .flatMap((day) =>
          day.slots.map((slot) => ({
            dayOfWeek: dayNames[day.dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6],
            startTime: slot.startTime,
            endTime: slot.endTime,
          }))
        )

      if (!id) {
        throw new Error("No schedule ID available")
      }

      const res = await apiClient.availability[":id"].$put({
        param: { id },
        json: {
          name: data.name,
          isDefault: data.isDefault ?? undefined,
          timeZone: data.timeZone ?? undefined,
          timeSlots,
        },
      })

      if (!res.ok) {
        const errorData = await res.json()

        // Enhanced error handling with specific error types
        if (res.status === 404) {
          throw new Error("Schedule not found. It may have been deleted.")
        } else if (res.status === 403) {
          throw new Error("You don't have permission to update this schedule.")
        } else if (res.status === 400) {
          throw new Error(
            errorData.message ||
              "Invalid schedule data. Please check your inputs."
          )
        } else if (res.status >= 500) {
          throw new Error("Server error. Please try again later.")
        } else {
          throw new Error(
            errorData.message || "Failed to update availability schedule"
          )
        }
      }

      return (await res.json()) as AvailabilitySchedule
    },
    // Optimistic updates - immediately update the UI before the API call completes
    onMutate: async (newData) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: ["availability", id],
      })

      // Snapshot the previous value
      const previousSchedule = queryClient.getQueryData(["availability", id])

      // Optimistically update to the new value
      if (previousSchedule && id) {
        queryClient.setQueryData(
          ["availability", id],
          (old: AvailabilitySchedule) => ({
            ...old,
            name: newData.name,
            updatedAt: new Date().toISOString(),
            // Note: We don't update weeklySlots optimistically as the transformation is complex
          })
        )
      }

      // Return a context object with the snapshotted value
      return { previousSchedule }
    },
    onSuccess: (updatedSchedule) => {
      toast.success("Schedule updated successfully!")
      setIsEditing(false)

      // Update the cache with the actual server response
      if (id) {
        queryClient.setQueryData(["availability", id], updatedSchedule)
      }

      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["availability"] })
    },
    onError: (error, newData, context) => {
      // Revert the optimistic update on error
      if (context?.previousSchedule && id) {
        queryClient.setQueryData(["availability", id], context.previousSchedule)
      }

      // Enhanced error messaging with specific error types
      let errorMessage = "Failed to update schedule"
      let errorAction = "Please try again"

      if (error instanceof Error) {
        const message = error.message.toLowerCase()

        if (message.includes("network") || message.includes("fetch")) {
          errorMessage = "Connection error"
          errorAction = "Check your internet connection and try again"
        } else if (message.includes("forbidden") || message.includes("403")) {
          errorMessage = "Permission denied"
          errorAction = "You don't have permission to update this schedule"
        } else if (message.includes("not found") || message.includes("404")) {
          errorMessage = "Schedule not found"
          errorAction = "The schedule may have been deleted"
        } else if (message.includes("validation") || message.includes("400")) {
          errorMessage = "Invalid data"
          errorAction = "Please check your inputs and try again"
        } else {
          errorMessage = error.message
        }
      }

      // Show error toast with action
      toast.error(errorMessage, {
        description: errorAction,
        duration: 5000,
        action: {
          label: "Retry",
          onClick: () => {
            updateScheduleMutation.mutate({
              name: editedName,
              isDefault: editedIsDefault,
              weeklySchedule: weeklySchedule,
            })
          },
        },
      })

      // Keep edit mode active on error so user can retry
      console.error("Schedule update failed:", {
        error: error.message,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        scheduleId: id,
      })
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      if (id) {
        queryClient.invalidateQueries({
          queryKey: ["availability", id],
        })
      }
    },
  })

  const deleteScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No schedule ID available")
      const res = await apiClient.availability[":id"].$delete({ param: { id } })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to delete schedule")
      }
      return true
    },
    onSuccess: () => {
      toast.success("Schedule deleted")
      queryClient.invalidateQueries({ queryKey: ["availability"] })
      try {
        router.replace?.("/availability")
      } catch {}
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    },
  })

  const handleSave = () => {
    // Validation before saving
    if (!editedName.trim()) {
      toast.error("Schedule name cannot be empty")
      return
    }

    // Check if at least one day is enabled
    const hasEnabledDays = weeklySchedule.some((day) => day.enabled)
    if (!hasEnabledDays) {
      toast.error("At least one day must be enabled")
      return
    }

    // Validate time slots (ensure each slot start < end and no overlaps per day)
    for (const day of weeklySchedule) {
      if (!day.enabled) continue
      const slots = day.slots
      for (const slot of slots) {
        const startMinutes = timeToMinutes(slot.startTime)
        const endMinutes = timeToMinutes(slot.endTime)
        if (startMinutes >= endMinutes) {
          const dayName = DAYS[day.dayOfWeek]
          toast.error(
            `Invalid time range for ${dayName}. End time must be after start time.`
          )
          return
        }
      }
      const sorted = [...slots].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      )
      for (let i = 1; i < sorted.length; i++) {
        if (
          timeToMinutes(sorted[i]!.startTime) <
          timeToMinutes(sorted[i - 1]!.endTime)
        ) {
          const dayName = DAYS[day.dayOfWeek]
          toast.error(`Overlapping time slots on ${dayName}.`)
          return
        }
      }
    }

    updateScheduleMutation.mutate({
      name: editedName,
      isDefault: editedIsDefault,
      timeZone: editedTimeZone,
      weeklySchedule: weeklySchedule,
    })
  }

  const handleCancel = () => {
    // Revert changes to original values
    if (schedule) {
      setEditedName(schedule.name)
      setEditedIsDefault(schedule.isDefault)
      setEditedTimeZone(schedule.timeZone)

      // Reset weekly schedule to original state
      const originalScheduleByDay: DaySchedule[] = DAYS.map((_, dayIndex) => {
        const daySlots = schedule.weeklySlots
          .filter((slot) => slot.dayOfWeek === dayIndex)
          .map((slot) => ({
            id: generateSlotId(),
            startTime: normalizeToHHMM(slot.startTime) || "09:00",
            endTime: normalizeToHHMM(slot.endTime) || "17:00",
          }))
        return {
          dayOfWeek: dayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          enabled: daySlots.length > 0,
          slots: daySlots,
        }
      })

      setWeeklySchedule(originalScheduleByDay)
    }

    setIsEditing(false)
  }

  // Helper function to convert time string to minutes for validation
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number)
    return (hours || 0) * 60 + (minutes || 0)
  }

  // Normalize time strings from API (e.g., "09:00:00" -> "09:00") and ensure HH:MM format
  const normalizeToHHMM = (time?: string) => {
    if (!time) return undefined
    // Handle HH:MM:SS or H:MM:SS
    const match = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
    if (match && match[1] != null && match[2] != null) {
      const h = (match[1] || "").padStart(2, "0")
      const m = match[2] || "00"
      return `${h}:${m}`
    }
    // Handle HHMM (e.g., 0900)
    const compact = time.match(/^(\d{2})(\d{2})$/)
    if (compact && compact[1] != null && compact[2] != null) {
      return `${compact[1]}:${compact[2]}`
    }
    return time
  }

  // Add minutes to an HH:MM time string, clamped to 23:45 in 15-min steps
  const addMinutesToTime = (timeStr: string, add: number) => {
    const [hRaw, mRaw] = timeStr.split(":")
    const h = Number(hRaw ?? 0)
    const m = Number(mRaw ?? 0)
    const total = (h || 0) * 60 + (m || 0) + add
    const clamped = Math.min(Math.max(total, 0), 23 * 60 + 45)
    const nh = Math.floor(clamped / 60)
    const nm = clamped % 60
    return `${nh.toString().padStart(2, "0")}:${nm.toString().padStart(2, "0")}`
  }

  // Helper function to detect if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (!schedule) return false

    // Check if name has changed
    if (editedName !== schedule.name) return true
    if (editedIsDefault !== schedule.isDefault) return true
    if (editedTimeZone !== schedule.timeZone) return true

    // Check if weekly schedule has changed
    const originalScheduleByDay: DaySchedule[] = DAYS.map((_, dayIndex) => {
      const daySlots = schedule.weeklySlots
        .filter((slot) => slot.dayOfWeek === dayIndex)
        .map((slot) => ({
          id: "orig",
          startTime: normalizeToHHMM(slot.startTime) || "09:00",
          endTime: normalizeToHHMM(slot.endTime) || "17:00",
        }))
      return {
        dayOfWeek: dayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        enabled: daySlots.length > 0,
        slots: daySlots,
      }
    })

    // Compare current schedule with original
    for (let i = 0; i < weeklySchedule.length; i++) {
      const currentDay = weeklySchedule[i]
      const originalDay = originalScheduleByDay[i]
      if (!currentDay || !originalDay) continue
      if (currentDay.enabled !== originalDay.enabled) return true
      if (currentDay.slots.length !== originalDay.slots.length) return true
      for (let j = 0; j < currentDay.slots.length; j++) {
        if (
          currentDay.slots[j]?.startTime !== originalDay.slots[j]?.startTime ||
          currentDay.slots[j]?.endTime !== originalDay.slots[j]?.endTime
        ) {
          return true
        }
      }
    }

    return false
  }

  // Helper function to check if a specific day has invalid time ranges or overlaps
  const hasInvalidTimeRange = (dayIndex: number) => {
    const day = weeklySchedule.find((d) => d.dayOfWeek === dayIndex)
    if (!day || !day.enabled) return false
    const slots = day.slots
    if (slots.length === 0) return false
    for (const s of slots) {
      if (timeToMinutes(s.startTime) >= timeToMinutes(s.endTime)) return true
    }
    const sorted = [...slots].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    )
    for (let i = 1; i < sorted.length; i++) {
      if (
        timeToMinutes(sorted[i]!.startTime) <
        timeToMinutes(sorted[i - 1]!.endTime)
      ) {
        return true
      }
    }
    return false
  }

  const handleDayToggle = (dayIndex: number, enabled: boolean) => {
    setWeeklySchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayIndex
          ? {
              ...day,
              enabled,
              slots:
                enabled && day.slots.length === 0
                  ? [
                      {
                        id: generateSlotId(),
                        startTime: "09:00",
                        endTime: "17:00",
                      },
                    ]
                  : day.slots,
            }
          : day
      )
    )
  }

  const handleTimeChange = (
    dayIndex: number,
    slotId: string,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setWeeklySchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayIndex
          ? {
              ...day,
              slots: day.slots.map((s) =>
                s.id === slotId ? { ...s, [field]: value } : s
              ),
            }
          : day
      )
    )
  }

  const addTimeSlot = (dayIndex: number) => {
    setWeeklySchedule((prev) =>
      prev.map((day) => {
        if (day.dayOfWeek !== dayIndex) return day
        const last = day.slots[day.slots.length - 1]
        const newSlot: DaySlot = {
          id: generateSlotId(),
          startTime: last ? last.endTime : "09:00",
          endTime: last ? addMinutesToTime(last.endTime, 30) : "09:30",
        }
        return {
          ...day,
          enabled: true,
          slots: [...day.slots, newSlot],
        }
      })
    )
  }

  const removeTimeSlot = (dayIndex: number, slotId: string) => {
    setWeeklySchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayIndex
          ? { ...day, slots: day.slots.filter((s) => s.id !== slotId) }
          : day
      )
    )
  }

  // If for some reason id is not available, show skeleton
  if (!id) {
    return <AvailabilityDetailSkeleton />
  }

  return (
    <div className="relative mx-auto max-w-7xl space-y-4 px-4 md:px-0">
      {/* Loading overlay during save operations */}
      {updateScheduleMutation.isPending && <SaveLoadingOverlay />}

      {/* Floating settings bar */}
      <div className="sticky top-0 z-30 -mx-4 md:mx-0 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 md:px-0">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="outline" size="sm">
                <Link
                  href="/availability"
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Link>
              </Button>
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  disabled={updateScheduleMutation.isPending}
                  className="h-8 w-48 md:w-64 text-sm"
                  placeholder="Schedule name"
                />
              ) : (
                <h1 className="truncate text-sm md:text-base font-medium">
                  {schedule.name}
                </h1>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Set to Default</span>
                <Switch
                  aria-label="Set as default schedule"
                  checked={!!editedIsDefault}
                  onCheckedChange={(checked) => setEditedIsDefault(checked)}
                  disabled={!isEditing || updateScheduleMutation.isPending}
                />
              </div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={updateScheduleMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={
                      updateScheduleMutation.isPending || !hasUnsavedChanges()
                    }
                  >
                    {updateScheduleMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Saving
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Save
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <svg
                          className="h-4 w-4 mr-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete schedule?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone and will remove all
                          weekly slots.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteScheduleMutation.mutate()}
                          loading={deleteScheduleMutation.isPending}
                          variant={"destructive"}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Weekly Schedule - main area */}
        <div className="col-span-12 lg:col-span-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                Weekly Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {DAYS.map((day, dayIndex) => {
                const daySchedule = weeklySchedule.find(
                  (d) => d.dayOfWeek === dayIndex
                )
                const isEnabled = daySchedule?.enabled || false
                const hasError = isEditing && hasInvalidTimeRange(dayIndex)

                return (
                  <div
                    key={day}
                    className={`relative flex items-center gap-3 p-2 rounded-md border transition-colors duration-200 ${
                      hasError
                        ? "border-destructive/50 bg-destructive/5"
                        : isEnabled
                          ? "border-primary/30 bg-primary/10"
                          : "border-border/60 bg-card/40 hover:bg-card/60"
                    }`}
                  >
                    {/* Day indicator */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isEnabled
                            ? "bg-primary shadow-lg shadow-primary/30"
                            : "bg-muted-foreground/30"
                        }`}
                      />
                      <div className="w-24 font-medium text-foreground text-xs md:text-sm">
                        {day}
                      </div>
                    </div>

                    {/* Enhanced Switch with better visual feedback */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) =>
                          handleDayToggle(dayIndex, checked)
                        }
                        disabled={
                          !isEditing || updateScheduleMutation.isPending
                        }
                        className={
                          isEnabled ? "data-[state=checked]:bg-primary" : ""
                        }
                      />
                      <span
                        className={`text-xs ${
                          isEnabled ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {isEnabled ? "Available" : "Unavailable"}
                      </span>
                    </div>

                    {isEnabled && daySchedule && (
                      <div className="flex items-center gap-2 flex-1 flex-wrap">
                        {daySchedule.slots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center gap-2 bg-background rounded-md p-2 border"
                          >
                            <Select
                              value={slot.startTime || "09:00"}
                              onValueChange={(value) =>
                                handleTimeChange(
                                  dayIndex,
                                  slot.id,
                                  "startTime",
                                  value
                                )
                              }
                              disabled={
                                !isEditing || updateScheduleMutation.isPending
                              }
                            >
                              <SelectTrigger className="w-24 dark:border-none shadow-none focus:ring-0 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map((time) => (
                                  <SelectItem
                                    key={time.value}
                                    value={time.value}
                                  >
                                    {time.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <span className="text-xs text-muted-foreground">
                              to
                            </span>

                            <Select
                              value={slot.endTime || "17:00"}
                              onValueChange={(value) =>
                                handleTimeChange(
                                  dayIndex,
                                  slot.id,
                                  "endTime",
                                  value
                                )
                              }
                              disabled={
                                !isEditing || updateScheduleMutation.isPending
                              }
                            >
                              <SelectTrigger className="w-24 dark:border-none shadow-none focus:ring-0 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OPTIONS.map((time) => (
                                  <SelectItem
                                    key={time.value}
                                    value={time.value}
                                  >
                                    {time.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                  removeTimeSlot(dayIndex, slot.id)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}

                        {isEditing && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addTimeSlot(dayIndex)}
                            disabled={updateScheduleMutation.isPending}
                            className="border-dashed"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        )}
                      </div>
                    )}

                    {hasError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-destructive/5 rounded-md pointer-events-none">
                        <div className="flex items-center gap-2 text-destructive font-medium">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">
                            End time must be after start time
                          </span>
                        </div>
                      </div>
                    )}

                    {!isEnabled && isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(dayIndex)}
                        disabled={updateScheduleMutation.isPending}
                        className={`ml-auto border-dashed hover:border-primary hover:bg-primary/5 ${
                          updateScheduleMutation.isPending
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add hours
                      </Button>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Side panel - Information only */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Information card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-2 bg-secondary rounded-lg">
                  <Calendar className="h-4 w-4 text-secondary-foreground" />
                </div>
                Schedule Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Time Zone
                  </div>
                  {isEditing ? (
                    <TimezoneSelect
                      value={editedTimeZone}
                      onChange={setEditedTimeZone}
                      disabled={updateScheduleMutation.isPending}
                      className="w-full md:w-64 h-8"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20 text-xs"
                      >
                        {schedule.timeZone}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-2"></div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Created
                  </div>
                  <p className="font-medium text-foreground">
                    {new Date(schedule.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Edit3 className="h-4 w-4" />
                    Last Updated
                  </div>
                  <p className="font-medium text-foreground">
                    {new Date(schedule.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Schedule Summary */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Schedule Summary
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {weeklySchedule.filter((d) => d.enabled).length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Active Days
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {(() => {
                          const totalMinutes = weeklySchedule
                            .filter((d) => d.enabled)
                            .reduce((acc, day) => {
                              const dayMinutes = day.slots.reduce((m, s) => {
                                return (
                                  m +
                                  Math.max(
                                    0,
                                    timeToMinutes(s.endTime) -
                                      timeToMinutes(s.startTime)
                                  )
                                )
                              }, 0)
                              return acc + dayMinutes
                            }, 0)
                          return Math.floor(totalMinutes / 60)
                        })()}
                        h
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Weekly Hours
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {(() => {
                          const enabledDays = weeklySchedule.filter(
                            (d) => d.enabled
                          )
                          if (enabledDays.length === 0) return "N/A"
                          const starts: number[] = []
                          enabledDays.forEach((day) =>
                            day.slots.forEach((s) =>
                              starts.push(timeToMinutes(s.startTime))
                            )
                          )
                          if (starts.length === 0) return "N/A"
                          const avgStart =
                            starts.reduce((acc, v) => acc + v, 0) /
                            starts.length
                          const hours = Math.floor(avgStart / 60)
                          const minutes = (avgStart % 60).toFixed(0)
                          return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
                        })()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg Start
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {(() => {
                          const enabledDays2 = weeklySchedule.filter(
                            (d) => d.enabled
                          )
                          if (enabledDays2.length === 0) return "N/A"
                          const ends: number[] = []
                          enabledDays2.forEach((day) =>
                            day.slots.forEach((s) =>
                              ends.push(timeToMinutes(s.endTime))
                            )
                          )
                          if (ends.length === 0) return "N/A"
                          const avgEnd =
                            ends.reduce((acc, v) => acc + v, 0) / ends.length
                          const hours = Math.floor(avgEnd / 60)
                          const minutes = (avgEnd % 60).toFixed(0)
                          return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
                        })()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg End
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Enhanced error boundary component for handling API errors
const AvailabilityDetailError = ({
  error,
  retry,
}: {
  error: Error
  retry: () => void
}) => {
  // Determine error type and provide appropriate messaging
  const getErrorDetails = (error: Error) => {
    const message = error.message.toLowerCase()

    if (message.includes("not found") || message.includes("404")) {
      return {
        title: "Schedule Not Found",
        description:
          "The availability schedule you're looking for doesn't exist or may have been deleted.",
        icon: <XCircle className="h-6 w-6 text-destructive" />,
        showRetry: false,
      }
    }

    if (message.includes("forbidden") || message.includes("403")) {
      return {
        title: "Access Denied",
        description:
          "You don't have permission to view this availability schedule.",
        icon: <XCircle className="h-6 w-6 text-destructive" />,
        showRetry: false,
      }
    }

    if (message.includes("network") || message.includes("fetch")) {
      return {
        title: "Connection Error",
        description:
          "Unable to connect to the server. Please check your internet connection and try again.",
        icon: <XCircle className="h-6 w-6 text-destructive" />,
        showRetry: true,
      }
    }

    if (message.includes("timeout")) {
      return {
        title: "Request Timeout",
        description: "The request took too long to complete. Please try again.",
        icon: <Clock className="h-6 w-6 text-muted-foreground" />,
        showRetry: true,
      }
    }

    // Default error
    return {
      title: "Something Went Wrong",
      description:
        error.message ||
        "An unexpected error occurred while loading the schedule.",
      icon: <XCircle className="h-6 w-6 text-destructive" />,
      showRetry: true,
    }
  }

  const errorDetails = getErrorDetails(error)

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Header with back button */}
      <div className="bg-gradient-to-r from-destructive/5 to-destructive/10 rounded-xl p-6 border border-destructive/20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/availability">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            Availability Schedule
          </h1>
        </div>
      </div>

      {/* Enhanced error card */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-destructive">
            {errorDetails.icon}
            {errorDetails.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground leading-relaxed">
              {errorDetails.description}
            </p>

            {/* Technical error details (collapsible) */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <code className="text-xs text-muted-foreground break-all">
                  {error.message}
                </code>
              </div>
            </details>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {errorDetails.showRetry && (
              <Button onClick={retry} className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                Try Again
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/availability" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Availability
              </Link>
            </Button>
          </div>

          {/* Help text */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              If this problem persists, please contact support or try refreshing
              the page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AvailabilityScheduleDetail
