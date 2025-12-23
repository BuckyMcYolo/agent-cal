"use client"

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import type { InferResponseType } from "@workspace/api-client"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Separator } from "@workspace/ui/components/separator"
import { Switch } from "@workspace/ui/components/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import {
  Calendar,
  Clock,
  Code,
  CopyIcon,
  Edit3,
  Eye,
  Globe,
  GripVertical,
  MapPin,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/utils/api-client"
import { DeleteDialog } from "../misc/dialogs/delete-dialog"
import CreateEventTypeDialog from "./create-event-type-dialog"

// Derive EventType from API response
type EventTypesResponse = InferResponseType<
  (typeof apiClient)["event-types"]["$get"]
>
type EventType = EventTypesResponse extends Array<infer T> ? T : never

/**
 * Sortable Event Type Card Component
 *
 * This component wraps each event type card with drag-and-drop functionality.
 * Users can drag the grip handle to reorder event types, which updates the
 * listPosition field in the database.
 *
 * Features:
 * - Drag handle with visual feedback
 * - Mobile-friendly touch support
 * - Optimistic UI updates
 * - Error handling with revert on failure
 * - Visual feedback during drag operations
 */
interface SortableEventTypeCardProps {
  eventType: EventType
  onDelete: (id: string) => void
  onToggleHidden: (id: string, hidden: boolean) => void
  isDeleting: boolean
  isTogglingHidden: boolean
  href: string
}

const SortableEventTypeCard = ({
  eventType,
  onDelete,
  onToggleHidden,
  isDeleting,
  isTogglingHidden,
  href,
}: SortableEventTypeCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: eventType.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 lg:p-6 hover:bg-muted/50 transition-all duration-50 ${
        isDragging
          ? "z-50 shadow-xl bg-background border-2 border-primary/20 rounded-lg scale-[1.02]"
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center cursor-grab active:cursor-grabbing mr-3 p-3 lg:p-2 hover:bg-muted rounded touch-manipulation min-h-[44px] min-w-[44px] justify-center"
          title="Drag to reorder"
          role="button"
          aria-label="Drag to reorder event type"
          tabIndex={0}
        >
          <GripVertical className="h-6 w-6 lg:h-5 lg:w-5 text-muted-foreground" />
        </div>

        <Link className="flex-1 space-y-3" href={href}>
          {/* Title and Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">{eventType.title}</h3>
            </div>
            {eventType.hidden && (
              <Badge variant="destructive" className="text-xs">
                Hidden
              </Badge>
            )}
            {eventType.requiresConfirmation && (
              <Badge variant="outline" className="text-xs">
                Requires confirmation
              </Badge>
            )}
          </div>

          {/* Description */}
          {eventType.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {eventType.description}
            </p>
          )}

          {/* Event Details */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{eventType.length} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="capitalize">
                {eventType.locationType?.replace("_", " ").toLowerCase() ||
                  "Virtual"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="capitalize">
                {eventType.schedulingType?.replace("_", " ").toLowerCase() ||
                  "Individual"}
              </span>
            </div>
            {eventType.timeZone && (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {eventType.timeZone}
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Visibility Toggle */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!eventType.hidden}
                    onCheckedChange={(checked) =>
                      onToggleHidden(eventType.id, !checked)
                    }
                    disabled={isTogglingHidden}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {eventType.hidden
                    ? "Make this public and bookable"
                    : "Hide this event type from public booking"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 touch-manipulation"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 touch-manipulation"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="touch-manipulation min-h-[44px] min-w-[44px]"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="sm:hidden">
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              </div>
              <DropdownMenuItem>
                <CopyIcon className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Code className="h-4 w-4 mr-2" />
                Embed
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DeleteDialog
                trigger={
                  <DropdownMenuItem
                    variant="destructive"
                    className="text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                }
                title="Delete Event Type"
                description={`Are you sure you want to delete "${eventType.title}"? This action cannot be undone.`}
                confirmText="Delete"
                onDelete={() => onDelete(eventType.id)}
                loading={isDeleting}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

const EventTypesList = () => {
  const queryClient = useQueryClient()
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [isReordering, setIsReordering] = useState(false)

  const { data: fetchedEventTypes } = useSuspenseQuery({
    queryKey: ["event-types"],
    queryFn: async (): Promise<EventType[]> => {
      const res = await apiClient["event-types"].$get({
        query: {},
      })
      if (res.ok) {
        const data = (await res.json()) as EventType[]
        // Sort by listPosition to maintain order
        return data.sort(
          (a, b) => (a.listPosition ?? 0) - (b.listPosition ?? 0)
        )
      }
      try {
        const errorData = (await res.json()) as { message?: string }
        throw new Error(errorData?.message || "Failed to fetch event types")
      } catch {
        throw new Error("Failed to fetch event types")
      }
    },
    retry: false,
  })

  // Update local state when data changes
  useEffect(() => {
    if (fetchedEventTypes) {
      setEventTypes(fetchedEventTypes)
    }
  }, [fetchedEventTypes])

  const { mutate: deleteEventType, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient["event-types"][":id"].$delete({
        param: {
          id,
        },
      })
      if (!res.ok) {
        const errorData = await res.json()
        const message = errorData.message || "Failed to delete event type"
        throw new Error(message)
      }
    },
    onSuccess: () => {
      toast.success("Event type deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["event-types"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete event type")
    },
  })

  const { mutate: toggleEventTypeVisibility, isPending: isTogglingVisibility } =
    useMutation({
      mutationFn: async ({ id, hidden }: { id: string; hidden: boolean }) => {
        const res = await apiClient["event-types"][":id"].$put({
          param: { id },
          json: { hidden },
        })
        if (!res.ok) {
          const errorData = await res.json()
          const message =
            errorData.message || "Failed to update event type visibility"
          throw new Error(message)
        }
        return res.json()
      },
      onSuccess: (_, { hidden }) => {
        toast.success(
          `Event type ${hidden ? "hidden" : "made public"} successfully!`
        )
        queryClient.invalidateQueries({ queryKey: ["event-types"] })
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update event type visibility")
      },
    })

  const { mutate: updateEventTypePosition } = useMutation({
    mutationFn: async ({
      id,
      listPosition,
    }: {
      id: string
      listPosition: number
    }) => {
      const res = await apiClient["event-types"][":id"].$put({
        param: { id },
        json: { listPosition },
      })
      if (!res.ok) {
        const errorData = await res.json()
        const message =
          errorData.message || "Failed to update event type position"
        throw new Error(message)
      }
      return res.json()
    },
    onSuccess: () => {
      setIsReordering(false)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update event type order")
      setIsReordering(false)
      // Revert the optimistic update
      queryClient.invalidateQueries({ queryKey: ["event-types"] })
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100, // Add delay for better touch experience
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = eventTypes.findIndex((item) => item.id === active.id)
    const newIndex = eventTypes.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    setIsReordering(true)

    // Optimistically update the UI
    const newEventTypes = arrayMove(eventTypes, oldIndex, newIndex)
    setEventTypes(newEventTypes)

    // Update listPosition values for all affected items
    const updates = newEventTypes.map((eventType, index) => ({
      id: eventType.id,
      listPosition: index,
    }))

    // Send updates to the server
    updates.forEach(({ id, listPosition }) => {
      updateEventTypePosition({
        id,
        listPosition,
      })
    })
  }

  if (!eventTypes || eventTypes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Event Types</h1>
            <p className="text-muted-foreground">
              Manage your event types and availability
            </p>
          </div>
          <CreateEventTypeDialog />
        </div>
        <div className="bg-card rounded-lg border">
          <div className="text-center py-16 px-6">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No event types yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first event type to start accepting bookings. You can
              customize duration, location, and availability settings.
            </p>
            <CreateEventTypeDialog />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Types</h1>
          <p className="text-muted-foreground">
            Manage your event types and availability
            {isReordering && " • Saving order..."}
          </p>
        </div>
        <CreateEventTypeDialog />
      </div>

      <div className="bg-card rounded-lg border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={eventTypes.map((et) => et.id)}
            strategy={verticalListSortingStrategy}
          >
            {eventTypes.map((eventType, index) => (
              <div key={eventType.id}>
                <SortableEventTypeCard
                  eventType={eventType}
                  onDelete={deleteEventType}
                  onToggleHidden={(id, hidden) =>
                    toggleEventTypeVisibility({ id, hidden })
                  }
                  isDeleting={isDeleting}
                  isTogglingHidden={isTogglingVisibility}
                  href={`/event-types/${eventType.id}`}
                />
                {index < eventTypes.length - 1 && <Separator />}
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}

export default EventTypesList
