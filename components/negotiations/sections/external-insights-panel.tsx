"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Search, Globe, Pin, PinOff, Sparkles, Clock, ShieldCheck, ExternalLink,
  TrendingUp, BarChart3, MapPin, Loader2, Download, Eye, EyeOff,
  ChevronRight, AlertTriangle, Building2, Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend, LineChart, Line, Brush, ReferenceLine,
} from "recharts"
import {
  type NegotiationWorkspace,
  type ExternalInsight,
  type MarketOverview,
  type SupplierGrowthSeries,
  marketOverviews,
  mockExternalInsights,
  negotiationSuppliers,
} from "@/lib/negotiations-data"

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface ExternalInsightsPanelProps {
  workspace: NegotiationWorkspace
  supplierId: string
  onUpdate: (ws: NegotiationWorkspace) => void
}

type GrowthTimeRange = "1y" | "3y" | "5y"
type TopN = 5 | 10 | 15

const SUPPLIER_COLORS = [
  "hsl(var(--primary))",      // negotiated supplier: always primary brand
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8b5cf6",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#6366f1",
  "#14b8a6",
  "#e11d48",
  "#a855f7",
]

/* ─── Supplier Detail Side Panel ────────────────────────────────────────── */

function SupplierDetailSheet({
  supplier,
  overview,
  open,
  onClose,
}: {
  supplier: SupplierGrowthSeries | null
  overview: MarketOverview
  open: boolean
  onClose: () => void
}) {
  const topSupplierRow = supplier
    ? overview.topSuppliers.find((s) => s.name === supplier.name)
    : null

  const lastPoint = supplier?.series[supplier.series.length - 1]
  const firstPoint = supplier?.series[0]
  const totalGrowth = lastPoint && firstPoint
    ? ((lastPoint.index - firstPoint.index) / firstPoint.index) * 100
    : 0

  // Simulated AI implication
  const aiLeverage = supplier?.isNegotiatedSupplier
    ? `${supplier.name} is growing faster than the overall market (${lastPoint?.yoyPct?.toFixed(1) ?? "N/A"}% vs. ${overview.cagr}% market CAGR). This indicates strong demand for their products, which may reduce your leverage on pricing. However, their capacity investment trajectory and your volume commitment can be used as counter-leverage in negotiations.`
    : supplier
      ? `${supplier.name} is ${(lastPoint?.yoyPct ?? 0) > overview.cagr ? "outpacing" : "trailing"} the market at ${lastPoint?.yoyPct?.toFixed(1) ?? "N/A"}% growth. ${(lastPoint?.yoyPct ?? 0) > overview.cagr ? "Their growth may signal competitive pressure on your negotiated supplier." : "Slower growth may indicate pricing pressure or capacity availability that could benefit your sourcing alternatives."}`
      : ""

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            {supplier?.name ?? "Supplier"}
            {supplier?.isNegotiatedSupplier && (
              <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">Negotiated</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {supplier && (
          <div className="space-y-5 mt-4">
            {/* Growth Summary */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Growth Summary</h4>
              <div className="grid grid-cols-3 gap-2">
                <Card><CardContent className="py-2 px-3">
                  <p className="text-[10px] text-muted-foreground">Total Growth</p>
                  <p className="text-sm font-bold">{totalGrowth.toFixed(1)}%</p>
                </CardContent></Card>
                <Card><CardContent className="py-2 px-3">
                  <p className="text-[10px] text-muted-foreground">Last 12m</p>
                  <p className="text-sm font-bold">{lastPoint?.yoyPct?.toFixed(1) ?? "N/A"}%</p>
                </CardContent></Card>
                <Card><CardContent className="py-2 px-3">
                  <p className="text-[10px] text-muted-foreground">vs Market</p>
                  <p className={cn("text-sm font-bold",
                    (lastPoint?.yoyPct ?? 0) > overview.cagr ? "text-emerald-600" : "text-destructive"
                  )}>{((lastPoint?.yoyPct ?? 0) - overview.cagr) > 0 ? "+" : ""}{((lastPoint?.yoyPct ?? 0) - overview.cagr).toFixed(1)}%</p>
                </CardContent></Card>
              </div>
            </div>

            {/* Market Share & Position */}
            {topSupplierRow && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Market Position</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Card><CardContent className="py-2 px-3">
                    <p className="text-[10px] text-muted-foreground">Market Share</p>
                    <p className="text-sm font-bold">{topSupplierRow.sharePercent}%</p>
                  </CardContent></Card>
                  <Card><CardContent className="py-2 px-3">
                    <p className="text-[10px] text-muted-foreground">CAGR</p>
                    <p className="text-sm font-bold">{topSupplierRow.growth}%</p>
                  </CardContent></Card>
                </div>
              </div>
            )}

            {/* Data Quality */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Data Quality</h4>
              <div className="grid grid-cols-2 gap-2">
                <Card><CardContent className="py-2 px-3">
                  <p className="text-[10px] text-muted-foreground">Coverage</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 h-1.5 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${supplier.coverage}%` }} />
                    </div>
                    <span className="text-xs font-medium">{supplier.coverage}%</span>
                  </div>
                </CardContent></Card>
                <Card><CardContent className="py-2 px-3">
                  <p className="text-[10px] text-muted-foreground">Confidence</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck className={cn("h-3 w-3",
                      supplier.confidence >= 80 ? "text-emerald-500" : supplier.confidence >= 60 ? "text-amber-500" : "text-red-400"
                    )} />
                    <span className="text-xs font-medium">{supplier.confidence}%</span>
                  </div>
                </CardContent></Card>
              </div>
              {supplier.dataProxy && (
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Data based on proxy: <strong>{supplier.dataProxy}</strong> (revenue unavailable)</span>
                </div>
              )}
            </div>

            <Separator />

            {/* AI Leverage Implications */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <h4 className="text-xs font-semibold text-primary">Implications for Leverage</h4>
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <p className="text-[11px] text-foreground leading-relaxed">{aiLeverage}</p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

/* ─── Growth Line Chart ─────────────────────────────────────────────────── */

function GrowthChart({
  overview,
  range,
  topN,
  showTopSuppliers,
  hiddenSeries,
  onToggleSeries,
  onClickSupplier,
}: {
  overview: MarketOverview
  range: GrowthTimeRange
  topN: TopN
  showTopSuppliers: boolean
  hiddenSeries: Set<string>
  onToggleSeries: (key: string) => void
  onClickSupplier: (s: SupplierGrowthSeries) => void
}) {
  // Filter series by time range
  const allYears = overview.marketGrowthSeries.series.map((p) => p.year)
  const maxYear = Math.max(...allYears)
  const minYear =
    range === "1y" ? maxYear - 1 :
    range === "3y" ? maxYear - 3 :
    maxYear - 5

  // Prepare visible suppliers: always include negotiated, then top N by share
  const visibleSuppliers = useMemo(() => {
    const negotiated = overview.supplierGrowthSeries.filter((s) => s.isNegotiatedSupplier)
    const others = overview.supplierGrowthSeries
      .filter((s) => !s.isNegotiatedSupplier)
      .slice(0, topN - negotiated.length)
    return [...negotiated, ...others]
  }, [overview.supplierGrowthSeries, topN])

  // Re-normalize to 100 at the minYear for all series
  const normalize = useCallback((series: { year: number; index: number }[]) => {
    const filtered = series.filter((p) => p.year >= minYear)
    if (filtered.length === 0) return []
    const base = filtered[0].index
    return filtered.map((p) => ({
      year: p.year,
      index: base > 0 ? (p.index / base) * 100 : 100,
    }))
  }, [minYear])

  const marketNorm = normalize(overview.marketGrowthSeries.series)

  // Build chart data: one row per year, columns = market + each supplier
  const chartData = useMemo(() => {
    const years = marketNorm.map((p) => p.year)
    return years.map((year) => {
      const row: Record<string, number | string> = { year }
      const mp = marketNorm.find((p) => p.year === year)
      row["Market"] = mp ? Number(mp.index.toFixed(1)) : 100

      if (showTopSuppliers) {
        visibleSuppliers.forEach((s) => {
          const norm = normalize(s.series)
          const sp = norm.find((p) => p.year === year)
          row[s.name] = sp ? Number(sp.index.toFixed(1)) : 100
        })
      }

      return row
    })
  }, [marketNorm, visibleSuppliers, showTopSuppliers, normalize])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
        <p className="font-semibold mb-1.5">{label}</p>
        {payload.map((entry) => {
          const prev = chartData.find((d) => Number(d.year) === Number(label) - 1)
          const prevVal = prev ? (prev[entry.dataKey] as number) : undefined
          const yoy = prevVal ? ((entry.value - prevVal) / prevVal * 100) : undefined
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground">{entry.dataKey}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{entry.value.toFixed(1)}</span>
                {yoy !== undefined && (
                  <span className={cn("text-[10px]", yoy >= 0 ? "text-emerald-600" : "text-destructive")}>
                    {yoy >= 0 ? "+" : ""}{yoy.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Legend click handler
  const handleLegendClick = (entry: { dataKey?: string; value?: string }) => {
    const key = entry.dataKey ?? entry.value ?? ""
    if (key && key !== "Market") {
      onToggleSeries(key)
    }
  }

  // Chart line click handler
  const handleLineClick = (supplierName: string) => {
    const s = visibleSuppliers.find((vs) => vs.name === supplierName)
    if (s) onClickSupplier(s)
  }

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <YAxis
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          domain={["auto", "auto"]}
          label={{ value: "Index (100 = base)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }}
        />
        <RTooltip content={<CustomTooltip />} />
        <Legend
          iconSize={8}
          wrapperStyle={{ fontSize: 11, cursor: "pointer" }}
          onClick={handleLegendClick}
          formatter={(value: string) => (
            <span className={cn(
              hiddenSeries.has(value) && "line-through opacity-40"
            )}>{value}</span>
          )}
        />
        <ReferenceLine y={100} stroke="hsl(var(--border))" strokeDasharray="4 4" />

        {/* Market line: dashed, neutral, always visible */}
        {!hiddenSeries.has("Market") && (
          <Line
            dataKey="Market"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ r: 3, fill: "hsl(var(--muted-foreground))" }}
            activeDot={{ r: 5 }}
          />
        )}

        {/* Supplier lines */}
        {showTopSuppliers && visibleSuppliers.map((s, i) => {
          if (hiddenSeries.has(s.name)) return null
          const isNegotiated = s.isNegotiatedSupplier
          const color = isNegotiated ? SUPPLIER_COLORS[0] : SUPPLIER_COLORS[(i % (SUPPLIER_COLORS.length - 1)) + 1]
          return (
            <Line
              key={s.name}
              dataKey={s.name}
              stroke={color}
              strokeWidth={isNegotiated ? 3 : 1.5}
              strokeOpacity={isNegotiated ? 1 : 0.7}
              dot={isNegotiated ? { r: 4, fill: color, strokeWidth: 2, stroke: "hsl(var(--card))" } : { r: 2.5, fill: color }}
              activeDot={{ r: 6, onClick: () => handleLineClick(s.name) }}
              style={{ cursor: "pointer" }}
              connectNulls
              strokeDasharray={s.dataProxy ? "4 2" : undefined}
            />
          )
        })}

        {chartData.length > 3 && (
          <Brush
            dataKey="year"
            height={20}
            stroke="hsl(var(--border))"
            fill="hsl(var(--muted))"
            travellerWidth={8}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

/* ─── Market Overview Component ─────────────────────────────────────────── */

function MarketOverviewPanel({ category, negotiatedSupplierId }: { category: string; negotiatedSupplierId: string }) {
  const overview = marketOverviews[category]
  const [range, setRange] = useState<GrowthTimeRange>("5y")
  const [topN, setTopN] = useState<TopN>(5)
  const [showTopSuppliers, setShowTopSuppliers] = useState(true)
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set())
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierGrowthSeries | null>(null)

  const toggleSeries = useCallback((key: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  if (!overview) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No market data available</p>
            <p className="text-xs text-muted-foreground mt-1">{"Market overview for \""}{category}{"\" is not yet available."}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Market Size</p>
            <p className="text-xl font-bold mt-0.5">${overview.marketSizeB}B</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">CAGR</p>
            <p className="text-xl font-bold mt-0.5">{overview.cagr}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Suppliers Tracked</p>
            <p className="text-xl font-bold mt-0.5">{overview.supplierGrowthSeries.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Regional Growth */}
      <Card>
        <CardHeader className="pb-1 pt-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Regional Growth Breakout</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={overview.regionalGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="region" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} className="text-muted-foreground" />
              <RTooltip
                formatter={(value: number) => [`${value}%`, "Growth"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="growth" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Supplier vs Market Growth -- TIME-SERIES LINE CHART */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Supplier vs Market Growth</CardTitle>
              <Badge variant="outline" className="text-[9px] font-normal">Indexed to 100</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm" className="h-7 gap-1 text-[10px]"
                onClick={() => {
                  /* Export stub */
                  const el = document.createElement("a")
                  el.setAttribute("href", "data:text/csv;charset=utf-8,Year,Market," + overview.supplierGrowthSeries.map(s => s.name).join(","))
                  el.setAttribute("download", `growth_series_${category}.csv`)
                  el.click()
                }}
              >
                <Download className="h-3 w-3" />
                Export
              </Button>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Time range */}
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
              {(["1y", "3y", "5y"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                    range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Top N */}
            <Select value={String(topN)} onValueChange={(v) => setTopN(Number(v) as TopN)}>
              <SelectTrigger className="h-7 w-[100px] text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5" className="text-xs">Top 5</SelectItem>
                <SelectItem value="10" className="text-xs">Top 10</SelectItem>
                <SelectItem value="15" className="text-xs">Top 15</SelectItem>
              </SelectContent>
            </Select>

            {/* Show suppliers toggle */}
            <div className="flex items-center gap-1.5">
              <Switch
                checked={showTopSuppliers}
                onCheckedChange={setShowTopSuppliers}
                className="h-4 w-7"
              />
              <span className="text-[10px] text-muted-foreground">Show suppliers</span>
            </div>

            {/* Data source */}
            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <ShieldCheck className={cn("h-3 w-3",
                overview.marketGrowthSeries.confidence >= 80 ? "text-emerald-500" : "text-amber-500"
              )} />
              <span>Confidence: {overview.marketGrowthSeries.confidence}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <GrowthChart
            overview={overview}
            range={range}
            topN={topN}
            showTopSuppliers={showTopSuppliers}
            hiddenSeries={hiddenSeries}
            onToggleSeries={toggleSeries}
            onClickSupplier={setSelectedSupplier}
          />

          {/* Proxy data legend */}
          {overview.supplierGrowthSeries.some((s) => s.dataProxy) && (
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Dashed lines indicate proxy data (e.g., shipment volume) where revenue is unavailable.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Suppliers Table */}
      <Card>
        <CardHeader className="pb-1 pt-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Supplier Comparison</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left font-medium px-3 py-2 text-muted-foreground">Supplier</th>
                  <th className="text-right font-medium px-3 py-2 text-muted-foreground">Market Share</th>
                  <th className="text-right font-medium px-3 py-2 text-muted-foreground">CAGR</th>
                  <th className="text-right font-medium px-3 py-2 text-muted-foreground">Last 12m</th>
                  <th className="text-right font-medium px-3 py-2 text-muted-foreground">vs Market</th>
                  <th className="text-right font-medium px-3 py-2 text-muted-foreground">Coverage</th>
                  <th className="text-center font-medium px-3 py-2 text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {overview.topSuppliers.map((s) => {
                  const delta = s.last12mGrowth - overview.cagr
                  const series = overview.supplierGrowthSeries.find((gs) => gs.name === s.name)
                  const isNeg = series?.isNegotiatedSupplier
                  return (
                    <tr key={s.name} className={cn("border-t border-border", isNeg && "bg-primary/5")}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("font-medium", isNeg && "text-primary")}>{s.name}</span>
                          {isNeg && <Badge className="text-[8px] bg-primary/10 text-primary border-primary/20 py-0">Negotiated</Badge>}
                          {series?.dataProxy && (
                            <Badge variant="outline" className="text-[8px] py-0 text-amber-600 border-amber-300">{series.dataProxy}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">{s.sharePercent}%</td>
                      <td className="px-3 py-2 text-right">{s.growth}%</td>
                      <td className="px-3 py-2 text-right">{s.last12mGrowth}%</td>
                      <td className={cn("px-3 py-2 text-right font-medium", delta > 0 ? "text-emerald-600" : delta < 0 ? "text-destructive" : "text-muted-foreground")}>
                        {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-10 h-1.5 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary/60" style={{ width: `${s.coverage}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{s.coverage}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {series && (
                          <Button
                            variant="ghost" size="sm" className="h-6 w-6 p-0"
                            onClick={() => setSelectedSupplier(series)}
                          >
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Citation / provenance */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
        <span className="flex items-center gap-1">
          <ExternalLink className="h-2.5 w-2.5" />
          Source: {overview.source}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          Last updated: {overview.lastUpdated}
        </span>
      </div>

      {/* Supplier Detail Side Panel */}
      <SupplierDetailSheet
        supplier={selectedSupplier}
        overview={overview}
        open={selectedSupplier !== null}
        onClose={() => setSelectedSupplier(null)}
      />
    </div>
  )
}

/* ─── Insight Search Component ──────────────────────────────────────────── */

function InsightSearchPanel({ workspace, supplierId }: { workspace: NegotiationWorkspace; supplierId: string }) {
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ExternalInsight[]>(mockExternalInsights)
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    new Set(mockExternalInsights.filter((i) => i.pinnedTo !== "workspace").map((i) => i.id))
  )
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({})

  const supplierName = negotiationSuppliers.find((s) => s.id === supplierId)?.name ?? "Supplier"

  const handleSearch = () => {
    if (!query.trim()) return
    setSearching(true)
    setTimeout(() => {
      const filtered = mockExternalInsights.filter(
        (i) =>
          i.title.toLowerCase().includes(query.toLowerCase()) ||
          i.summary.toLowerCase().includes(query.toLowerCase()) ||
          i.tags.some((t) => t.includes(query.toLowerCase()))
      )
      setResults(filtered.length > 0 ? filtered : mockExternalInsights)
      setSearching(false)
    }, 800)
  }

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAskAi = (insight: ExternalInsight) => {
    setAiLoading(insight.id)
    setTimeout(() => {
      const implications: Record<string, string> = {
        "ei-1": "The 8% drop in PP resin prices undermines any supplier argument for holding prices. You should anchor your negotiation on this index decline as evidence that raw material costs have decreased, supporting a price reduction ask of at least 5-8%.",
        "ei-2": "Capacity utilization at 76% means suppliers are competing for volume. This strengthens your BATNA significantly -- you have credible alternatives ready and the market is not supply-constrained.",
        "ei-3": "While DRAM index is up 14%, the 22% increase in wafer starts signals easing ahead. Use this to counter any supplier claims of sustained cost pressure -- the tide is turning in H2 2026.",
        "ei-4": "Beta's Fab 4 adds 30% capacity with only 60% pre-committed. This reduces their leverage argument and creates an opportunity to negotiate better pricing in exchange for volume commitment to fill their new capacity.",
        "ei-5": "CBAM regulation creates a differentiation lever: domestic or EU-based suppliers gain a cost advantage. Use this to renegotiate with non-EU suppliers on pricing to offset potential tariff exposure.",
      }
      setAiSummaries((prev) => ({
        ...prev,
        [insight.id]: implications[insight.id] ?? "This insight suggests a shift in market dynamics that may affect your negotiating position. Consider incorporating it into your fact base for the upcoming round.",
      }))
      setAiLoading(null)
    }, 1500)
  }

  const filteredResults = useMemo(() => {
    return results.filter((r) => r.pinnedTo === "workspace" || r.pinnedTo === supplierId)
  }, [results, supplierId])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search external insights (e.g., capacity utilization, commodity drivers, regulatory changes...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button size="sm" onClick={handleSearch} disabled={searching} className="gap-1.5">
          {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Search
        </Button>
      </div>

      {searching && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">Searching external sources...</span>
        </div>
      )}

      {!searching && (
        <div className="space-y-3">
          {filteredResults.map((insight) => (
            <Card key={insight.id} className={cn(
              "transition-all",
              pinnedIds.has(insight.id) && "border-primary/30"
            )}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-semibold">{insight.title}</h4>
                      <div className="flex items-center gap-1">
                        <ShieldCheck className={cn(
                          "h-3 w-3",
                          insight.confidence >= 80 ? "text-emerald-500" : insight.confidence >= 60 ? "text-amber-500" : "text-red-400"
                        )} />
                        <span className="text-[10px] text-muted-foreground">{insight.confidence}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.summary}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {insight.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[9px]">{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-2.5 w-2.5" />
                        {insight.source}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {insight.date}
                      </span>
                      <Badge variant="outline" className="text-[9px]">
                        {insight.pinnedTo === "workspace" ? "Workspace" : supplierName}
                      </Badge>
                    </div>
                    {aiSummaries[insight.id] && (
                      <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-semibold text-primary">AI Negotiation Implication</span>
                        </div>
                        <p className="text-[11px] text-foreground leading-relaxed">{aiSummaries[insight.id]}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost" size="sm"
                      className={cn("h-7 w-7 p-0", pinnedIds.has(insight.id) && "text-primary")}
                      onClick={() => togglePin(insight.id)}
                    >
                      {pinnedIds.has(insight.id) ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => handleAskAi(insight)}
                      disabled={aiLoading === insight.id}
                    >
                      {aiLoading === insight.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredResults.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center text-center">
                  <Search className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">No insights found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try different search terms or broaden your query.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Main External Insights Panel ──────────────────────────────────────── */

export function ExternalInsightsPanel({ workspace, supplierId, onUpdate }: ExternalInsightsPanelProps) {
  const [activeView, setActiveView] = useState<"overview" | "search">("overview")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveView("overview")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            activeView === "overview"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Market Overview
        </button>
        <button
          onClick={() => setActiveView("search")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            activeView === "search"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Search className="h-3.5 w-3.5" />
          Insight Search
        </button>
      </div>

      {activeView === "overview" ? (
        <MarketOverviewPanel category={workspace.category} negotiatedSupplierId={supplierId} />
      ) : (
        <InsightSearchPanel workspace={workspace} supplierId={supplierId} />
      )}
    </div>
  )
}
