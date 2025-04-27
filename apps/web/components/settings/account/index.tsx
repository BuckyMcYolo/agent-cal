"use client"

import { useEffect, useState } from "react"
import { User, Save, Camera, Check } from "lucide-react"

// Import Shadcn components
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Switch } from "@workspace/ui/components/switch"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { authClient } from "@workspace/auth/client"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "@/hooks/use-user"

const UserAccountSettings = () => {
  //   const { data: user, isLoading } = useQuery({
  //     queryKey: ["user"],
  //     queryFn: async () => {
  //       const res = await authClient.getSession({
  //         query: {
  //           disableCookieCache: true,
  //         },
  //       })
  //       return res.data?.user
  //     },
  //   })

  const { user, isLoading } = useUser()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    timezone: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
        timezone: user.timezone || "",
      })
    }
  }, [user])

  interface UserFormData {
    name: string
    email: string
    phone: string
    timezone: string
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prevData: UserFormData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prevData: UserFormData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Handle form submission logic here
    console.log("Form submitted:", formData)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loader"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Profile Section */}
          <Card className="dark:bg-zinc-900 ">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-2xl font-bold">
                        JO
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 h-8 w-8 bg-primary hover:bg-violet-700"
                    >
                      <Camera size={16} />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-muted-foreground">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className=""
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className=""
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone" className="text-muted-foreground">
                      Phone Number
                    </Label>
                    <div className="flex">
                      <div className="inline-flex items-center px-3 bg-zinc-100 dark:bg-zinc-700 border border-r-0 dark:border-zinc-700 text-neutral-700 dark:text-muted-foreground text-sm rounded-l-md">
                        <span>+1</span>
                      </div>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="rounded-l-none "
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card className="dark:bg-zinc-900">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="timezone" className="text-muted-foreground">
                    Timezone
                  </Label>
                  <Select
                    defaultValue={formData.timezone}
                    onValueChange={(value) =>
                      handleSelectChange("timezone", value)
                    }
                  >
                    <SelectTrigger className="">
                      <SelectValue placeholder="Select a timezone" />
                    </SelectTrigger>
                    <SelectContent className="">
                      <SelectItem value="America/New_York">
                        Eastern Time (US & Canada)
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time (US & Canada)
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time (US & Canada)
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time (US & Canada)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="dark:bg-zinc-900">
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Button variant="outline">Change Password</Button>
                </div>

                {/* <Separator className="my-4 " /> */}
                {/* 
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch id="2fa" />
                </div> */}

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Session Management</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Manage active sessions and devices
                    </p>
                  </div>
                  <Button
                    variant="link"
                    className="dark:text-violet-500 text-primary p-0 h-auto"
                  >
                    View Sessions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="dark:bg-zinc-900">
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-destructive">
                    Delete Account
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove your data from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive">
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit">
              <Save size={16} className="mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default UserAccountSettings
