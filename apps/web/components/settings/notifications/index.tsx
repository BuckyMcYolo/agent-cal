import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@workspace/ui/components/card"
import { Switch } from "@workspace/ui/components/switch"
import React from "react"

export default function Notifications() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Notification Preferences */}
      <Card className="dark:bg-zinc-900">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Email Notifications</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Receive emails for new bookings
                </p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">SMS Notifications</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Receive text messages for booking reminders
                </p>
              </div>
              <Switch id="sms-notifications" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
