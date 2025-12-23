"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { authClient } from "@workspace/auth/client"
import { Button } from "@workspace/ui/components/button"
import { Card, CardFooter, CardHeader } from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { EyeIcon, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"
import LogoImage from "../../public/logo.png"
import { type SignInForm, signInSchema } from "./auth-utils"

export default function SignIn() {
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [passwordType, setPasswordType] = useState<"password" | "text">(
    "password"
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
    reset,
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    mode: "all",
  })

  const onSubmit: SubmitHandler<SignInForm> = async (data) => {
    setLoading(true)
    await authClient.signIn.email(
      {
        email: data.email,
        password: data.password,
        rememberMe,
        callbackURL: "/bookings",
      },
      {
        onRequest: () => setLoading(true),
        onResponse: () => setLoading(false),
        onError(context) {
          toast.error(context.error.message)
        },
      }
    )
  }

  return (
    <Card className="max-w-md mx-auto border-0 shadow-none">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <Image src={LogoImage} alt="logo" width={200} height={40} />
        </div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Please enter your details to sign in
        </p>
      </CardHeader>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
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
            className="h-10 text-sm"
          />
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="#" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
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
              className="h-10 text-sm pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              className="absolute right-0 top-0 h-10"
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
        </div>

        {/* Remember Me */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={() => setRememberMe(!rememberMe)}
          />
          <Label htmlFor="remember" className="text-sm font-normal">
            Remember me
          </Label>
        </div>

        {/* Sign In Button */}
        <Button
          className="w-full"
          type="submit"
          loading={isSubmitting || loading}
        >
          Sign in
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Logins */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 256 262"
              className="mr-2"
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
          <Button variant="outline" size="sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              className="mr-2"
            >
              <path
                fill="currentColor"
                d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
              ></path>
            </svg>
            GitHub
          </Button>
        </div>
      </form>

      <CardFooter className="flex flex-col items-center pt-0">
        <p className="text-center text-sm text-muted-foreground mt-2">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>

        <p className="text-xs text-muted-foreground mt-4">
          By continuing, you agree to our{" "}
          <Link href="#" className="underline hover:text-primary">
            Terms
          </Link>{" "}
          &{" "}
          <Link href="#" className="underline hover:text-primary">
            Privacy
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
