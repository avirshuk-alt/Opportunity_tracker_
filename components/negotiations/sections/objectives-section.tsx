"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  Target, Sparkles, RefreshCw, Lock, Unlock, Plus, Trash2,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  PanelRightOpen, PanelRightClose, MoreHorizontal, Copy,
  Pencil, RotateCcw, Eye, ExternalLink, Info,
  DollarSign, ShieldCheck, Clock, Package, Truck,
  FileText, Shield, Lightbulb, SlidersHorizontal, X,
} from "lucide-react"
import {
  type NegotiationWorkspace,
  type Objective,
  type ObjectiveDomain,
  type ObjectivePriority,
  type ObjectiveMetric,
  type ObjectiveTemplate,
  DOMAIN_LABELS,
  METRIC_LABELS,
  OBJECTIVE_TEMPLATES,
  negotiationSuppliers,
} from "@/lib/negotiations-data"

// ─── Props ──────────────────────────────────────────────────────────────────

interface ObjectivesSectionProps {
  workspace: NegotiationWorkspace
  onUpdate: (ws: NegotiationWorkspace) => void
}

// ─── Domain Icons ───────────────────────────────────────────────────────────

const DOMAIN_ICON_MAP: Record<ObjectiveDomain, React.ElementType> = {
  "cost-price": DollarSign,
  quality: ShieldCheck,
  sla: Clock,
  "min-volumes": Package,
  "lead-time": Truck,
  "contract-terms": FileText,
  "risk-resiliency": Shield,
  innovation: Lightbulb,
}

// ─── Style Maps ─────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<ObjectivePriority, { bg: string; text: string; border: string }> = {
  "Must-have": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  Important: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Nice-to-have": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
}

const STATUS_STYLES = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-50 text-emerald-700",
  achieved: "bg-primary/10 text-primary",
  missed: "bg-red-50 text-red-700",
}

const CONFIDENCE_COLOR = (c: number) =>
  c >= 80 ? "text-emerald-600" : c >= 60 ? "text-amber-600" : "text-red-500"

// ─── Inline Editable Cell ───────────────────────────────────────────────────

function InlineEditCell({
  value,
  onChange,
  className,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  if (disabled) {
    return <span className={cn("text-xs", className)}>{value || "-"}</span>
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(value); setEditing(true) }}
        className={cn(
          "text-xs text-left w-full rounded px-1.5 py-1 -mx-1.5 -my-1 hover:bg-muted/60 transition-colors cursor-text min-h-[24px]",
          !value && "text-muted-foreground italic",
          className
        )}
      >
        {value || placeholder || "Click to edit"}
      </button>
    )
  }

  return (
    <Input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { onChange(draft); setEditing(false) }}
      onKeyDown={(e) => {
        if (e.key === "Enter") { onChange(draft); setEditing(false) }
        if (e.key === "Escape") { setDraft(value); setEditing(false) }
      }}
      className={cn("h-6 text-xs px-1.5 py-0", className)}
      placeholder={placeholder}
    />
  )
}

// ─── AI Suggestions Side Panel ──────────────────────────────────────────────

function AiSuggestionsPanel({
  objective,
  onClose,
  onResetToAi,
}: {
  objective: Objective
  onClose: () => void
  onResetToAi: (id: string) => void
}) {
  return (
    <div className="w-[340px] shrink-0 border-l border-border bg-card overflow-y-auto">
      <div className="sticky top-0 bg-card z-10 border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-xs font-semibold">AI Rationale</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Objective title */}
        <div>
          <p className="text-xs font-medium text-foreground">{objective.title}</p>
          <Badge variant="outline" className={cn("text-[9px] mt-1", PRIORITY_STYLES[objective.priority].bg, PRIORITY_STYLES[objective.priority].text)}>
            {objective.priority}
          </Badge>
        </div>

        {/* Targets summary */}
        <div className="grid grid-cols-3 gap-2">
          {objective.anchor && (
            <div className="rounded-md bg-primary/5 px-2 py-1.5 text-center">
              <p className="text-[9px] text-muted-foreground">Anchor</p>
              <p className="text-[10px] font-semibold text-primary">{objective.anchor}</p>
            </div>
          )}
          <div className="rounded-md bg-emerald-50 px-2 py-1.5 text-center">
            <p className="text-[9px] text-muted-foreground">MDO</p>
            <p className="text-[10px] font-semibold text-emerald-700">{objective.mdo}</p>
          </div>
          <div className="rounded-md bg-amber-50 px-2 py-1.5 text-center">
            <p className="text-[9px] text-muted-foreground">LAA</p>
            <p className="text-[10px] font-semibold text-amber-700">{objective.laa}</p>
          </div>
        </div>

        <Separator />

        {/* AI Rationale */}
        {objective.aiRationale && (
          <div>
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Why these values</h4>
            <p className="text-xs text-foreground leading-relaxed">{objective.aiRationale}</p>
          </div>
        )}

        {/* Confidence */}
        {objective.aiConfidence != null && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Confidence:</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  objective.aiConfidence >= 80 ? "bg-emerald-500" : objective.aiConfidence >= 60 ? "bg-amber-500" : "bg-red-400"
                )}
                style={{ width: `${objective.aiConfidence}%` }}
              />
            </div>
            <span className={cn("text-[10px] font-medium", CONFIDENCE_COLOR(objective.aiConfidence))}>
              {objective.aiConfidence}%
            </span>
          </div>
        )}

        {/* Missing data */}
        {objective.missingData && objective.missingData.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Data gaps
            </h4>
            <ul className="space-y-1">
              {objective.missingData.map((d, i) => (
                <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">{"--"}</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Evidence links */}
        {objective.linkedFactIds && objective.linkedFactIds.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Evidence</h4>
            <div className="flex flex-wrap gap-1">
              {objective.linkedFactIds.map((fid) => (
                <Badge key={fid} variant="outline" className="text-[9px] gap-1 cursor-pointer hover:bg-muted">
                  <ExternalLink className="h-2.5 w-2.5" />
                  {fid}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Override log */}
        {objective.overrideLog && objective.overrideLog.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Edit History</h4>
            <div className="space-y-2">
              {objective.overrideLog.map((entry, i) => (
                <div key={i} className="text-[10px] border-l-2 border-muted pl-2">
                  <p className="text-foreground">
                    <span className="font-medium">{entry.field}</span>: {entry.before} {"-->"} {entry.after}
                  </p>
                  <p className="text-muted-foreground">{entry.userId} {entry.reason ? `- ${entry.reason}` : ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          {objective.source === "ai" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1.5 h-7"
              onClick={() => onResetToAi(objective.id)}
            >
              <RotateCcw className="h-3 w-3" />
              Reset to AI recommendation
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Add Objective Dialog ───────────────────────────────────────────────────

function AddObjectiveDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onAdd: (obj: Objective) => void
}) {
  const [mode, setMode] = useState<"template" | "blank">("template")
  const [selectedTemplate, setSelectedTemplate] = useState<ObjectiveTemplate | null>(null)
  const [title, setTitle] = useState("")
  const [domain, setDomain] = useState<ObjectiveDomain>("cost-price")
  const [metric, setMetric] = useState<ObjectiveMetric>("unit-price")
  const [anchor, setAnchor] = useState("")
  const [mdo, setMdo] = useState("")
  const [laa, setLaa] = useState("")
  const [batna, setBatna] = useState("")
  const [priority, setPriority] = useState<ObjectivePriority>("Important")
  const [rationale, setRationale] = useState("")

  const reset = () => {
    setMode("template")
    setSelectedTemplate(null)
    setTitle("")
    setDomain("cost-price")
    setMetric("unit-price")
    setAnchor("")
    setMdo("")
    setLaa("")
    setBatna("")
    setPriority("Important")
    setRationale("")
  }

  const handleSelectTemplate = (tpl: ObjectiveTemplate) => {
    setSelectedTemplate(tpl)
    setTitle(tpl.title)
    setDomain(tpl.domain)
    setMetric(tpl.metric)
    setPriority(tpl.defaultPriority)
    setMode("blank") // move to edit form
  }

  const handleAdd = () => {
    const newObj: Objective = {
      id: `obj-user-${Date.now()}`,
      domain,
      metric,
      title: title || "New Objective",
      anchor: anchor || undefined,
      mdo: mdo || "TBD",
      laa: laa || "TBD",
      batna: batna || "TBD",
      priority,
      weight: priority === "Must-have" ? 30 : priority === "Important" ? 20 : 10,
      rationale: rationale || "",
      status: "draft",
      source: "user",
    }
    onAdd(newObj)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">Add Objective</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose a template or create a blank objective.
          </DialogDescription>
        </DialogHeader>

        {mode === "template" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => { setMode("blank"); setSelectedTemplate(null) }}
              >
                <Plus className="h-3 w-3 mr-1" /> Blank Objective
              </Button>
            </div>
            <div className="grid gap-2 max-h-[360px] overflow-y-auto">
              {OBJECTIVE_TEMPLATES.map((tpl) => {
                const Icon = DOMAIN_ICON_MAP[tpl.domain]
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{tpl.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{tpl.description}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[9px]">{DOMAIN_LABELS[tpl.domain]}</Badge>
                        <Badge variant="outline" className="text-[9px]">{METRIC_LABELS[tpl.metric]}</Badge>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedTemplate && (
              <button onClick={() => setMode("template")} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                {"<-"} Back to templates
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Domain</label>
                <Select value={domain} onValueChange={(v) => setDomain(v as ObjectiveDomain)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DOMAIN_LABELS) as ObjectiveDomain[]).map((d) => (
                      <SelectItem key={d} value={d} className="text-xs">{DOMAIN_LABELS[d]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Metric</label>
                <Select value={metric} onValueChange={(v) => setMetric(v as ObjectiveMetric)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(METRIC_LABELS) as ObjectiveMetric[]).map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">{METRIC_LABELS[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-xs" placeholder="e.g., Reduce unit price by 10%" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Anchor (opening)</label>
                <Input value={anchor} onChange={(e) => setAnchor(e.target.value)} className="h-8 text-xs" placeholder="Aggressive" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">MDO (best)</label>
                <Input value={mdo} onChange={(e) => setMdo(e.target.value)} className="h-8 text-xs" placeholder="Target" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">LAA (walk-away)</label>
                <Input value={laa} onChange={(e) => setLaa(e.target.value)} className="h-8 text-xs" placeholder="Minimum" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">BATNA</label>
              <Input value={batna} onChange={(e) => setBatna(e.target.value)} className="h-8 text-xs" placeholder="Best alternative if no deal" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Priority</label>
                <Select value={priority} onValueChange={(v) => setPriority(v as ObjectivePriority)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Must-have" className="text-xs">Must-have</SelectItem>
                    <SelectItem value="Important" className="text-xs">Important</SelectItem>
                    <SelectItem value="Nice-to-have" className="text-xs">Nice-to-have</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Rationale</label>
              <Textarea value={rationale} onChange={(e) => setRationale(e.target.value)} className="text-xs min-h-[60px]" placeholder="Why is this important?" />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => { reset(); onOpenChange(false) }}>Cancel</Button>
          {mode === "blank" && (
            <Button size="sm" className="text-xs" onClick={handleAdd} disabled={!title && !selectedTemplate}>
              Add Objective
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Bulk Shift Dialog ──────────────────────────────────────────────────────

function BulkShiftDialog({
  open,
  onOpenChange,
  objectiveCount,
  onApply,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  objectiveCount: number
  onApply: (pct: number) => void
}) {
  const [pct, setPct] = useState("")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Shift All Targets</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Applies a percentage shift to numeric objectives. Positive = more aggressive, negative = more conservative.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3">
          <Input
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            className="h-8 text-xs w-24"
            placeholder="+/- %"
            type="number"
          />
          <span className="text-xs text-muted-foreground">
            Applied to {objectiveCount} objective{objectiveCount !== 1 ? "s" : ""}
          </span>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="text-xs" onClick={() => { onApply(Number(pct)); onOpenChange(false) }} disabled={!pct}>
            Apply Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ObjectivesSection({ workspace, onUpdate }: ObjectivesSectionProps) {
  const objectives = workspace.objectives
  const suppliers = useMemo(() => negotiationSuppliers.filter((s) => workspace.supplierIds.includes(s.id)), [workspace.supplierIds])

  // State
  const [supplierFilter, setSupplierFilter] = useState<string>("all")
  const [domainFilter, setDomainFilter] = useState<string>("all")
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set(Object.keys(DOMAIN_LABELS)))
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showBulkShift, setShowBulkShift] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Derived
  const filteredObjectives = useMemo(() => {
    let filtered = objectives
    if (supplierFilter !== "all") {
      filtered = filtered.filter((o) => o.scope?.supplierIds?.includes(supplierFilter) || !o.scope?.supplierIds?.length)
    }
    if (domainFilter !== "all") {
      filtered = filtered.filter((o) => o.domain === domainFilter)
    }
    return filtered
  }, [objectives, supplierFilter, domainFilter])

  const groupedByDomain = useMemo(() => {
    const groups: Record<string, Objective[]> = {}
    for (const obj of filteredObjectives) {
      if (!groups[obj.domain]) groups[obj.domain] = []
      groups[obj.domain].push(obj)
    }
    return groups
  }, [filteredObjectives])

  const aiCount = objectives.filter((o) => o.source === "ai").length
  const userEditedCount = objectives.filter((o) => o.userEdited).length
  const mustHaveCount = objectives.filter((o) => o.priority === "Must-have").length
  const totalWeight = objectives.reduce((s, o) => s + (o.weight ?? 0), 0)

  // Handlers
  const updateObjective = useCallback((id: string, updates: Partial<Objective>) => {
    if (isLocked) return
    const updated = objectives.map((o) => {
      if (o.id !== id) return o
      const merged = { ...o, ...updates, userEdited: true }
      return merged
    })
    onUpdate({ ...workspace, objectives: updated })
  }, [objectives, workspace, onUpdate, isLocked])

  const deleteObjective = useCallback((id: string) => {
    if (isLocked) return
    onUpdate({ ...workspace, objectives: objectives.filter((o) => o.id !== id) })
    if (selectedObjective === id) setSelectedObjective(null)
  }, [objectives, workspace, onUpdate, isLocked, selectedObjective])

  const addObjective = useCallback((obj: Objective) => {
    if (isLocked) return
    onUpdate({ ...workspace, objectives: [...objectives, obj] })
  }, [objectives, workspace, onUpdate, isLocked])

  const duplicateObjective = useCallback((id: string) => {
    const src = objectives.find((o) => o.id === id)
    if (!src || isLocked) return
    const dup: Objective = {
      ...src,
      id: `obj-dup-${Date.now()}`,
      title: `${src.title} (copy)`,
      source: "user",
      aiConfidence: undefined,
      aiRationale: undefined,
      aiVersion: undefined,
      userEdited: false,
      overrideLog: [],
      status: "draft",
    }
    onUpdate({ ...workspace, objectives: [...objectives, dup] })
  }, [objectives, workspace, onUpdate, isLocked])

  const resetToAi = useCallback((_id: string) => {
    // In a real app this would fetch the original AI-generated values
    // For now we just mark it as no longer user-edited
    updateObjective(_id, { userEdited: false })
  }, [updateObjective])

  const toggleDomain = (d: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === filteredObjectives.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredObjectives.map((o) => o.id)))
    }
  }

  const deleteSelected = () => {
    if (isLocked) return
    onUpdate({ ...workspace, objectives: objectives.filter((o) => !selectedIds.has(o.id)) })
    setSelectedIds(new Set())
  }

  const panelObjective = objectives.find((o) => o.id === selectedObjective)

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Negotiation Targets</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Define your targets for each negotiation dimension. Anchor / MDO / LAA / BATNA.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showAiPanel ? (
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-7" onClick={() => { setShowAiPanel(false); setSelectedObjective(null) }}>
                <PanelRightClose className="h-3.5 w-3.5" />
                Close Panel
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-7" onClick={() => setShowAiPanel(true)}>
                <PanelRightOpen className="h-3.5 w-3.5" />
                AI Panel
              </Button>
            )}
          </div>
        </div>

        {/* AI Banner */}
        {aiCount > 0 && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    AI-generated objectives (v1) — {aiCount} objective{aiCount !== 1 ? "s" : ""} pre-populated
                    {userEditedCount > 0 && <span className="text-muted-foreground"> ({userEditedCount} edited)</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Grounded in Fact Base, Supplier Matrix placement, and Lever outputs. Review and edit as needed.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="outline" size="sm" className="text-xs gap-1 h-7">
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </Button>
                <Button
                  variant={isLocked ? "default" : "outline"}
                  size="sm"
                  className={cn("text-xs gap-1 h-7", isLocked && "bg-amber-600 hover:bg-amber-700")}
                  onClick={() => setIsLocked(!isLocked)}
                >
                  {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  {isLocked ? "Locked" : "Lock"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="text-xs font-semibold">{objectives.length}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5">
            <span className="text-xs text-red-700">Must-have:</span>
            <span className="text-xs font-semibold text-red-700">{mustHaveCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
            <span className="text-xs text-muted-foreground">Weight:</span>
            <span className="text-xs font-semibold">{totalWeight}%</span>
            {totalWeight !== 100 && totalWeight > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent className="text-xs">Weights should sum to 100%. Currently {totalWeight}%.</TooltipContent>
              </Tooltip>
            )}
          </div>
          {isLocked && (
            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 gap-1">
              <Lock className="h-2.5 w-2.5" />
              Targets Locked
            </Badge>
          )}
        </div>

        {/* Filters + Actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Supplier switcher */}
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="h-7 text-xs w-[160px]">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Suppliers</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Domain filter */}
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger className="h-7 text-xs w-[150px]">
                <SelectValue placeholder="All Domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Domains</SelectItem>
                {(Object.keys(DOMAIN_LABELS) as ObjectiveDomain[]).map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">{DOMAIN_LABELS[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            {selectedIds.size > 0 && (
              <>
                <span className="text-[10px] text-muted-foreground mr-1">{selectedIds.size} selected</span>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1 text-destructive hover:text-destructive" onClick={deleteSelected} disabled={isLocked}>
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
                <Separator orientation="vertical" className="h-4" />
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                  <SlidersHorizontal className="h-3 w-3" />
                  Bulk Actions
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem className="text-xs gap-2" onClick={() => setShowBulkShift(true)} disabled={isLocked}>
                  <SlidersHorizontal className="h-3 w-3" />
                  Shift targets +/- %
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2" onClick={selectAll}>
                  <CheckCircle2 className="h-3 w-3" />
                  {selectedIds.size === filteredObjectives.length ? "Deselect All" : "Select All"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" className="text-xs h-7 gap-1" onClick={() => setShowAddDialog(true)} disabled={isLocked}>
              <Plus className="h-3 w-3" />
              Add Objective
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex gap-0">
          {/* Table */}
          <div className={cn("flex-1 min-w-0 transition-all", showAiPanel && "mr-0")}>
            {objectives.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Target className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No objectives defined yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Complete the Levers section to auto-populate targets, or add objectives manually.
                    </p>
                    <Button size="sm" className="mt-4 text-xs gap-1.5" onClick={() => setShowAddDialog(true)}>
                      <Plus className="h-3 w-3" />
                      Add First Objective
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-8 text-center">
                            <input
                              type="checkbox"
                              className="rounded border-border"
                              checked={selectedIds.size === filteredObjectives.length && filteredObjectives.length > 0}
                              onChange={selectAll}
                            />
                          </TableHead>
                          <TableHead className="text-[10px] w-[130px]">Domain / Metric</TableHead>
                          <TableHead className="text-[10px]">Objective</TableHead>
                          <TableHead className="text-[10px] text-center w-[80px]">Anchor</TableHead>
                          <TableHead className="text-[10px] text-center w-[80px]">MDO</TableHead>
                          <TableHead className="text-[10px] text-center w-[80px]">LAA</TableHead>
                          <TableHead className="text-[10px] text-center w-[70px]">Priority</TableHead>
                          <TableHead className="text-[10px] text-center w-[50px]">Wt.</TableHead>
                          <TableHead className="text-[10px] text-center w-[55px]">Status</TableHead>
                          <TableHead className="text-[10px] text-center w-[55px]">Source</TableHead>
                          <TableHead className="w-8" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(Object.keys(DOMAIN_LABELS) as ObjectiveDomain[]).map((domain) => {
                          const domainObjs = groupedByDomain[domain]
                          if (!domainObjs || domainObjs.length === 0) return null
                          const Icon = DOMAIN_ICON_MAP[domain]
                          const isExpanded = expandedDomains.has(domain)

                          return (
                            <ObjectiveDomainGroup
                              key={domain}
                              domain={domain}
                              label={DOMAIN_LABELS[domain]}
                              icon={Icon}
                              objectives={domainObjs}
                              isExpanded={isExpanded}
                              onToggle={() => toggleDomain(domain)}
                              selectedIds={selectedIds}
                              selectedObjective={selectedObjective}
                              isLocked={isLocked}
                              onToggleSelect={toggleSelect}
                              onSelectObjective={(id) => { setSelectedObjective(id); setShowAiPanel(true) }}
                              onUpdate={updateObjective}
                              onDelete={deleteObjective}
                              onDuplicate={duplicateObjective}
                            />
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Must-have summary cards (below table) */}
            {objectives.filter((o) => o.priority === "Must-have").length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Must-Have Summary</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  {objectives.filter((o) => o.priority === "Must-have").map((obj) => {
                    const Icon = DOMAIN_ICON_MAP[obj.domain]
                    return (
                      <Card
                        key={obj.id}
                        className={cn(
                          "border-l-2 border-l-red-400 cursor-pointer transition-colors",
                          selectedObjective === obj.id && "ring-1 ring-primary"
                        )}
                        onClick={() => { setSelectedObjective(obj.id); setShowAiPanel(true) }}
                      >
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <Badge variant="outline" className={cn("text-[9px]", PRIORITY_STYLES["Must-have"].bg, PRIORITY_STYLES["Must-have"].text)}>Must-have</Badge>
                            <Badge variant="outline" className="text-[9px]">{DOMAIN_LABELS[obj.domain]}</Badge>
                            {obj.source === "ai" && (
                              <Sparkles className="h-3 w-3 text-primary ml-auto" />
                            )}
                          </div>
                          <p className="text-xs font-medium">{obj.title}</p>
                          <div className="mt-2 grid grid-cols-4 gap-1.5">
                            {obj.anchor && (
                              <div className="rounded-md bg-primary/5 px-1.5 py-1 text-center">
                                <p className="text-[8px] text-muted-foreground">Anchor</p>
                                <p className="text-[10px] font-semibold text-primary truncate">{obj.anchor}</p>
                              </div>
                            )}
                            <div className="rounded-md bg-emerald-50 px-1.5 py-1 text-center">
                              <p className="text-[8px] text-muted-foreground">MDO</p>
                              <p className="text-[10px] font-semibold text-emerald-700 truncate">{obj.mdo}</p>
                            </div>
                            <div className="rounded-md bg-amber-50 px-1.5 py-1 text-center">
                              <p className="text-[8px] text-muted-foreground">LAA</p>
                              <p className="text-[10px] font-semibold text-amber-700 truncate">{obj.laa}</p>
                            </div>
                            <div className="rounded-md bg-red-50 px-1.5 py-1 text-center">
                              <p className="text-[8px] text-muted-foreground">BATNA</p>
                              <p className="text-[10px] font-semibold text-red-700 truncate" title={obj.batna}>{obj.batna}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* AI Panel */}
          {showAiPanel && panelObjective && (
            <AiSuggestionsPanel
              objective={panelObjective}
              onClose={() => { setShowAiPanel(false); setSelectedObjective(null) }}
              onResetToAi={resetToAi}
            />
          )}
        </div>

        {/* Dialogs */}
        <AddObjectiveDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdd={addObjective} />
        <BulkShiftDialog
          open={showBulkShift}
          onOpenChange={setShowBulkShift}
          objectiveCount={filteredObjectives.length}
          onApply={(_pct) => {
            // In production, this would parse numeric values and shift them
            // For now, it's a placeholder for the shift logic
          }}
        />
      </div>
    </TooltipProvider>
  )
}

// ─── Domain Group Component ─────────────────────────────────────────────────

function ObjectiveDomainGroup({
  domain,
  label,
  icon: Icon,
  objectives,
  isExpanded,
  onToggle,
  selectedIds,
  selectedObjective,
  isLocked,
  onToggleSelect,
  onSelectObjective,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  domain: ObjectiveDomain
  label: string
  icon: React.ElementType
  objectives: Objective[]
  isExpanded: boolean
  onToggle: () => void
  selectedIds: Set<string>
  selectedObjective: string | null
  isLocked: boolean
  onToggleSelect: (id: string) => void
  onSelectObjective: (id: string) => void
  onUpdate: (id: string, updates: Partial<Objective>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}) {
  return (
    <>
      {/* Domain group header */}
      <TableRow className="hover:bg-transparent bg-muted/30 cursor-pointer" onClick={onToggle}>
        <TableCell colSpan={11} className="py-1.5">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-foreground">{label}</span>
            <Badge variant="outline" className="text-[9px] ml-1">{objectives.length}</Badge>
          </div>
        </TableCell>
      </TableRow>

      {/* Objective rows */}
      {isExpanded && objectives.map((obj) => (
        <ObjectiveRow
          key={obj.id}
          objective={obj}
          isSelected={selectedIds.has(obj.id)}
          isHighlighted={selectedObjective === obj.id}
          isLocked={isLocked}
          onToggleSelect={() => onToggleSelect(obj.id)}
          onSelectForPanel={() => onSelectObjective(obj.id)}
          onUpdate={(updates) => onUpdate(obj.id, updates)}
          onDelete={() => onDelete(obj.id)}
          onDuplicate={() => onDuplicate(obj.id)}
        />
      ))}
    </>
  )
}

// ─── Single Objective Row ───────────────────────────────────────────────────

function ObjectiveRow({
  objective: obj,
  isSelected,
  isHighlighted,
  isLocked,
  onToggleSelect,
  onSelectForPanel,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  objective: Objective
  isSelected: boolean
  isHighlighted: boolean
  isLocked: boolean
  onToggleSelect: () => void
  onSelectForPanel: () => void
  onUpdate: (updates: Partial<Objective>) => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const ps = PRIORITY_STYLES[obj.priority]

  return (
    <TableRow className={cn(
      "group transition-colors",
      isHighlighted && "bg-primary/[0.04] hover:bg-primary/[0.06]",
      isSelected && "bg-muted/50"
    )}>
      {/* Checkbox */}
      <TableCell className="text-center py-2">
        <input
          type="checkbox"
          className="rounded border-border"
          checked={isSelected}
          onChange={onToggleSelect}
        />
      </TableCell>

      {/* Domain / Metric */}
      <TableCell className="py-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">{DOMAIN_LABELS[obj.domain]}</span>
          {obj.metric && (
            <Badge variant="outline" className="text-[8px] w-fit px-1 py-0">{METRIC_LABELS[obj.metric]}</Badge>
          )}
        </div>
      </TableCell>

      {/* Objective Title + Rationale */}
      <TableCell className="py-2">
        <button
          onClick={onSelectForPanel}
          className="text-left group/title"
        >
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium group-hover/title:text-primary transition-colors">{obj.title}</p>
            {obj.source === "ai" && !obj.userEdited && (
              <Sparkles className="h-3 w-3 text-primary/60 shrink-0" />
            )}
            {obj.userEdited && (
              <Tooltip>
                <TooltipTrigger>
                  <Pencil className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                </TooltipTrigger>
                <TooltipContent className="text-[10px]">User edited</TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{obj.rationale}</p>
        </button>
      </TableCell>

      {/* Anchor */}
      <TableCell className="text-center py-2">
        <InlineEditCell
          value={obj.anchor ?? ""}
          onChange={(v) => onUpdate({ anchor: v })}
          className="text-center font-medium text-primary"
          placeholder="--"
          disabled={isLocked}
        />
      </TableCell>

      {/* MDO */}
      <TableCell className="text-center py-2">
        <InlineEditCell
          value={obj.mdo}
          onChange={(v) => onUpdate({ mdo: v })}
          className="text-center font-medium text-emerald-700"
          placeholder="--"
          disabled={isLocked}
        />
      </TableCell>

      {/* LAA */}
      <TableCell className="text-center py-2">
        <InlineEditCell
          value={obj.laa}
          onChange={(v) => onUpdate({ laa: v })}
          className="text-center font-medium text-amber-700"
          placeholder="--"
          disabled={isLocked}
        />
      </TableCell>

      {/* Priority */}
      <TableCell className="text-center py-2">
        {isLocked ? (
          <Badge variant="outline" className={cn("text-[9px]", ps.bg, ps.text, ps.border)}>{obj.priority}</Badge>
        ) : (
          <Select value={obj.priority} onValueChange={(v) => onUpdate({ priority: v as ObjectivePriority })}>
            <SelectTrigger className="h-5 text-[9px] border-0 px-1.5 py-0 w-auto">
              <Badge variant="outline" className={cn("text-[9px]", ps.bg, ps.text, ps.border)}>{obj.priority}</Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Must-have" className="text-xs">Must-have</SelectItem>
              <SelectItem value="Important" className="text-xs">Important</SelectItem>
              <SelectItem value="Nice-to-have" className="text-xs">Nice-to-have</SelectItem>
            </SelectContent>
          </Select>
        )}
      </TableCell>

      {/* Weight */}
      <TableCell className="text-center py-2">
        <InlineEditCell
          value={String(obj.weight ?? "")}
          onChange={(v) => onUpdate({ weight: Number(v) || 0 })}
          className="text-center w-10"
          placeholder="0"
          disabled={isLocked}
        />
      </TableCell>

      {/* Status */}
      <TableCell className="text-center py-2">
        {isLocked ? (
          <Badge variant="outline" className={cn("text-[9px]", STATUS_STYLES[obj.status])}>{obj.status}</Badge>
        ) : (
          <Select value={obj.status} onValueChange={(v) => onUpdate({ status: v as Objective["status"] })}>
            <SelectTrigger className="h-5 text-[9px] border-0 px-1 py-0 w-auto">
              <Badge variant="outline" className={cn("text-[9px]", STATUS_STYLES[obj.status])}>{obj.status}</Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft" className="text-xs">Draft</SelectItem>
              <SelectItem value="active" className="text-xs">Active</SelectItem>
              <SelectItem value="achieved" className="text-xs">Achieved</SelectItem>
              <SelectItem value="missed" className="text-xs">Missed</SelectItem>
            </SelectContent>
          </Select>
        )}
      </TableCell>

      {/* Source */}
      <TableCell className="text-center py-2">
        {obj.source === "ai" ? (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1 justify-center">
                <Sparkles className="h-3 w-3 text-primary" />
                {obj.aiConfidence != null && (
                  <span className={cn("text-[9px] font-medium", CONFIDENCE_COLOR(obj.aiConfidence))}>
                    {obj.aiConfidence}%
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-[10px] max-w-[200px]">
              AI-generated (v{obj.aiVersion ?? 1}). Click row to see rationale.
            </TooltipContent>
          </Tooltip>
        ) : (
          <Badge variant="outline" className="text-[9px]">User</Badge>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuItem className="text-xs gap-2" onClick={onSelectForPanel}>
              <Eye className="h-3 w-3" />
              View AI rationale
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2" onClick={onDuplicate} disabled={isLocked}>
              <Copy className="h-3 w-3" />
              Duplicate
            </DropdownMenuItem>
            {obj.source === "ai" && (
              <DropdownMenuItem className="text-xs gap-2" disabled={isLocked}>
                <RotateCcw className="h-3 w-3" />
                Reset to AI values
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive" onClick={onDelete} disabled={isLocked}>
              <Trash2 className="h-3 w-3" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
