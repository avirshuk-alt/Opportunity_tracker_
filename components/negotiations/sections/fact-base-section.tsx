"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Globe, FileText, ChevronDown, ChevronRight, ExternalLink, ShieldCheck,
  TrendingUp, BarChart3, LineChart, Activity, PanelRightOpen, PanelRightClose,
  Download, SlidersHorizontal, X, Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AreaChart, Area, BarChart, Bar, LineChart as RLineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import {
  type NegotiationWorkspace,
  type FactSection,
  negotiationSuppliers,
  getFactPackForSupplierRuntime,
  formatCurrencyCompact,
  MASTER_SKUS,
} from "@/lib/negotiations-data"
import { ExternalInsightsPanel } from "./external-insights-panel"
import { CustomerShareVisualization } from "./customer-share-visualization"
import { SupplierProfileTab } from "./supplier-profile-tab"

/* ─── Types & Constants ─────────────────────────────────────────────────── */

interface FactBaseSectionProps {
  workspace: NegotiationWorkspace
  onUpdate: (ws: NegotiationWorkspace) => void
}

const FACT_CATEGORY_LABELS: Record<string, string> = {
  "market-growth": "Market Growth",
  capacity: "Capacity & Utilization",
  indices: "Indices & Benchmarks",
  "financial-health": "Financial Health",
  spend: "Spend Analysis",
  "price-history": "Price & Volume History",
  contract: "Contract Details",
  "sla-performance": "SLA & Performance",
}

type TimeRange = "1y" | "3y" | "5y"

/* ─── Spend History Chart ───────────────────────────────────────────────── */

function SpendHistoryChart({ supplierId, range }: { supplierId: string; range: TimeRange }) {
  const factPack = getFactPackForSupplierRuntime(supplierId)
  if (!factPack) return <EmptyChart message="No spend history data available" />

  const yearCount = range === "1y" ? 1 : range === "3y" ? 3 : 5
  const data = factPack.spendHistory.slice(-yearCount).map((d) => ({
    year: String(d.year),
    total: d.total,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => formatCurrencyCompact(v)}
          className="text-muted-foreground"
        />
        <Tooltip
          formatter={(value: number) => [formatCurrencyCompact(value), "Total Spend"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ─── Spend by SKU Chart ────────────────────────────────────────────────── */

function SpendBySkuChart({
  supplierId,
  selectedSku,
  onSelectSku,
}: {
  supplierId: string
  selectedSku: string | null
  onSelectSku: (sku: string | null) => void
}) {
  const factPack = getFactPackForSupplierRuntime(supplierId)
  if (!factPack) return <EmptyChart message="No SKU spend data available" />

  const latest = factPack.spendHistory[factPack.spendHistory.length - 1]
  if (!latest) return <EmptyChart message="No spend data" />

  const data = Object.entries(latest.bySku)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

  const COLORS_DIM = [
    "hsl(var(--primary) / 0.25)",
    "hsl(var(--chart-2) / 0.25)",
    "hsl(var(--chart-3) / 0.25)",
    "hsl(var(--chart-4) / 0.25)",
    "hsl(var(--chart-5) / 0.25)",
  ]

  const handleBarClick = (entry: { name: string }) => {
    onSelectSku(selectedSku === entry.name ? null : entry.name)
  }

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
          onClick={(state) => {
            if (state?.activePayload?.[0]?.payload) {
              handleBarClick(state.activePayload[0].payload)
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatCurrencyCompact(v)} className="text-muted-foreground" />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} className="text-muted-foreground" />
          <Tooltip
            formatter={(value: number) => [formatCurrencyCompact(value), "Spend"]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, idx) => (
              <rect
                key={idx}
                fill={
                  selectedSku === null
                    ? COLORS[idx % COLORS.length]
                    : selectedSku === entry.name
                    ? COLORS[idx % COLORS.length]
                    : COLORS_DIM[idx % COLORS_DIM.length]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Top SKUs table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left font-medium px-3 py-2 text-muted-foreground">SKU</th>
              <th className="text-right font-medium px-3 py-2 text-muted-foreground">Spend</th>
              <th className="text-right font-medium px-3 py-2 text-muted-foreground">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr
                key={d.name}
                onClick={() => onSelectSku(selectedSku === d.name ? null : d.name)}
                className={cn(
                  "border-t border-border cursor-pointer transition-colors",
                  selectedSku === d.name
                    ? "bg-primary/[0.06] ring-1 ring-inset ring-primary/20"
                    : "hover:bg-muted/40"
                )}
              >
                <td className="px-3 py-2 font-medium">
                  <div className="flex items-center gap-1.5">
                    {selectedSku === d.name && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    )}
                    {d.name}
                  </div>
                </td>
                <td className="px-3 py-2 text-right">{formatCurrencyCompact(d.value)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {((d.value / latest.total) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Price & Volume Chart (dual axis) ──────────────────────────────────── */

function PriceVolumeChart({
  supplierId,
  range,
  selectedSku,
  onClearSku,
}: {
  supplierId: string
  range: TimeRange
  selectedSku: string | null
  onClearSku: () => void
}) {
  const factPack = getFactPackForSupplierRuntime(supplierId)
  if (!factPack) return <EmptyChart message="No price/volume data available" />

  const quarters = range === "1y" ? 4 : range === "3y" ? 12 : 20

  // Filter: if a SKU is selected, only show rows with that sku field
  // If no SKU selected, show aggregated rows (sku === undefined)
  const filtered = useMemo(() => {
    const subset = selectedSku
      ? factPack.priceVolume.filter((p) => p.sku === selectedSku)
      : factPack.priceVolume.filter((p) => !p.sku)
    return subset.slice(-quarters)
  }, [factPack.priceVolume, selectedSku, quarters])

  // Find the SKU code from MASTER_SKUS for the pill
  const skuCode = useMemo(() => {
    if (!selectedSku) return null
    const found = MASTER_SKUS.find((s) => s.name === selectedSku)
    return found?.code ?? null
  }, [selectedSku])

  return (
    <div className="space-y-2">
      {/* Selected SKU pill */}
      {selectedSku && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary pl-2.5 pr-1.5 py-1 text-[11px] font-medium">
            {selectedSku}{skuCode ? ` (${skuCode})` : ""}
            <button
              onClick={onClearSku}
              className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
              aria-label="Clear SKU selection"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 rounded-lg border border-dashed border-border bg-muted/20 gap-2">
          <p className="text-xs text-muted-foreground">
            No price/volume history available for this SKU
          </p>
          <Button variant="outline" size="sm" className="text-[10px]" onClick={onClearSku}>
            Select another SKU
          </Button>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <RLineChart data={filtered} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <YAxis yAxisId="price" orientation="left" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} className="text-muted-foreground" />
            <YAxis yAxisId="volume" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} className="text-muted-foreground" />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
              formatter={(value: number, name: string) => [
                name === "price" ? `$${value.toFixed(2)}` : `${(value / 1000).toFixed(0)}K units`,
                name === "price" ? "Unit Price" : "Volume",
              ]}
              labelFormatter={(label) => selectedSku ? `${label} - ${selectedSku}` : label}
            />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Line yAxisId="price" type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Unit Price" />
            <Line yAxisId="volume" type="monotone" dataKey="volume" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" name="Volume" />
          </RLineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

/* ─── SLA Performance Chart ─────────────────────────────────────────────── */

function SlaPerformanceChart({ supplierId }: { supplierId: string }) {
  const factPack = getFactPackForSupplierRuntime(supplierId)
  if (!factPack) return <EmptyChart message="No SLA data available" />

  const data = factPack.slaPerformance

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* OTD chart */}
      <div>
        <p className="text-xs font-medium mb-2 text-muted-foreground">On-Time Delivery (%)</p>
        <ResponsiveContainer width="100%" height={180}>
          <RLineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <YAxis domain={[85, 100]} tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
            <ReferenceLine y={data[0]?.otdTarget ?? 95} stroke="hsl(var(--chart-3))" strokeDasharray="6 3" label={{ value: "Target", position: "insideTopRight", fontSize: 10, fill: "hsl(var(--chart-3))" }} />
            <Line type="monotone" dataKey="otd" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="OTD %" />
          </RLineChart>
        </ResponsiveContainer>
      </div>
      {/* Reject rate chart */}
      <div>
        <p className="text-xs font-medium mb-2 text-muted-foreground">Reject Rate (%)</p>
        <ResponsiveContainer width="100%" height={180}>
          <RLineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <YAxis domain={[0, 3]} tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
            <ReferenceLine y={data[0]?.rejectTarget ?? 1.5} stroke="hsl(var(--destructive))" strokeDasharray="6 3" label={{ value: "Target", position: "insideTopRight", fontSize: 10, fill: "hsl(var(--destructive))" }} />
            <Line type="monotone" dataKey="rejectRate" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} name="Reject %" />
          </RLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ─── Empty chart placeholder ───────────────────────────────────────────── */

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 rounded-lg border border-dashed border-border bg-muted/20">
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  )
}

/* ─── Evidence Drawer ───────────────────────────────────────────────────── */

function EvidenceDrawer({
  factSections,
  open,
}: {
  factSections: FactSection[]
  open: boolean
}) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!open) return null

  return (
    <div className="w-80 shrink-0 border-l border-border pl-4 space-y-3 overflow-y-auto max-h-[calc(100vh-16rem)]">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence & Notes</h4>
      {factSections.map((section) => (
        <div key={section.id} className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            {section.type === "external" ? <Globe className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
            {section.title}
          </p>
          {section.items.map((item) => {
            const isExpanded = expandedItems.has(item.id)
            return (
              <div key={item.id} className={cn("rounded-lg border transition-colors", isExpanded ? "border-primary/30 bg-primary/[0.02]" : "border-border")}>
                <button onClick={() => toggleItem(item.id)} className="w-full flex items-center gap-2 px-2.5 py-2 text-left">
                  {isExpanded ? <ChevronDown className="h-3 w-3 text-primary shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                  <span className="text-[11px] font-medium truncate flex-1">{item.title}</span>
                  <ShieldCheck className={cn("h-3 w-3 shrink-0", item.confidence >= 80 ? "text-emerald-500" : item.confidence >= 60 ? "text-amber-500" : "text-red-400")} />
                </button>
                {isExpanded && (
                  <div className="px-2.5 pb-2.5 pt-0 ml-5 space-y-1.5">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{item.content}</p>
                    {item.dataPoints && item.dataPoints.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.dataPoints.map((dp) => (
                          <div key={dp.label} className="flex items-center gap-1 bg-muted rounded px-2 py-1">
                            <span className="text-[9px] text-muted-foreground">{dp.label}:</span>
                            <span className="text-[9px] font-semibold">{dp.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                      <ExternalLink className="h-2.5 w-2.5" />{item.source} &middot; {item.lastUpdated}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
      {factSections.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-6">No evidence items yet.</p>
      )}
    </div>
  )
}

/* ─── Main Fact Base Section ────────────────────────────────────────────── */

export function FactBaseSection({ workspace, onUpdate }: FactBaseSectionProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>("5y")
  const [activeTab, setActiveTab] = useState<"fact-pack" | "supplier-profile" | "external">("fact-pack")

  const supplierTabs = workspace.supplierIds.map((sid) => {
    const sup = negotiationSuppliers.find((s) => s.id === sid)
    return { id: sid, name: sup?.name ?? sid }
  })

  const [activeSupplier, setActiveSupplier] = useState(supplierTabs[0]?.id ?? "")
  const [selectedSku, setSelectedSku] = useState<string | null>(null)

  // Reset SKU selection when supplier changes
  useEffect(() => {
    setSelectedSku(null)
  }, [activeSupplier])

  const handleSelectSku = useCallback((sku: string | null) => {
    setSelectedSku(sku)
  }, [])

  const supplierFacts = workspace.factSections.filter((fs) => fs.supplierId === activeSupplier)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Fact Base</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Comprehensive supplier data, analytics, and external market intelligence
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="gap-1.5 text-xs shrink-0"
        >
          {drawerOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          {drawerOpen ? "Hide" : "Evidence & Notes"}
        </Button>
      </div>

      {/* Supplier tabs (if multi-supplier) */}
      {supplierTabs.length > 1 && (
        <div className="flex items-center gap-1 border-b border-border pb-0">
          {supplierTabs.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSupplier(s.id)}
              className={cn(
                "px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px",
                activeSupplier === s.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Content area: main + optional drawer */}
      <div className="flex gap-0">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Sub-tabs: Fact Pack | External Insights */}
          <div className="flex items-center gap-4 border-b border-border">
            <button
              onClick={() => setActiveTab("fact-pack")}
              className={cn(
                "pb-2 text-xs font-medium border-b-2 -mb-px flex items-center gap-1.5 transition-colors",
                activeTab === "fact-pack"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Supplier Fact Pack
            </button>
            <button
              onClick={() => setActiveTab("supplier-profile")}
              className={cn(
                "pb-2 text-xs font-medium border-b-2 -mb-px flex items-center gap-1.5 transition-colors",
                activeTab === "supplier-profile"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              Supplier Profile
            </button>
            <button
              onClick={() => setActiveTab("external")}
              className={cn(
                "pb-2 text-xs font-medium border-b-2 -mb-px flex items-center gap-1.5 transition-colors",
                activeTab === "external"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              External Insights
            </button>
          </div>

          {activeTab === "fact-pack" ? (
            <div className="space-y-5">
              {/* Time range filter */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Time range:</span>
                  {(["1y", "3y", "5y"] as TimeRange[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                        timeRange === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1">
                  <Download className="h-3 w-3" />
                  Export
                </Button>
              </div>

              {/* Chart 1: Historical Spend */}
              <Card>
                <CardHeader className="pb-1 pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">Historical Spend</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <SpendHistoryChart supplierId={activeSupplier} range={timeRange} />
                </CardContent>
              </Card>

              {/* Charts 2 & 3: Spend by SKU + Price & Volume (side by side on lg) */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-1 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm">Top Runner SKUs</CardTitle>
                      </div>
                      {selectedSku && (
                        <button
                          onClick={() => handleSelectSku(null)}
                          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear selection
                        </button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <SpendBySkuChart supplierId={activeSupplier} selectedSku={selectedSku} onSelectSku={handleSelectSku} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-1 pt-4">
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">
                        Unit Price vs Volume
                        {selectedSku && (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            (filtered)
                          </span>
                        )}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <PriceVolumeChart supplierId={activeSupplier} range={timeRange} selectedSku={selectedSku} onClearSku={() => handleSelectSku(null)} />
                  </CardContent>
                </Card>
              </div>

              {/* Chart 4: SLA & Performance */}
              <Card>
                <CardHeader className="pb-1 pt-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">SLA & Performance</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <SlaPerformanceChart supplierId={activeSupplier} />
                </CardContent>
              </Card>

              {/* Chart 5: Customer Share / Revenue Exposure */}
              <CustomerShareVisualization supplierId={activeSupplier} timeRange={timeRange} />
            </div>
          ) : activeTab === "supplier-profile" ? (
            <SupplierProfileTab supplierId={activeSupplier} />
          ) : (
            <ExternalInsightsPanel
              workspace={workspace}
              supplierId={activeSupplier}
              onUpdate={onUpdate}
            />
          )}
        </div>

        {/* Evidence drawer */}
        <EvidenceDrawer factSections={supplierFacts} open={drawerOpen} />
      </div>
    </div>
  )
}
