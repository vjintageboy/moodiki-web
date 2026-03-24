"use client"

import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DatePickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: Date | null
  onChange?: (date: Date | null) => void
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  placeholder?: string
  format?: string
}

interface CalendarState {
  year: number
  month: number
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  ({
    value,
    onChange,
    minDate,
    maxDate,
    disabled = false,
    placeholder = "Select a date",
    format: dateFormat = "MMM dd, yyyy",
    className,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [calendarState, setCalendarState] = React.useState<CalendarState>(() => {
      const date = value || new Date()
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
      }
    })
    const [inputValue, setInputValue] = React.useState<string>(
      value ? format(value, dateFormat) : ""
    )
    const popoverRef = React.useRef<HTMLDivElement>(null)
    const triggerRef = React.useRef<HTMLButtonElement>(null)

    // Close popover when clicking outside
    React.useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          popoverRef.current &&
          triggerRef.current &&
          !popoverRef.current.contains(event.target as Node) &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [isOpen])

    const handleDateClick = (day: number) => {
      const newDate = new Date(calendarState.year, calendarState.month, day)
      
      // Validate against min/max dates
      if (minDate && newDate < minDate) return
      if (maxDate && newDate > maxDate) return

      onChange?.(newDate)
      setInputValue(format(newDate, dateFormat))
      setIsOpen(false)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInputValue(value)

      // Try to parse the input
      const parsed = parse(value, dateFormat, new Date())
      if (isValid(parsed)) {
        onChange?.(parsed)
        setCalendarState({
          year: parsed.getFullYear(),
          month: parsed.getMonth(),
        })
      }
    }

    const handleClear = () => {
      onChange?.(null)
      setInputValue("")
      setIsOpen(false)
    }

    const handlePrevMonth = () => {
      setCalendarState((prev) => {
        if (prev.month === 0) {
          return { year: prev.year - 1, month: 11 }
        }
        return { ...prev, month: prev.month - 1 }
      })
    }

    const handleNextMonth = () => {
      setCalendarState((prev) => {
        if (prev.month === 11) {
          return { year: prev.year + 1, month: 0 }
        }
        return { ...prev, month: prev.month + 1 }
      })
    }

    const getDaysInMonth = (year: number, month: number): number => {
      return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (year: number, month: number): number => {
      return new Date(year, month, 1).getDay()
    }

    const isDateDisabled = (day: number): boolean => {
      const date = new Date(calendarState.year, calendarState.month, day)
      if (minDate && date < minDate) return true
      if (maxDate && date > maxDate) return true
      return false
    }

    const isDateSelected = (day: number): boolean => {
      if (!value) return false
      return (
        value.getFullYear() === calendarState.year &&
        value.getMonth() === calendarState.month &&
        value.getDate() === day
      )
    }

    const isDateToday = (day: number): boolean => {
      const today = new Date()
      return (
        today.getFullYear() === calendarState.year &&
        today.getMonth() === calendarState.month &&
        today.getDate() === day
      )
    }

    const days = Array.from({ length: getDaysInMonth(calendarState.year, calendarState.month) }, (_, i) => i + 1)
    const firstDay = getFirstDayOfMonth(calendarState.year, calendarState.month)
    const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

    const monthName = new Date(calendarState.year, calendarState.month).toLocaleDateString(
      "en-US",
      { month: "long", year: "numeric" }
    )

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    return (
      <div ref={ref} className={cn("relative w-full", className)} {...props}>
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={disabled}
              readOnly
              className="cursor-pointer pr-10"
              onClick={() => !disabled && setIsOpen(!isOpen)}
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
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

        {/* Calendar Popover */}
        {isOpen && !disabled && (
          <div
            ref={popoverRef}
            className="absolute top-full left-0 z-50 mt-2 rounded-lg border border-input bg-popover text-popover-foreground shadow-md p-3 w-72 dark:bg-slate-950 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePrevMonth}
                className="h-8 w-8"
              >
                ←
              </Button>
              <h2 className="text-sm font-semibold">{monthName}</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                className="h-8 w-8"
              >
                →
              </Button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {emptyDays.map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}
              {days.map((day) => {
                const isDisabled = isDateDisabled(day)
                const isSelected = isDateSelected(day)
                const isToday = isDateToday(day)

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    disabled={isDisabled}
                    className={cn(
                      "h-8 rounded-md text-sm font-medium transition-colors outline-none",
                      isDisabled && "pointer-events-none opacity-40",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground",
                      isToday && !isSelected && "border border-primary"
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }
)

DatePicker.displayName = "DatePicker"

export { DatePicker }
