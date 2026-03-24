"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronDown, X } from "lucide-react"

interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

interface MultiSelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: Option[]
  value?: (string | number)[]
  onChange?: (value: (string | number)[]) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  maxSelections?: number
  searchable?: boolean
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({
    options,
    value = [],
    onChange,
    placeholder = "Select items",
    searchPlaceholder = "Search...",
    disabled = false,
    maxSelections,
    searchable = true,
    className,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const popoverRef = React.useRef<HTMLDivElement>(null)
    const triggerRef = React.useRef<HTMLButtonElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

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

    // Focus search input when popover opens
    React.useEffect(() => {
      if (isOpen && searchable && inputRef.current) {
        inputRef.current.focus()
      }
    }, [isOpen, searchable])

    const handleSelect = (optionValue: string | number) => {
      if (maxSelections && value.length >= maxSelections && !value.includes(optionValue)) {
        return
      }

      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]

      onChange?.(newValue)
    }

    const handleRemove = (e: React.MouseEvent, optionValue: string | number) => {
      e.stopPropagation()
      onChange?.(value.filter((v) => v !== optionValue))
    }

    const handleSelectAll = () => {
      const selectableOptions = options.filter((opt) => !opt.disabled)
      const allSelected = selectableOptions.every((opt) => value.includes(opt.value))

      if (allSelected) {
        onChange?.([])
      } else {
        onChange?.(selectableOptions.map((opt) => opt.value))
      }
    }

    const handleClearAll = () => {
      onChange?.([])
    }

    const filteredOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const selectedOptions = options.filter((opt) => value.includes(opt.value))
    const selectableOptions = options.filter((opt) => !opt.disabled)
    const allSelected =
      selectableOptions.length > 0 &&
      selectableOptions.every((opt) => value.includes(opt.value))

    return (
      <div ref={ref} className={cn("relative w-full", className)} {...props}>
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30 dark:disabled:bg-input/80",
            isOpen && "border-ring ring-3 ring-ring/50"
          )}
        >
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedOptions.map((opt) => (
                <Badge
                  key={opt.value}
                  variant="secondary"
                  className="rounded-md px-2 py-0.5 text-xs flex items-center gap-1"
                >
                  {opt.label}
                  <X
                    className="size-3 cursor-pointer"
                    onClick={(e) => handleRemove(e, opt.value)}
                  />
                </Badge>
              ))}
            </div>
          )}
          <ChevronDown className={cn(
            "size-4 ml-auto shrink-0 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>

        {/* Selection Info */}
        {value.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {value.length} of {options.length} selected
          </p>
        )}

        {/* Dropdown Popover */}
        {isOpen && !disabled && (
          <div
            ref={popoverRef}
            className="absolute top-full left-0 z-50 mt-2 w-full rounded-lg border border-input bg-popover text-popover-foreground shadow-md min-w-max dark:bg-slate-950 dark:border-slate-800"
          >
            <div className="p-3 space-y-2">
              {/* Search */}
              {searchable && (
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8"
                />
              )}

              {/* Select All / Clear All */}
              <div className="flex gap-2 items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    disabled={selectableOptions.length === 0}
                    className="rounded cursor-pointer"
                  />
                  <span>Select all</span>
                </label>
                {value.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-xs h-6"
                  >
                    Clear
                  </Button>
                )}
              </div>

              <div className="border-t border-input" />

              {/* Options List */}
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2 text-center">
                    No options found
                  </p>
                ) : (
                  filteredOptions.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer transition-colors hover:bg-accent text-sm",
                        option.disabled && "cursor-not-allowed opacity-50",
                        value.includes(option.value) && "bg-accent"
                      )}
                      onClick={() => !option.disabled && handleSelect(option.value)}
                    >
                      <input
                        type="checkbox"
                        checked={value.includes(option.value)}
                        onChange={() => !option.disabled && handleSelect(option.value)}
                        disabled={option.disabled}
                        className="rounded cursor-pointer"
                      />
                      <span className="flex-1">{option.label}</span>
                      {value.includes(option.value) && (
                        <Check className="size-4 text-primary" />
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

MultiSelect.displayName = "MultiSelect"

export { MultiSelect, type Option }
