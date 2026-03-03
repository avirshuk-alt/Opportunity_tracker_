"use client"

import { useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { GripVertical, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { StrategicObjective } from "@/lib/strategic-objectives-data"
import { CATEGORY_COLORS, PRIORITY_COLORS } from "@/lib/strategic-objectives-data"

export type DropZone = "before" | "after" | "nest" | null

interface ObjectiveCardProps {
  objective: StrategicObjective
  number: string
  isChild?: boolean
  onOpen: (id: string) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDropReorder: (sourceId: string, targetId: string, position: "before" | "after") => void
  onDropNest: (sourceId: string, targetId: string) => void
  dragSourceId: string | null
}

export function ObjectiveCard({
  objective,
  number,
  isChild = false,
  onOpen,
  onDragStart,
  onDropReorder,
  onDropNest,
  dragSourceId,
}: ObjectiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [dropZone, setDropZone] = useState<DropZone>(null)
  const catColor = CATEGORY_COLORS[objective.category]
  const priColor = PRIORITY_COLORS[objective.priority]

  const isDragSource = dragSourceId === objective.id

  const computeZone = useCallback((e: React.DragEvent): DropZone => {
    if (!cardRef.current) return null
    const rect = cardRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const h = rect.height
    const threshold = h * 0.28
    if (y < threshold) return "before"
    if (y > h - threshold) return "after"
    return "nest"
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (dragSourceId === objective.id) return
      setDropZone(computeZone(e))
    },
    [dragSourceId, objective.id, computeZone]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation()
    setDropZone(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const zone = computeZone(e)
      setDropZone(null)
      if (!dragSourceId || dragSourceId === objective.id) return
      if (zone === "before" || zone === "after") {
        onDropReorder(dragSourceId, objective.id, zone)
      } else if (zone === "nest") {
        onDropNest(dragSourceId, objective.id)
      }
    },
    [dragSourceId, objective.id, computeZone, onDropReorder, onDropNest]
  )

  return (
    <div className="relative" ref={cardRef}>
      {/* Insertion line BEFORE */}
      {dropZone === "before" && (
        <div className="absolute -top-[3px] left-0 right-0 z-20 flex items-center pointer-events-none">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <div className="flex-1 h-[2px] bg-primary" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
      )}

      <div
        draggable
        onDragStart={(e) => onDragStart(e, objective.id)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group relative flex items-stretch rounded-2xl border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 ease-out cursor-grab active:cursor-grabbing",
          "hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-orange-200",
          dropZone === "nest" && "ring-2 ring-primary border-primary bg-orange-50/40 scale-[1.005]",
          isDragSource && "opacity-40",
          isChild && "ml-8"
        )}
      >
        {/* Orange accent rail */}
        <div className={cn(
          "w-1 shrink-0 rounded-l-2xl transition-colors",
          dropZone === "nest" ? "bg-primary" : isChild ? "bg-muted group-hover:bg-orange-300" : "bg-orange-200 group-hover:bg-orange-400"
        )} />

        {/* Drag handle */}
        <div className="flex items-center px-2 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Main content */}
        <div
          className="flex-1 flex items-center gap-4 py-4 pr-4 cursor-pointer"
          onClick={() => onOpen(objective.id)}
        >
          {/* Number badge */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-card">
            <span className="text-[11px] font-bold text-orange-600">{number}</span>
          </div>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug truncate">
              {objective.title}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge
                variant="outline"
                className={cn("text-[10px] font-medium px-1.5 py-0", catColor.bg, catColor.text, catColor.border)}
              >
                {objective.category}
              </Badge>
              <span className="text-[11px] text-muted-foreground">{objective.targetMetric}</span>
              <span className="text-[11px] text-muted-foreground/50">|</span>
              <span className="text-[11px] text-muted-foreground">{objective.timeHorizon}</span>
            </div>
          </div>

          {/* Nest hint (center zone only) */}
          {dropZone === "nest" && (
            <span className="text-[10px] font-semibold text-primary shrink-0 animate-pulse">
              Drop to nest
            </span>
          )}

          {/* Priority badge */}
          <Badge
            variant="outline"
            className={cn("text-[10px] font-medium shrink-0 px-2 py-0.5", priColor.bg, priColor.text)}
          >
            {objective.priority}
          </Badge>

          {/* Arrow */}
          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
        </div>
      </div>

      {/* Insertion line AFTER */}
      {dropZone === "after" && (
        <div className="absolute -bottom-[3px] left-0 right-0 z-20 flex items-center pointer-events-none">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <div className="flex-1 h-[2px] bg-primary" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
      )}
    </div>
  )
}
