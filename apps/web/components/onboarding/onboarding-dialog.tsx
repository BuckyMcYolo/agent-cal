"use client"
import { authClient } from "@workspace/auth/client"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@workspace/ui/components/dialog"
import { redirect, useRouter } from "next/navigation"
import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@workspace/ui/components/form"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import { Progress } from "@workspace/ui/components/progress"
import {
  CheckCircle2,
  Briefcase,
  User,
  Calendar,
  HelpCircle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  House,
  Globe,
  CalendarDays,
} from "lucide-react"
import Image from "next/image"
import logoImage from "../../public/favicon.svg"
import { useUser } from "@/hooks/use-user"
import Confetti from "react-confetti"
import { apiClient } from "@/lib/utils/api-client"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

// Zod schemas for each step
const accountTypeSchema = z.object({
  accountType: z.enum(["personal", "business"]),
  businessName: z.string().optional(),
  teamSize: z.string().optional(),
})

const calendarExperienceSchema = z.object({
  usedCalendarTools: z.enum(["yes", "no"]),
  calendarService: z
    .enum([
      "googleCalendar",
      "outlookCalendar",
      "appleCalendar",
      "other",
      "none",
    ])
    .optional(),
  otherCalendarService: z.string().optional(),
})

const schedulingPreferencesSchema = z.object({
  schedulingType: z.enum(["inPerson", "online", "both"]),
  familiarWithTools: z.enum(["notAtAll", "somewhat", "veryFamiliar"]),
  timezone: z.string(),
})

const referralSourceSchema = z.object({
  referralSource: z.enum([
    "search",
    "socialMedia",
    "friend",
    "advertisement",
    "other",
  ]),
  referralDetails: z.string().optional(),
})

// Combined schema
const onboardingSchema = z.object({
  ...accountTypeSchema.shape,
  ...calendarExperienceSchema.shape,
  ...schedulingPreferencesSchema.shape,
  ...referralSourceSchema.shape,
})

// Type for the form data
type OnboardingFormValues = z.infer<typeof onboardingSchema>

const OnboardingDialog = () => {
  // Get the current user's role from auth client
  const { user, error, isLoading } = useUser()

  const router = useRouter()

  const isAdmin = user?.role === "admin"

  // Client-side component since we're using hooks
  const [step, setStep] = useState(1)
  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  // Form setup with React Hook Form and Zod
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      accountType: undefined,
      businessName: "",
      teamSize: "",
      usedCalendarTools: undefined,
      calendarService: undefined,
      otherCalendarService: "",
      familiarWithTools: undefined,
      schedulingType: undefined,
      timezone: "",
      referralSource: undefined,
      referralDetails: "",
    },
    mode: "onChange",
  })

  const {
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = form
  const accountType = watch("accountType")
  const calendarService = watch("calendarService")

  console.log("Form values:", getValues())

  const validateCurrentStep = async () => {
    let fieldsToValidate: string[] = []

    switch (step) {
      case 1:
        // If admin user, validate account type
        if (isAdmin) {
          fieldsToValidate = ["accountType"]

          // Check if accountType is defined
          const accountType = watch("accountType")
          if (!accountType) {
            form.setError("accountType", {
              type: "manual",
              message: "Please select how you will use AgentCal",
            })
            return false
          }

          // Additional validation for business option
          if (accountType === "business") {
            fieldsToValidate.push("businessName", "teamSize")

            // Additional validation for business fields
            const businessName = watch("businessName")
            const teamSize = watch("teamSize")

            if (!businessName || businessName.trim() === "") {
              form.setError("businessName", {
                type: "manual",
                message: "Business name is required",
              })
              return false
            }

            if (!teamSize || teamSize === "") {
              form.setError("teamSize", {
                type: "manual",
                message: "Team size is required",
              })
              return false
            }
          }
          return true
        }
        // For non-admin users, just proceed (no validation needed for welcome screen)
        return true
        break
      case 2:
        fieldsToValidate = ["usedCalendarTools", "familiarWithTools"]

        // Only validate calendar service if they've used calendar tools before
        if (watch("usedCalendarTools") === "yes") {
          fieldsToValidate.push("calendarService")

          const calendarService = watch("calendarService")
          if (!calendarService) {
            form.setError("calendarService", {
              type: "manual",
              message: "Please select a calendar service",
            })
            return false
          }

          if (calendarService === "other") {
            fieldsToValidate.push("otherCalendarService")
            const otherCalendarService = watch("otherCalendarService")

            if (!otherCalendarService || otherCalendarService.trim() === "") {
              form.setError("otherCalendarService", {
                type: "manual",
                message: "Please specify your calendar service",
              })
              return false
            }
          }
        }
        break
      case 3:
        fieldsToValidate = ["schedulingType", "timezone"]

        // Additional validation for timezone
        const timezone = watch("timezone")
        if (!timezone || timezone.trim() === "") {
          form.setError("timezone", {
            type: "manual",
            message: "Timezone is required",
          })
          return false
        }
        break
      case 4:
        fieldsToValidate = ["referralSource"]
        if (watch("referralSource") === "other") {
          fieldsToValidate.push("referralDetails")
        }
        break
    }

    return await trigger(fieldsToValidate as any)
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: OnboardingFormValues) => {
      console.log("Submitting onboarding data:", data)
      const res = await apiClient.onboarding.$post({
        json: {
          onboarding: {
            timezone: data.timezone,
            calendarService: data.calendarService,
            shouldShowFullTour:
              data.familiarWithTools === "notAtAll" ||
              data.familiarWithTools === "somewhat"
                ? true
                : false,
            schedulingPreference: data.schedulingType,
            referralSource:
              data.referralSource === "other"
                ? data.referralDetails
                : data.referralSource,
          },
          businessName: data.businessName,
          isBusinessOrPersonal: data.accountType,
        },
      })

      const d = await res.json()
      if (!res.ok) {
        throw new Error(d.message)
      }
      return d
    },
    onSuccess: () => {
      setStep(5)
      setTimeout(() => {
        router.replace("/event-types")
      }, 4500)
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred"
      toast.error(errorMessage)
    },
  })

  const handleNext = async () => {
    const isValid = await validateCurrentStep()

    if (isValid) {
      if (step < 4) {
        setStep(step + 1)
      } else {
        const values = getValues()
        console.log("Form submitted:", values)

        if (step < 4) {
          setStep(step + 1)
        } else {
          mutate(values)
        }
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  // Simple radio button component
  const RadioCard = ({
    value,
    checked,
    onChange,
    icon = null,
    children,
  }: {
    value: string
    checked: boolean
    onChange: (value: string) => void
    icon?: React.ReactNode
    children: React.ReactNode
  }) => {
    return (
      <div
        className={`relative flex items-center space-x-3 rounded-md border p-4 cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/5 ${
          checked
            ? "border-primary bg-primary/10 dark:bg-primary/20 dark:hover:bg-primary/15"
            : ""
        }`}
        onClick={() => onChange(value)}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-input">
          {checked && (
            <div className="h-2.5 w-2.5 p-1.5 rounded-full bg-primary"></div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {icon}
          <div>{children}</div>
        </div>
      </div>
    )
  }

  if (error) {
    console.error("Error fetching user:", error)
    return null
  }
  if (isLoading) {
    return (
      <div>
        <Dialog open={true}>
          <DialogContent
            className="sm:max-w-[650px]"
            showCloseBtn={false}
            autoFocus={false}
          >
            <DialogHeader className="px-6 pt-4">
              <DialogTitle className="text-xl font-semibold">
                Loading...
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center h-full pb-8">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <Dialog open={true}>
      <DialogContent
        className="sm:max-w-[650px] p-0 overflow-hidden bg-card"
        showCloseBtn={false}
      >
        <div className="flex flex-col h-full">
          {/* Progress bar */}
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>
                Step {step} of {totalSteps}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Form {...form}>
            <form className="space-y-6">
              <DialogHeader className="px-6 pt-4">
                <DialogTitle className="text-xl font-semibold">
                  {step === 1 && "Welcome to AgentCal"}
                  {step === 2 && "Calendar & Scheduling Experience"}
                  {step === 3 && "Scheduling Preferences"}
                  {step === 4 && "Almost Done!"}
                  {step === 5 && "Setup Complete!"}
                </DialogTitle>
                <DialogDescription>
                  {step === 1 &&
                    "Let's set up your account to get you started."}
                  {step === 2 &&
                    "Tell us about your experience with calendar and scheduling tools."}
                  {step === 3 && "Help us understand your scheduling needs."}
                  {step === 4 &&
                    "Just a few final details before you're all set."}
                  {step === 5 &&
                    "Congratulations! Your AgentCal account is ready."}
                </DialogDescription>
              </DialogHeader>

              <div className="px-6">
                {/* Step 1: Welcome to AgentCal */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex justify-center gap-3 py-10">
                      <Image
                        src={logoImage}
                        alt="logo"
                        width={40}
                        height={40}
                        className="size-14 rounded-sm shrink-0"
                      />
                      <div className="text-6xl font-semibold">AgentCal</div>
                    </div>

                    {isAdmin ? (
                      // Admin-specific content with account type selection
                      <FormField
                        control={form.control}
                        name="accountType"
                        render={({ field }) => (
                          <FormItem className="space-y-4">
                            <FormLabel>How will you use AgentCal?</FormLabel>
                            <div className="space-y-3">
                              <RadioCard
                                value="personal"
                                checked={field.value === "personal"}
                                onChange={(value) => field.onChange(value)}
                                icon={
                                  <User className="h-5 w-5 text-violet-500" />
                                }
                              >
                                <span className="font-normal">
                                  Personal use
                                </span>
                              </RadioCard>

                              <RadioCard
                                value="business"
                                checked={field.value === "business"}
                                onChange={(value) => field.onChange(value)}
                                icon={
                                  <Briefcase className="h-5 w-5 text-violet-500" />
                                }
                              >
                                <span className="font-normal">
                                  Business use
                                </span>
                              </RadioCard>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      // Non-admin welcome content
                      <div className="text-center space-y-4">
                        <h3 className="text-2xl font-medium">
                          Welcome to AgentCal!
                        </h3>
                        <p className="text-muted-foreground">
                          Let's set up your calendar preferences to help you
                          schedule meetings more efficiently.
                        </p>
                        <div className="flex justify-center mt-6">
                          <div className="w-32 h-32 bg-contain bg-center bg-no-repeat">
                            <Calendar className="w-full h-full text-violet-500" />
                          </div>
                        </div>
                      </div>
                    )}

                    {accountType === "business" && isAdmin && (
                      <>
                        <FormField
                          control={form.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Name *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your business name"
                                  {...field}
                                  required
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="teamSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Team Size *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || undefined}
                                required
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select team size" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1-5">1-5</SelectItem>
                                  <SelectItem value="6-10">6-10</SelectItem>
                                  <SelectItem value="11-50">11-50</SelectItem>
                                  <SelectItem value="51-200">51-200</SelectItem>
                                  <SelectItem value="201+">201+</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                )}

                {/* Step 2: Calendar Experience - FLIPPED ORDER HERE */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="flex justify-center mb-6">
                      <div
                        className="w-48 h-48 bg-contain bg-center bg-no-repeat dark:invert"
                        style={{
                          backgroundImage:
                            'url("https://cdn-icons-png.flaticon.com/512/2693/2693507.png")',
                        }}
                      ></div>
                    </div>
                    <FormField
                      control={form.control}
                      name="usedCalendarTools"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel>
                            Have you used calendar tools before?
                          </FormLabel>
                          <FormDescription>
                            We'll customize your experience based on your
                            familiarity with calendar tools.
                          </FormDescription>
                          <div className="space-y-3">
                            <RadioCard
                              value="yes"
                              checked={field.value === "yes"}
                              onChange={(value) => field.onChange(value)}
                              icon={
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              }
                            >
                              <span className="font-normal">
                                Yes, I'm familiar with calendar tools
                              </span>
                            </RadioCard>

                            <RadioCard
                              value="no"
                              checked={field.value === "no"}
                              onChange={(value) => field.onChange(value)}
                              icon={
                                <HelpCircle className="h-5 w-5 text-amber-500" />
                              }
                            >
                              <span className="font-normal">
                                No, this is new to me
                              </span>
                            </RadioCard>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* New Calendar Service Field - Only shown when user has used calendar tools before */}
                    {watch("usedCalendarTools") === "yes" && (
                      <>
                        <FormField
                          control={form.control}
                          name="calendarService"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Which calendar service do you use? *
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || undefined}
                                required
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your calendar service" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="googleCalendar">
                                    Google Calendar
                                  </SelectItem>
                                  <SelectItem value="outlookCalendar">
                                    Outlook Calendar
                                  </SelectItem>
                                  <SelectItem value="appleCalendar">
                                    Apple Calendar
                                  </SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                  <SelectItem value="none">
                                    None/I'll set up later
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Conditional Field for Other Calendar Service */}
                        {calendarService === "other" && (
                          <FormField
                            control={form.control}
                            name="otherCalendarService"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Please specify your calendar service
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter your calendar service"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </>
                    )}
                    {/* Moved this field up from Step 3 */}
                    <FormField
                      control={form.control}
                      name="familiarWithTools"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            How familiar are you with scheduling tools such as
                            Calendly? *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                            required
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your familiarity level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="notAtAll">
                                Not at all familiar
                              </SelectItem>
                              <SelectItem value="somewhat">
                                Somewhat familiar
                              </SelectItem>
                              <SelectItem value="veryFamiliar">
                                Very familiar
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Scheduling Preferences */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="flex justify-center mb-6">
                      <div
                        className="w-48 h-48 bg-contain bg-center bg-no-repeat"
                        style={{
                          backgroundImage:
                            'url("https://cdn-icons-png.flaticon.com/512/4205/4205906.png")',
                        }}
                      ></div>
                    </div>

                    <FormField
                      control={form.control}
                      name="schedulingType"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel>
                            What type of scheduling do you need?
                          </FormLabel>
                          <div className="space-y-3">
                            <RadioCard
                              value="inPerson"
                              checked={field.value === "inPerson"}
                              onChange={(value) => field.onChange(value)}
                              icon={
                                <House className="h-5 w-5 text-violet-500" />
                              }
                            >
                              <span className="font-normal">
                                In-person meetings
                              </span>
                            </RadioCard>

                            <RadioCard
                              value="online"
                              checked={field.value === "online"}
                              onChange={(value) => field.onChange(value)}
                              icon={
                                <Globe className="h-5 w-5 text-violet-500" />
                              }
                            >
                              <span className="font-normal">
                                Online meetings
                              </span>
                            </RadioCard>

                            <RadioCard
                              value="both"
                              checked={field.value === "both"}
                              onChange={(value) => field.onChange(value)}
                              icon={
                                <CalendarDays className="h-5 w-5 text-violet-500" />
                              }
                            >
                              <span className="font-normal">
                                Both in-person and online
                              </span>
                            </RadioCard>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What is your timezone? *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-96">
                              <SelectItem value="America/New_York">
                                America/New_York (Eastern Time)
                              </SelectItem>
                              <SelectItem value="America/Chicago">
                                America/Chicago (Central Time)
                              </SelectItem>
                              <SelectItem value="America/Denver">
                                America/Denver (Mountain Time)
                              </SelectItem>
                              <SelectItem value="America/Los_Angeles">
                                America/Los_Angeles (Pacific Time)
                              </SelectItem>
                              <SelectItem value="America/Anchorage">
                                America/Anchorage (Alaska)
                              </SelectItem>
                              <SelectItem value="Pacific/Honolulu">
                                Pacific/Honolulu (Hawaii)
                              </SelectItem>
                              <SelectItem value="America/Toronto">
                                America/Toronto (Eastern Canada)
                              </SelectItem>
                              <SelectItem value="America/Vancouver">
                                America/Vancouver (Pacific Canada)
                              </SelectItem>
                              <SelectItem value="America/Mexico_City">
                                America/Mexico_City
                              </SelectItem>
                              <SelectItem value="America/Sao_Paulo">
                                America/Sao_Paulo
                              </SelectItem>
                              <SelectItem value="America/Argentina/Buenos_Aires">
                                America/Argentina/Buenos_Aires
                              </SelectItem>
                              <SelectItem value="Europe/London">
                                Europe/London
                              </SelectItem>
                              <SelectItem value="Europe/Paris">
                                Europe/Paris
                              </SelectItem>
                              <SelectItem value="Europe/Berlin">
                                Europe/Berlin
                              </SelectItem>
                              <SelectItem value="Europe/Moscow">
                                Europe/Moscow
                              </SelectItem>
                              <SelectItem value="Europe/Amsterdam">
                                Europe/Amsterdam
                              </SelectItem>
                              <SelectItem value="Europe/Madrid">
                                Europe/Madrid
                              </SelectItem>
                              <SelectItem value="Europe/Rome">
                                Europe/Rome
                              </SelectItem>
                              <SelectItem value="Europe/Dublin">
                                Europe/Dublin
                              </SelectItem>
                              <SelectItem value="Africa/Cairo">
                                Africa/Cairo
                              </SelectItem>
                              <SelectItem value="Africa/Johannesburg">
                                Africa/Johannesburg
                              </SelectItem>
                              <SelectItem value="Africa/Lagos">
                                Africa/Lagos
                              </SelectItem>
                              <SelectItem value="Asia/Dubai">
                                Asia/Dubai
                              </SelectItem>
                              <SelectItem value="Asia/Kolkata">
                                Asia/Kolkata (India)
                              </SelectItem>
                              <SelectItem value="Asia/Shanghai">
                                Asia/Shanghai
                              </SelectItem>
                              <SelectItem value="Asia/Singapore">
                                Asia/Singapore
                              </SelectItem>
                              <SelectItem value="Asia/Tokyo">
                                Asia/Tokyo
                              </SelectItem>
                              <SelectItem value="Asia/Seoul">
                                Asia/Seoul
                              </SelectItem>
                              <SelectItem value="Asia/Hong_Kong">
                                Asia/Hong_Kong
                              </SelectItem>
                              <SelectItem value="Australia/Sydney">
                                Australia/Sydney
                              </SelectItem>
                              <SelectItem value="Australia/Melbourne">
                                Australia/Melbourne
                              </SelectItem>
                              <SelectItem value="Australia/Perth">
                                Australia/Perth
                              </SelectItem>
                              <SelectItem value="Pacific/Auckland">
                                Pacific/Auckland
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Your timezone helps us display meeting times
                            correctly.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 4: Referral Source */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="flex justify-center mb-6">
                      <div
                        className="w-48 h-48 bg-contain bg-center bg-no-repeat"
                        style={{
                          backgroundImage:
                            'url("https://cdn-icons-png.flaticon.com/512/1356/1356479.png")',
                        }}
                      ></div>
                    </div>

                    <FormField
                      control={form.control}
                      name="referralSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Where did you hear about us? *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select referral source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="search">
                                Search Engine
                              </SelectItem>
                              <SelectItem value="socialMedia">
                                Social Media
                              </SelectItem>
                              <SelectItem value="friend">
                                Friend or Colleague
                              </SelectItem>
                              <SelectItem value="advertisement">
                                Advertisement
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watch("referralSource") === "other" && (
                      <FormField
                        control={form.control}
                        name="referralDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Please specify</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us where you heard about us"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {/* Step 5: Completion with Confetti */}
                {step === 5 && (
                  <div className="space-y-6 py-8">
                    <Confetti
                      width={window.innerWidth}
                      height={window.innerHeight}
                      recycle={false}
                      numberOfPieces={500}
                      // gravity={1}
                    />

                    <div className="flex justify-center">
                      <div className="w-32 h-32 bg-contain bg-center bg-no-repeat">
                        <CheckCircle2 className="w-full h-full text-green-500" />
                      </div>
                    </div>

                    <div className="text-center space-y-4">
                      <h2 className="text-3xl font-bold text-primary">
                        All set!
                      </h2>
                      <p className="text-xl">
                        Your AgentCal account is ready to use
                      </p>
                      <p className="text-muted-foreground">
                        You'll be redirected to set up your first event type in
                        a moment.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="px-6 py-4 bg-muted/20 border-t">
                <div className="flex justify-between w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1 || step === 5}
                    className="flex items-center"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  {step !== 5 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center"
                      loading={isPending}
                    >
                      {step === totalSteps - 1 ? "Finish" : "Next"}{" "}
                      {step !== totalSteps - 1 && (
                        <ChevronRight className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <div className="h-10"></div>
                    // Empty spacer for the final step
                  )}
                </div>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OnboardingDialog
