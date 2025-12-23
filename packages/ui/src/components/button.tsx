import { Slot } from "@radix-ui/react-slot"
import { cn } from "@workspace/ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import type * as React from "react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  startIcon,
  endIcon,
  loading = false,
  ref,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    startIcon?: React.ReactNode
    endIcon?: React.ReactNode
  }) {
  const Comp = asChild ? Slot : "button"

  const renderContent = () => {
    if (loading) {
      return [
        <Loader2 key="loader" size={16} className="animate-spin mr-2" />,
        children,
      ]
    }

    const content = []
    if (startIcon)
      content.push(
        <span key="start" className="mr-2">
          {startIcon}
        </span>
      )
    content.push(children)
    if (endIcon)
      content.push(
        <span key="end" className="ml-2">
          {endIcon}
        </span>
      )

    return content
  }

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </Comp>
  )
}

export { Button, buttonVariants }
