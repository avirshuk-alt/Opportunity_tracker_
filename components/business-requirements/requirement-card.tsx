"use client"

import { useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { GripVertical, ChevronRight, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { BusinessRequirement } from "@/lib/business-requirements-data"
import {
  REQUIREMENT_CATEGORY_COLORS,
  REQUIREMENT_PRIORITY_COLORS,
  STATUS_COLORS,
  TIME_HORIZON_COLORS,
  getAlignmentInfo,
} from "@/lib/business-requirements-data"

export type DropZone = "before" | "after" | "nest" | null

interface RequirementCardProps {
  requirement: BusinessRequirement
  number: string
  isChild?: boolean
  onOpen: (id: string) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDropReorder: (sourceId: string, targetId: string, position: "before" | "after") => void
  onDropNest: (sourceId: string, targetId: string) => void
  dragSourceId: string | null
}

export function RequirementCard({
  requirement,
  number,
  isChild = false,
  onOpen,
  onDragStart,
  onDropReorder,
  onDropNest,
  dragSourceId,
}: RequirementCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [dropZone, setDropZone] = useState<DropZone>(null)
  const catColor = REQUIREMENT_CATEGORY_COLORS[requirement.category]
  const priColor = REQUIREMENT_PRIORITY_COLORS[requirement.priority]
  const statusColor = STATUS_COLORS[requirement.status]
  const horizonColor = TIME_HORIZON_COLORS[requirement.timeHorizon]
  const alignment = getAlignmentInfo(requirement)

  const isDragSource = dragSourceId === requirement.id

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
      if (dragSourceId === requirement.id) return
      setDropZone(computeZone(e))
    },
    [dragSourceId, requirement.id, computeZone]
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
      if (!dragSourceId || dragSourceId === requirement.id) return
      if (zone === "before" || zone === "after") {
        onDropReorder(dragSourceId, requirement.id, zone)
      } else if (zone === "nest") {
        onDropNest(dragSourceId, requirement.id)
      }
    },
    [dragSourceId, requirement.id, computeZone, onDropReorder, onDropNest]
  )

  // Stakeholder avatars (max 4 visible)
  const visibleStakeholders = requirement.assignedStakeholders.slice(0, 4)
  const overflowCount = requirement.assignedStakeholders.length - 4

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
        onDragStart={(e) => onDragStart(e, requirement.id)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group relative flex items-stretch rounded-2xl border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 ease-out cursor-grab active:cursor-grabbing overflow-hidden min-h-[72px]",
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
          className="flex-1 py-4 pr-4 cursor-pointer"
          onClick={() => onOpen(requirement.id)}
        >
          <div className="flex items-start gap-4">
            {/* Number badge */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-card">
              <span className="text-[11px] font-bold text-orange-600">{number}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Requirement Name (or fallback from statement) */}
              <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1 break-words whitespace-normal">
                {requirement.name || requirement.statement.split(/\s+/).slice(0, 8).join(" ") + (requirement.statement.split(/\s+/).length > 8 ? "..." : "")}
              </p>
              {/* Statement as body text */}
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 break-words whitespace-normal mt-0.5">
                {requirement.statement}
              </p>

              {/* Metadata row */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-medium px-1.5 py-0", catColor.bg, catColor.text, catColor.border)}
                >
                  {requirement.category}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-medium px-1.5 py-0", priColor.bg, priColor.text)}
                >
                  {requirement.priority}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-medium px-1.5 py-0", horizonColor.bg, horizonColor.text)}
                >
                  {requirement.timeHorizon}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-medium px-1.5 py-0", statusColor.bg, statusColor.text, statusColor.border)}
                >
                  {requirement.status}
                </Badge>
              </div>

              {/* Bottom row: only shown when stakeholders are assigned */}
              {requirement.assignedStakeholders.length > 0 && <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                {/* Stakeholder avatars */}
                {requirement.assignedStakeholders.length > 0 && (
                  <div className="flex items-center -space-x-1.5">
                    {visibleStakeholders.map((s) => (
                      <div
                        key={s.stakeholderId}
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[9px] font-bold",
                          s.validationStatus === "Approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : s.validationStatus === "Revision Requested"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-600"
                        )}
                        title={`${s.name} (${s.validationStatus})`}
                      >
                        {s.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                    ))}
                    {overflowCount > 0 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] font-bold text-muted-foreground">
                        +{overflowCount}
                      </div>
                    )}
                  </div>
                )}

                {/* Alignment */}
                {alignment.total > 0 && (
                  <div className="flex items-center gap-2">
                    <Progress value={alignment.percentage} className="h-1.5 w-16" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {alignment.label}
                    </span>
                  </div>
                )}

                {/* Comment count + Last edited */}
                <div className="flex items-center gap-2 ml-auto">
                  {requirement.comments.length > 0 && (
                    <div className="flex items-center gap-1 text-orange-500">
                      <MessageSquare className="h-3 w-3" />
                      <span className="text-[10px] font-medium">{requirement.comments.length}</span>
                    </div>
                  )}
                  {requirement.lastEditedAt && (
                    <span className="text-[10px] text-muted-foreground">
                      Last edited: {new Date(requirement.lastEditedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>}
            </div>

            {/* Nest hint */}
            {dropZone === "nest" && (
              <span className="text-[10px] font-semibold text-primary shrink-0 animate-pulse self-center">
                Drop to nest
              </span>
            )}

            {/* Arrow */}
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 self-center" />
          </div>
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
