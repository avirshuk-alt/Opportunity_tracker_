"use client"

import { useState, useMemo } from "react"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fleetSuppliers,
  supplierScorecards,
  supplierAIInsights,
  ALL_SUPPLIER_TYPES,
  SUPPLIER_TYPE_COLORS,
  SCORECARD_LABELS,
  formatCurrencyShort,
  type SupplierType,
  type ScorecarDimension,
} from "@/lib/supplier-strategy-data"
import { toast } from "sonner"

const dimensions = Object.keys(SCORECARD_LABELS) as ScorecarDimension[]

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

export function SupplierPerformanceTab() {
  const [radarSupplier, setRadarSupplier] = useState(fleetSuppliers[0].id)
  const [compareSupplier, setCompareSupplier] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<SupplierType | "All">("All")
  const [segmentFilter, setSegmentFilter] = useState<string>("All")
  const [sortDim, setSortDim] = useState<ScorecarDimension | "avg">("avg")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [savedInsights, setSavedInsights] = useState<Set<string>>(new Set())

  // ─── Radar Chart Data ───────────────────────────────────────────
  const radarData = useMemo(() => {
    const primary = supplierScorecards.find((sc) => sc.supplierId === radarSupplier)
    const compare = compareSupplier ? supplierScorecards.find((sc) => sc.supplierId === compareSupplier) : null
    return dimensions.map((dim) => ({
      dimension: SCORECARD_LABELS[dim],
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

  return (
    <div className="space-y-6">
      {/* Radar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm">Supplier Scorecard Radar</CardTitle>
              <CardDescription className="text-xs">Compare supplier performance across 7 dimensions</CardDescription>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar
                name={primaryName}
                dataKey="primary"
                stroke="hsl(215, 80%, 48%)"
                fill="hsl(215, 80%, 48%)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              {compareSupplier && (
                <Radar
                  name={compareName}
                  dataKey="compare"
                  stroke="hsl(160, 60%, 40%)"
                  fill="hsl(160, 60%, 40%)"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              )}
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rankings Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm">Supplier Performance Rankings</CardTitle>
              <CardDescription className="text-xs">Click column headers to sort. Filter by type or segment.</CardDescription>
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
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                        <p className="text-sm font-medium truncate">{row.name}</p>
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

      {/* AI Insights Panel */}
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
                <div
                  key={insight.id}
                  className={cn(
                    "rounded-lg border border-l-4 p-3.5 flex items-start gap-3",
                    severityStyle[insight.severity],
                  )}
                >
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
                    className={cn(
                      "h-7 text-xs shrink-0",
                      isSaved && "text-emerald-600",
                      !isSaved && "bg-transparent",
                    )}
                    onClick={() => !isSaved && saveInsight(insight.id)}
                    disabled={isSaved}
                  >
                    {isSaved ? (
                      <><CheckCircle2 className="mr-1 h-3 w-3" />Saved</>
                    ) : (
                      <><Save className="mr-1 h-3 w-3" />Save</>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
