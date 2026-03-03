"use client"

import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface FilterPillProps {
  label: string
  value: string
  onClear: () => void
}

export function FilterPill({ label, value, onClear }: FilterPillProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-primary/5 border-primary/20">
      <Badge variant="outline" className="text-xs bg-transparent border-none p-0 text-primary font-medium">
        {label}: {value}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
        onClick={onClear}
        aria-label={`Clear ${label} filter`}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

interface ShowAllButtonProps {
  onClick: () => void
  className?: string
}

export function ShowAllButton({ onClick, className }: ShowAllButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={`h-7 text-xs ${className ?? ""}`}
      onClick={onClick}
    >
      Show all
    </Button>
  )
}
