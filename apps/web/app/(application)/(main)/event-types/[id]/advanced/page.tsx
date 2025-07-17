import React from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Switch } from "@workspace/ui/components/switch"
import { Separator } from "@workspace/ui/components/separator"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { 
  Shield, 
  Webhook, 
  Mail, 
  Calendar, 
  CreditCard, 
  Users, 
  Clock,
  AlertTriangle,
  Plus,
  X
} from "lucide-react"

const customFields = [
  { id: 1, name: "Company", type: "text", required: true },
  { id: 2, name: "Phone Number", type: "phone", required: false },
  { id: 3, name: "Project Budget", type: "select", required: false, options: ["< $5k", "$5k - $25k", "$25k+"] }
]

const Advanced = () => {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Advanced Settings</h1>
        <p className="text-muted-foreground">
          Configure advanced features and integrations for this event type.
        </p>
      </div>

      <Separator />

      {/* Advanced Settings */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Booking Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Booking Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Limit future bookings</p>
                      <p className="text-sm text-muted-foreground">Restrict how far in advance people can book</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="space-y-2">
                    <Label>Maximum bookings per day</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        defaultValue="10"
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">bookings</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum gap between bookings</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        defaultValue="0"
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">minutes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Workflows & Automation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Workflows & Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Send confirmation email</p>
                      <p className="text-sm text-muted-foreground">Automatically send booking confirmations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Send reminder emails</p>
                      <p className="text-sm text-muted-foreground">Send reminders before the meeting</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Add to calendar automatically</p>
                      <p className="text-sm text-muted-foreground">Create calendar events for attendees</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input 
                      placeholder="https://your-site.com/webhook"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Receive booking notifications at this endpoint
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security & Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Require phone verification</p>
                      <p className="text-sm text-muted-foreground">Verify attendee phone numbers</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Disable guests</p>
                      <p className="text-sm text-muted-foreground">Only allow the booker to attend</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Require approval</p>
                      <p className="text-sm text-muted-foreground">Manually approve each booking</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Custom Questions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Custom Questions
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {customFields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{field.name}</span>
                          {field.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{field.type} field</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Require payment</p>
                      <p className="text-sm text-muted-foreground">Charge for this event type</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="space-y-2">
                    <Label>Price</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        placeholder="0.00"
                        className="w-24"
                      />
                      <Select defaultValue="usd">
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">USD</SelectItem>
                          <SelectItem value="eur">EUR</SelectItem>
                          <SelectItem value="gbp">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment provider</Label>
                    <Select defaultValue="stripe">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Confirmation email subject</Label>
                    <Input 
                      defaultValue="Your meeting is confirmed"
                      placeholder="Confirmation email subject"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Confirmation email body</Label>
                    <Textarea 
                      placeholder="Thank you for booking..."
                      rows={3}
                      defaultValue="Thank you for booking a meeting with us. We look forward to speaking with you!"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Reminder timing</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        defaultValue="24"
                        className="w-20"
                      />
                      <Select defaultValue="hours">
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">minutes</SelectItem>
                          <SelectItem value="hours">hours</SelectItem>
                          <SelectItem value="days">days</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">before event</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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

export default Advanced
