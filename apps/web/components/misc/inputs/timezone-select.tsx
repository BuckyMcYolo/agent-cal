"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

export interface TimezoneSelectProps {
  value: string | undefined
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const FALLBACK_TIMEZONES: string[] = [
  "UTC",
  "Etc/UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
]

const getTimezones = (): string[] => {
  try {
    const zones: string[] | undefined =
      typeof Intl !== "undefined" && (Intl as any).supportedValuesOf
        ? (Intl as any).supportedValuesOf("timeZone")
        : undefined
    if (Array.isArray(zones) && zones.length > 0) return zones
  } catch {}
  return FALLBACK_TIMEZONES
}

const timezones = getTimezones()

const getTimeZoneAbbreviation = (timeZone: string): string => {
  try {
    const now = new Date()
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(now)
    const tzPart = parts.find((p) => p.type === "timeZoneName")?.value
    if (tzPart) return tzPart
  } catch {}
  // Fallback attempt: try long form and shorten common endings
  try {
    const now = new Date()
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "long",
    }).formatToParts(now)
    const tzPart = parts.find((p) => p.type === "timeZoneName")?.value
    if (tzPart) {
      // e.g., "Central Daylight Time" -> "CDT", "Central Standard Time" -> "CST"
      const initialism = tzPart
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
      if (initialism.length >= 2 && initialism.length <= 4) return initialism
      return tzPart
    }
  } catch {}
  return ""
}

const timezoneItems = timezones.map((tz) => {
  const abbr = getTimeZoneAbbreviation(tz)
  return {
    value: tz,
    label: abbr ? `${tz} - ${abbr}` : tz,
  }
})

export function TimezoneSelect({
  value,
  onChange,
  disabled,
  placeholder = "Select time zone",
  className,
}: TimezoneSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {timezoneItems.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default TimezoneSelect
