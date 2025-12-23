"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Label } from "./label"
import { ChevronUp, ChevronDown } from "lucide-react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  helperText?: string
  label?: string
  labelWithAsterisk?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error,
      helperText,
      label,
      labelWithAsterisk,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    // Use internal state only if the component is uncontrolled
    const [internalValue, setInternalValue] = React.useState<string>(
      defaultValue?.toString() || ""
    )

    // Determine if the component is controlled
    const isControlled = value !== undefined
    // Use either controlled value or internal state
    const currentValue = isControlled ? value : internalValue

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value)
      }
      onChange?.(e)
    }

    const handleIncrement = () => {
      const currentNumericValue = parseInt(currentValue as string, 10) || 0
      const newValue = (currentNumericValue + 1).toString()

      if (!isControlled) {
        setInternalValue(newValue)
      }

      onChange?.({
        target: { value: newValue },
      } as React.ChangeEvent<HTMLInputElement>)
    }

    const handleDecrement = () => {
      const currentNumericValue = parseInt(currentValue as string, 10) || 0
      const newValue = (currentNumericValue - 1).toString()

      if (!isControlled) {
        setInternalValue(newValue)
      }

      onChange?.({
        target: { value: newValue },
      } as React.ChangeEvent<HTMLInputElement>)
    }

    // Sync internal state with external value when controlled
    React.useEffect(() => {
      if (isControlled) {
        setInternalValue(value as string)
      }
    }, [isControlled, value])

    return (
      <div className="w-full">
        <style>
          {`
            input[type="number"]::-webkit-inner-spin-button,
            input[type="number"]::-webkit-outer-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            input[type="number"] {
              -moz-appearance: textfield;
            }
          `}
        </style>
        {Boolean(label) && (
          <Label className="text-sm">
            {label}
            {labelWithAsterisk && <span className="text-red-500"> *</span>}
          </Label>
        )}
        <div className="relative">
          <input
            type={type}
            data-slot="input"
            className={cn(
              "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              error
                ? "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                : "",
              type === "number" ? "pr-12" : "",
              className
            )}
            value={currentValue}
            onChange={handleChange}
            ref={ref}
            aria-invalid={error}
            {...props}
          />
          {type === "number" && (
            <div
              className={cn(
                "absolute inset-y-0 right-0 flex flex-col",
                "border-l-0 z-10",
                error ? "text-destructive" : "text-foreground"
              )}
            >
              <button
                type="button"
                className={cn(
                  "flex-1 px-2 flex items-center justify-center hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 rounded-tr-md cursor-pointer",
                  "border-l border-input",
                  "border-b-0",
                  "active:bg-white/80 dark:active:bg-neutral-800/70",
                  error ? "border-destructive" : "border-input"
                )}
                onClick={handleIncrement}
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 px-2 flex items-center justify-center hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 rounded-br-md cursor-pointer",
                  "border-l border-t border-input",
                  "active:bg-white/80 dark:active:bg-neutral-800/70",
                  error ? "border-destructive" : "border-input"
                )}
                onClick={handleDecrement}
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        {helperText && (
          <p
            className={cn(
              "mt-1 text-sm",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
