"use client"

import { apiClient } from "@/lib/utils/api-client"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import {
  Clock,
  MapPin,
  Settings,
  Eye,
  Edit3,
  MoreHorizontal,
  Calendar,
  Globe,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import CreateEventTypeDialog from "./create-event-type-dialog"
import { toast } from "sonner"
import { DeleteDialog } from "../misc/dialogs/delete-dialog"

const EventTypesList = () => {
  const queryClient = useQueryClient()

  const { data: eventTypes } = useSuspenseQuery({
    queryKey: ["event-types"],
    queryFn: async () => {
      const res = await apiClient["event-types"].$get({
        query: {},
      })
      if (res.ok) {
        const data = await res.json()
        return data
      }
      return []
    },
  })

  const { mutate, isPending } = useMutation({
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
          </p>
        </div>
        <CreateEventTypeDialog />
      </div>

      <div className="bg-card rounded-lg border">
        {eventTypes.map((eventType, index) => (
          <div key={eventType.id}>
            <div className="p-6 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-3">
                  {/* Title and Status */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">
                        {eventType.title}
                      </h3>
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
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">
                        {eventType.length} minutes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="capitalize">
                        {eventType.locationType
                          ?.replace("_", " ")
                          .toLowerCase() || "Virtual"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="capitalize">
                        {eventType.schedulingType
                          ?.replace("_", " ")
                          .toLowerCase() || "Individual"}
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
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DeleteDialog
                        trigger={
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            Delete
                          </DropdownMenuItem>
                        }
                        title="Delete Event Type"
                        description={`Are you sure you want to delete "${eventType.title}"? This action cannot be undone.`}
                        confirmText="Delete"
                        onDelete={() => mutate(eventType.id)}
                        loading={isPending}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            {index < eventTypes.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default EventTypesList
