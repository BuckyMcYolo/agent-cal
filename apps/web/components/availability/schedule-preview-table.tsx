"use client"

import React from "react"
import Link from "next/link"
import { Globe, ExternalLink } from "lucide-react"

type WeeklySlot = {
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface SchedulePreviewTableProps {
  weeklySlots: WeeklySlot[]
  timeZone?: string | null
  scheduleId?: string | null
}

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

const DAY_INDEXES = [0, 1, 2, 3, 4, 5, 6] as const

const normalizeTime = (time: string) => {
  // incoming may be HH:MM or HH:MM:SS - keep HH:MM
  const [hh = "00", mm = "00"] = time.split(":")
  return `${hh.padStart(2, "0")}:${mm.padStart(2, "0")}`
}

const toTimeLabel = (t: string) => {
  const [hStr, mStr] = t.split(":")
  const hours = parseInt(hStr || "0", 10)
  const minutes = parseInt(mStr || "0", 10)
  const ampm = hours >= 12 ? "PM" : "AM"
  const displayHour = hours % 12 === 0 ? 12 : hours % 12
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${ampm}`
}

const SchedulePreviewTable: React.FC<SchedulePreviewTableProps> = ({
  weeklySlots,
  timeZone,
  scheduleId,
}) => {
  const dayToSlots: {
    label: string
    slots: { start: string; end: string }[]
  }[] = DAY_INDEXES.map((dayIdx) => {
    const slotsForDay = (weeklySlots || [])
      .filter((s) => s.dayOfWeek === dayIdx)
      .map((s) => ({
        start: normalizeTime(s.startTime),
        end: normalizeTime(s.endTime),
      }))
      .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))

    return {
      label: DAY_LABELS[dayIdx],
      slots: slotsForDay,
    }
  })

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="divide-y">
        {dayToSlots.map((d) => {
          const hasSlots = d.slots.length > 0

          if (!hasSlots) {
            return (
              <div
                key={d.label}
                className="grid grid-cols-5 items-center px-4 py-3"
              >
                <div className="col-span-1 text-muted-foreground">
                  {d.label}
                </div>
                <div className="col-span-4 text-sm text-muted-foreground">
                  Unavailable
                </div>
              </div>
            )
          }

          return (
            <div key={d.label} className="px-4 py-3">
              {d.slots.map((slot, index) => (
                <div
                  key={`${d.label}-${index}`}
                  className="grid grid-cols-5 items-center"
                >
                  <div className="col-span-1 font-medium text-foreground">
                    {index === 0 ? d.label : ""}
                  </div>
                  <div className="col-span-4 sm:col-span-3 lg:col-span-2 grid grid-cols-3 items-center text-sm">
                    <div>{toTimeLabel(slot.start)}</div>
                    <div className="text-center text-muted-foreground">-</div>
                    <div>{toTimeLabel(slot.end)}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>{timeZone || "Timezone not set"}</span>
        </div>
        {scheduleId && (
          <Link
            href={`/availability/${scheduleId}`}
            className="text-sm font-medium hover:underline inline-flex items-center gap-1"
          >
            Edit availability <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  )
}

export default SchedulePreviewTable
