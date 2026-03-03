"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Link2, Send, X, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  type Stakeholder,
  type StrategicObjective,
  buildNumberingMap,
} from "@/lib/strategic-objectives-data"

interface StakeholderTableProps {
  stakeholders: Stakeholder[]
  objectives: StrategicObjective[]
  /**
   * Called with the final desired state: which stakeholders should be assigned to
   * which objectives. The page is responsible for diffing vs current state to
   * add new assignments AND remove unchecked ones.
   */
  onSyncAssignments: (stakeholderIds: string[], objectiveIds: string[]) => void
  onRemove: (stakeholderId: string) => void
  onRequestValidation: (stakeholderIds: string[]) => void
}

export function StakeholderTable({
  stakeholders,
  objectives,
  onSyncAssignments,
  onRemove,
  onRequestValidation,
}: StakeholderTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignObjectives, setAssignObjectives] = useState<Set<string>>(new Set())
  const [assignIndeterminate, setAssignIndeterminate] = useState<Set<string>>(new Set())
  const [assignSearch, setAssignSearch] = useState("")
  const [validationOpen, setValidationOpen] = useState(false)

  const numbering = buildNumberingMap(objectives)

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

  // ─── Compute initial checked state when modal opens ────────────
  const openAssignModal = useCallback(() => {
    const selected = stakeholders.filter((s) => selectedRows.has(s.id))
    if (selected.length === 0) return

    const checked = new Set<string>()
    const indeterminate = new Set<string>()

    for (const obj of objectives) {
      const assignedCount = selected.filter((s) => s.assignedObjectiveIds.includes(obj.id)).length
      if (assignedCount === selected.length) {
        checked.add(obj.id)
      } else if (assignedCount > 0) {
        indeterminate.add(obj.id)
      }
    }

    setAssignObjectives(checked)
    setAssignIndeterminate(indeterminate)
    setAssignSearch("")
    setAssignOpen(true)
  }, [stakeholders, selectedRows, objectives])

  const handleAssignToggle = useCallback((objId: string) => {
    setAssignObjectives((prev) => {
      const next = new Set(prev)
      if (next.has(objId)) {
        next.delete(objId)
      } else {
        next.add(objId)
      }
      return next
    })
    // Clear indeterminate state when user explicitly toggles
    setAssignIndeterminate((prev) => {
      const next = new Set(prev)
      next.delete(objId)
      return next
    })
  }, [])

  const handleAssignConfirm = () => {
    // Sync assignments: checked objectives are the desired final state
    onSyncAssignments(Array.from(selectedRows), Array.from(assignObjectives))
    setAssignOpen(false)
    setAssignObjectives(new Set())
    setAssignIndeterminate(new Set())
    setAssignSearch("")
  }

  const handleValidationConfirm = () => {
    onRequestValidation(Array.from(selectedRows))
    setValidationOpen(false)
    setSelectedRows(new Set())
  }

  // Organize objectives into hierarchy for the assign modal
  const topLevel = objectives.filter((o) => o.parentId === null)
  const getChildren = (parentId: string) => objectives.filter((o) => o.parentId === parentId)

  const filteredTopLevel = assignSearch.trim()
    ? topLevel.filter((o) => {
        const q = assignSearch.toLowerCase()
        const children = getChildren(o.id)
        return (
          o.title.toLowerCase().includes(q) ||
          numbering[o.id]?.toLowerCase().includes(q) ||
          children.some((c) => c.title.toLowerCase().includes(q) || numbering[c.id]?.toLowerCase().includes(q))
        )
      })
    : topLevel

  // Count of newly toggled items (checked minus indeterminate that were not resolved)
  const assignCount = assignObjectives.size

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
            Assign to Objective
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedRows.size === 0}
            className="h-8 text-xs gap-1.5"
            onClick={() => setValidationOpen(true)}
          >
            <Send className="h-3.5 w-3.5" />
            Request Validation
          </Button>
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
              <TableHead className="text-xs font-semibold">Objectives Assigned</TableHead>
              <TableHead className="text-xs font-semibold w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stakeholders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                  Select stakeholders from the org chart or people directory above.
                </TableCell>
              </TableRow>
            ) : (
              stakeholders.map((s) => {
                const assignedObjs = objectives.filter((o) =>
                  s.assignedObjectiveIds.includes(o.id)
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
                        {assignedObjs.length > 0 ? (
                          assignedObjs.map((o) => (
                            <span
                              key={o.id}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-orange-200 bg-card text-[10px] font-bold text-orange-700"
                            >
                              {numbering[o.id] || o.id}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">None</span>
                        )}
                      </div>
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

      {/* ═══ FULL-SCREEN ASSIGN MODAL ═══════════════════════════════ */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-2xl p-0">
          <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-lg font-semibold">Assign to Objectives</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
              {selectedRows.size} stakeholder{selectedRows.size !== 1 ? "s" : ""} selected.
              Check objectives to assign, uncheck to remove.
            </DialogDescription>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter objectives..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </DialogHeader>

          {/* Scrollable objective list */}
          <div className="flex-1 overflow-y-auto px-6 pb-2">
            {filteredTopLevel.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {objectives.length === 0
                  ? "Generate objectives first to assign stakeholders."
                  : "No objectives match your filter."}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredTopLevel.map((obj) => {
                  const children = getChildren(obj.id)
                  const num = numbering[obj.id] || ""
                  const isChecked = assignObjectives.has(obj.id)
                  const isIndeterminate = !isChecked && assignIndeterminate.has(obj.id)

                  return (
                    <div key={obj.id}>
                      {/* Parent objective */}
                      <label className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 rounded-lg px-3 py-2.5 transition-colors">
                        <Checkbox
                          checked={isChecked ? true : isIndeterminate ? "indeterminate" : false}
                          onCheckedChange={() => handleAssignToggle(obj.id)}
                        />
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-card text-[10px] font-bold text-orange-700">
                          {num}
                        </span>
                        <span className="text-sm text-foreground leading-snug">{obj.title}</span>
                      </label>

                      {/* Sub-objectives */}
                      {children.map((child) => {
                        const childNum = numbering[child.id] || ""
                        const childChecked = assignObjectives.has(child.id)
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
                            <span className="text-sm text-foreground/80 leading-snug">{child.title}</span>
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
            <Button
              size="sm"
              onClick={handleAssignConfirm}
            >
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
              Send a validation request to the following stakeholders for their assigned objectives.
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
