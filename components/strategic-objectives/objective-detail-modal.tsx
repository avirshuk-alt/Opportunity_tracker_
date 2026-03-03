"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Users,
  Lightbulb,
  ShieldAlert,
  Pencil,
  Check,
  Target,
  Sparkles,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { StrategicObjective, Stakeholder } from "@/lib/strategic-objectives-data"
import { CATEGORY_COLORS, PRIORITY_COLORS, buildNumberingMap } from "@/lib/strategic-objectives-data"

interface ObjectiveDetailModalProps {
  objective: StrategicObjective | null
  number: string
  open: boolean
  onOpenChange: (open: boolean) => void
  stakeholders: Stakeholder[]
  allObjectives: StrategicObjective[]
  onUpdate: (id: string, updates: Partial<StrategicObjective>) => void
}

/* ─── Editable Section Card ──────────────────────────────────────── */
function SectionCard({
  label,
  icon: Icon,
  iconBg,
  iconColor,
  accentColor,
  value,
  onSave,
  items,
}: {
  label: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  accentColor: string
  value: string
  onSave: (val: string) => void
  items?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  // Split value into list items if they exist
  const lines = items && !editing
    ? value.split(/[.]\s+/).filter(Boolean).map((s) => s.replace(/\.$/, "").trim()).filter(Boolean)
    : []

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Accent bar */}
      <div className={cn("h-0.5", accentColor)} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", iconBg)}>
              <Icon className={cn("h-3.5 w-3.5", iconColor)} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-primary hover:bg-orange-50"
            onClick={() => {
              if (editing) {
                onSave(draft)
                setEditing(false)
              } else {
                setDraft(value)
                setEditing(true)
              }
            }}
          >
            {editing ? (
              <><Check className="mr-1 h-3 w-3" /> Save</>
            ) : (
              <><Pencil className="mr-1 h-3 w-3" /> Edit</>
            )}
          </Button>
        </div>

        {/* Content */}
        {editing ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[80px] text-sm"
          />
        ) : items && lines.length > 1 ? (
          <div className="space-y-1.5">
            {lines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border border-border/60 px-3 py-2",
                  "bg-muted/20"
                )}
              >
                <div className={cn("h-2 w-2 shrink-0 rounded-full", accentColor)} />
                <p className="text-sm text-foreground/80 leading-relaxed">{line}.</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {value || "No content yet."}
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Main Modal ─────────────────────────────────────────────────── */
export function ObjectiveDetailModal({
  objective,
  number,
  open,
  onOpenChange,
  stakeholders,
  allObjectives,
  onUpdate,
}: ObjectiveDetailModalProps) {
  const [aiThumb, setAiThumb] = useState<"up" | "down" | null>(null)

  if (!objective) return null

  const catColor = CATEGORY_COLORS[objective.category]
  const priColor = PRIORITY_COLORS[objective.priority]
  const assigned = stakeholders.filter((s) =>
    objective.assignedStakeholderIds.includes(s.id)
  )

  const numbering = buildNumberingMap(allObjectives)
  const subObjectives = allObjectives.filter((o) => o.parentId === objective.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl p-0">
        {/* ─── Header ─────────────────────────────────────────── */}
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start gap-3.5">
            {/* Circular number badge */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-orange-200 bg-card">
              <span className="text-sm font-bold text-orange-600">{number}</span>
            </div>
            <div className="flex-1 min-w-0">
              {/* Title WITHOUT number prefix */}
              <DialogTitle className="text-lg font-semibold text-foreground leading-snug text-balance">
                {objective.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Details and settings for objective {number}
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-medium px-2 py-0.5", catColor.bg, catColor.text, catColor.border)}
                >
                  {objective.category}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-medium px-2 py-0.5", priColor.bg, priColor.text)}
                >
                  {objective.priority} Priority
                </Badge>
                <span className="text-xs text-muted-foreground">{objective.targetMetric}</span>
                <span className="text-[10px] text-muted-foreground/40">|</span>
                <span className="text-xs text-muted-foreground">{objective.timeHorizon}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Soft orange divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent mx-6" />

        {/* ─── Body ───────────────────────────────────────────── */}
        <div className="p-6 space-y-5">
          {/* ─── AI Executive Summary ─────────────────────────── */}
          {objective.aiSummary && (
            <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-100">
                    <Sparkles className="h-3 w-3 text-orange-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Executive Summary</h3>
                  <span className="text-[9px] font-medium text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">
                    AI-generated
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-orange-50"
                    title="Regenerate"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 p-0 transition-colors",
                      aiThumb === "up" ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-orange-50"
                    )}
                    onClick={() => setAiThumb(aiThumb === "up" ? null : "up")}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 p-0 transition-colors",
                      aiThumb === "down" ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-orange-50"
                    )}
                    onClick={() => setAiThumb(aiThumb === "down" ? null : "down")}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {objective.aiSummary}
              </p>
            </div>
          )}

          {/* ─── Business Requirements ────────────────────────── */}
          <SectionCard
            label="Business Requirements"
            icon={FileText}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            accentColor="bg-blue-400"
            value={objective.businessRequirements}
            onSave={(val) => onUpdate(objective.id, { businessRequirements: val })}
            items
          />

          {/* ─── Sub-objectives ────────────────────────────────── */}
          {subObjectives.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/20 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="h-0.5 bg-orange-300" />
              <div className="p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
                    <Target className="h-3.5 w-3.5 text-orange-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Sub-objectives</h3>
                </div>
                <div className="space-y-2">
                  {subObjectives.map((sub) => {
                    const subNum = numbering[sub.id] || ""
                    const subCatColor = CATEGORY_COLORS[sub.category]
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-card">
                          <span className="text-[10px] font-bold text-orange-600">{subNum}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground flex-1 truncate">
                          {sub.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5 py-0 shrink-0", subCatColor.bg, subCatColor.text, subCatColor.border)}
                        >
                          {sub.category}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── Assigned Stakeholders ─────────────────────────── */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="h-0.5 bg-emerald-400" />
            <div className="p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                  <Users className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Assigned Stakeholders</h3>
              </div>
              {assigned.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {assigned.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 rounded-full border border-border bg-muted/20 pl-1 pr-3 py-1"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700">
                        {s.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="text-xs font-medium text-foreground">{s.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground italic rounded-lg border border-dashed border-border bg-muted/10">
                  No stakeholders assigned yet
                </div>
              )}
            </div>
          </div>

          {/* ─── Opportunities ─────────────────────────────────── */}
          <SectionCard
            label="Opportunities"
            icon={Lightbulb}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            accentColor="bg-amber-400"
            value={objective.opportunities}
            onSave={(val) => onUpdate(objective.id, { opportunities: val })}
            items
          />

          {/* ─── Risks ─────────────────────────────────────────── */}
          <SectionCard
            label="Risks"
            icon={ShieldAlert}
            iconBg="bg-red-50"
            iconColor="text-red-500"
            accentColor="bg-red-400"
            value={objective.risks}
            onSave={(val) => onUpdate(objective.id, { risks: val })}
            items
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
