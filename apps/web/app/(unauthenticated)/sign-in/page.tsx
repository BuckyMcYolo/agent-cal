import SignIn from "@/components/unauthenticated/sign-in"

export default function SignInPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-8">
        <SignIn />
      </div>
    </div>
  )
}
