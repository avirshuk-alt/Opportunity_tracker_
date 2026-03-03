"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Target,
  Plus,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronRight,
  Users,
  Network,
  BookUser,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import {
  SEED_OBJECTIVES,
  ORG_TREE,
  ALL_STAKEHOLDERS,
  buildNumberingMap,
  type StrategicObjective,
  type Stakeholder,
} from "@/lib/strategic-objectives-data"

import { ObjectiveCard } from "@/components/strategic-objectives/objective-card"
import { ObjectiveDetailModal } from "@/components/strategic-objectives/objective-detail-modal"
import { OrgTree } from "@/components/strategic-objectives/org-tree"
import { PeopleDirectory } from "@/components/strategic-objectives/people-directory"
import { StakeholderTable } from "@/components/strategic-objectives/stakeholder-table"

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

/**
 * Full Strategic Objectives module — extracted so it can be embedded
 * inside the Strategy Workspace page. Preserves ALL interactions identically.
 */
export function ObjectivesModule() {
  // ─── State ─────────────────────────────────────────────────────
  const [objectives, setObjectives] = useState<StrategicObjective[]>([])
  const [generating, setGenerating] = useState(false)
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [dragSourceId, setDragSourceId] = useState<string | null>(null)

  const [selectedStakeholderIds, setSelectedStakeholderIds] = useState<Set<string>>(new Set())
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])

  const [objectivesExpanded, setObjectivesExpanded] = useState(true)
  const [alignmentExpanded, setAlignmentExpanded] = useState(true)
  const [stakeholderView, setStakeholderView] = useState<"orgchart" | "directory">("orgchart")

  const mountedRef = useRef(true)
  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  const numbering = buildNumberingMap(objectives)

  // ─── Generate Objectives ───────────────────────────────────────
  const handleGenerate = useCallback(() => {
    setGenerating(true)
    setTimeout(() => {
      if (!mountedRef.current) return
      setObjectives(SEED_OBJECTIVES)
      setGenerating(false)
      toast.success("Generated 6 strategic objectives from insights")
    }, 1200)
  }, [])

  const handleAddObjective = useCallback(() => {
    const topLevel = objectives.filter((o) => o.parentId === null)
    setObjectives((prev) => [...prev, makeBlankObjective(topLevel.length + 1)])
  }, [objectives])

  const handleOpenObjective = useCallback((id: string) => {
    setSelectedObjectiveId(id)
    setModalOpen(true)
  }, [])

  const handleUpdateObjective = useCallback((id: string, updates: Partial<StrategicObjective>) => {
    setObjectives((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    )
  }, [])

  // ─── Drag & Drop ────────────────────────────────────────────────
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
      return null
    })
  }, [])

  // ─── Stakeholder toggle ────────────────────────────────────────
  const handleToggleStakeholder = useCallback((id: string) => {
    setSelectedStakeholderIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setStakeholders((s) => s.filter((sh) => sh.id !== id))
      } else {
        next.add(id)
        setStakeholders((s) => {
          if (s.some((sh) => sh.id === id)) return s
          const match = ALL_STAKEHOLDERS.find((st) => st.id === id)
          if (match) return [...s, { ...match }]
          return s
        })
      }
      return next
    })
  }, [])

  const handleSyncAssignments = useCallback(
    (stakeholderIds: string[], objectiveIds: string[]) => {
      const objSet = new Set(objectiveIds)

      setStakeholders((prev) =>
        prev.map((s) => {
          if (!stakeholderIds.includes(s.id)) return s
          const existingOther = s.assignedObjectiveIds.filter(
            (oid) => !objectives.some((o) => o.id === oid)
          )
          return {
            ...s,
            assignedObjectiveIds: [...existingOther, ...objectiveIds],
          }
        })
      )

      setObjectives((prev) =>
        prev.map((o) => {
          const shouldBeAssigned = objSet.has(o.id)
          const currentStakeIds = new Set(o.assignedStakeholderIds)

          if (shouldBeAssigned) {
            for (const sid of stakeholderIds) {
              currentStakeIds.add(sid)
            }
          } else {
            for (const sid of stakeholderIds) {
              currentStakeIds.delete(sid)
            }
          }
          return { ...o, assignedStakeholderIds: Array.from(currentStakeIds) }
        })
      )

      const added = objectiveIds.length
      toast.success(`Updated assignments for ${stakeholderIds.length} stakeholder(s) across ${added} objective(s)`)
    },
    [objectives]
  )

  const handleRemoveStakeholder = useCallback((id: string) => {
    setSelectedStakeholderIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setStakeholders((prev) => prev.filter((s) => s.id !== id))
    setObjectives((prev) =>
      prev.map((o) => ({
        ...o,
        assignedStakeholderIds: o.assignedStakeholderIds.filter((sid) => sid !== id),
      }))
    )
  }, [])

  const handleRequestValidation = useCallback((stakeholderIds: string[]) => {
    setStakeholders((prev) =>
      prev.map((s) =>
        stakeholderIds.includes(s.id) ? { ...s, validationStatus: "Pending" as const } : s
      )
    )
    toast.success(`Validation request sent to ${stakeholderIds.length} stakeholder(s)`)
  }, [])

  // ─── Organize objectives for display ───────────────────────────
  const topLevel = objectives.filter((o) => o.parentId === null)
  const getChildren = (parentId: string) => objectives.filter((o) => o.parentId === parentId)
  const selectedObjective = objectives.find((o) => o.id === selectedObjectiveId) || null

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════════════
          SECTION: STRATEGIC OBJECTIVES
          ═══════════════════════════════════════════════════════════ */}
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
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {generating ? "Generating..." : "Generate from Insights"}
              </Button>
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
            {objectives.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 border border-orange-100 mb-4">
                  <Target className="h-7 w-7 text-orange-400" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">No objectives defined yet</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Click &quot;Generate from Insights&quot; to auto-create structured objectives from your category data, or add one manually.
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
          </CardContent>
        )}
      </Card>

      {/* ═══════════════════════════════════════════════════════════
          SECTION: STAKEHOLDER ALIGNMENT
          ═══════════════════════════════════════════════════════════ */}
      <Card className="rounded-2xl border border-border shadow-sm">
        <CardHeader
          className="cursor-pointer select-none px-6 py-5"
          onClick={() => setAlignmentExpanded((v) => !v)}
        >
          <div className="flex items-center gap-3">
            {alignmentExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-base font-semibold">Stakeholder Alignment</CardTitle>
              <CardDescription className="text-sm mt-0.5">
                Who must align to these objectives?
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {alignmentExpanded && (
          <CardContent className="px-6 pb-6 pt-0 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {stakeholderView === "orgchart" ? "Organization Chart" : "People Directory"}
                  </h3>
                  <Badge variant="outline" className="text-[10px] ml-1">
                    Click to select
                  </Badge>
                </div>
                <div className="flex items-center rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setStakeholderView("orgchart")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                      stakeholderView === "orgchart"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    <Network className="h-3.5 w-3.5" />
                    Org Chart
                  </button>
                  <button
                    onClick={() => setStakeholderView("directory")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                      stakeholderView === "directory"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    <BookUser className="h-3.5 w-3.5" />
                    People Directory
                  </button>
                </div>
              </div>

              {stakeholderView === "orgchart" ? (
                <OrgTree
                  root={ORG_TREE}
                  selectedIds={selectedStakeholderIds}
                  onToggle={handleToggleStakeholder}
                />
              ) : (
                <PeopleDirectory
                  selectedIds={selectedStakeholderIds}
                  onToggle={handleToggleStakeholder}
                />
              )}
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Category Stakeholders</h3>
              </div>
              <StakeholderTable
                stakeholders={stakeholders}
                objectives={objectives}
                onSyncAssignments={handleSyncAssignments}
                onRemove={handleRemoveStakeholder}
                onRequestValidation={handleRequestValidation}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Detail Modal */}
      <ObjectiveDetailModal
        objective={selectedObjective}
        number={selectedObjective ? (numbering[selectedObjective.id] || "") : ""}
        open={modalOpen}
        onOpenChange={setModalOpen}
        stakeholders={stakeholders}
        allObjectives={objectives}
        onUpdate={handleUpdateObjective}
      />
    </div>
  )
}
