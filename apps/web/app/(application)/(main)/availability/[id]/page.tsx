"use client"

import { useState } from "react"
import { apiClient } from "@/lib/utils/api-client"
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
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
  Trash2,
  ArrowLeft,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface TimeSlot {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  enabled: boolean
}

interface AvailabilityScheduleDetailProps {
  params: { id: string }
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

const AvailabilityScheduleDetail = ({ params }: AvailabilityScheduleDetailProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [weeklySchedule, setWeeklySchedule] = useState<TimeSlot[]>([])
  const queryClient = useQueryClient()

  // In a real implementation, you would fetch the specific schedule by ID
  // For now, we'll create a placeholder structure
  const { data: schedule } = useSuspenseQuery({
    queryKey: ["availability", params.id],
    queryFn: async () => {
      // This would be the actual API call
      // const res = await apiClient.availability[":id"].$get({ param: { id: params.id } })
      
      // Mock data for now - replace with real API call
      const mockSchedule = {
        id: params.id,
        name: "Working Hours",
        timeZone: "America/New_York",
        ownerId: "user-123",
        organizationId: "org-456",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      // Initialize with default weekly schedule
      const defaultWeeklySchedule: TimeSlot[] = DAYS.map((_, index) => ({
        dayOfWeek: index,
        startTime: "09:00",
        endTime: "17:00",
        enabled: index >= 1 && index <= 5, // Monday to Friday enabled by default
      }))
      
      setEditedName(mockSchedule.name)
      setWeeklySchedule(defaultWeeklySchedule)
      
      return mockSchedule
    },
  })

  const updateScheduleMutation = useMutation({
    mutationFn: async (data: { name: string; weeklySchedule: TimeSlot[] }) => {
      // This would be the actual API call to update the schedule
      // const res = await apiClient.availability[":id"].$put({
      //   param: { id: params.id },
      //   json: data,
      // })
      
      // Mock success for now
      return Promise.resolve()
    },
    onSuccess: () => {
      toast.success("Schedule updated successfully!")
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ["availability"] })
      queryClient.invalidateQueries({ queryKey: ["availability", params.id] })
    },
    onError: (error) => {
      toast.error("Failed to update schedule")
    },
  })

  const handleSave = () => {
    updateScheduleMutation.mutate({
      name: editedName,
      weeklySchedule: weeklySchedule.filter(slot => slot.enabled),
    })
  }

  const handleDayToggle = (dayIndex: number, enabled: boolean) => {
    setWeeklySchedule(prev => 
      prev.map(slot => 
        slot.dayOfWeek === dayIndex ? { ...slot, enabled } : slot
      )
    )
  }

  const handleTimeChange = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setWeeklySchedule(prev => 
      prev.map(slot => 
        slot.dayOfWeek === dayIndex ? { ...slot, [field]: value } : slot
      )
    )
  }

  const addTimeSlot = (dayIndex: number) => {
    // For simplicity, just enable the day if it's disabled
    // In a full implementation, you'd support multiple time slots per day
    handleDayToggle(dayIndex, true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/availability">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          {isEditing ? (
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0"
              placeholder="Schedule name"
            />
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{schedule.name}</h1>
              <Badge variant="outline">{schedule.timeZone}</Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={updateScheduleMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day, dayIndex) => {
            const daySlot = weeklySchedule.find(slot => slot.dayOfWeek === dayIndex)
            const isEnabled = daySlot?.enabled || false
            
            return (
              <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-24 font-medium">{day}</div>
                
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleDayToggle(dayIndex, checked)}
                  disabled={!isEditing}
                />
                
                {isEnabled && (
                  <div className="flex items-center gap-2 flex-1">
                    <Select
                      value={daySlot?.startTime || "09:00"}
                      onValueChange={(value) => handleTimeChange(dayIndex, 'startTime', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <span>to</span>
                    
                    <Select
                      value={daySlot?.endTime || "17:00"}
                      onValueChange={(value) => handleTimeChange(dayIndex, 'endTime', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {!isEnabled && isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTimeSlot(dayIndex)}
                    className="ml-auto"
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

      {/* Schedule Info */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Time Zone
              </label>
              <p className="font-medium">{schedule.timeZone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Type
              </label>
              <p className="font-medium">
                {schedule.ownerId ? "Personal" : "Organization"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created
              </label>
              <p className="font-medium">
                {new Date(schedule.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Last Updated
              </label>
              <p className="font-medium">
                {new Date(schedule.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AvailabilityScheduleDetail
