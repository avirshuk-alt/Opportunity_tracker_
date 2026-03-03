"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Target,
  Plus,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react"

import {
  buildNumberingMap,
  type StrategicObjective,
  type Stakeholder,
} from "@/lib/strategic-objectives-data"

import { ObjectiveCard } from "@/components/strategic-objectives/objective-card"
import { ObjectiveDetailModal } from "@/components/strategic-objectives/objective-detail-modal"
import { useInsights } from "@/lib/insights-context"

function makeBlankObjective(index: number): StrategicObjective {
  return {
    id: `obj-new-${Date.now()}-${index}`,
    parentId: null,
    title: `New Objective ${index}`,
    category: "Operational",
    targetMetric: "Define target",
    timeHorizon: "12 months",
    priority: "Medium",
    businessRequirements: "",
    opportunities: "",
    risks: "",
    aiSummary: "",
    assignedStakeholderIds: [],
  }
}

// ─── Skeleton for loading state ────────────────────────────────────────────

function ObjectivesSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex gap-2 pl-9">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Objectives-only module for embedding inside the Strategy Workspace.
 * Consumes from the unified InsightsContext — no local generate button.
 */
export function ObjectivesOnlyModule() {
  const { state, isGenerating, hasGenerated } = useInsights()

  const [objectives, setObjectives] = useState<StrategicObjective[]>([])
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [dragSourceId, setDragSourceId] = useState<string | null>(null)
  const [objectivesExpanded, setObjectivesExpanded] = useState(true)

  // Track whether user has manually edited objectives
  const [hasUserEdits, setHasUserEdits] = useState(false)

  // Stakeholder list for the detail modal
  const [stakeholders] = useState<Stakeholder[]>([])

  // Sync objectives from unified insights state when generated
  useEffect(() => {
    if (state.objectives.length > 0) {
      // On regeneration, only overwrite generated objectives (preserve manually added ones)
      if (hasUserEdits) {
        const generatedIds = new Set(state.objectives.map((o) => o.id))
        const manuallyAdded = objectives.filter((o) => !generatedIds.has(o.id) && o.id.startsWith("obj-new-"))
        setObjectives([...state.objectives, ...manuallyAdded])
      } else {
        setObjectives(state.objectives)
      }
    }
  }, [state.objectives]) // eslint-disable-line react-hooks/exhaustive-deps

  const numbering = buildNumberingMap(objectives)

  const handleAddObjective = useCallback(() => {
    const topLevel = objectives.filter((o) => o.parentId === null)
    setObjectives((prev) => [...prev, makeBlankObjective(topLevel.length + 1)])
    setHasUserEdits(true)
  }, [objectives])

  const handleOpenObjective = useCallback((id: string) => {
    setSelectedObjectiveId(id)
    setModalOpen(true)
  }, [])

  const handleUpdateObjective = useCallback((id: string, updates: Partial<StrategicObjective>) => {
    setObjectives((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    )
    setHasUserEdits(true)
  }, [])

  const handleDragStart = useCallback((_e: React.DragEvent, id: string) => {
    setDragSourceId(id)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragSourceId(null)
  }, [])

  const handleDropReorder = useCallback(
    (sourceId: string, targetId: string, position: "before" | "after") => {
      setDragSourceId(null)
      setObjectives((prev) => {
        const arr = [...prev]
        const srcIdx = arr.findIndex((o) => o.id === sourceId)
        const tgtIdx = arr.findIndex((o) => o.id === targetId)
        if (srcIdx === -1 || tgtIdx === -1) return prev
        const target = arr[tgtIdx]
        const [removed] = arr.splice(srcIdx, 1)
        removed.parentId = target.parentId
        const newTgtIdx = arr.findIndex((o) => o.id === targetId)
        const insertIdx = position === "after" ? newTgtIdx + 1 : newTgtIdx
        arr.splice(insertIdx, 0, removed)
        return arr
      })
      setHasUserEdits(true)
    },
    []
  )

  const handleDropNest = useCallback(
    (sourceId: string, targetId: string) => {
      setDragSourceId(null)
      setObjectives((prev) => {
        const target = prev.find((o) => o.id === targetId)
        if (!target) return prev
        if (target.parentId !== null) return prev
        return prev.map((o) =>
          o.id === sourceId ? { ...o, parentId: targetId } : o
        )
      })
      setHasUserEdits(true)
    },
    []
  )

  const handleDropOnTopLevel = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragSourceId((prev) => {
      if (!prev) return null
      setObjectives((objs) => {
        const source = objs.find((o) => o.id === prev)
        if (!source || source.parentId === null) return objs
        return objs.map((o) =>
          o.id === prev ? { ...o, parentId: null } : o
        )
      })
      setHasUserEdits(true)
      return null
    })
  }, [])

  const topLevel = objectives.filter((o) => o.parentId === null)
  const getChildren = (parentId: string) => objectives.filter((o) => o.parentId === parentId)
  const selectedObjective = objectives.find((o) => o.id === selectedObjectiveId) || null

  return (
    <>
      <Card className="rounded-2xl border border-border shadow-sm">
        <CardHeader
          className="cursor-pointer select-none px-6 py-5"
          onClick={() => setObjectivesExpanded((v) => !v)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {objectivesExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <CardTitle className="text-base font-semibold">Strategic Objectives</CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  What must this category deliver to the business?
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleAddObjective}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Objective
              </Button>
            </div>
          </div>
        </CardHeader>

        {objectivesExpanded && (
          <CardContent className="px-6 pb-6 pt-0">
            {/* Loading state during unified generation */}
            {isGenerating ? (
              <ObjectivesSkeleton />
            ) : objectives.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 border border-orange-100 mb-4">
                  <Target className="h-7 w-7 text-orange-400" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">No objectives defined yet</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Click &quot;Generate Insights&quot; at the top of the workspace to auto-create structured objectives from your category data, or add one manually.
                </p>
              </div>
            ) : (
              <div
                className="space-y-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropOnTopLevel}
                onDragEnd={handleDragEnd}
              >
                {topLevel.map((obj) => {
                  const children = getChildren(obj.id)
                  return (
                    <div key={obj.id}>
                      <ObjectiveCard
                        objective={obj}
                        number={numbering[obj.id] || ""}
                        onOpen={handleOpenObjective}
                        onDragStart={handleDragStart}
                        onDropReorder={handleDropReorder}
                        onDropNest={handleDropNest}
                        dragSourceId={dragSourceId}
                      />
                      {children.length > 0 && (
                        <div className="ml-4 pl-4 border-l-2 border-border mt-2 space-y-2">
                          {children.map((child) => (
                            <ObjectiveCard
                              key={child.id}
                              objective={child}
                              number={numbering[child.id] || ""}
                              isChild
                              onOpen={handleOpenObjective}
                              onDragStart={handleDragStart}
                              onDropReorder={handleDropReorder}
                              onDropNest={handleDropNest}
                              dragSourceId={dragSourceId}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                <p className="text-[11px] text-muted-foreground mt-3 pl-1">
                  Drag near edges to reorder. Drag to center of a card to nest as sub-objective. Drop on empty area to un-nest.
                </p>
              </div>
            )}

            {/* ─── Source attribution footer ─────────────────────────────── */}
            {!isGenerating && objectives.length > 0 && (
              <>
                <Separator className="mt-5 mb-4" />
                <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-medium text-muted-foreground">Sources</span>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Info about sources"
                          >
                            <Info className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
                          <p>These modules contributed signals used to generate objectives.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {hasGenerated ? (
                      <>
                        {["Fact Base", "Risk Management", "Opportunity Tracker", "Supplier Matrix"].map((mod) => (
                          <Badge
                            key={mod}
                            variant="outline"
                            className="text-[10px] font-normal text-muted-foreground border-border bg-muted/30 px-2 py-0.5"
                          >
                            {mod}
                          </Badge>
                        ))}
                      </>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal text-muted-foreground border-border bg-muted/30 px-2 py-0.5"
                      >
                        Manual
                      </Badge>
                    )}
                  </div>

                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {hasGenerated && state.generatedAt
                      ? `Last generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} \u00B7 ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
                      : hasUserEdits
                        ? "Last edited: just now"
                        : ""}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>

      <ObjectiveDetailModal
        objective={selectedObjective}
        number={selectedObjective ? (numbering[selectedObjective.id] || "") : ""}
        open={modalOpen}
        onOpenChange={setModalOpen}
        stakeholders={stakeholders}
        allObjectives={objectives}
        onUpdate={handleUpdateObjective}
      />
    </>
  )
}
