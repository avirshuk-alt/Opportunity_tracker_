"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
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
  SEED_REQUIREMENTS,
  buildRequirementNumberingMap,
  type BusinessRequirement,
} from "@/lib/business-requirements-data"

import {
  ORG_TREE,
  ALL_STAKEHOLDERS,
  type Stakeholder,
} from "@/lib/strategic-objectives-data"

import { RequirementCard } from "@/components/business-requirements/requirement-card"
import { RequirementDetailModal } from "@/components/business-requirements/requirement-detail-modal"
import { OrgTree } from "@/components/strategic-objectives/org-tree"
import { PeopleDirectory } from "@/components/strategic-objectives/people-directory"
import { RequirementStakeholderTable } from "@/components/business-requirements/requirement-stakeholder-table"

// ─── New Requirement Template ──────────────────────────────────────
function makeBlankRequirement(index: number): BusinessRequirement {
  const now = new Date().toISOString()
  return {
    id: `req-new-${Date.now()}-${index}`,
    parentId: null,
    name: "",
    statement: "",
    category: "Operations",
    priority: "Medium",
    timeHorizon: "Mid-term",
    status: "Draft",
    assignedStakeholders: [],
    comments: [],
    versionHistory: [
      {
        version: 1,
        timestamp: now,
        editor: "Sarah Mitchell",
        changeLog: "Created manually",
      },
    ],
    currentVersion: 1,
    lastEditedAt: now,
    lastEditedBy: "Sarah Mitchell",
  }
}

export default function StakeholderStrategyBusinessRequirementsPage() {
  // ─── State ─────────────────────────────────────────────────────
  const [requirements, setRequirements] = useState<BusinessRequirement[]>([])
  const [generating, setGenerating] = useState(false)
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [dragSourceId, setDragSourceId] = useState<string | null>(null)

  // Stakeholder state
  const [selectedStakeholderIds, setSelectedStakeholderIds] = useState<Set<string>>(new Set())
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])

  // Sections
  const [requirementsExpanded, setRequirementsExpanded] = useState(true)
  const [alignmentExpanded, setAlignmentExpanded] = useState(true)

  // View toggle
  const [stakeholderView, setStakeholderView] = useState<"orgchart" | "directory">("orgchart")

  // Mounted guard
  const mountedRef = useRef(true)
  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  // ─── Numbering map ─────────────────────────────────────────────
  const numbering = buildRequirementNumberingMap(requirements)

  // ─── Generate Requirements ─────────────────────────────────────
  const handleGenerate = useCallback(() => {
    setGenerating(true)
    setTimeout(() => {
      if (!mountedRef.current) return
      setRequirements(SEED_REQUIREMENTS)
      setGenerating(false)
      toast.success("Generated 7 business requirements from insights")
    }, 1200)
  }, [])

  // ─── Add blank requirement ─────────────────────────────────────
  const handleAddRequirement = useCallback(() => {
    const topLevel = requirements.filter((r) => r.parentId === null)
    setRequirements((prev) => [...prev, makeBlankRequirement(topLevel.length + 1)])
  }, [requirements])

  // ─── Open detail modal ─────────────────────────────────────────
  const handleOpenRequirement = useCallback((id: string) => {
    setSelectedRequirementId(id)
    setModalOpen(true)
  }, [])

  // ─── Update requirement ────────────────────────────────────────
  const handleUpdateRequirement = useCallback((id: string, updates: Partial<BusinessRequirement>) => {
    setRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )
  }, [])

  // ─── Request Validation (from modal) ───────────────────────────
  const handleRequestValidationForRequirement = useCallback((requirementId: string) => {
    const now = new Date().toISOString()
    setRequirements((prev) =>
      prev.map((r) => {
        if (r.id !== requirementId) return r
        const updatedStakeholders = r.assignedStakeholders.map((s) =>
          s.validationStatus === "Approved" || s.validationStatus === "Revision Requested"
            ? s
            : { ...s, validationStatus: "Validation Requested" as const, timestamp: now }
        )
        return {
          ...r,
          status: r.status === "Draft" ? "Under Review" : r.status,
          assignedStakeholders: updatedStakeholders,
        } as BusinessRequirement
      })
    )
    // Also update stakeholder-level
    setStakeholders((prev) => {
      const req = requirements.find((r) => r.id === requirementId)
      if (!req) return prev
      const stakeholderIds = req.assignedStakeholders.map((s) => s.stakeholderId)
      return prev.map((s) =>
        stakeholderIds.includes(s.id) ? { ...s, validationStatus: "Pending" as const } : s
      )
    })
    toast.success("Validation request sent to all assigned stakeholders")
  }, [requirements])

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
      setRequirements((prev) => {
        const arr = [...prev]
        const srcIdx = arr.findIndex((r) => r.id === sourceId)
        const tgtIdx = arr.findIndex((r) => r.id === targetId)
        if (srcIdx === -1 || tgtIdx === -1) return prev
        const target = arr[tgtIdx]
        const [removed] = arr.splice(srcIdx, 1)
        removed.parentId = target.parentId
        const newTgtIdx = arr.findIndex((r) => r.id === targetId)
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
      setRequirements((prev) => {
        const target = prev.find((r) => r.id === targetId)
        if (!target) return prev
        if (target.parentId !== null) return prev
        return prev.map((r) =>
          r.id === sourceId ? { ...r, parentId: targetId } : r
        )
      })
    },
    []
  )

  const handleDropOnTopLevel = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragSourceId((prev) => {
      if (!prev) return null
      setRequirements((reqs) => {
        const source = reqs.find((r) => r.id === prev)
        if (!source || source.parentId === null) return reqs
        return reqs.map((r) =>
          r.id === prev ? { ...r, parentId: null } : r
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

  // ─── Sync assignments ──────────────────────────────────────────
  const handleSyncAssignments = useCallback(
    (stakeholderIds: string[], requirementIds: string[]) => {
      const reqSet = new Set(requirementIds)

      setStakeholders((prev) =>
        prev.map((s) => {
          if (!stakeholderIds.includes(s.id)) return s
          const existingOther = s.assignedObjectiveIds.filter(
            (rid) => !requirements.some((r) => r.id === rid)
          )
          return {
            ...s,
            assignedObjectiveIds: [...existingOther, ...requirementIds],
          }
        })
      )

      setRequirements((prev) =>
        prev.map((r) => {
          const shouldBeAssigned = reqSet.has(r.id)
          const currentStakeIds = new Set(r.assignedStakeholders.map((s) => s.stakeholderId))

          if (shouldBeAssigned) {
            const newStakeholders = [...r.assignedStakeholders]
            for (const sid of stakeholderIds) {
              if (!currentStakeIds.has(sid)) {
                const match = ALL_STAKEHOLDERS.find((st) => st.id === sid)
                if (match) {
                  newStakeholders.push({
                    stakeholderId: sid,
                    name: match.name,
                    jobTitle: match.title,
                    role: "Consulted",
                    validationStatus: "Pending",
                    timestamp: "",
                  })
                }
              }
            }
            return { ...r, assignedStakeholders: newStakeholders }
          } else {
            return {
              ...r,
              assignedStakeholders: r.assignedStakeholders.filter(
                (s) => !stakeholderIds.includes(s.stakeholderId)
              ),
            }
          }
        })
      )

      toast.success(`Updated assignments for ${stakeholderIds.length} stakeholder(s) across ${requirementIds.length} requirement(s)`)
    },
    [requirements]
  )

  // ─── Remove stakeholder ────────────────────────────────────────
  const handleRemoveStakeholder = useCallback((id: string) => {
    setSelectedStakeholderIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setStakeholders((prev) => prev.filter((s) => s.id !== id))
    setRequirements((prev) =>
      prev.map((r) => ({
        ...r,
        assignedStakeholders: r.assignedStakeholders.filter(
          (s) => s.stakeholderId !== id
        ),
      }))
    )
  }, [])

  // ─── Request Validation (from table) ───────────────────────────
  const handleRequestValidation = useCallback((stakeholderIds: string[]) => {
    const now = new Date().toISOString()
    // Update stakeholder-level status
    setStakeholders((prev) =>
      prev.map((s) =>
        stakeholderIds.includes(s.id) ? { ...s, validationStatus: "Pending" as const } : s
      )
    )
    // Update requirement-level stakeholder statuses
    setRequirements((prev) =>
      prev.map((r) => ({
        ...r,
        assignedStakeholders: r.assignedStakeholders.map((s) =>
          stakeholderIds.includes(s.stakeholderId) &&
          s.validationStatus !== "Approved" &&
          s.validationStatus !== "Revision Requested"
            ? { ...s, validationStatus: "Validation Requested" as const, timestamp: now }
            : s
        ),
      }))
    )
    toast.success(`Validation request sent to ${stakeholderIds.length} stakeholder(s)`)
  }, [])

  // ─── Organize for display ─────────────────────────────────────
  const topLevel = requirements.filter((r) => r.parentId === null)
  const getChildren = (parentId: string) => requirements.filter((r) => r.parentId === parentId)
  const selectedRequirement = requirements.find((r) => r.id === selectedRequirementId) || null

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Stakeholder Strategy & Business Requirements" },
        ]}
        title="Stakeholder Strategy & Business Requirements"
        description="Translate insights into structured business requirements and validate alignment."
      />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: BUSINESS REQUIREMENTS
          ═══════════════════════════════════════════════════════════ */}
      <Card className="rounded-2xl border border-border shadow-sm">
        <CardHeader
          className="cursor-pointer select-none px-6 py-5"
          onClick={() => setRequirementsExpanded((v) => !v)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {requirementsExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <CardTitle className="text-base font-semibold">Business Requirements</CardTitle>
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
                {generating ? "Generating..." : "Generate Requirements from Insights"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleAddRequirement}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Requirement
              </Button>
            </div>
          </div>
        </CardHeader>

        {requirementsExpanded && (
          <CardContent className="px-6 pb-6 pt-0">
            {requirements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 border border-orange-100 mb-4">
                  <FileText className="h-7 w-7 text-orange-400" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">No requirements defined yet</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Click &quot;Generate Requirements from Insights&quot; to auto-create structured business requirements from your category data, or add one manually.
                </p>
              </div>
            ) : (
              <div
                className="space-y-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropOnTopLevel}
                onDragEnd={handleDragEnd}
              >
                {topLevel.map((req) => {
                  const children = getChildren(req.id)
                  return (
                    <div key={req.id}>
                      <RequirementCard
                        requirement={req}
                        number={numbering[req.id] || ""}
                        onOpen={handleOpenRequirement}
                        onDragStart={handleDragStart}
                        onDropReorder={handleDropReorder}
                        onDropNest={handleDropNest}
                        dragSourceId={dragSourceId}
                      />
                      {children.length > 0 && (
                        <div className="ml-4 pl-4 border-l-2 border-border mt-2 space-y-2">
                          {children.map((child) => (
                            <RequirementCard
                              key={child.id}
                              requirement={child}
                              number={numbering[child.id] || ""}
                              isChild
                              onOpen={handleOpenRequirement}
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
                  Drag near edges to reorder. Drag to center of a card to nest as sub-requirement. Drop on empty area to un-nest.
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: STAKEHOLDER ALIGNMENT (unchanged behavior)
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
                Who must align to these requirements?
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {alignmentExpanded && (
          <CardContent className="px-6 pb-6 pt-0 space-y-6">
            {/* Toggle: Org Chart / People Directory */}
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

            {/* Category Stakeholders Table */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Category Stakeholders</h3>
              </div>
              <RequirementStakeholderTable
                stakeholders={stakeholders}
                requirements={requirements}
                onSyncAssignments={handleSyncAssignments}
                onRemove={handleRemoveStakeholder}
                onRequestValidation={handleRequestValidation}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Detail Modal */}
      <RequirementDetailModal
        requirement={selectedRequirement}
        number={selectedRequirement ? (numbering[selectedRequirement.id] || "") : ""}
        open={modalOpen}
        onOpenChange={setModalOpen}
        allRequirements={requirements}
        onUpdate={handleUpdateRequirement}
      />
    </div>
  )
}
