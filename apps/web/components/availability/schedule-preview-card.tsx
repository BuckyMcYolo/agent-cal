import React from "react"

interface WeeklySlot {
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface SchedulePreviewProps {
  weeklySlots: WeeklySlot[]
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

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":")
  const hour = parseInt(hours || "0")
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}${minutes !== "00" ? `:${minutes}` : ""} ${ampm}`
}

const processGroup = (slots: WeeklySlot[]) => {
  if (slots.length === 0) {
    return {
      days: "",
      startTime: "",
      endTime: "",
    }
  }

  if (slots.length === 1) {
    const firstSlot = slots[0]
    if (!firstSlot) return { days: "", startTime: "", endTime: "" }
    return {
      days: DAYS[firstSlot.dayOfWeek] || "",
      startTime: firstSlot.startTime,
      endTime: firstSlot.endTime,
    }
  } else if (slots.length === 2) {
    const firstSlot = slots[0]
    const lastSlot = slots[slots.length - 1]
    if (!firstSlot || !lastSlot) return { days: "", startTime: "", endTime: "" }
    return {
      days: `${DAYS[firstSlot.dayOfWeek] || ""} - ${DAYS[lastSlot.dayOfWeek] || ""}`,
      startTime: firstSlot.startTime,
      endTime: firstSlot.endTime,
    }
  } else {
    const firstSlot = slots[0]
    const lastSlot = slots[slots.length - 1]
    if (!firstSlot || !lastSlot) return { days: "", startTime: "", endTime: "" }
    return {
      days: `${DAYS[firstSlot.dayOfWeek] || ""} - ${DAYS[lastSlot.dayOfWeek] || ""}`,
      startTime: firstSlot.startTime,
      endTime: firstSlot.endTime,
    }
  }
}

const SchedulePreviewCard: React.FC<SchedulePreviewProps> = ({
  weeklySlots,
}) => {
  if (!weeklySlots || weeklySlots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No schedule configured
      </p>
    )
  }

  // Group consecutive days with the same time range
  const groupedSlots: { days: string; startTime: string; endTime: string }[] =
    []
  const sortedSlots = [...weeklySlots].sort((a, b) => a.dayOfWeek - b.dayOfWeek)

  let currentGroup: WeeklySlot[] = []

  for (const slot of sortedSlots) {
    if (currentGroup.length === 0) {
      currentGroup = [slot]
    } else {
      const lastSlot = currentGroup[currentGroup.length - 1]
      // Check if this slot is consecutive and has the same time range

      if (
        lastSlot &&
        slot.dayOfWeek === lastSlot.dayOfWeek + 1 &&
        slot.startTime === lastSlot.startTime &&
        slot.endTime === lastSlot.endTime
      ) {
        currentGroup.push(slot)
      } else {
        // Process current group and start a new one
        groupedSlots.push(processGroup(currentGroup))
        currentGroup = [slot]
      }
    }
  }

  // Process the last group
  if (currentGroup.length > 0) {
    groupedSlots.push(processGroup(currentGroup))
  }

  return (
    <div className="space-y-1">
      {groupedSlots.map((group, index) => (
        <div key={index} className="text-sm">
          <span className="font-medium text-foreground">{group.days}</span>
          <span className="text-muted-foreground ml-2">
            {formatTime(group.startTime)} - {formatTime(group.endTime)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default SchedulePreviewCard
