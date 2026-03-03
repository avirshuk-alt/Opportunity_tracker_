"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Microscope,
  Layers,
  Briefcase,
  ShieldAlert,
  CalendarRange,
  Send,
  Pencil,
  ExternalLink,
  Zap,
  BarChart3,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/data"
import { useInsights } from "@/lib/insights-context"

// ─── Sources Footer (matches Strategic Objectives pattern) ───────────────

function SourcesFooter({
  sources,
  generatedAt,
  tooltipText = "These modules contributed data used to generate this section.",
}: {
  sources: string[]
  generatedAt: string
  tooltipText?: string
}) {
  return (
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
                <p>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {sources.map((mod) => (
            <Badge
              key={mod}
              variant="outline"
              className="text-[10px] font-normal text-muted-foreground border-border bg-muted/30 px-2 py-0.5"
            >
              {mod}
            </Badge>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          Last generated: {new Date(generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} {"\u00B7"} {new Date(generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </span>
      </div>
    </>
  )
}

// ─── Skeleton Block ───────────────────────────────────────────────────────

function ContainerSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-16 flex-1 rounded-lg" />
        <Skeleton className="h-16 flex-1 rounded-lg" />
      </div>
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

// ─── Empty State Before Generation ────────────────────────────────────────

function WaitingState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted border border-border mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm">{text}</p>
    </div>
  )
}

// ─── Shared Collapsible Shell ─────────────────────────────────────────────

function ContainerShell({
  title,
  subtitle,
  actions,
  children,
  defaultOpen = true,
}: {
  title: string
  subtitle: string
  icon?: React.ElementType
  actions?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultOpen)

  return (
    <Card className="rounded-2xl border border-border shadow-sm">
      <CardHeader
        className="cursor-pointer select-none px-6 py-5"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setExpanded((v) => !v)
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div>
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
              <CardDescription className="text-sm mt-0.5">{subtitle}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="px-6 pb-6 pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  )
}

// ─── A) Executive Summary ─────────────────────────────────────────────────

function ExecutiveSummaryContainer() {
  const { state, isGenerating, hasGenerated } = useInsights()
  const data = state.executiveSummary
  const [refineOpen, setRefineOpen] = useState(false)
  const [editableThemes, setEditableThemes] = useState<string[]>([])
  const [editableTradeOffs, setEditableTradeOffs] = useState<string[]>([])
  const [editableRisks, setEditableRisks] = useState<string[]>([])
  const [editableRoadmap, setEditableRoadmap] = useState("")

  // Sync local editable state when data arrives
  const lastGenAt = data?.generatedAt
  useMemo(() => {
    if (data) {
      setEditableThemes([...data.strategicThemes])
      setEditableTradeOffs([...data.keyTradeOffs])
      setEditableRisks([...data.topRisks])
      setEditableRoadmap(data.roadmapDirection)
    }
  }, [lastGenAt])  // eslint-disable-line react-hooks/exhaustive-deps

  const MAX_VISIBLE_TRADEOFFS = 4

  return (
    <ContainerShell
      title="Executive Summary"
      subtitle="High-level synthesis for executives."
      icon={FileText}
      actions={
        data ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setRefineOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Refine
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => toast.success("Shared for review via notification")}
            >
              <Send className="h-3.5 w-3.5" />
              Share
            </Button>
          </>
        ) : undefined
      }
    >
      {isGenerating ? (
        <ContainerSkeleton />
      ) : !hasGenerated || !data ? (
        <WaitingState
          icon={FileText}
          text='Click "Generate Insights" at the top of the workspace to populate this section.'
        />
      ) : (
        <div className="space-y-4">
          {/* Two-column executive layout */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* LEFT column: Strategic Themes + Key Trade-offs */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Strategic Themes</h4>
                <div className="space-y-2">
                  {editableThemes.map((theme, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">{idx + 1}</span>
                      <span className="text-sm text-foreground leading-snug">{theme}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Key Trade-offs</h4>
                <ul className="space-y-1.5">
                  {editableTradeOffs.slice(0, MAX_VISIBLE_TRADEOFFS).map((item, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-muted-foreground mt-1 shrink-0">{"•"}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                  {editableTradeOffs.length > MAX_VISIBLE_TRADEOFFS && (
                    <li className="text-xs text-muted-foreground pl-4">
                      +{editableTradeOffs.length - MAX_VISIBLE_TRADEOFFS} more
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* RIGHT column: Value at Stake + Top Risks + Roadmap */}
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4 bg-primary/5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Value at Stake</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(data.totalValueAtStake)}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Top Risks</h4>
                <ul className="space-y-1.5">
                  {editableRisks.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-destructive mt-1 shrink-0">{"•"}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Roadmap Direction</h4>
                <p className="text-sm text-foreground leading-relaxed">{editableRoadmap}</p>
              </div>
            </div>
          </div>

          <SourcesFooter
            sources={["Strategic Objectives", "Fact Base", "Opportunity Tracker", "Risk Management"]}
            generatedAt={state.generatedAt!}
          />
        </div>
      )}

      {/* Refine Modal */}
      <Dialog open={refineOpen} onOpenChange={setRefineOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Refine Executive Summary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Strategic Themes</label>
              {editableThemes.map((theme, idx) => (
                <Textarea
                  key={idx}
                  value={theme}
                  onChange={(e) => {
                    const updated = [...editableThemes]
                    updated[idx] = e.target.value
                    setEditableThemes(updated)
                  }}
                  rows={2}
                  className="text-sm mb-2"
                />
              ))}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Roadmap Direction</label>
              <Textarea
                value={editableRoadmap}
                onChange={(e) => setEditableRoadmap(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => { setRefineOpen(false); toast.success("Summary refined") }}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ContainerShell>
  )
}

// ─── B) Category Diagnosis ────────────────────────────────────────────────

function CategoryDiagnosisContainer() {
  const { state, isGenerating, hasGenerated } = useInsights()
  const data = state.diagnosis
  const [editedSections, setEditedSections] = useState<Record<string, string>>({})

  const lastGenAt = data?.generatedAt
  useMemo(() => {
    if (data) {
      setEditedSections({
        marketSupplyDemand: data.marketSupplyDemand,
        costStructuralPressures: data.costStructuralPressures,
        supplierLandscape: data.supplierLandscape,
        internalPerformanceGaps: data.internalPerformanceGaps,
      })
    }
  }, [lastGenAt])  // eslint-disable-line react-hooks/exhaustive-deps

  const sections: { key: string; label: string }[] = [
    { key: "marketSupplyDemand", label: "Market & Supply-Demand Shifts" },
    { key: "costStructuralPressures", label: "Cost & Structural Pressures" },
    { key: "supplierLandscape", label: "Supplier Landscape Dynamics" },
    { key: "internalPerformanceGaps", label: "Internal Performance Gaps" },
  ]

  return (
    <ContainerShell
      title="Category Diagnosis"
      subtitle="Narrative synthesis of market & supply dynamics."
      icon={Microscope}
    >
      {isGenerating ? (
        <ContainerSkeleton />
      ) : !hasGenerated || !data ? (
        <WaitingState
          icon={Microscope}
          text='Click "Generate Insights" at the top of the workspace to populate this section.'
        />
      ) : (
        <div className="space-y-5">
          {sections.map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h4>
              </div>
              <Textarea
                value={editedSections[key] ?? ""}
                onChange={(e) => setEditedSections((prev) => ({ ...prev, [key]: e.target.value }))}
                rows={4}
                className="text-sm resize-y"
              />
            </div>
          ))}
          <SourcesFooter
            sources={["Fact Base", "Supplier Matrix", "Opportunity Tracker"]}
            generatedAt={state.generatedAt!}
          />
        </div>
      )}
    </ContainerShell>
  )
}

// ─── C) Strategic Themes ──────────────────────────────────────────────────

function StrategicThemesContainer() {
  const { state, isGenerating, hasGenerated } = useInsights()
  const themes = state.themes

  return (
    <ContainerShell
      title="Strategic Themes"
      subtitle="Thematic groupings linking objectives, insights, and initiatives."
      icon={Layers}
      actions={
        themes.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => toast.success("Themes refined")}
          >
            <Pencil className="h-3.5 w-3.5" />
            Refine Themes
          </Button>
        ) : undefined
      }
    >
      {isGenerating ? (
        <ContainerSkeleton />
      ) : !hasGenerated || themes.length === 0 ? (
        <WaitingState
          icon={Layers}
          text='Click "Generate Insights" at the top of the workspace to populate this section.'
        />
      ) : (
        <div className="space-y-4">
          {themes.map((theme) => (
            <div key={theme.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-semibold">{theme.name}</h4>
                <Badge variant="outline" className="text-[10px] shrink-0 bg-primary/5 text-primary border-primary/20">
                  {theme.expectedImpactRange}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{theme.rationale}</p>
              <div className="flex flex-wrap gap-3">
                {theme.linkedObjectiveIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Objectives:</span>
                    {theme.linkedObjectiveIds.map((id) => (
                      <Badge
                        key={id}
                        variant="outline"
                        className="text-[10px] cursor-pointer hover:bg-primary/10 transition-colors"
                      >
                        <ExternalLink className="h-2.5 w-2.5 mr-0.5" />
                        {id}
                      </Badge>
                    ))}
                  </div>
                )}
                {theme.linkedInsightIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Insights:</span>
                    {theme.linkedInsightIds.map((id) => (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="text-[10px] cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <ExternalLink className="h-2.5 w-2.5 mr-0.5" />
                        {id}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <SourcesFooter
            sources={["Strategic Objectives", "Fact Base"]}
            generatedAt={state.generatedAt!}
          />
        </div>
      )}
    </ContainerShell>
  )
}

// ─── D) Initiative Portfolio Summary ──────────────────────────────────────

function InitiativePortfolioContainer() {
  const { state, isGenerating, hasGenerated } = useInsights()
  const portfolio = state.portfolio
  const totalImpact = portfolio.reduce((s, p) => s + p.impactEstimate, 0)

  const timelineBandStyles: Record<string, string> = {
    Short: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Mid: "bg-amber-50 text-amber-700 border-amber-200",
    Long: "bg-sky-50 text-sky-700 border-sky-200",
  }

  const feasibilityStyles: Record<string, string> = {
    High: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-red-50 text-red-700 border-red-200",
  }

  return (
    <ContainerShell
      title="Initiative Portfolio Summary"
      subtitle="Top strategic initiatives from the Opportunity Tracker."
      icon={Briefcase}
      actions={
        portfolio.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => toast.success("Portfolio optimizer opened")}
          >
            <Zap className="h-3.5 w-3.5" />
            Optimize Portfolio
          </Button>
        ) : undefined
      }
    >
      {isGenerating ? (
        <ContainerSkeleton />
      ) : !hasGenerated || portfolio.length === 0 ? (
        <WaitingState
          icon={Briefcase}
          text='Click "Generate Insights" at the top of the workspace to populate this section.'
        />
      ) : (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex items-center gap-4 rounded-lg border p-3 bg-muted/30">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Pipeline</p>
              <p className="text-lg font-bold">{formatCurrency(totalImpact)}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Initiatives</p>
              <p className="text-lg font-bold">{portfolio.length}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">High Feasibility</p>
              <p className="text-lg font-bold">{portfolio.filter((p) => p.feasibility === "High").length}</p>
            </div>
          </div>

          {/* Initiative cards */}
          <div className="space-y-2">
            {portfolio.map((init) => (
              <div key={init.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{init.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px]">{init.stage}</Badge>
                      <Badge variant="outline" className={cn("text-[10px]", timelineBandStyles[init.timelineBand])}>
                        {init.timelineBand}-term
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px]", feasibilityStyles[init.feasibility])}>
                        {init.feasibility}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold">{formatCurrency(init.impactEstimate)}</p>
                </div>
              </div>
            ))}
          </div>

          <SourcesFooter
            sources={["Opportunity Tracker", "Fact Base"]}
            generatedAt={state.generatedAt!}
          />
        </div>
      )}
    </ContainerShell>
  )
}

// ─── E) Risk & Dependency Summary ─────────────────────────────────────────

function RiskDependencySummaryContainer() {
  const { state, isGenerating, hasGenerated } = useInsights()
  const riskItems = state.riskSummary

  const impactStyles: Record<string, string> = {
    High: "bg-red-50 text-red-700 border-red-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }

  return (
    <ContainerShell
      title="Risk & Dependency Summary"
      subtitle="Top strategic risks from Risk Management."
      icon={ShieldAlert}
      actions={
        riskItems.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => toast.success("Stress test initiated")}
          >
            <Zap className="h-3.5 w-3.5" />
            Stress-Test Strategy
          </Button>
        ) : undefined
      }
    >
      {isGenerating ? (
        <ContainerSkeleton />
      ) : !hasGenerated || riskItems.length === 0 ? (
        <WaitingState
          icon={ShieldAlert}
          text='Click "Generate Insights" at the top of the workspace to populate this section.'
        />
      ) : (
        <div className="space-y-2">
          {riskItems.map((risk) => (
            <div key={risk.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold truncate">{risk.title}</p>
                    <Badge variant="outline" className={cn("text-[10px] shrink-0", impactStyles[risk.impactLevel])}>
                      {risk.impactLevel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{risk.mitigationSummary}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono">
                    <span className={cn(
                      "font-bold",
                      risk.riskScore > risk.threshold ? "text-destructive" : "text-foreground"
                    )}>
                      {risk.riskScore}
                    </span>
                    <span className="text-muted-foreground">/{risk.threshold}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">score/threshold</p>
                </div>
              </div>
            </div>
          ))}

          <SourcesFooter
            sources={["Risk Management", "Supplier Matrix"]}
            generatedAt={state.generatedAt!}
          />
        </div>
      )}
    </ContainerShell>
  )
}

// ─── F) Roadmap & Phasing ─────────────────────────────────────────────────

function RoadmapPhasingContainer() {
  const { state, isGenerating, hasGenerated } = useInsights()
  const data = state.roadmap

  const maxValue = data ? Math.max(...data.valueRamp.map((v) => v.value)) : 0

  return (
    <ContainerShell
      title="Roadmap & Phasing"
      subtitle="Phased execution plan with value ramp visualization."
      icon={CalendarRange}
    >
      {isGenerating ? (
        <ContainerSkeleton />
      ) : !hasGenerated || !data ? (
        <WaitingState
          icon={CalendarRange}
          text='Click "Generate Insights" at the top of the workspace to populate this section.'
        />
      ) : (
        <div className="space-y-5">
          {/* Phase cards */}
          <div className="grid gap-3 md:grid-cols-3">
            {data.phases.map((phase) => (
              <div key={phase.phase} className="rounded-lg border p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold">{phase.phase}</p>
                  <p className="text-[10px] text-muted-foreground">{phase.timeframe}</p>
                </div>
                {phase.initiatives.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground italic">No items in this phase</p>
                ) : (
                  <div className="space-y-2">
                    {phase.initiatives.map((init) => (
                      <div key={init.id} className="flex items-center justify-between text-xs">
                        <span className="truncate flex-1">{init.title}</span>
                        <Badge variant="outline" className="text-[9px] ml-2 shrink-0">{init.progress}%</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Value Ramp Visualization */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Value Ramp
            </h4>
            <div className="flex items-end gap-2 h-20">
              {data.valueRamp.map((point) => (
                <div key={point.month} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-primary/80 rounded-t-sm transition-all min-h-[4px]"
                    style={{ height: `${maxValue > 0 ? (point.value / maxValue) * 64 : 4}px` }}
                  />
                  <span className="text-[9px] text-muted-foreground mt-1">{point.month}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">{formatCurrency(data.valueRamp[0]?.value ?? 0)}</span>
              <span className="text-[9px] text-muted-foreground font-medium">{formatCurrency(data.valueRamp[data.valueRamp.length - 1]?.value ?? 0)}</span>
            </div>
          </div>

          <SourcesFooter
            sources={["Opportunity Tracker", "Strategic Themes", "Risk Management"]}
            generatedAt={state.generatedAt!}
          />
        </div>
      )}
    </ContainerShell>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────

export function StrategyContainers() {
  return (
    <div className="space-y-4">
      <ExecutiveSummaryContainer />
      <CategoryDiagnosisContainer />
      <StrategicThemesContainer />
      <InitiativePortfolioContainer />
      <RiskDependencySummaryContainer />
      <RoadmapPhasingContainer />
    </div>
  )
}
