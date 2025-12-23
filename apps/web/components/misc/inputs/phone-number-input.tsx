import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import type React from "react"
import { useEffect, useState } from "react"
import countryCodes from "./country-codes"

interface PhoneNumberInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  id?: string
  name?: string
  required?: boolean
  className?: string
}

/**
 * PhoneNumberInput component using Shadcn UI components
 * Features country code dropdown and automatic number formatting
 */
const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  label,
  id = "phone",
  name = "phone",
  required = false,
  className = "",
}) => {
  // Extract country code and national number from E164 format
  const parseE164 = (e164: string) => {
    if (!e164 || e164.length <= 1)
      return { countryCode: "1", nationalNumber: "" }

    // Remove the + prefix
    const rawNumber = e164.replace(/^\+/, "")

    // Determine country code
    let countryCode = "1" // Default to US
    let nationalNumber = rawNumber

    // Try to match country codes from our list
    for (const country of countryCodes) {
      if (rawNumber.startsWith(country.code)) {
        countryCode = country.code
        nationalNumber = rawNumber.substring(country.code.length)
        break
      }
    }

    return { countryCode, nationalNumber }
  }

  // Parse the initial value
  const {
    countryCode: initialCountryCode,
    nationalNumber: initialNationalNumber,
  } = parseE164(value)

  // State for country code and formatted national number
  const [countryCode, setCountryCode] = useState(initialCountryCode)
  const [formattedNumber, setFormattedNumber] = useState("")

  // Format the national number for display
  const formatNationalNumber = (number: string) => {
    if (!number) return ""

    // Remove all non-numeric characters
    const digits = number.replace(/\D/g, "")

    // Format based on length (US format as default)
    if (countryCode === "1") {
      // US/Canada format: (123) 456-7890
      if (digits.length <= 3) {
        return digits
      } else if (digits.length <= 6) {
        return `(${digits.substring(0, 3)}) ${digits.substring(3)}`
      } else {
        return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 10)}`
      }
    } else {
      // Generic international format with spaces every 3 digits
      return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim()
    }
  }

  // Create E164 format from country code and national number
  const createE164 = (countryCode: string, nationalNumber: string) => {
    const digits = nationalNumber.replace(/\D/g, "")
    return digits ? `+${countryCode}${digits}` : ""
  }

  // Initialize formatted number from the provided value
  useEffect(() => {
    const { countryCode: parsedCode, nationalNumber } = parseE164(value)
    setCountryCode(parsedCode)
    setFormattedNumber(formatNationalNumber(nationalNumber))
  }, [value])

  // Handle country code change
  const handleCountryCodeChange = (code: string) => {
    setCountryCode(code)

    // Get the current national number in digits only
    const nationalDigits = formattedNumber.replace(/\D/g, "")

    // Format the national number again
    setFormattedNumber(formatNationalNumber(nationalDigits))

    // Update the full E164 value
    onChange(createE164(code, nationalDigits))
  }

  // Handle national number input change
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value

    // Get only digits
    const digitsOnly = input.replace(/\D/g, "")

    // Format for display
    const formatted = formatNationalNumber(digitsOnly)

    // Update formatted display
    setFormattedNumber(formatted)

    // Create and update E164 format
    onChange(createE164(countryCode, digitsOnly))
  }

  // Get flag for the selected country code
  const getFlag = () => {
    const found = countryCodes.find((c) => c.code === countryCode)
    return found ? found.flag : "🌍"
  }

  return (
    <div className="grid gap-2">
      {label && (
        <Label htmlFor={id} className="text-muted-foreground">
          {label}
        </Label>
      )}
      <div className="flex">
        <Select value={countryCode} onValueChange={handleCountryCodeChange}>
          <SelectTrigger
            className="w-24 rounded-r-none border-r-0 flex items-center justify-center"
            aria-label="Country code"
          >
            <SelectValue>
              <span className="flex items-center">
                <span className="mr-1">{getFlag()}</span>
                <span>+{countryCode}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countryCodes.map((country) => (
              <SelectItem
                key={`${country.code}-${country.country}`}
                value={country.code}
              >
                <span className="flex items-center">
                  <span className="mr-2">{country.flag}</span>
                  <span>+{country.code}</span>
                  <span className="ml-2 text-muted-foreground">
                    ({country.country})
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          name={name}
          value={formattedNumber}
          onChange={handleNumberChange}
          className={`rounded-l-none flex-1 ${className}`}
          required={required}
          placeholder={countryCode === "1" ? "(555) 123-4567" : "123 456 789"}
        />
      </div>
    </div>
  )
}

export default PhoneNumberInput
