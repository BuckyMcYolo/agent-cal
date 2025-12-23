"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { Loader2, Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { apiClient } from "@/lib/utils/api-client"

const createEventTypeSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(255, "Description must be less than 1000 characters"),
  length: z
    .number()
    .min(15, "Length must be at least 15 minutes")
    .max(480, "Length must be less than 8 hours"),
})

type CreateEventTypeFormData = z.infer<typeof createEventTypeSchema>

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

interface CreateEventTypeDialogProps {
  children?: React.ReactNode
}

export default function CreateEventTypeDialog({
  children,
}: CreateEventTypeDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<CreateEventTypeFormData>({
    resolver: zodResolver(createEventTypeSchema),
    defaultValues: {
      title: "",
      description: "",
      length: 30,
    },
  })

  const {
    watch,
    register,
    setValue,
    formState: { errors },
  } = form

  const createEventTypeMutation = useMutation({
    mutationFn: async (data: CreateEventTypeFormData) => {
      const res = await apiClient["event-types"].$post({
        json: data,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to create event type")
      }

      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-types"] })
      toast.success("Event type created successfully!")
      setOpen(false)
      form.reset()

      // Optionally navigate to the new event type
      // router.push(`/event-types/${data.id}`)
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to create event type"

      // Handle specific field errors
      if (errorMessage.includes("title") && errorMessage.includes("exists")) {
        form.setError("title", {
          type: "manual",
          message: errorMessage,
        })
      } else {
        toast.error(errorMessage)
      }
    },
  })

  const onSubmit = (data: CreateEventTypeFormData) => {
    createEventTypeMutation.mutate(data)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Event Type
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Event Type</DialogTitle>
          <DialogDescription>
            Create a new event type to start accepting bookings. You can
            customize more settings after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              placeholder="e.g., 30 Minute Meeting"
              error={!!errors.title}
              {...register("title")}
              helperText={
                errors.title?.message
                  ? errors.title.message
                  : " The name of your event type that guests will see"
              }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="e.g., A brief meeting to discuss your project needs"
              className={cn("resize-none", {
                "border-destructive": errors.description,
              })}
              rows={3}
              {...register("description")}
            />

            {errors.description ? (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                A brief description of the event type
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="length" className="text-sm font-medium">
              Duration *
            </label>
            <Select
              onValueChange={(value) => setValue("length", parseInt(value, 10))}
              defaultValue={watch("length")?.toString()}
            >
              <SelectTrigger>
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
            <p className="text-sm text-muted-foreground">
              How long each booking will last
            </p>
            {errors.length && (
              <p className="text-sm text-destructive">
                {errors.length.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createEventTypeMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createEventTypeMutation.isPending}>
              {createEventTypeMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Event Type
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
