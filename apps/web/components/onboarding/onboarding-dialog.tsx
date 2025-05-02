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
} from "@workspace/ui/components/dialog"
import { redirect } from "next/navigation"
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
} from "lucide-react"

// Zod schemas for each step
const accountTypeSchema = z.object({
  accountType: z.enum(["personal", "business"]),
  businessName: z.string().optional(),
  teamSize: z.string().optional(),
})

const calendarExperienceSchema = z.object({
  usedCalendarTools: z.enum(["yes", "no"]),
})

const schedulingPreferencesSchema = z.object({
  schedulingType: z.enum(["inPerson", "online", "both"]),
  familiarWithTools: z.enum(["notAtAll", "somewhat", "veryFamiliar"]),
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
  // Client-side component since we're using hooks
  const [step, setStep] = useState(1)
  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  // Form setup with React Hook Form and Zod
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      accountType: undefined,
      businessName: "",
      teamSize: "",
      usedCalendarTools: undefined,
      schedulingType: undefined,
      familiarWithTools: undefined,
      referralSource: undefined,
      referralDetails: "",
    },
    mode: "onChange",
  })

  const { watch, trigger, getValues } = form
  const accountType = watch("accountType")

  const validateCurrentStep = async () => {
    let fieldsToValidate: string[] = []

    switch (step) {
      case 1:
        fieldsToValidate = ["accountType"]
        if (accountType === "business") {
          fieldsToValidate.push("businessName", "teamSize")
        }
        break
      case 2:
        fieldsToValidate = ["usedCalendarTools"]
        break
      case 3:
        fieldsToValidate = ["schedulingType", "familiarWithTools"]
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

  const handleNext = async () => {
    const isValid = await validateCurrentStep()

    if (isValid) {
      if (step < totalSteps) {
        setStep(step + 1)
      } else {
        const values = getValues()
        console.log("Form submitted:", values)
        window.location.href = "/event-types"
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
            <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {icon}
          <div>{children}</div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-card">
        <div className="flex flex-col h-full">
          {/* Progress bar */}
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>
                Step {step} of {totalSteps}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Form {...form}>
            <form className="space-y-6">
              <DialogHeader className="px-6 pt-4">
                <DialogTitle className="text-xl font-semibold">
                  {step === 1 && "Welcome to AgentCal"}
                  {step === 2 && "Calendar Experience"}
                  {step === 3 && "Scheduling Preferences"}
                  {step === 4 && "Almost Done!"}
                </DialogTitle>
                <DialogDescription>
                  {step === 1 &&
                    "Let's set up your account to get you started."}
                  {step === 2 &&
                    "Tell us about your experience with calendar tools."}
                  {step === 3 && "Help us understand your scheduling needs."}
                  {step === 4 &&
                    "Just a few final details before you're all set."}
                </DialogDescription>
              </DialogHeader>

              <div className="px-6">
                {/* Step 1: Account Type */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex justify-center mb-6">
                      <div
                        className="w-48 h-48 bg-contain bg-center bg-no-repeat"
                        style={{
                          backgroundImage:
                            'url("https://cdn-icons-png.flaticon.com/512/6295/6295417.png")',
                        }}
                      ></div>
                    </div>

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
                              icon={<User className="h-5 w-5 text-blue-500" />}
                            >
                              <span className="font-normal">Personal use</span>
                            </RadioCard>

                            <RadioCard
                              value="business"
                              checked={field.value === "business"}
                              onChange={(value) => field.onChange(value)}
                              icon={
                                <Briefcase className="h-5 w-5 text-blue-500" />
                              }
                            >
                              <span className="font-normal">Business use</span>
                            </RadioCard>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {accountType === "business" && (
                      <>
                        <FormField
                          control={form.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your business name"
                                  {...field}
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
                              <FormLabel>Team Size</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || undefined}
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

                {/* Step 2: Calendar Experience */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="flex justify-center mb-6">
                      <div
                        className="w-48 h-48 bg-contain bg-center bg-no-repeat"
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
                            >
                              <span className="font-normal">
                                In-person meetings
                              </span>
                            </RadioCard>

                            <RadioCard
                              value="online"
                              checked={field.value === "online"}
                              onChange={(value) => field.onChange(value)}
                            >
                              <span className="font-normal">
                                Online meetings
                              </span>
                            </RadioCard>

                            <RadioCard
                              value="both"
                              checked={field.value === "both"}
                              onChange={(value) => field.onChange(value)}
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
                      name="familiarWithTools"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            How familiar are you with scheduling tools?
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
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
                          <FormLabel>Where did you hear about us?</FormLabel>
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
              </div>

              <DialogFooter className="px-6 py-4 bg-muted/20 border-t">
                <div className="flex justify-between w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1}
                    className="flex items-center"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center"
                  >
                    {step === totalSteps ? "Finish" : "Next"}{" "}
                    {step !== totalSteps && (
                      <ChevronRight className="ml-2 h-4 w-4" />
                    )}
                  </Button>
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
