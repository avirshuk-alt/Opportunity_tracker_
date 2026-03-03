"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  PieChart as PieIcon, TrendingUp, Download, AlertTriangle, Upload,
  ShieldCheck, Sparkles, Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ComposedChart, Bar,
} from "recharts"
import {
  supplierRevenueData,
  getInfluenceBand,
  getCustomerShareInsights,
  formatCurrencyCompact,
  negotiationSuppliers,
  type SupplierRevenueData,
  type AiInsightCard,
} from "@/lib/negotiations-data"

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface CustomerShareVisualizationProps {
  supplierId: string
  timeRange: "1y" | "3y" | "5y"
}

/* ─── Influence Gauge ────────────────────────────────────────────────────── */

function InfluenceGauge({ sharePct, confidence }: { sharePct: number; confidence: number }) {
  const influence = getInfluenceBand(sharePct)

  // Build waffle grid: 10x10 = 100 cells
  const filledCells = Math.round(Math.min(sharePct, 100))
  const waffleData = Array.from({ length: 100 }, (_, i) => i < filledCells)

  return (
    <Card className="border-border">
      <CardContent className="py-5 px-5">
        <div className="flex items-start gap-5">
          {/* Big callout */}
          <div className="text-center shrink-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Customer Share
            </p>
            <p className="text-4xl font-bold text-foreground leading-none">
              {sharePct < 1 ? sharePct.toFixed(2) : sharePct.toFixed(1)}%
            </p>
            <Badge
              className={cn(
                "mt-2 text-[10px]",
                influence.band === "high" && "bg-primary/10 text-primary border-primary/20",
                influence.band === "medium" && "bg-amber-50 text-amber-700 border-amber-200",
                influence.band === "low" && "bg-muted text-muted-foreground border-border"
              )}
              variant="outline"
            >
              {influence.label}
            </Badge>
          </div>

          <Separator orientation="vertical" className="h-20 self-center" />

          {/* Waffle gauge */}
          <div className="flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Share of Wallet (visual)
            </p>
            <div className="grid grid-cols-10 gap-[2px]" role="img" aria-label={`Customer share gauge: ${sharePct.toFixed(2)}%`}>
              {waffleData.map((filled, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-3 w-3 rounded-[2px] transition-colors",
                    filled
                      ? influence.band === "high"
                        ? "bg-primary"
                        : influence.band === "medium"
                        ? "bg-amber-500"
                        : "bg-muted-foreground"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <ShieldCheck className={cn("h-3 w-3",
                confidence >= 80 ? "text-emerald-500" : confidence >= 60 ? "text-amber-500" : "text-red-400"
              )} />
              <span className="text-[10px] text-muted-foreground">
                Confidence: {confidence}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Dual-Axis Spend vs Revenue Chart ───────────────────────────────────── */

function SpendRevenueChart({ data, range }: { data: SupplierRevenueData; range: "1y" | "3y" | "5y" }) {
  const yearCount = range === "1y" ? 1 : range === "3y" ? 3 : 5
  const series = data.customerShareSeries.slice(-yearCount)

  const chartData = series.map((d) => ({
    year: String(d.year),
    spend: d.spend,
    revenue: d.supplierRevenue,
    sharePct: d.sharePct,
  }))

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null
    const shareEntry = chartData.find((d) => d.year === label)
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
        <p className="font-semibold mb-1.5">{label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">
                {entry.dataKey === "spend" ? "Our Spend" : "Supplier Revenue"}
              </span>
            </div>
            <span className="font-medium">{formatCurrencyCompact(entry.value)}</span>
          </div>
        ))}
        {shareEntry && (
          <>
            <Separator className="my-1.5" />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Customer Share</span>
              <span className="font-bold text-primary">{shareEntry.sharePct.toFixed(2)}%</span>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <YAxis
          yAxisId="spend"
          orientation="left"
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => formatCurrencyCompact(v)}
          className="text-muted-foreground"
          label={{ value: "Our Spend", angle: -90, position: "insideLeft", style: { fontSize: 9, fill: "hsl(var(--muted-foreground))" } }}
        />
        <YAxis
          yAxisId="revenue"
          orientation="right"
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => formatCurrencyCompact(v)}
          className="text-muted-foreground"
          label={{ value: "Supplier Revenue", angle: 90, position: "insideRight", style: { fontSize: 9, fill: "hsl(var(--muted-foreground))" } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Bar
          yAxisId="spend"
          dataKey="spend"
          fill="hsl(var(--primary))"
          fillOpacity={0.8}
          radius={[4, 4, 0, 0]}
          name="Our Spend"
          barSize={40}
        />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "hsl(var(--chart-2))", strokeWidth: 2, stroke: "hsl(var(--card))" }}
          name="Supplier Revenue"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/* ─── Share Trend Sparkline ──────────────────────────────────────────────── */

function ShareTrendChart({ data, range }: { data: SupplierRevenueData; range: "1y" | "3y" | "5y" }) {
  const yearCount = range === "1y" ? 1 : range === "3y" ? 3 : 5
  const series = data.customerShareSeries.slice(-yearCount)

  const chartData = series.map((d) => ({
    year: String(d.year),
    sharePct: d.sharePct,
  }))

  // Benchmark bands
  const bands = [
    { y: 1, label: "Low/Med", color: "hsl(var(--muted-foreground))" },
    { y: 5, label: "Med/High", color: "hsl(36, 82%, 54%)" },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => `${v.toFixed(1)}%`}
          className="text-muted-foreground"
          domain={[0, "auto"]}
        />
        <Tooltip
          formatter={(value: number) => [`${value.toFixed(2)}%`, "Customer Share"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
        />
        {bands.map((band) => (
          <ReferenceLine
            key={band.label}
            y={band.y}
            stroke={band.color}
            strokeDasharray="6 3"
            strokeOpacity={0.6}
            label={{ value: band.label, position: "insideTopRight", fontSize: 9, fill: band.color }}
          />
        ))}
        <Area
          type="monotone"
          dataKey="sharePct"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.12}
          strokeWidth={2.5}
          dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--card))" }}
          name="Customer Share %"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ─── AI Implication Card ────────────────────────────────────────────────── */

function ShareInsightsCard({ insights }: { insights: AiInsightCard[] }) {
  if (insights.length === 0) return null

  return (
    <Card className="border-dashed border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <CardTitle className="text-xs font-semibold">Negotiation Implications</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        {insights.map((insight) => (
          <div key={insight.id} className="space-y-2">
            <div className="space-y-1.5">
              {insight.summary.split(". ").filter(Boolean).map((bullet, i) => (
                <div key={i} className="flex gap-2">
                  <div className="mt-1.5 shrink-0">
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      insight.confidence === "High" ? "bg-emerald-500" : insight.confidence === "Medium" ? "bg-amber-500" : "bg-red-400"
                    )} />
                  </div>
                  <p className="text-[11px] text-foreground leading-relaxed">
                    {bullet.endsWith(".") ? bullet : `${bullet}.`}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {insight.evidenceRefs.map((ref) => (
                <div key={ref.label} className="flex items-center gap-1 bg-muted rounded px-2 py-1">
                  <span className="text-[9px] text-muted-foreground">{ref.label}:</span>
                  <span className="text-[9px] font-semibold">{ref.value}</span>
                </div>
              ))}
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] px-1.5 py-0 h-4 font-normal",
                insight.confidence === "High" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                insight.confidence === "Medium" && "bg-amber-50 text-amber-700 border-amber-200",
                insight.confidence === "Low" && "bg-red-50 text-red-700 border-red-200"
              )}
            >
              {insight.confidence} confidence
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ─── Data Missing State ─────────────────────────────────────────────────── */

function RevenueDataMissing({ supplierName }: { supplierName: string }) {
  return (
    <Card className="border-dashed border-amber-300 bg-amber-50/50">
      <CardContent className="py-8">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Supplier Revenue Data Not Available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue data for {supplierName} is not available. Customer share cannot be computed without supplier revenue.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Upload className="h-3 w-3" />
              Upload Supplier Report
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Info className="h-3 w-3" />
              Enter Estimate
            </Button>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-red-400" />
            Data coverage: 0% -- Revenue sourcing required
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function CustomerShareVisualization({ supplierId, timeRange }: CustomerShareVisualizationProps) {
  const supplier = negotiationSuppliers.find((s) => s.id === supplierId)
  const supplierName = supplier?.name ?? supplierId
  const revData = supplierRevenueData[supplierId]

  const insights = useMemo(() => getCustomerShareInsights(supplierId), [supplierId])

  // Export CSV
  const handleExportCSV = useCallback(() => {
    if (!revData) return
    const rows = [
      ["Year", "Our Spend ($)", "Supplier Revenue ($)", "Customer Share (%)"],
      ...revData.customerShareSeries.map((d) => [
        String(d.year),
        String(d.spend),
        String(d.supplierRevenue),
        d.sharePct.toFixed(4),
      ]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `customer-share-${supplierId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [revData, supplierId])

  if (!revData || !revData.revenueDataAvailable) {
    return <RevenueDataMissing supplierName={supplierName} />
  }

  const latest = revData.customerShareSeries[revData.customerShareSeries.length - 1]

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Spend vs Supplier Revenue
          </h3>
          {revData.dataProxy && (
            <Badge variant="outline" className="text-[9px] font-normal text-amber-600 border-amber-200 bg-amber-50 gap-1">
              <AlertTriangle className="h-2.5 w-2.5" />
              Proxy: {revData.dataProxy}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={handleExportCSV}>
          <Download className="h-3 w-3" />
          Export CSV
        </Button>
      </div>

      {/* Gauge + Trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        <InfluenceGauge sharePct={latest.sharePct} confidence={latest.confidence} />
        <Card>
          <CardHeader className="pb-1 pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Share Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <ShareTrendChart data={revData} range={timeRange} />
          </CardContent>
        </Card>
      </div>

      {/* Dual-axis chart */}
      <Card>
        <CardHeader className="pb-1 pt-4">
          <CardTitle className="text-sm">Our Spend vs Supplier Revenue</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <SpendRevenueChart data={revData} range={timeRange} />
        </CardContent>
      </Card>

      {/* AI Implications */}
      <ShareInsightsCard insights={insights} />

      {/* Source + last updated */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          Source: {revData.revenueSeries[0]?.source ?? "Multiple"} | Last updated: {revData.lastUpdated}
        </span>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className={cn("h-3 w-3",
            latest.confidence >= 80 ? "text-emerald-500" : latest.confidence >= 60 ? "text-amber-500" : "text-red-400"
          )} />
          Avg confidence: {Math.round(revData.customerShareSeries.reduce((a, b) => a + b.confidence, 0) / revData.customerShareSeries.length)}%
        </div>
      </div>
    </div>
  )
}
