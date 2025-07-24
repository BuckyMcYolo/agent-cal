"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { apiClient } from "@/lib/utils/api-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Switch } from "@workspace/ui/components/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@workspace/ui/components/form"
import { Plus, Loader2, Clock, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@workspace/ui/lib/utils"
import { Card } from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import { ScrollArea } from "@workspace/ui/components/scroll-area"

// Define the day slot type and schema
type DaySlot = {
  enabled: boolean
  slots: { startTime: string; endTime: string }[]
}

const daySlotSchema = z.object({
  enabled: z.boolean(),
  slots: z.array(
    z.object({
      startTime: z.string(),
      endTime: z.string(),
    })
  ),
})

const createAvailabilitySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  sunday: daySlotSchema,
  monday: daySlotSchema,
  tuesday: daySlotSchema,
  wednesday: daySlotSchema,
  thursday: daySlotSchema,
  friday: daySlotSchema,
  saturday: daySlotSchema,
})

type CreateAvailabilityFormData = z.infer<typeof createAvailabilitySchema>

const DAYS = [
  { key: "sunday", label: "Sunday" },
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
]

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4)
  const minute = (i % 4) * 15
  const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayTime = `${displayHour}${minute !== 0 ? `:${minute.toString().padStart(2, "0")}` : ""} ${ampm}`
  return { value: timeString, label: displayTime }
})

interface CreateAvailabilityDialogProps {
  children?: React.ReactNode
}

export default function CreateAvailabilityDialog({
  children,
}: CreateAvailabilityDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  // Default availability slots for each day
  const defaultWorkingHours = [{ startTime: "09:00", endTime: "17:00" }]
  const emptySlots = [{ startTime: "", endTime: "" }]

  const defaultSchedule = {
    sunday: { enabled: false, slots: emptySlots },
    monday: { enabled: true, slots: defaultWorkingHours },
    tuesday: { enabled: true, slots: defaultWorkingHours },
    wednesday: { enabled: true, slots: defaultWorkingHours },
    thursday: { enabled: true, slots: defaultWorkingHours },
    friday: { enabled: true, slots: defaultWorkingHours },
    saturday: { enabled: false, slots: emptySlots },
  }

  const form = useForm<CreateAvailabilityFormData>({
    resolver: zodResolver(createAvailabilitySchema),
    defaultValues: {
      name: "",
      ...defaultSchedule,
    },
  })

  const {
    watch,
    register,
    setValue,
    formState: { errors },
  } = form

  const createAvailabilityMutation = useMutation({
    mutationFn: async (data: CreateAvailabilityFormData) => {
      const timeslots = Object.entries(data)
      const timeSlots = timeslots
        .filter(([key]) => key !== "name")
        .flatMap(([key, value]) => {
          const daySlot = value as DaySlot

          return daySlot.slots.map((slot) => ({
            dayOfWeek: key as
              | "sunday"
              | "monday"
              | "tuesday"
              | "wednesday"
              | "thursday"
              | "friday"
              | "saturday",
            startTime: slot.startTime || "",
            endTime: slot.endTime || "",
          }))
        })
        .filter((slot) => slot.startTime && slot.endTime)

      const res = await apiClient.availability.$post({
        json: {
          name: data.name,
          timeSlots: timeSlots,
        },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(
          errorData.message || "Failed to create availability schedule"
        )
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] })
      toast.success("Availability schedule created successfully!")
      setOpen(false)
      form.reset({
        name: "",
        ...defaultSchedule,
      })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create availability schedule")
    },
  })

  const onSubmit = (data: CreateAvailabilityFormData) => {
    createAvailabilityMutation.mutate(data)
  }

  // Helper function to add a time slot for a specific day
  const addTimeSlot = (day: string) => {
    const currentDay = watch(day as any) as DaySlot
    const updatedSlots = [...currentDay.slots, { startTime: "", endTime: "" }]
    setValue(`${day}.slots` as any, updatedSlots)
  }

  // Helper function to remove a time slot for a specific day
  const removeTimeSlot = (day: string, index: number) => {
    const currentDay = watch(day as any) as DaySlot
    const updatedSlots = currentDay.slots.filter((_, i) => i !== index)
    setValue(`${day}.slots` as any, updatedSlots)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset({
        name: "",
        ...defaultSchedule,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Availability Schedule</DialogTitle>
          <DialogDescription>
            Create a new availability schedule to define when you're available
            for bookings. You can customize this further after creation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Working Hours, Weekend Schedule"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormDescription>
                    Give your schedule a descriptive name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ScrollArea className="flex-1 px-6 pb-4 h-[400px]" type="always">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Weekly Availability</h3>
                <p className="text-sm text-muted-foreground">
                  Select which days you're available and set your hours for each
                  day.
                </p>
                {/* Days of the week */}
                {DAYS.map(({ key, label }) => (
                  <Card key={key} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <FormField
                          control={form.control}
                          name={`${key}.enabled` as any}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <Label
                                htmlFor={`${key}-switch`}
                                className="font-medium"
                              >
                                {label}
                              </Label>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Time slots for this day - only shown if the day is enabled */}
                    {watch(`${key}.enabled` as any) && (
                      <div className="space-y-4 pl-8">
                        {watch(`${key}.slots` as any)?.map(
                          (_: any, index: number) => (
                            <div key={index} className="flex items-end gap-2">
                              <FormField
                                control={form.control}
                                name={`${key}.slots.${index}.startTime` as any}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormLabel
                                      className={
                                        index > 0 ? "sr-only" : undefined
                                      }
                                    >
                                      Start Time
                                    </FormLabel>
                                    <FormControl>
                                      <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select time" />
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
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="mx-2 mb-2">to</div>
                              <FormField
                                control={form.control}
                                name={`${key}.slots.${index}.endTime` as any}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormLabel
                                      className={
                                        index > 0 ? "sr-only" : undefined
                                      }
                                    >
                                      End Time
                                    </FormLabel>
                                    <FormControl>
                                      <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select time" />
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
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              {index > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeTimeSlot(key, index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTimeSlot(key)}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Time Slot
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createAvailabilityMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAvailabilityMutation.isPending}
              >
                {createAvailabilityMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Schedule
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
