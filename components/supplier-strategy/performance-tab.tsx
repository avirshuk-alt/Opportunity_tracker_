"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts"
import {
  Sparkles,
  Save,
  CheckCircle2,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Clock,
  FileText,
  ExternalLink,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fleetSuppliers,
  supplierScorecards,
  supplierAIInsights,
  getScoreReasoning,
  normalizeScoreReasoning,
  ALL_SUPPLIER_TYPES,
  SUPPLIER_TYPE_COLORS,
  SCORECARD_LABELS,
  DIMENSIONS,
  DIMENSION_IDS,
  formatCurrencyShort,
  type SupplierType,
  type ScorecarDimension,
  type DimensionReasoning,
} from "@/lib/supplier-strategy-data"
import { toast } from "sonner"

/* ─── Constants ────────────────────────────────────────────────────────────── */

// Use the canonical DIMENSION_IDS from the data file (single source of truth)
const dimensions = DIMENSION_IDS

const segBadge: Record<string, string> = {
  Strategic: "bg-primary/10 text-primary border-primary/20",
  Preferred: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Approved: "bg-sky-50 text-sky-700 border-sky-200",
  Transactional: "bg-slate-100 text-slate-600 border-slate-200",
}

const severityStyle: Record<string, string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-slate-400",
}

const dimMeta: Record<ScorecarDimension, { color: string; bg: string; border: string; dot: string }> = {
  tco:          { color: "text-blue-700",    bg: "bg-blue-50",     border: "border-blue-200",    dot: "bg-blue-500" },
  delivery:     { color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   dot: "bg-amber-500" },
  coverage:     { color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200",  dot: "bg-emerald-500" },
  compliance:   { color: "text-indigo-700",  bg: "bg-indigo-50",   border: "border-indigo-200",   dot: "bg-indigo-500" },
  claimsRepair: { color: "text-rose-700",    bg: "bg-rose-50",     border: "border-rose-200",     dot: "bg-rose-500" },
  reporting:    { color: "text-cyan-700",    bg: "bg-cyan-50",     border: "border-cyan-200",     dot: "bg-cyan-500" },
  innovation:   { color: "text-violet-700",  bg: "bg-violet-50",   border: "border-violet-200",   dot: "bg-violet-500" },
}

const confidenceBadge: Record<string, string> = {
  High:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low:    "bg-red-50 text-red-700 border-red-200",
}

const statusBadge: Record<string, string> = {
  "Not Started": "bg-slate-100 text-slate-600 border-slate-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  "Complete":    "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Blocked":     "bg-red-50 text-red-700 border-red-200",
}

/* ─── Shared Sub-Components ───────────────────────────────────────────────── */

function ScoreRing({ score, size = 64, stroke = 5 }: { score: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, score))
  const offset = c - (pct / 100) * c
  const col = pct >= 85 ? "stroke-emerald-500" : pct >= 70 ? "stroke-primary" : "stroke-red-500"
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/30" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset} className={col}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-foreground font-bold" fontSize={size * 0.26}>{score}</text>
    </svg>
  )
}

function ChangeBadge({ change }: { change: number }) {
  if (change === 0) return <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground"><Minus className="h-3 w-3" />0</span>
  const pos = change > 0
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium", pos ? "text-emerald-600" : "text-red-600")}>
      {pos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {pos ? "+" : ""}{change}
    </span>
  )
}

/* ─── Dimension Card (used inside the drawer) ─────────────────────────────── */

function DimensionCard({ dim, isExpanded, onToggle, isFocused }: {
  dim: DimensionReasoning
  isExpanded: boolean
  onToggle: () => void
  isFocused: boolean
}) {
  const meta = dimMeta[dim.dimension]
  return (
    <div
      data-dim={dim.dimension}
      className={cn(
        "rounded-lg border border-l-4 bg-background transition-all",
        meta.border,
        isFocused && "ring-2 ring-primary ring-offset-1",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-3 pb-2">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex items-center justify-center h-9 w-9 rounded-md text-sm font-bold", meta.bg, meta.color)}>
            {dim.score}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">{SCORECARD_LABELS[dim.dimension]}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <ChangeBadge change={dim.change} />
              <span className="text-[10px] text-muted-foreground">Prior: {dim.priorScore}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="outline" className={cn("text-[9px]", confidenceBadge[dim.confidence])}>
            <Shield className="mr-0.5 h-2.5 w-2.5" />{dim.confidence}
          </Badge>
          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />{dim.lastUpdated}
          </span>
        </div>
      </div>

      <div className="px-3 pb-3 space-y-2.5">
        {/* Why this score */}
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Why this score</p>
          <ul className="space-y-0.5">
            {dim.drivers.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-foreground leading-relaxed">
                <span className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", meta.dot)} />
                {d}
              </li>
            ))}
          </ul>
        </div>

        {/* Metric Evidence */}
        <div className="rounded-md border border-border bg-muted/20 p-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Metric Evidence</p>
          <div className="grid grid-cols-2 gap-1.5">
            {dim.calcs.slice(0, 4).map((c) => (
              <div key={c.metric} className="rounded-md border border-border bg-background p-1.5">
                <p className="text-[9px] text-muted-foreground truncate">{c.metric}</p>
                <p className="text-xs font-semibold text-foreground">{c.value}</p>
                <p className="text-[9px] text-muted-foreground">Target: {c.target}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Expandable Calculations */}
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <FileText className="h-3 w-3" />
              View calculations
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1.5 rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-[10px] font-semibold h-7">Metric</TableHead>
                    <TableHead className="text-[10px] font-semibold h-7 text-center">Value</TableHead>
                    <TableHead className="text-[10px] font-semibold h-7 text-center">Target</TableHead>
                    <TableHead className="text-[10px] font-semibold h-7 text-center">Weight</TableHead>
                    <TableHead className="text-[10px] font-semibold h-7 text-center">Contrib.</TableHead>
                    <TableHead className="text-[10px] font-semibold h-7">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dim.calcs.map((c, ci) => (
                    <TableRow key={ci}>
                      <TableCell className="text-[11px] py-1.5">{c.metric}</TableCell>
                      <TableCell className="text-[11px] py-1.5 text-center font-medium">{c.value}</TableCell>
                      <TableCell className="text-[11px] py-1.5 text-center text-muted-foreground">{c.target}</TableCell>
                      <TableCell className="text-[11px] py-1.5 text-center">{c.weight}%</TableCell>
                      <TableCell className="text-center py-1.5">
                        <span className={cn(
                          "text-[11px] font-medium",
                          c.contribution >= c.weight * 0.9 ? "text-emerald-600" : c.contribution >= c.weight * 0.7 ? "text-foreground" : "text-red-600",
                        )}>
                          {c.contribution}
                        </span>
                      </TableCell>
                      <TableCell className="text-[9px] text-muted-foreground py-1.5">{c.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ─── Main Component ──────────────────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function SupplierPerformanceTab() {
  const [radarSupplier, setRadarSupplier] = useState(fleetSuppliers[0].id)
  const [compareSupplier, setCompareSupplier] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<SupplierType | "All">("All")
  const [segmentFilter, setSegmentFilter] = useState<string>("All")
  const [sortDim, setSortDim] = useState<ScorecarDimension | "avg">("avg")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [savedInsights, setSavedInsights] = useState<Set<string>>(new Set())

  // ─── Drawer State ──────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerSupplierId, setDrawerSupplierId] = useState<string | null>(null)
  const [drawerTimePeriod, setDrawerTimePeriod] = useState("Q1 2026")
  const [expandedCalcs, setExpandedCalcs] = useState<Set<string>>(new Set())
  const [focusedDim, setFocusedDim] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const openDrawer = useCallback((supplierId: string, dim?: string) => {
    setDrawerSupplierId(supplierId)
    setExpandedCalcs(new Set())
    setFocusedDim(dim ?? null)
    setDrawerOpen(true)
    // scroll to focused dimension after open
    if (dim) {
      setTimeout(() => {
        const el = scrollRef.current?.querySelector(`[data-dim="${dim}"]`)
        el?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 350)
    }
  }, [])

  const toggleCalc = (dim: string) => {
    setExpandedCalcs((prev) => {
      const next = new Set(prev)
      if (next.has(dim)) next.delete(dim)
      else next.add(dim)
      return next
    })
  }

  const drawerSupplier = drawerSupplierId ? fleetSuppliers.find((s) => s.id === drawerSupplierId) : null
  const drawerRawReasoning = drawerSupplierId ? getScoreReasoning(drawerSupplierId) : undefined
  const drawerNormalized = useMemo(() => {
    if (!drawerSupplierId) return null
    return normalizeScoreReasoning(drawerRawReasoning, drawerSupplier ?? undefined)
  }, [drawerSupplierId, drawerRawReasoning, drawerSupplier])

  // ─── Radar Chart Data ───────────────────────────────────────────
  const radarData = useMemo(() => {
    const primary = supplierScorecards.find((sc) => sc.supplierId === radarSupplier)
    const compare = compareSupplier ? supplierScorecards.find((sc) => sc.supplierId === compareSupplier) : null
    return dimensions.map((dim) => ({
      dimension: SCORECARD_LABELS[dim],
      dimKey: dim,
      primary: primary?.scores[dim] ?? 0,
      ...(compare ? { compare: compare.scores[dim] } : {}),
    }))
  }, [radarSupplier, compareSupplier])

  const primaryName = fleetSuppliers.find((s) => s.id === radarSupplier)?.name ?? ""
  const compareName = compareSupplier ? fleetSuppliers.find((s) => s.id === compareSupplier)?.name ?? "" : ""

  // ─── Filtered + Sorted Table ────────────────────────────────────
  const tableRows = useMemo(() => {
    let rows = fleetSuppliers.map((s) => {
      const sc = supplierScorecards.find((x) => x.supplierId === s.id)
      const scores = sc?.scores ?? {} as Record<ScorecarDimension, number>
      const avg = dimensions.length > 0
        ? dimensions.reduce((a, d) => a + (scores[d] ?? 0), 0) / dimensions.length
        : 0
      return { ...s, scores, avg }
    })
    if (typeFilter !== "All") rows = rows.filter((r) => r.type === typeFilter)
    if (segmentFilter !== "All") rows = rows.filter((r) => r.segment === segmentFilter)
    rows.sort((a, b) => {
      const aVal = sortDim === "avg" ? a.avg : (a.scores[sortDim] ?? 0)
      const bVal = sortDim === "avg" ? b.avg : (b.scores[sortDim] ?? 0)
      return sortDir === "desc" ? bVal - aVal : aVal - bVal
    })
    return rows
  }, [typeFilter, segmentFilter, sortDim, sortDir])

  const handleSort = (dim: ScorecarDimension | "avg") => {
    if (sortDim === dim) setSortDir((p) => (p === "desc" ? "asc" : "desc"))
    else { setSortDim(dim); setSortDir("desc") }
  }

  const saveInsight = (id: string) => {
    setSavedInsights((prev) => new Set(prev).add(id))
    toast.success("Insight saved to Fact Base")
  }

  // ─── Radar axis click handler ──────────────────────────────────
  const handleAxisClick = useCallback((payload: { value?: string }) => {
    if (!payload?.value) return
    const dimKey = dimensions.find((d) => SCORECARD_LABELS[d] === payload.value)
    if (dimKey) openDrawer(radarSupplier, dimKey)
  }, [radarSupplier, openDrawer])

  return (
    <div className="space-y-6">
      {/* ═══ Radar Chart ═══════════════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm">Supplier Scorecard Radar</CardTitle>
              <CardDescription className="text-xs">Compare supplier performance across 7 dimensions. Click an axis label to see reasoning.</CardDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              <Select value={radarSupplier} onValueChange={setRadarSupplier}>
                <SelectTrigger className="w-48 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fleetSuppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={compareSupplier || "none"} onValueChange={(v) => setCompareSupplier(v === "none" ? "" : v)}>
                <SelectTrigger className="w-48 h-8 text-xs">
                  <SelectValue placeholder="Compare with..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">No comparison</SelectItem>
                  {fleetSuppliers.filter((s) => s.id !== radarSupplier).map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openDrawer(radarSupplier)}>
                <ExternalLink className="mr-1 h-3 w-3" />
                Score Reasoning
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 10, cursor: "pointer" }}
                onClick={(e: unknown) => handleAxisClick(e as { value?: string })}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name={primaryName} dataKey="primary" stroke="hsl(215, 80%, 48%)" fill="hsl(215, 80%, 48%)" fillOpacity={0.15} strokeWidth={2} />
              {compareSupplier && (
                <Radar name={compareName} dataKey="compare" stroke="hsl(160, 60%, 40%)" fill="hsl(160, 60%, 40%)" fillOpacity={0.1} strokeWidth={2} />
              )}
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ═══ Rankings Table ════════════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm">Supplier Performance Rankings</CardTitle>
              <CardDescription className="text-xs">Click a row to view score reasoning. Click column headers to sort.</CardDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as SupplierType | "All")}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-xs">All Types</SelectItem>
                  {ALL_SUPPLIER_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-xs">All Segments</SelectItem>
                  {["Strategic", "Preferred", "Approved", "Transactional"].map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Supplier</TableHead>
                  <TableHead className="w-[90px]">Type</TableHead>
                  <TableHead className="w-[90px]">Segment</TableHead>
                  {dimensions.map((dim) => (
                    <TableHead key={dim} className="w-[80px] text-center">
                      <button
                        onClick={() => handleSort(dim)}
                        className="inline-flex items-center gap-0.5 text-xs hover:text-foreground transition-colors"
                      >
                        {SCORECARD_LABELS[dim].split(" ")[0]}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                  ))}
                  <TableHead className="w-[70px] text-center">
                    <button
                      onClick={() => handleSort("avg")}
                      className="inline-flex items-center gap-0.5 text-xs font-semibold hover:text-foreground transition-colors"
                    >
                      Avg
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row, i) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors group"
                    onClick={() => openDrawer(row.id)}
                    title="View score details"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                        <p className="text-sm font-medium truncate">{row.name}</p>
                        <ExternalLink className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors shrink-0" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]" style={{ backgroundColor: `${SUPPLIER_TYPE_COLORS[row.type]}10`, color: SUPPLIER_TYPE_COLORS[row.type], borderColor: `${SUPPLIER_TYPE_COLORS[row.type]}30` }}>
                        {row.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", segBadge[row.segment])}>{row.segment}</Badge>
                    </TableCell>
                    {dimensions.map((dim) => {
                      const score = row.scores[dim] ?? 0
                      return (
                        <TableCell key={dim} className="text-center">
                          <span className={cn(
                            "text-xs font-medium",
                            score >= 85 ? "text-emerald-600" : score >= 70 ? "text-foreground" : "text-red-600",
                          )}>
                            {score}
                          </span>
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-center">
                      <span className="text-xs font-bold">{row.avg.toFixed(0)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ═══ AI Insights ══════════════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">AI-Generated Insights</CardTitle>
          </div>
          <CardDescription className="text-xs">Insights derived from supplier performance data and network analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {supplierAIInsights.map((insight) => {
              const isSaved = savedInsights.has(insight.id)
              return (
                <div key={insight.id} className={cn("rounded-lg border border-l-4 p-3.5 flex items-start gap-3", severityStyle[insight.severity])}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge variant="outline" className={cn(
                        "text-[9px]",
                        insight.severity === "high" ? "bg-red-50 text-red-600 border-red-200" :
                        insight.severity === "medium" ? "bg-amber-50 text-amber-600 border-amber-200" :
                        "bg-slate-50 text-slate-600 border-slate-200",
                      )}>
                        {insight.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{insight.text}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isSaved ? "ghost" : "outline"}
                    className={cn("h-7 text-xs shrink-0", isSaved && "text-emerald-600", !isSaved && "bg-transparent")}
                    onClick={() => !isSaved && saveInsight(insight.id)}
                    disabled={isSaved}
                  >
                    {isSaved ? <><CheckCircle2 className="mr-1 h-3 w-3" />Saved</> : <><Save className="mr-1 h-3 w-3" />Save</>}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ═══ Score Reasoning Drawer ═══════════════════════════════════ */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col overflow-hidden"
        >
          {drawerNormalized ? (
            <>
              {/* ─── Drawer Header ─────────────────────────────────────── */}
              <div className="border-b border-border px-5 py-4 shrink-0">
                <SheetHeader className="space-y-0">
                  <div className="flex items-start justify-between gap-4 pr-6">
                    <div className="flex items-center gap-4 min-w-0">
                      {drawerNormalized.overallScore != null ? (
                        <ScoreRing score={drawerNormalized.overallScore} size={56} stroke={5} />
                      ) : (
                        <div className="flex items-center justify-center h-14 w-14 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0">
                          <span className="text-sm font-bold text-muted-foreground">--</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <SheetTitle className="text-base truncate">{drawerNormalized.supplierName}</SheetTitle>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {drawerSupplier && (
                            <>
                              <Badge variant="outline" className="text-[9px]" style={{
                                backgroundColor: `${SUPPLIER_TYPE_COLORS[drawerSupplier.type]}10`,
                                color: SUPPLIER_TYPE_COLORS[drawerSupplier.type],
                                borderColor: `${SUPPLIER_TYPE_COLORS[drawerSupplier.type]}30`,
                              }}>
                                {drawerSupplier.type}
                              </Badge>
                              <Badge variant="outline" className={cn("text-[9px]", segBadge[drawerSupplier.segment])}>{drawerSupplier.segment}</Badge>
                              <Badge variant="outline" className="text-[9px]">Tier {drawerSupplier.tier}</Badge>
                            </>
                          )}
                        </div>
                        <SheetDescription className="mt-1 text-xs">
                          {drawerNormalized.overallScore != null ? (
                            <>
                              Score <span className="font-semibold text-foreground">{drawerNormalized.overallScore}</span>
                              {drawerNormalized.priorOverallScore != null && (
                                <>{" "}<ChangeBadge change={drawerNormalized.overallScore - drawerNormalized.priorOverallScore} /></>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">Score pending</span>
                          )}
                          {drawerSupplier && (
                            <>{" -- "}{drawerSupplier.regions.join(", ")} -- {formatCurrencyShort(drawerSupplier.annualSpend)}/yr</>
                          )}
                        </SheetDescription>
                      </div>
                    </div>
                    <Select value={drawerTimePeriod} onValueChange={setDrawerTimePeriod}>
                      <SelectTrigger className="w-36 h-7 text-[11px] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Q1 2026" className="text-xs">Q1 2026 (Current)</SelectItem>
                        <SelectItem value="Q4 2025" className="text-xs">Q4 2025</SelectItem>
                        <SelectItem value="Trailing 12M" className="text-xs">Trailing 12 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </SheetHeader>
              </div>

              {/* ─── Scrollable Body ──────────────────────────────────── */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {/* Dimension Cards -- always exactly 7 in canonical order */}
                {drawerNormalized.dimensions.map((dim) => {
                  const hasData = dim.score != null && dim.score !== (null as unknown as number)
                  const meta = dimMeta[dim.dimension] ?? dimMeta.tco
                  return hasData ? (
                    <DimensionCard
                      key={dim.dimension}
                      dim={dim}
                      isExpanded={expandedCalcs.has(dim.dimension)}
                      onToggle={() => toggleCalc(dim.dimension)}
                      isFocused={focusedDim === dim.dimension}
                    />
                  ) : (
                    /* Placeholder card for missing dimension data */
                    <div
                      key={dim.dimension}
                      data-dim={dim.dimension}
                      className={cn(
                        "rounded-lg border border-l-4 border-dashed bg-muted/10 p-3",
                        meta.border,
                        focusedDim === dim.dimension && "ring-2 ring-primary ring-offset-1",
                      )}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={cn("h-9 w-9 rounded-md flex items-center justify-center text-sm font-bold", meta.bg, meta.color)}>--</div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{dim.label}</p>
                          <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-500 border-slate-200 mt-0.5">
                            <Shield className="mr-0.5 h-2.5 w-2.5" />TBD
                          </Badge>
                        </div>
                      </div>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Why this score</p>
                      <ul className="space-y-0.5">
                        {(dim.drivers ?? []).map((d, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground italic leading-relaxed">
                            <span className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-muted-foreground/30")} />
                            {d}
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-muted-foreground mt-2 italic">Metric evidence and calculation details unavailable.</p>
                    </div>
                  )
                })}

                {/* ─── What Changed ──────────────────────────────────── */}
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center gap-2 mb-2.5">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">What Changed</p>
                    <span className="text-[10px] text-muted-foreground">Biggest movers vs prior period</span>
                  </div>
                  <div className="space-y-2">
                    {(drawerNormalized.scoreMovers ?? []).map((m, i) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-md border border-border p-2.5">
                        <div className={cn(
                          "flex items-center justify-center h-7 w-7 rounded-md shrink-0",
                          m.direction === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
                        )}>
                          {m.direction === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-foreground">{SCORECARD_LABELS[m.dimension]}</span>
                            <ChangeBadge change={m.direction === "up" ? m.delta : -m.delta} />
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{m.reason}</p>
                        </div>
                      </div>
                    ))}
                    {(drawerNormalized.scoreMovers ?? []).length === 0 && (
                      <p className="text-xs text-muted-foreground italic py-3 text-center">No significant score movements in this period.</p>
                    )}
                  </div>
                </div>

                {/* ─── Actions ────────────────────────────────────────── */}
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center gap-2 mb-2.5">
                    <ExternalLink className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Recommended Actions</p>
                  </div>
                  <div className="space-y-2">
                    {(drawerNormalized.actions ?? []).map((act) => (
                      <div key={act.id} className="rounded-md border border-border p-2.5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs font-medium text-foreground leading-relaxed">{act.title}</p>
                          <Badge variant="outline" className={cn("text-[9px] shrink-0", statusBadge[act.status] ?? "bg-slate-100 text-slate-600 border-slate-200")}>
                            {act.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>Playbook: <span className="font-medium text-foreground">{act.playbookLink}</span></span>
                          <span className="text-border">|</span>
                          <span>Owner: <span className="font-medium text-foreground">{act.owner}</span></span>
                          <span className="text-border">|</span>
                          <span>Due: <span className="font-medium text-foreground">{act.dueDate}</span></span>
                        </div>
                      </div>
                    ))}
                    {(drawerNormalized.actions ?? []).length === 0 && (
                      <p className="text-xs text-muted-foreground italic py-3 text-center">No linked actions for this supplier.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ─── No supplier selected state ──────────────────────── */
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5">
              <SheetHeader>
                <SheetTitle className="text-base">Score Reasoning</SheetTitle>
                <SheetDescription className="text-xs">Select a supplier to view score reasoning.</SheetDescription>
              </SheetHeader>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
