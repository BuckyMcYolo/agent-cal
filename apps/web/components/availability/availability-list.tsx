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
  Settings,
  Eye,
  Edit3,
  MoreHorizontal,
  Calendar,
  Globe,
  Plus,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { toast } from "sonner"
import { DeleteDialog } from "@/components/misc/dialogs/delete-dialog"
import CreateAvailabilityDialog from "@/components/availability/create-availability-dialog"
import Link from "next/link"

import React from "react"
import SchedulePreviewCard from "./schedule-preview-card"

const AvailabilityList = () => {
  const { data: availabilitySchedules } = useSuspenseQuery({
    queryKey: ["availability"],
    queryFn: async () => {
      const res = await apiClient.availability.$get({
        query: {},
      })
      if (res.ok) {
        const data = await res.json()
        return data
      }
      return []
    },
  })

  if (!availabilitySchedules || availabilitySchedules.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Availability</h1>
            <p className="text-muted-foreground">
              Manage your availability schedules
            </p>
          </div>
          <CreateAvailabilityDialog />
        </div>

        <div className="bg-card rounded-lg border">
          <div className="text-center py-16 px-6">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              No availability schedules yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first availability schedule to define when you're
              available for bookings. You can create multiple schedules for
              different purposes.
            </p>
            <CreateAvailabilityDialog />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Availability</h1>
          <p className="text-muted-foreground">
            Manage your availability schedules
          </p>
        </div>
        <CreateAvailabilityDialog />
      </div>

      <div className="bg-card rounded-lg border">
        {availabilitySchedules.map((schedule, index) => (
          <div key={schedule.id}>
            <div className="p-6 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{schedule.name}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {schedule.timeZone}
                    </Badge>
                  </div>

                  {/* Schedule Preview */}
                  <div className="space-y-2">
                    <SchedulePreviewCard
                      weeklySlots={schedule?.weeklySlots || []}
                    />
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>
                        {schedule.ownerId ? "Personal" : "Organization"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <Link href={`/availability/${schedule.id}`}>
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <Link href={`/availability/${schedule.id}`}>
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/availability/${schedule.id}`}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
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
                        title="Delete Availability Schedule"
                        description={`Are you sure you want to delete "${schedule.name}"? This action cannot be undone.`}
                        confirmText="Delete"
                        onDelete={() => {
                          // TODO: Implement delete functionality when API endpoint is available
                          toast.error(
                            "Delete functionality not yet implemented"
                          )
                        }}
                        loading={false}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            {index < availabilitySchedules.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AvailabilityList
