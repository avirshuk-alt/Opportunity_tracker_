"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  Users,
  Pencil,
  Check,
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoreHorizontal,
  Trash2,
  RotateCcw,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type {
  BusinessRequirement,
  CommentEntry,
} from "@/lib/business-requirements-data"
import {
  REQUIREMENT_CATEGORY_COLORS,
  REQUIREMENT_PRIORITY_COLORS,
  STATUS_COLORS,
  TIME_HORIZON_COLORS,
  getAlignmentInfo,
  buildRequirementNumberingMap,
} from "@/lib/business-requirements-data"

interface RequirementDetailModalProps {
  requirement: BusinessRequirement | null
  number: string
  open: boolean
  onOpenChange: (open: boolean) => void
  allRequirements: BusinessRequirement[]
  onUpdate: (id: string, updates: Partial<BusinessRequirement>) => void
}

/* ─── Validation Status Icon ──────────────────────────────── */
function ValidationIcon({ status }: { status: string }) {
  if (status === "Approved") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
  if (status === "Revision Requested") return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
  if (status === "Commented") return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
  if (status === "Validation Requested") return <Clock className="h-3.5 w-3.5 text-amber-500" />
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
}

function getValidationLabel(status: string, hasTimestamp: boolean): string {
  if (status === "Approved") return "Approved"
  if (status === "Revision Requested") return "Revision requested"
  if (status === "Commented") return "Commented"
  if (status === "Validation Requested") return "Validation requested"
  if (hasTimestamp) return "Validation requested"
  return "No request sent"
}

function getValidationColor(status: string, hasTimestamp: boolean): string {
  if (status === "Approved") return "text-emerald-700"
  if (status === "Revision Requested") return "text-red-700"
  if (status === "Commented") return "text-blue-700"
  if (status === "Validation Requested") return "text-amber-700"
  if (hasTimestamp) return "text-amber-700"
  return "text-muted-foreground"
}

/* ─── Main Modal ──────────────────────────────────────────── */
export function RequirementDetailModal({
  requirement,
  number,
  open,
  onOpenChange,
  allRequirements,
  onUpdate,
}: RequirementDetailModalProps) {
  const [editingStatement, setEditingStatement] = useState(false)
  const [statementDraft, setStatementDraft] = useState("")
  const [showComments, setShowComments] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentDraft, setEditCommentDraft] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showResolved, setShowResolved] = useState(false)

  if (!requirement) return null

  const catColor = REQUIREMENT_CATEGORY_COLORS[requirement.category]
  const priColor = REQUIREMENT_PRIORITY_COLORS[requirement.priority]
  const statusColor = STATUS_COLORS[requirement.status]
  const horizonColor = TIME_HORIZON_COLORS[requirement.timeHorizon]
  const alignment = getAlignmentInfo(requirement)
  const numbering = buildRequirementNumberingMap(allRequirements)
  const subRequirements = allRequirements.filter((r) => r.parentId === requirement.id)

  // Derive display name
  const displayName = requirement.name || requirement.statement.split(/\s+/).slice(0, 8).join(" ") + (requirement.statement.split(/\s+/).length > 8 ? "..." : "")

  const handleSaveStatement = () => {
    if (statementDraft.trim()) {
      const now = new Date().toISOString()
      onUpdate(requirement.id, {
        statement: statementDraft.trim(),
        lastEditedAt: now,
        lastEditedBy: "Sarah Mitchell",
      })
      toast.success("Requirement updated")
    }
    setEditingStatement(false)
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    const comment: CommentEntry = {
      id: `c-${Date.now()}`,
      author: "Sarah Mitchell",
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
    }
    // Update the stakeholder validation status to "Commented" if they had "Validation Requested"
    const updatedStakeholders = requirement.assignedStakeholders.map((s) => {
      if (s.name === "Sarah Mitchell" && (s.validationStatus === "Validation Requested" || s.validationStatus === "Pending")) {
        return { ...s, validationStatus: "Commented" as const }
      }
      return s
    })
    onUpdate(requirement.id, {
      comments: [...requirement.comments, comment],
      assignedStakeholders: updatedStakeholders,
    })
    setNewComment("")
    toast.success("Comment added")
  }

  const handleEditComment = (commentId: string) => {
    if (!editCommentDraft.trim()) return
    const now = new Date().toISOString()
    onUpdate(requirement.id, {
      comments: requirement.comments.map((c) =>
        c.id === commentId ? { ...c, text: editCommentDraft.trim(), edited: true, editedAt: now } : c
      ),
    })
    setEditingCommentId(null)
    setEditCommentDraft("")
    toast.success("Comment updated")
  }

  const handleDeleteComment = (commentId: string) => {
    onUpdate(requirement.id, {
      comments: requirement.comments.filter((c) => c.id !== commentId),
    })
    setDeleteConfirmId(null)
    toast.success("Comment deleted")
  }

  const handleResolveComment = (commentId: string) => {
    onUpdate(requirement.id, {
      comments: requirement.comments.map((c) =>
        c.id === commentId ? { ...c, resolved: !c.resolved } : c
      ),
    })
  }

  const formatTimestamp = (ts: string) => {
    if (!ts) return "N/A"
    try {
      return new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return ts
    }
  }

  const activeComments = requirement.comments.filter((c) => !c.resolved)
  const resolvedComments = requirement.comments.filter((c) => c.resolved)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[980px] w-[95vw] max-h-[88vh] overflow-y-auto overflow-x-hidden rounded-2xl p-0">
        {/* ─── Header ─────────────────────────────────────────── */}
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-orange-200 bg-card">
              <span className="text-sm font-bold text-orange-600">{number}</span>
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold text-foreground leading-snug text-balance">
                {displayName}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Details for requirement {number}
              </DialogDescription>
              {/* Last edited instead of version */}
              {requirement.lastEditedAt && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Last edited: {formatTimestamp(requirement.lastEditedAt)}
                  {requirement.lastEditedBy ? ` by ${requirement.lastEditedBy}` : ""}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className={cn("text-[10px] font-medium px-2 py-0.5", catColor.bg, catColor.text, catColor.border)}>
                  {requirement.category}
                </Badge>
                <Badge variant="outline" className={cn("text-[10px] font-medium px-2 py-0.5", priColor.bg, priColor.text)}>
                  {requirement.priority} Priority
                </Badge>
                <Badge variant="outline" className={cn("text-[10px] font-medium px-2 py-0.5", horizonColor.bg, horizonColor.text)}>
                  {requirement.timeHorizon}
                </Badge>
                <Badge variant="outline" className={cn("text-[10px] font-medium px-2 py-0.5", statusColor.bg, statusColor.text, statusColor.border)}>
                  {requirement.status}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent mx-6" />

        {/* ─── Body ───────────────────────────────────────────── */}
        <div className="p-6 space-y-5">
          {/* ─── Requirement Statement ────────────────────────── */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="h-0.5 bg-orange-400" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Requirement Statement</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-primary hover:bg-orange-50"
                  onClick={() => {
                    if (editingStatement) {
                      handleSaveStatement()
                    } else {
                      setStatementDraft(requirement.statement)
                      setEditingStatement(true)
                    }
                  }}
                >
                  {editingStatement ? (
                    <><Check className="mr-1 h-3 w-3" /> Save</>
                  ) : (
                    <><Pencil className="mr-1 h-3 w-3" /> Edit</>
                  )}
                </Button>
              </div>
              {editingStatement ? (
                <Textarea
                  value={statementDraft}
                  onChange={(e) => setStatementDraft(e.target.value)}
                  className="min-h-[80px] text-sm"
                />
              ) : (
                <p className="text-sm text-foreground/80 leading-relaxed break-words whitespace-normal">
                  {requirement.statement}
                </p>
              )}
            </div>
          </div>

          {/* ─── Stakeholder Alignment ─────────────────────── */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="h-0.5 bg-emerald-400" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                    <Users className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Stakeholder Alignment</h3>
                </div>
                {alignment.total > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{alignment.percentage}%</span>
                    <span className="text-[10px] text-muted-foreground">({alignment.label})</span>
                  </div>
                )}
              </div>

              {alignment.total > 0 ? (
                <>
                  <Progress value={alignment.percentage} className="h-2 mb-4" />

                  {/* Stakeholder rows with validation status */}
                  <div className="space-y-2">
                    {requirement.assignedStakeholders.map((s) => {
                      const label = getValidationLabel(s.validationStatus, !!s.timestamp)
                      const color = getValidationColor(s.validationStatus, !!s.timestamp)
                      return (
                        <div
                          key={s.stakeholderId}
                          className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5"
                        >
                          <div className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                            s.validationStatus === "Approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : s.validationStatus === "Revision Requested"
                                ? "bg-red-100 text-red-700"
                                : s.validationStatus === "Commented"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-600"
                          )}>
                            {s.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground">{s.jobTitle || "Stakeholder"}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ValidationIcon status={s.validationStatus} />
                            <span className={cn("text-[10px] font-medium", color)}>
                              {label}
                            </span>
                          </div>
                          {s.timestamp && (
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatTimestamp(s.timestamp)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 mb-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">No stakeholders assigned yet.</p>
                  <p className="text-xs text-muted-foreground/70 mb-3">
                    Assign stakeholders from the Stakeholder Alignment section below.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => onOpenChange(false)}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Assign stakeholders
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ─── Sub-requirements ──────────────────────────────── */}
          {subRequirements.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/20 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="h-0.5 bg-orange-300" />
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Sub-requirements</h3>
                <div className="space-y-2">
                  {subRequirements.map((sub) => {
                    const subNum = numbering[sub.id] || ""
                    const subCatColor = REQUIREMENT_CATEGORY_COLORS[sub.category]
                    const subStatusColor = STATUS_COLORS[sub.status]
                    return (
                      <div
                        key={sub.id}
                        className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-card">
                          <span className="text-[10px] font-bold text-orange-600">{subNum}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground flex-1 break-words whitespace-normal leading-snug">
                          {sub.name || sub.statement}
                        </span>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", subCatColor.bg, subCatColor.text, subCatColor.border)}>
                          {sub.category}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", subStatusColor.bg, subStatusColor.text, subStatusColor.border)}>
                          {sub.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── Comments (with Edit / Delete / Resolve) ─────── */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="h-0.5 bg-orange-400" />
            <div className="p-4">
              <button
                onClick={() => setShowComments((v) => !v)}
                className="flex items-center gap-2.5 mb-3 w-full text-left"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
                  <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Comments ({activeComments.length})
                </h3>
              </button>
              {showComments && (
                <>
                  {requirement.assignedStakeholders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <p className="text-xs text-muted-foreground italic">No comments yet.</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        Assign stakeholders to enable commenting.
                      </p>
                    </div>
                  ) : activeComments.length === 0 && resolvedComments.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-3">No comments yet.</p>
                  ) : (
                    <>
                      {/* Active comments */}
                      {activeComments.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {activeComments.map((c) => (
                            <div key={c.id} className="rounded-lg bg-muted/30 border border-border/60 px-3 py-2.5">
                              {editingCommentId === c.id ? (
                                /* Inline edit mode */
                                <div className="space-y-2">
                                  <Textarea
                                    value={editCommentDraft}
                                    onChange={(e) => setEditCommentDraft(e.target.value)}
                                    className="text-xs min-h-[60px]"
                                    autoFocus
                                  />
                                  <div className="flex items-center gap-2 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-[10px]"
                                      onClick={() => { setEditingCommentId(null); setEditCommentDraft("") }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-6 text-[10px]"
                                      disabled={!editCommentDraft.trim()}
                                      onClick={() => handleEditComment(c.id)}
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                /* View mode */
                                <>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-foreground">{c.author}</span>
                                      <span className="text-[10px] text-muted-foreground">{formatTimestamp(c.timestamp)}</span>
                                      {c.edited && (
                                        <span className="text-[9px] text-muted-foreground italic">(edited)</span>
                                      )}
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                                          <MoreHorizontal className="h-3.5 w-3.5" />
                                          <span className="sr-only">Comment actions</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-36">
                                        <DropdownMenuItem
                                          className="text-xs gap-2"
                                          onClick={() => { setEditingCommentId(c.id); setEditCommentDraft(c.text) }}
                                        >
                                          <Pencil className="h-3 w-3" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-xs gap-2"
                                          onClick={() => handleResolveComment(c.id)}
                                        >
                                          <CheckCircle2 className="h-3 w-3" />
                                          Resolve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-xs gap-2 text-destructive"
                                          onClick={() => setDeleteConfirmId(c.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <p className="text-xs text-foreground/80 leading-relaxed break-words whitespace-normal">{c.text}</p>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Resolved comments section */}
                      {resolvedComments.length > 0 && (
                        <div className="mb-3">
                          <button
                            onClick={() => setShowResolved((v) => !v)}
                            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-2"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {showResolved ? "Hide" : "Show"} {resolvedComments.length} resolved comment{resolvedComments.length !== 1 ? "s" : ""}
                          </button>
                          {showResolved && (
                            <div className="space-y-2">
                              {resolvedComments.map((c) => (
                                <div key={c.id} className="rounded-lg bg-muted/20 border border-border/40 px-3 py-2 opacity-60">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-foreground">{c.author}</span>
                                      <span className="text-[10px] text-muted-foreground">{formatTimestamp(c.timestamp)}</span>
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                                        Resolved
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-[10px] text-muted-foreground gap-1"
                                      onClick={() => handleResolveComment(c.id)}
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                      Re-open
                                    </Button>
                                  </div>
                                  <p className="text-xs text-foreground/60 leading-relaxed break-words whitespace-normal">{c.text}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {/* Add comment */}
                  {requirement.assignedStakeholders.length > 0 && (
                    <div className="flex gap-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={2}
                        className="text-xs flex-1"
                      />
                      <Button
                        size="sm"
                        className="h-8 self-end gap-1"
                        disabled={!newComment.trim()}
                        onClick={handleAddComment}
                      >
                        <Send className="h-3 w-3" />
                        Post
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Version History section completely removed - replaced by "Last edited" in header */}
        </div>
      </DialogContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this comment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDeleteComment(deleteConfirmId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
