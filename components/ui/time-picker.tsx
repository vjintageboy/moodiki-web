"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

interface TimePickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: Date | null
  onChange?: (date: Date | null) => void
  disabled?: boolean
  placeholder?: string
  format24h?: boolean
  step?: 15 | 30 | 60
  minTime?: string
  maxTime?: string
}

const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  ({
    value,
    onChange,
    disabled = false,
    placeholder = "Select time",
    format24h = true,
    step = 15,
    minTime,
    maxTime,
    className,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [hours, setHours] = React.useState<number>(() => {
      return value ? value.getHours() : 12
    })
    const [minutes, setMinutes] = React.useState<number>(() => {
      return value ? value.getMinutes() : 0
    })
    const [period, setPeriod] = React.useState<"AM" | "PM">(() => {
      if (format24h) return "AM"
      return value ? (value.getHours() >= 12 ? "PM" : "AM") : "AM"
    })
    const inputRef = React.useRef<HTMLInputElement>(null)
    const popoverRef = React.useRef<HTMLDivElement>(null)
    const triggerRef = React.useRef<HTMLButtonElement>(null)

    // Close popover when clicking outside
    React.useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          popoverRef.current &&
          triggerRef.current &&
          !popoverRef.current.contains(event.target as Node) &&
          !triggerRef.current.contains(event.target as Node) &&
          !inputRef.current?.contains(event.target as Node)
        ) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [isOpen])

    const formatTime = (): string => {
      if (!value) return ""
      const hours = value.getHours()
      const minutes = value.getMinutes()
      const hh = String(hours).padStart(2, "0")
      const mm = String(minutes).padStart(2, "0")

      if (format24h) {
        return `${hh}:${mm}`
      }

      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      const period = hours >= 12 ? "PM" : "AM"
      return `${String(displayHours).padStart(2, "0")}:${mm} ${period}`
    }

    const handleHourChange = (newHours: number) => {
      const actualHours = format24h ? newHours : ((newHours - 1 + (period === "PM" ? 12 : 0)) % 24)
      const newDate = new Date()
      newDate.setHours(actualHours, minutes, 0, 0)
      onChange?.(newDate)
      setHours(newHours)
    }

    const handleMinuteChange = (newMinutes: number) => {
      const actualHours = format24h ? hours : ((hours - 1 + (period === "PM" ? 12 : 0)) % 24)
      const newDate = new Date()
      newDate.setHours(actualHours, newMinutes, 0, 0)
      onChange?.(newDate)
      setMinutes(newMinutes)
    }

    const handlePeriodChange = (newPeriod: "AM" | "PM") => {
      if (format24h) return
      const actualHours = ((hours - 1 + (newPeriod === "PM" ? 12 : 0)) % 24)
      const newDate = new Date()
      newDate.setHours(actualHours, minutes, 0, 0)
      onChange?.(newDate)
      setPeriod(newPeriod)
    }

    const handleClear = () => {
      onChange?.(null)
      setHours(12)
      setMinutes(0)
      setPeriod("AM")
      setIsOpen(false)
    }

    const getHourOptions = (): number[] => {
      if (format24h) {
        return Array.from({ length: 24 }, (_, i) => i)
      }
      return Array.from({ length: 12 }, (_, i) => i + 1)
    }

    const getMinuteOptions = (): number[] => {
      return Array.from({ length: 60 / step }, (_, i) => i * step)
    }

    const isTimeDisabled = (h: number, m: number): boolean => {
      const actualHours = format24h ? h : ((h - 1 + (period === "PM" ? 12 : 0)) % 24)
      const timeStr = `${String(actualHours).padStart(2, "0")}:${String(m).padStart(2, "0")}`

      if (minTime && timeStr < minTime) return true
      if (maxTime && timeStr > maxTime) return true
      return false
    }

    return (
      <div ref={ref} className={cn("relative w-full", className)} {...props}>
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              value={formatTime()}
              placeholder={placeholder}
              disabled={disabled}
              readOnly
              className="cursor-pointer pr-10"
              onClick={() => !disabled && setIsOpen(!isOpen)}
            />
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="shrink-0"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Time Picker Popover */}
        {isOpen && !disabled && (
          <div
            ref={popoverRef}
            className="absolute top-full left-0 z-50 mt-2 rounded-lg border border-input bg-popover text-popover-foreground shadow-md p-4 w-80 dark:bg-slate-950 dark:border-slate-800"
          >
            <div className="space-y-4">
              {/* Time Input Row */}
              <div className="flex items-center justify-center gap-4">
                {/* Hours Selector */}
                <div className="flex flex-col items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Hours
                  </label>
                  <div className="border border-input rounded-lg overflow-hidden">
                    <div className="flex flex-col max-h-48 overflow-y-auto">
                      {getHourOptions().map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleHourChange(h)}
                          disabled={isTimeDisabled(h, minutes)}
                          className={cn(
                            "w-12 h-10 flex items-center justify-center text-sm font-medium transition-colors hover:bg-accent",
                            hours === h && "bg-primary text-primary-foreground",
                            isTimeDisabled(h, minutes) && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {String(h).padStart(2, "0")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Colon Separator */}
                <div className="text-2xl font-bold text-foreground">:</div>

                {/* Minutes Selector */}
                <div className="flex flex-col items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Minutes
                  </label>
                  <div className="border border-input rounded-lg overflow-hidden">
                    <div className="flex flex-col max-h-48 overflow-y-auto">
                      {getMinuteOptions().map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleMinuteChange(m)}
                          disabled={isTimeDisabled(hours, m)}
                          className={cn(
                            "w-12 h-10 flex items-center justify-center text-sm font-medium transition-colors hover:bg-accent",
                            minutes === m && "bg-primary text-primary-foreground",
                            isTimeDisabled(hours, m) && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {String(m).padStart(2, "0")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AM/PM Selector */}
                {!format24h && (
                  <div className="flex flex-col items-center gap-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Period
                    </label>
                    <div className="flex flex-col gap-1">
                      {(["AM", "PM"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePeriodChange(p)}
                          className={cn(
                            "w-12 h-10 flex items-center justify-center text-sm font-medium rounded-md transition-colors",
                            period === p
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground hover:bg-muted/80"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-2 pt-2 border-t border-input">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Done
                </Button>
                {value && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

TimePicker.displayName = "TimePicker"

export { TimePicker }
