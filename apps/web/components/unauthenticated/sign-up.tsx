"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { EyeIcon, EyeOff } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { SignUpForm, signUpSchema } from "./auth-utils"
import { SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { authClient } from "@workspace/auth/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import LogoImage from "../../public/logo.png"
import Image from "next/image"

export default function SignUp() {
  const [passwordType, setPasswordType] = useState<"password" | "text">(
    "password"
  )
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
    reset,
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    mode: "all",
  })

  const onSubmit: SubmitHandler<SignUpForm> = async (data) => {
    setLoading(true)
    await authClient.signUp.email(
      {
        email: data.email,
        password: data.password,
        name: data.firstName + " " + data.lastName,
      },
      {
        onRequest: () => setLoading(true),
        onResponse: () => setLoading(false),
        onError(context) {
          toast.error("Error: " + context.error.message)
        },
      }
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center mb-2">
          <Image src={LogoImage} alt="logo" width={200} height={40} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Create an account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex space-x-2">
            <Input
              {...register("firstName")}
              error={Boolean(
                errors?.firstName?.message && touchedFields.firstName
              )}
              helperText={
                errors?.firstName?.message && touchedFields.firstName
                  ? errors.firstName.message
                  : undefined
              }
              id="firstName"
              type="text"
              placeholder="First Name"
              className="text-sm"
            />
            <Input
              {...register("lastName")}
              error={Boolean(
                errors?.lastName?.message && touchedFields.lastName
              )}
              helperText={
                errors?.lastName?.message && touchedFields.lastName
                  ? errors.lastName.message
                  : undefined
              }
              id="lastName"
              type="text"
              placeholder="Last Name"
              className="text-sm"
            />
          </div>
          <Input
            {...register("email")}
            error={Boolean(errors?.email?.message && touchedFields.email)}
            helperText={
              errors?.email?.message && touchedFields.email
                ? errors.email.message
                : undefined
            }
            id="email"
            type="email"
            placeholder="name@example.com"
            className="text-sm"
          />
          <div className="relative">
            <Input
              {...register("password")}
              error={
                Boolean(errors?.password?.message) && touchedFields.password
              }
              helperText={
                errors?.password?.message && touchedFields.password
                  ? errors.password.message
                  : undefined
              }
              id="password"
              type={passwordType}
              placeholder="••••••••"
              className="text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              className="absolute right-0 top-0"
              onClick={() =>
                setPasswordType((prev) =>
                  prev === "text" ? "password" : "text"
                )
              }
            >
              {passwordType === "text" ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
          <Button className="w-full" type="submit" loading={loading}>
            Sign Up
          </Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-2 text-muted-foreground">
              Or sign up with
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-center space-y-4">
          <Button variant="outline" className="w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="0.98em"
              height="1em"
              viewBox="0 0 256 262"
            >
              <path
                fill="#4285F4"
                d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
              ></path>
              <path
                fill="#34A853"
                d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
              ></path>
              <path
                fill="#FBBC05"
                d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
              ></path>
              <path
                fill="#EB4335"
                d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
              ></path>
            </svg>
            Google
          </Button>
          <Button variant="outline" className="w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
              ></path>
            </svg>
            GitHub
          </Button>
        </div>
        <div className="text-center">
          <p className="mt-2 text-sm text-muted-foreground">
            By signing up, you agree to our{" "}
            <Link
              href="/terms"
              className="font-semibold text-primary hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-semibold text-primary hover:underline"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
