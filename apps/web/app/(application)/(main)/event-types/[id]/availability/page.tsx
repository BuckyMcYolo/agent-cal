import React from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Separator } from "@workspace/ui/components/separator"
import { Badge } from "@workspace/ui/components/badge"
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
import { Calendar, Clock, Plus, Trash2, Edit } from "lucide-react"

const daysOfWeek = [
  { id: "monday", label: "Monday", short: "Mon" },
  { id: "tuesday", label: "Tuesday", short: "Tue" },
  { id: "wednesday", label: "Wednesday", short: "Wed" },
  { id: "thursday", label: "Thursday", short: "Thu" },
  { id: "friday", label: "Friday", short: "Fri" },
  { id: "saturday", label: "Saturday", short: "Sat" },
  { id: "sunday", label: "Sunday", short: "Sun" },
]

const schedules = [
  {
    id: 1,
    name: "Working Hours",
    isDefault: true,
    timezone: "America/New_York",
    availability: {
      monday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
      tuesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
      wednesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
      thursday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
      friday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
      saturday: { enabled: false, slots: [] },
      sunday: { enabled: false, slots: [] },
    },
  },
  {
    id: 2,
    name: "Weekends Only",
    isDefault: false,
    timezone: "America/New_York",
    availability: {
      monday: { enabled: false, slots: [] },
      tuesday: { enabled: false, slots: [] },
      wednesday: { enabled: false, slots: [] },
      thursday: { enabled: false, slots: [] },
      friday: { enabled: false, slots: [] },
      saturday: { enabled: true, slots: [{ start: "10:00", end: "16:00" }] },
      sunday: { enabled: true, slots: [{ start: "10:00", end: "16:00" }] },
    },
  },
]

const Availability = () => {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Availability</h1>
        <p className="text-muted-foreground">
          Configure when you're available for this event type.
        </p>
      </div>

      <Separator />

      {/* Schedule Selection */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Use Schedule</Label>
              <Select defaultValue="1">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a schedule" />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((schedule) => (
                    <SelectItem
                      key={schedule.id}
                      value={schedule.id.toString()}
                    >
                      <div className="flex items-center gap-2">
                        <span>{schedule.name}</span>
                        {schedule.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select defaultValue="America/New_York">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">
                    Eastern Time (UTC-5)
                  </SelectItem>
                  <SelectItem value="America/Chicago">
                    Central Time (UTC-6)
                  </SelectItem>
                  <SelectItem value="America/Denver">
                    Mountain Time (UTC-7)
                  </SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time (UTC-8)
                  </SelectItem>
                  <SelectItem value="Europe/London">GMT (UTC+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Weekly Schedule
              </CardTitle>
              <Button variant="outline" size="sm">
                <Edit className="h-3 w-3 mr-1" />
                Edit Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {daysOfWeek.map((day) => {
                const dayAvailability =
                  schedules[0]?.availability[
                    day.id as keyof (typeof schedules)[0]["availability"]
                  ]
                if (!dayAvailability) return null
                return (
                  <div
                    key={day.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={dayAvailability.enabled}
                        className="data-[state=checked]:bg-primary"
                      />
                      <div className="w-16">
                        <span className="font-medium text-sm">{day.short}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {dayAvailability.enabled ? (
                        dayAvailability.slots.map((slot, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="px-2 py-1 bg-muted rounded text-muted-foreground">
                              {slot.start} - {slot.end}
                            </span>
                            {index === dayAvailability.slots.length - 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Buffer Times */}
        <Card>
          <CardHeader>
            <CardTitle>Buffer Times</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Buffer before event</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" defaultValue="0" className="w-20" />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Time to prepare before the meeting starts
                </p>
              </div>

              <div className="space-y-2">
                <Label>Buffer after event</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" defaultValue="0" className="w-20" />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Time to wrap up after the meeting ends
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date Range */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Indefinitely into the future</p>
                  <p className="text-sm text-muted-foreground">
                    Allow bookings far into the future
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Available from</Label>
                  <Input type="date" defaultValue="2024-01-01" />
                </div>

                <div className="space-y-2">
                  <Label>Available until</Label>
                  <Input type="date" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notice period</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" defaultValue="60" className="w-20" />
                  <Select defaultValue="minutes">
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">minutes</SelectItem>
                      <SelectItem value="hours">hours</SelectItem>
                      <SelectItem value="days">days</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    before booking
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum time required between booking and the event
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <div className="flex gap-3">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}

export default Availability
