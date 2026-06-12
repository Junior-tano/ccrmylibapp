"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const COUNTRIES = [
  {
    code: "CI",
    name: "Côte d'Ivoire",
    dialCode: "+225",
    flag: "🇨🇮",
  },
  {
    code: "BJ",
    name: "Bénin",
    dialCode: "+229",
    flag: "🇧🇯",
  },
  {
    code: "FR",
    name: "France",
    dialCode: "+33",
    flag: "🇫🇷",
  },
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  id?: string
  className?: string
}

export function PhoneInput({
  value,
  onChange,
  placeholder,
  required,
  id,
  className,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(COUNTRIES[0])

  const getNumberPart = (val: string) => {
    for (const c of COUNTRIES) {
      if (val.startsWith(c.dialCode)) {
        return val.slice(c.dialCode.length).trim()
      }
    }
    return val
  }

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelected(country)
    setOpen(false)
    const numberPart = getNumberPart(value)
    onChange(numberPart ? `${country.dialCode} ${numberPart}` : "")
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value
    onChange(num ? `${selected.dialCode} ${num}` : "")
  }

  const displayNumber = getNumberPart(value)

  return (
    <div className={cn("relative flex", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 border border-r-0 border-input rounded-l-md bg-muted hover:bg-muted/80 transition-colors shrink-0 text-sm"
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="font-medium text-foreground">{selected.dialCode}</span>
        <svg
          className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Input
        id={id}
        type="tel"
        value={displayNumber}
        onChange={handleNumberChange}
        placeholder={placeholder ?? "07 00 00 00 00"}
        required={required}
        className="rounded-l-none border-l-0 focus-visible:ring-offset-0"
      />

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1 w-52 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            {COUNTRIES.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleCountrySelect(country)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left",
                  selected.code === country.code && "bg-primary/5 text-primary font-medium"
                )}
              >
                <span className="text-xl leading-none">{country.flag}</span>
                <div>
                  <p className="font-medium">{country.name}</p>
                  <p className="text-xs text-muted-foreground">{country.dialCode}</p>
                </div>
                {selected.code === country.code && (
                  <svg className="ml-auto h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}