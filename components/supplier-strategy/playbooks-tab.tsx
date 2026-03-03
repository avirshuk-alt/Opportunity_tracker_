"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Textarea } from "@/components/ui/textarea"
import {
  Inbox,
  AlertTriangle,
  Lightbulb,
  Eye,
  Search,
  Filter,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  Link2,
  Sparkles,
  Target,
  RefreshCw,
  MoreHorizontal,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Minus,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  generatedInsights,
  fleetSuppliers,
  playbooks,
  SUPPLIER_TYPE_COLORS,
  ALL_SUPPLIER_TYPES,
  type Insight,
  type InsightType,
  type InsightSource,
  type InsightStatus,
  type SeverityLevel,
  type StagedOpportunity,
  type OpportunityStage,
  type EffortLevel,
  type ConfidenceLevel,
  type SupplierType,
} from "@/lib/supplier-strategy-data"
import { toast } from "sonner"

// ─── Simplified Level Indicator ────────────────────────────────────────────────

type LevelIndicator = "Low" | "Medium" | "High"

function LevelBadge({ level, type }: { level: LevelIndicator; type: InsightType }) {
  const label = type === "Risk" ? "Severity" : type === "Opportunity" ? "Potential" : "Importance"
  const colors: Record<LevelIndicator, string> = {
    Low: "text-slate-500",
    Medium: "text-amber-600",
    High: "text-red-600",
  }
  const icons: Record<LevelIndicator, React.ReactNode> = {
    Low: <Minus className="h-3 w-3" />,
    Medium: <ArrowUp className="h-3 w-3" />,
    High: <ArrowUp className="h-3 w-3" />,
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", colors[level])}>
      {icons[level]}
      {level}
    </span>
  )
}

// ─── Type Icon ─────────────────────────────────────────────────────────────────

const typeIcon: Record<InsightType, React.ReactNode> = {
  Observation: <Eye className="h-3.5 w-3.5 text-slate-500" />,
  Risk: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
  Opportunity: <Lightbulb className="h-3.5 w-3.5 text-emerald-500" />,
}

const typeLabel: Record<InsightType, string> = {
  Observation: "Observation",
  Risk: "Risk",
  Opportunity: "Opportunity",
}

// ─── Status Styles ─────────────────────────────────────────────────────────────

const statusStyles: Record<InsightStatus, string> = {
  New: "text-sky-600",
  Triaged: "text-violet-600",
  Promoted: "text-emerald-600",
  Dismissed: "text-slate-400",
}

// ─── Helper: Extract level from insight ────────────────────────────────────────

function getInsightLevel(ins: Insight): LevelIndicator {
  if (ins.severity) {
    if (ins.severity === "Critical" || ins.severity === "High") return "High"
    if (ins.severity === "Medium") return "Medium"
    return "Low"
  }
  // For opportunities without severity, infer from value
  if (ins.valueRange) {
    const match = ins.valueRange.match(/\$(\d+)/)
    if (match) {
      const val = parseInt(match[1], 10)
      if (val >= 200) return "High"
      if (val >= 50) return "Medium"
    }
  }
  return "Medium"
}

// ─── Helper: Format timestamp ──────────────────────────────────────────────────

function formatTimestamp(ts: string): string {
  const date = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "1d ago"
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

// ─── Helper: Get supplier names ────────────────────────────────────────────────

function getSupplierText(ids: string[]): string {
  if (ids.length === 0) return "—"
  const names = ids.map((id) => fleetSuppliers.find((s) => s.id === id)?.name?.split(" ")[0] || "Unknown")
  if (names.length <= 2) return names.join(", ")
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`
}

// ─── Insight Row Component ─────────────────────────────────────────────────────

function InsightRow({
  insight,
  onViewEvidence,
  onPromote,
  onDismiss,
}: {
  insight: Insight
  onViewEvidence: () => void
  onPromote: () => void
  onDismiss: (reason: string) => void
}) {
  const level = getInsightLevel(insight)
  const isPromoted = insight.status === "Promoted"
  const isDismissed = insight.status === "Dismissed"

  return (
    <div className={cn(
      "flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors border-b border-border last:border-b-0",
      isDismissed && "opacity-50",
    )}>
      {/* Type Icon */}
      <div className="shrink-0">{typeIcon[insight.type]}</div>

      {/* Title + Type */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug truncate">{insight.title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {typeLabel[insight.type]} · {getSupplierText(insight.linkedSupplierIds)}
        </p>
      </div>

      {/* Level */}
      <div className="w-16 shrink-0">
        <LevelBadge level={level} type={insight.type} />
      </div>

      {/* Status */}
      <div className={cn("w-16 text-[11px] font-medium shrink-0", statusStyles[insight.status])}>
        {insight.status}
      </div>

      {/* Timestamp */}
      <div className="w-16 text-[11px] text-muted-foreground shrink-0">
        {formatTimestamp(insight.timestamp)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={onViewEvidence}>
          View Evidence
        </Button>
        {!isPromoted && !isDismissed && insight.type !== "Observation" && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-emerald-600 hover:text-emerald-700" onClick={onPromote}>
            <ArrowRight className="h-3 w-3 mr-1" />
            Promote
          </Button>
        )}
        {!isDismissed && (
          <Select onValueChange={(v) => onDismiss(v)}>
            <SelectTrigger className="h-7 w-7 p-0 border-0 hover:bg-muted">
              <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="not-relevant" className="text-xs">Not relevant</SelectItem>
              <SelectItem value="duplicate" className="text-xs">Duplicate</SelectItem>
              <SelectItem value="insufficient-evidence" className="text-xs">Insufficient evidence</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function SupplierPlaybooksTab() {
  // ── Insights state ──
  const [insights, setInsights] = useState<Insight[]>(generatedInsights)
  const [filterType, setFilterType] = useState<InsightType | "All">("All")
  const [filterSupplier, setFilterSupplier] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<SupplierType | "all">("all")
  const [filterTimeRange, setFilterTimeRange] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<InsightStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // ── Drawer state ──
  const [drawerInsight, setDrawerInsight] = useState<Insight | null>(null)
  const [drawerNote, setDrawerNote] = useState("")
  const [drawerOwner, setDrawerOwner] = useState("")
  const [leversOpen, setLeversOpen] = useState(false)

  // ── Opportunity staging state ──
  const [stagedOpps, setStagedOpps] = useState<StagedOpportunity[]>([])
  const [stagingOpen, setStagingOpen] = useState(true)

  // ── Filtered insights ──
  const filteredInsights = useMemo(() => {
    return insights.filter((ins) => {
      if (filterType !== "All" && ins.type !== filterType) return false
      if (filterSupplier !== "all" && !ins.linkedSupplierIds.includes(filterSupplier)) return false
      if (filterCategory !== "all") {
        const supplierTypes = ins.linkedSupplierIds.map((id) => fleetSuppliers.find((s) => s.id === id)?.type)
        if (!supplierTypes.includes(filterCategory)) return false
      }
      if (filterStatus !== "all" && ins.status !== filterStatus) return false
      if (filterTimeRange !== "all") {
        const date = new Date(ins.timestamp)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
        if (filterTimeRange === "7d" && diffDays > 7) return false
        if (filterTimeRange === "30d" && diffDays > 30) return false
        if (filterTimeRange === "90d" && diffDays > 90) return false
      }
      if (searchQuery && !ins.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [insights, filterType, filterSupplier, filterCategory, filterTimeRange, filterStatus, searchQuery])

  // ── Counts ──
  const counts = useMemo(() => ({
    all: insights.filter((i) => i.status !== "Dismissed").length,
    risks: insights.filter((i) => i.type === "Risk" && i.status !== "Dismissed").length,
    opportunities: insights.filter((i) => i.type === "Opportunity" && i.status !== "Dismissed").length,
    observations: insights.filter((i) => i.type === "Observation" && i.status !== "Dismissed").length,
  }), [insights])

  // ── Actions ──
  const promoteToOpportunity = (ins: Insight) => {
    const newOpp: StagedOpportunity = {
      id: `opp-${Date.now()}`,
      insightId: ins.id,
      statement: ins.title,
      supplierIds: ins.linkedSupplierIds,
      valueRange: ins.valueRange || "TBD",
      effort: "M",
      confidence: ins.evidence.metrics.length >= 3 ? "High" : ins.evidence.metrics.length >= 1 ? "Medium" : "Low",
      owner: drawerOwner || "",
      targetQuarter: "2026-Q3",
      stage: "Proposed",
      attachedLevers: ins.suggestedLevers?.slice(0, 3) ?? [],
      linkedActionIds: [],
    }
    setStagedOpps((prev) => [...prev, newOpp])
    setInsights((prev) => prev.map((i) => i.id === ins.id ? { ...i, status: "Promoted" as InsightStatus } : i))
    setDrawerInsight(null)
    setDrawerNote("")
    setDrawerOwner("")
    toast.success("Promoted to Opportunity Staging")
  }

  const markAsTriaged = (ins: Insight) => {
    setInsights((prev) => prev.map((i) => i.id === ins.id ? { ...i, status: "Triaged" as InsightStatus } : i))
    toast.success("Marked as triaged")
  }

  const dismissInsight = (ins: Insight, reason: string) => {
    setInsights((prev) => prev.map((i) => i.id === ins.id ? { ...i, status: "Dismissed" as InsightStatus, dismissReason: reason } : i))
    setDrawerInsight(null)
    toast.info(`Dismissed: ${reason}`)
  }

  const pushToOpportunitySection = (opp: StagedOpportunity) => {
    setStagedOpps((prev) => prev.map((o) => o.id === opp.id ? { ...o, stage: "Approved" as OpportunityStage } : o))
    toast.success("Pushed to Opportunity Section")
  }

  const returnToTracker = (opp: StagedOpportunity) => {
    setInsights((prev) => prev.map((i) => i.id === opp.insightId ? { ...i, status: "Triaged" as InsightStatus } : i))
    setStagedOpps((prev) => prev.filter((o) => o.id !== opp.id))
    toast.info("Returned to tracker")
  }

  const refreshInsights = () => {
    toast.success("Insights refreshed")
  }

  // ── Get suggested levers for drawer ──
  const getDrawerLevers = (): string[] => {
    if (!drawerInsight) return []
    if (drawerInsight.suggestedLevers?.length) return drawerInsight.suggestedLevers
    const supplierId = drawerInsight.linkedSupplierIds[0]
    const supplier = fleetSuppliers.find((s) => s.id === supplierId)
    if (!supplier) return []
    const playbook = playbooks.find((p) => p.type === supplier.type)
    return playbook?.levers.slice(0, 4) ?? []
  }

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* PAGE HEADER                                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Insights & Opportunities</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Signals from segmentation, profiles, network dependencies, and performance—triage and promote to opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={refreshInsights}>
            <RefreshCw className="h-3 w-3 mr-1.5" />
            Refresh Insights
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={() => setStagingOpen(true)}>
            <Target className="h-3 w-3 mr-1.5" />
            View Opportunities ({stagedOpps.length})
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* INSIGHTS TRACKER                                                            */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Insights Tracker</CardTitle>
            <span className="text-xs text-muted-foreground ml-1">
              {counts.risks} risks · {counts.opportunities} opportunities · {counts.observations} observations
            </span>
          </div>
        </CardHeader>

        {/* Filter Bar */}
        <div className="border-t border-b border-border px-4 py-2.5 flex flex-wrap items-center gap-2 bg-muted/30">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search supplier or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 w-48 pl-8 text-[11px]"
            />
          </div>
          <div className="h-4 w-px bg-border mx-1" />
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Select value={filterType} onValueChange={(v) => setFilterType(v as InsightType | "All")}>
            <SelectTrigger className="w-28 h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All" className="text-xs">All Types</SelectItem>
              <SelectItem value="Risk" className="text-xs">Risks</SelectItem>
              <SelectItem value="Opportunity" className="text-xs">Opportunities</SelectItem>
              <SelectItem value="Observation" className="text-xs">Observations</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSupplier} onValueChange={setFilterSupplier}>
            <SelectTrigger className="w-32 h-7 text-[11px]">
              <SelectValue placeholder="Supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Suppliers</SelectItem>
              {fleetSuppliers.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as SupplierType | "all")}>
            <SelectTrigger className="w-24 h-7 text-[11px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All</SelectItem>
              {ALL_SUPPLIER_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTimeRange} onValueChange={setFilterTimeRange}>
            <SelectTrigger className="w-24 h-7 text-[11px]">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Time</SelectItem>
              <SelectItem value="7d" className="text-xs">Last 7 days</SelectItem>
              <SelectItem value="30d" className="text-xs">Last 30 days</SelectItem>
              <SelectItem value="90d" className="text-xs">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as InsightStatus | "all")}>
            <SelectTrigger className="w-24 h-7 text-[11px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Status</SelectItem>
              <SelectItem value="New" className="text-xs">New</SelectItem>
              <SelectItem value="Triaged" className="text-xs">Triaged</SelectItem>
              <SelectItem value="Promoted" className="text-xs">Promoted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Insight List */}
        <CardContent className="p-0 max-h-[480px] overflow-y-auto">
          {filteredInsights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No insights found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Adjust filters or refresh insights.</p>
            </div>
          ) : (
            <div>
              {filteredInsights.map((ins) => (
                <InsightRow
                  key={ins.id}
                  insight={ins}
                  onViewEvidence={() => setDrawerInsight(ins)}
                  onPromote={() => promoteToOpportunity(ins)}
                  onDismiss={(reason) => dismissInsight(ins, reason)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* OPPORTUNITY STAGING                                                         */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <Collapsible open={stagingOpen} onOpenChange={setStagingOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {stagingOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <Target className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Opportunity Staging</CardTitle>
                  <span className="text-xs text-muted-foreground ml-1">{stagedOpps.length} staged</span>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-0">
              {stagedOpps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-t border-border">
                  <Lightbulb className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No opportunities staged yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Promote insights from the tracker above</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Opportunity</TableHead>
                      <TableHead>Suppliers</TableHead>
                      <TableHead className="w-20 text-center">Potential</TableHead>
                      <TableHead className="w-16 text-center">Effort</TableHead>
                      <TableHead className="w-20 text-center">Confidence</TableHead>
                      <TableHead className="w-24">Target</TableHead>
                      <TableHead className="w-24 text-center">Stage</TableHead>
                      <TableHead className="w-32"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stagedOpps.map((opp) => {
                      // Infer potential from valueRange
                      const valMatch = opp.valueRange.match(/\$(\d+)/)
                      const potential: LevelIndicator = valMatch && parseInt(valMatch[1], 10) >= 200 ? "High" : valMatch && parseInt(valMatch[1], 10) >= 50 ? "Medium" : "Low"
                      return (
                        <TableRow key={opp.id}>
                          <TableCell>
                            <p className="text-xs font-medium leading-relaxed line-clamp-2">{opp.statement}</p>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">{getSupplierText(opp.supplierIds)}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <LevelBadge level={potential} type="Opportunity" />
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-xs font-medium">{opp.effort}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn("text-xs font-medium", opp.confidence === "High" ? "text-emerald-600" : opp.confidence === "Medium" ? "text-amber-600" : "text-slate-500")}>{opp.confidence}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">{opp.targetQuarter}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "text-xs font-medium",
                              opp.stage === "Approved" ? "text-emerald-600" : opp.stage === "Validating" ? "text-sky-600" : "text-amber-600",
                            )}>{opp.stage}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {opp.stage !== "Approved" && (
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-emerald-600" onClick={() => pushToOpportunitySection(opp)}>
                                  Push
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => returnToTracker(opp)}>
                                Return
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* EVIDENCE DRAWER                                                             */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <Sheet open={!!drawerInsight} onOpenChange={(open) => !open && setDrawerInsight(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px] flex flex-col p-0">
          {drawerInsight && (
            <>
              {/* Header */}
              <div className="border-b border-border px-5 py-4 shrink-0">
                <SheetHeader className="space-y-0">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">{typeIcon[drawerInsight.type]}</div>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-sm leading-relaxed">{drawerInsight.title}</SheetTitle>
                      <SheetDescription className="mt-1.5 text-xs flex items-center gap-2 flex-wrap">
                        <span>{typeLabel[drawerInsight.type]}</span>
                        <span className="text-border">·</span>
                        <LevelBadge level={getInsightLevel(drawerInsight)} type={drawerInsight.type} />
                        <span className="text-border">·</span>
                        <span className={statusStyles[drawerInsight.status]}>{drawerInsight.status}</span>
                        <span className="text-border">·</span>
                        <span>{formatTimestamp(drawerInsight.timestamp)}</span>
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* What triggered this */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    What triggered this
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-md p-3">
                    {drawerInsight.evidence.trigger || "No trigger information available."}
                  </p>
                </div>

                {/* Key evidence metrics */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2">Key evidence</h4>
                  {drawerInsight.evidence.metrics.length > 0 ? (
                    <div className="rounded-md border border-border overflow-hidden">
                      <Table>
                        <TableBody>
                          {drawerInsight.evidence.metrics.slice(0, 6).map((m, i) => (
                            <TableRow key={i}>
                              <TableCell className="py-2 text-xs text-muted-foreground">{m.label}</TableCell>
                              <TableCell className="py-2 text-xs font-medium text-foreground text-right">{m.value}</TableCell>
                              {m.target && <TableCell className="py-2 text-xs text-muted-foreground text-right">Target: {m.target}</TableCell>}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic bg-muted/40 rounded-md p-3">Evidence metrics not available. Confidence: Low.</p>
                  )}
                </div>

                {/* Confidence + Last updated */}
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Confidence: </span>
                    <span className={cn(
                      "font-medium",
                      drawerInsight.evidence.metrics.length >= 3 ? "text-emerald-600" : drawerInsight.evidence.metrics.length >= 1 ? "text-amber-600" : "text-slate-500",
                    )}>
                      {drawerInsight.evidence.metrics.length >= 3 ? "High" : drawerInsight.evidence.metrics.length >= 1 ? "Medium" : "Low"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last updated: </span>
                    <span className="font-medium">{drawerInsight.timestamp}</span>
                  </div>
                </div>

                {/* Jump to source */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-primary" />
                    Jump to source
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {drawerInsight.evidence.jumpToSource.tab && (
                      <Button variant="outline" size="sm" className="h-7 text-[11px]">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {drawerInsight.evidence.jumpToSource.tab === "matrix" && "Segmentation Matrix"}
                        {drawerInsight.evidence.jumpToSource.tab === "profiles" && "Supplier Profile"}
                        {drawerInsight.evidence.jumpToSource.tab === "network" && "Tier 2-3 Network"}
                        {drawerInsight.evidence.jumpToSource.tab === "performance" && "Performance & Health"}
                      </Button>
                    )}
                    {drawerInsight.evidence.jumpToSource.section && (
                      <Button variant="outline" size="sm" className="h-7 text-[11px]">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {drawerInsight.evidence.jumpToSource.section} details
                      </Button>
                    )}
                  </div>
                </div>

                {/* Suggested levers (collapsed by default) */}
                {getDrawerLevers().length > 0 && (
                  <Collapsible open={leversOpen} onOpenChange={setLeversOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-muted-foreground w-full justify-start">
                        {leversOpen ? <ChevronDown className="h-3 w-3 mr-1.5" /> : <ChevronRight className="h-3 w-3 mr-1.5" />}
                        Suggested levers ({getDrawerLevers().length})
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ul className="mt-2 space-y-1.5 pl-4">
                        {getDrawerLevers().map((lever, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                            {lever}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Add note */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    Add note (optional)
                  </h4>
                  <Textarea
                    placeholder="Add context or notes..."
                    value={drawerNote}
                    onChange={(e) => setDrawerNote(e.target.value)}
                    className="text-xs min-h-[60px]"
                  />
                </div>

                {/* Assign owner */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    Assign owner (optional)
                  </h4>
                  <Input
                    placeholder="Owner name or email"
                    value={drawerOwner}
                    onChange={(e) => setDrawerOwner(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-border px-5 py-3 flex items-center justify-between shrink-0 bg-muted/20">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => markAsTriaged(drawerInsight)}>
                  <CheckCircle2 className="h-3 w-3 mr-1.5" />
                  Mark as Triaged
                </Button>
                <div className="flex items-center gap-2">
                  <Select onValueChange={(v) => dismissInsight(drawerInsight, v)}>
                    <SelectTrigger className="h-8 w-[120px] text-xs">
                      <XCircle className="h-3 w-3 mr-1.5" />
                      Dismiss
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="not-relevant" className="text-xs">Not relevant</SelectItem>
                      <SelectItem value="duplicate" className="text-xs">Duplicate</SelectItem>
                      <SelectItem value="insufficient-evidence" className="text-xs">Insufficient evidence</SelectItem>
                    </SelectContent>
                  </Select>
                  {drawerInsight.type !== "Observation" && drawerInsight.status !== "Promoted" && (
                    <Button size="sm" className="h-8 text-xs" onClick={() => promoteToOpportunity(drawerInsight)}>
                      <ArrowRight className="h-3 w-3 mr-1.5" />
                      Promote to Opportunity
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
