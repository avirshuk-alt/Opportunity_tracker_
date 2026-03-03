"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Link2, Send, X, Search, Clock, CheckCircle2, AlertTriangle, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  type Stakeholder,
  type ValidationStatus,
} from "@/lib/strategic-objectives-data"
import type { BusinessRequirement } from "@/lib/business-requirements-data"
import { buildRequirementNumberingMap } from "@/lib/business-requirements-data"

interface RequirementStakeholderTableProps {
  stakeholders: Stakeholder[]
  requirements: BusinessRequirement[]
  onSyncAssignments: (stakeholderIds: string[], requirementIds: string[]) => void
  onRemove: (stakeholderId: string) => void
  onRequestValidation: (stakeholderIds: string[]) => void
}

export function RequirementStakeholderTable({
  stakeholders,
  requirements,
  onSyncAssignments,
  onRemove,
  onRequestValidation,
}: RequirementStakeholderTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignRequirements, setAssignRequirements] = useState<Set<string>>(new Set())
  const [assignIndeterminate, setAssignIndeterminate] = useState<Set<string>>(new Set())
  const [assignSearch, setAssignSearch] = useState("")
  const [validationOpen, setValidationOpen] = useState(false)

  const numbering = buildRequirementNumberingMap(requirements)

  const allSelected = stakeholders.length > 0 && selectedRows.size === stakeholders.length
  const someSelected = selectedRows.size > 0 && selectedRows.size < stakeholders.length

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllRows = () => {
    if (allSelected) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(stakeholders.map((s) => s.id)))
    }
  }

  const openAssignModal = useCallback(() => {
    const selected = stakeholders.filter((s) => selectedRows.has(s.id))
    if (selected.length === 0) return

    const checked = new Set<string>()
    const indeterminate = new Set<string>()

    for (const req of requirements) {
      const assignedCount = selected.filter((s) =>
        s.assignedObjectiveIds.includes(req.id)
      ).length
      if (assignedCount === selected.length) {
        checked.add(req.id)
      } else if (assignedCount > 0) {
        indeterminate.add(req.id)
      }
    }

    setAssignRequirements(checked)
    setAssignIndeterminate(indeterminate)
    setAssignSearch("")
    setAssignOpen(true)
  }, [stakeholders, selectedRows, requirements])

  const handleAssignToggle = useCallback((reqId: string) => {
    setAssignRequirements((prev) => {
      const next = new Set(prev)
      if (next.has(reqId)) next.delete(reqId)
      else next.add(reqId)
      return next
    })
    setAssignIndeterminate((prev) => {
      const next = new Set(prev)
      next.delete(reqId)
      return next
    })
  }, [])

  const handleAssignConfirm = () => {
    onSyncAssignments(Array.from(selectedRows), Array.from(assignRequirements))
    setAssignOpen(false)
    setAssignRequirements(new Set())
    setAssignIndeterminate(new Set())
    setAssignSearch("")
  }

  const handleValidationConfirm = () => {
    onRequestValidation(Array.from(selectedRows))
    setValidationOpen(false)
    setSelectedRows(new Set())
  }

  const topLevel = requirements.filter((r) => r.parentId === null)
  const getChildren = (parentId: string) => requirements.filter((r) => r.parentId === parentId)

  const filteredTopLevel = assignSearch.trim()
    ? topLevel.filter((r) => {
        const q = assignSearch.toLowerCase()
        const children = getChildren(r.id)
        return (
          r.statement.toLowerCase().includes(q) ||
          numbering[r.id]?.toLowerCase().includes(q) ||
          children.some((c) => c.statement.toLowerCase().includes(q) || numbering[c.id]?.toLowerCase().includes(q))
        )
      })
    : topLevel

  const assignCount = assignRequirements.size

  // Smart validation button logic
  const selectedStakeholdersList = stakeholders.filter((s) => selectedRows.has(s.id))
  const terminalStates = new Set(["Pending", "Approved", "Revision Requested"])
  const alreadyRequestedCount = selectedStakeholdersList.filter((s) =>
    terminalStates.has(s.validationStatus ?? "")
  ).length
  const allSelectedTerminal = selectedStakeholdersList.length > 0 && alreadyRequestedCount === selectedStakeholdersList.length
  const someAlreadyRequested = alreadyRequestedCount > 0 && alreadyRequestedCount < selectedStakeholdersList.length
  const validationButtonDisabled = selectedRows.size === 0 || allSelectedTerminal

  // Compute per-stakeholder validation display status based on requirement assignments
  function getStakeholderValidationDisplay(s: Stakeholder): {
    label: string
    color: string
    icon: React.ReactNode
  } {
    // Check across all requirements this stakeholder is assigned to
    const assignedReqs = requirements.filter((r) =>
      r.assignedStakeholders.some((rs) => rs.stakeholderId === s.id)
    )
    if (assignedReqs.length === 0) {
      return { label: "Not requested", color: "text-muted-foreground", icon: <Clock className="h-3 w-3 text-muted-foreground" /> }
    }

    const statuses = assignedReqs.flatMap((r) =>
      r.assignedStakeholders.filter((rs) => rs.stakeholderId === s.id).map((rs) => rs.validationStatus)
    )

    if (statuses.some((st) => st === "Approved")) {
      return { label: "Approved", color: "text-emerald-700", icon: <CheckCircle2 className="h-3 w-3 text-emerald-600" /> }
    }
    if (statuses.some((st) => st === "Revision Requested")) {
      return { label: "Revision requested", color: "text-red-700", icon: <AlertTriangle className="h-3 w-3 text-red-500" /> }
    }
    if (statuses.some((st) => st === "Commented")) {
      return { label: "Commented", color: "text-blue-700", icon: <MessageSquare className="h-3 w-3 text-blue-500" /> }
    }
    if (statuses.some((st) => st === "Validation Requested")) {
      return { label: "Validation requested", color: "text-amber-700", icon: <Clock className="h-3 w-3 text-amber-500" /> }
    }
    if (s.validationStatus === "Pending") {
      return { label: "Validation requested", color: "text-amber-700", icon: <Clock className="h-3 w-3 text-amber-500" /> }
    }
    return { label: "Not requested", color: "text-muted-foreground", icon: <Clock className="h-3 w-3 text-muted-foreground" /> }
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {stakeholders.length} stakeholder{stakeholders.length !== 1 ? "s" : ""} selected
          </p>
          {allSelected && stakeholders.length > 0 && (
            <Badge variant="outline" className="text-[10px] bg-orange-50 text-primary border-orange-200">
              All stakeholders selected
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={selectedRows.size === 0}
            className="h-8 text-xs gap-1.5"
            onClick={openAssignModal}
          >
            <Link2 className="h-3.5 w-3.5" />
            Assign to Requirement
          </Button>
          <div className="flex flex-col items-end gap-0.5">
            <Button
              variant="outline"
              size="sm"
              disabled={validationButtonDisabled}
              className="h-8 text-xs gap-1.5"
              onClick={() => setValidationOpen(true)}
            >
              <Send className="h-3.5 w-3.5" />
              Request Validation
            </Button>
            {someAlreadyRequested && (
              <span className="text-[10px] text-muted-foreground">
                Validation already requested for {alreadyRequestedCount} of {selectedStakeholdersList.length} selected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 min-w-[48px] text-center">
                <div className="flex items-center justify-center w-full">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAllRows}
                  />
                </div>
              </TableHead>
              <TableHead className="text-xs font-semibold">Name</TableHead>
              <TableHead className="text-xs font-semibold">Email</TableHead>
              <TableHead className="text-xs font-semibold">Department</TableHead>
              <TableHead className="text-xs font-semibold">Requirements Assigned</TableHead>
              <TableHead className="text-xs font-semibold">Validation</TableHead>
              <TableHead className="text-xs font-semibold w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stakeholders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                  Select stakeholders from the org chart or people directory above.
                </TableCell>
              </TableRow>
            ) : (
              stakeholders.map((s) => {
                const assignedReqs = requirements.filter((r) =>
                  s.assignedObjectiveIds.includes(r.id)
                )
                return (
                  <TableRow key={s.id} className={cn(selectedRows.has(s.id) && "bg-orange-50/50")}>
                    <TableCell className="w-12 min-w-[48px] text-center">
                      <div className="flex items-center justify-center w-full">
                        <Checkbox
                          checked={selectedRows.has(s.id)}
                          onCheckedChange={() => toggleRow(s.id)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {s.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">{s.name}</span>
                          <p className="text-[10px] text-muted-foreground">{s.title}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.department}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {assignedReqs.length > 0 ? (
                          assignedReqs.map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-orange-200 bg-card text-[10px] font-bold text-orange-700"
                            >
                              {numbering[r.id] || r.id}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const display = getStakeholderValidationDisplay(s)
                        return (
                          <div className="flex items-center gap-1.5">
                            {display.icon}
                            <span className={cn("text-xs font-medium", display.color)}>
                              {display.label}
                            </span>
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-orange-50"
                        onClick={() => onRemove(s.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span className="sr-only">Remove stakeholder</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-2xl p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-lg font-semibold">Assign to Requirements</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {selectedRows.size} stakeholder{selectedRows.size !== 1 ? "s" : ""} selected.
              Check requirements to assign, uncheck to remove.
            </DialogDescription>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter requirements..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-2">
            {filteredTopLevel.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {requirements.length === 0
                  ? "Generate requirements first to assign stakeholders."
                  : "No requirements match your filter."}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredTopLevel.map((req) => {
                  const children = getChildren(req.id)
                  const num = numbering[req.id] || ""
                  const isChecked = assignRequirements.has(req.id)
                  const isIndeterminate = !isChecked && assignIndeterminate.has(req.id)

                  return (
                    <div key={req.id}>
                      <label className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 rounded-lg px-3 py-2.5 transition-colors">
                        <Checkbox
                          checked={isChecked ? true : isIndeterminate ? "indeterminate" : false}
                          onCheckedChange={() => handleAssignToggle(req.id)}
                        />
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-card text-[10px] font-bold text-orange-700">
                          {num}
                        </span>
                        <span className="text-sm text-foreground leading-snug line-clamp-2">{req.statement}</span>
                      </label>

                      {children.map((child) => {
                        const childNum = numbering[child.id] || ""
                        const childChecked = assignRequirements.has(child.id)
                        const childIndeterminate = !childChecked && assignIndeterminate.has(child.id)
                        return (
                          <label
                            key={child.id}
                            className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 rounded-lg px-3 py-2 ml-8 transition-colors"
                          >
                            <Checkbox
                              checked={childChecked ? true : childIndeterminate ? "indeterminate" : false}
                              onCheckedChange={() => handleAssignToggle(child.id)}
                            />
                            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-muted-foreground/20 bg-card text-[10px] font-bold text-muted-foreground">
                              {childNum}
                            </span>
                            <span className="text-sm text-foreground/80 leading-snug line-clamp-2">{child.statement}</span>
                          </label>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAssignConfirm}>
              Assign ({assignCount})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Dialog */}
      <Dialog open={validationOpen} onOpenChange={setValidationOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Request Stakeholder Validation</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Send a validation request to the following stakeholders for their assigned requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {stakeholders
              .filter((s) => selectedRows.has(s.id))
              .map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {s.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{s.department}</span>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setValidationOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleValidationConfirm}>
              Send Validation Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
