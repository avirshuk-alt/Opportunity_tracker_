"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts"
import {
  ChevronRight,
  Info,
  Lightbulb,
  Bookmark,
  BookmarkCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  formatCurrency,
  type SKURecord,
  type Supplier,
} from "@/lib/data"
import {
  createInternalInsight,
  isDuplicate,
  type InternalFactInsight,
} from "@/lib/internal-insights"
import { toast } from "sonner"

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = [
  "hsl(215, 80%, 48%)",
  "hsl(165, 60%, 40%)",
  "hsl(35, 90%, 52%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 72%, 51%)",
  "hsl(200, 70%, 50%)",
  "hsl(45, 85%, 50%)",
  "hsl(320, 60%, 50%)",
]

const BU_LIST = ["Sales", "Market Access", "Field Service", "Medical"]
const REGIONS_LIST = ["North America", "EMEA", "APAC"]

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight text-foreground">{value}</span>
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Heatmap Cell ────────────────────────────────────────────────────────────

function HeatmapCell({ value, maxValue }: { value: number; maxValue: number }) {
  const intensity = maxValue > 0 ? Math.min(value / maxValue, 1) : 0
  return (
    <TooltipProvider delayDuration={100}>
      <UITooltip>
        <TooltipTrigger asChild>
          <div
            className="h-8 w-full rounded flex items-center justify-center text-[10px] font-medium transition-colors"
            style={{
              backgroundColor: intensity > 0
                ? `hsla(215, 80%, 48%, ${0.08 + intensity * 0.45})`
                : "hsl(var(--muted))",
              color: intensity > 0.35 ? "white" : "hsl(var(--foreground))",
            }}
          >
            {value > 0 ? formatCurrency(value) : "-"}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {formatCurrency(value)}
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface SKUAnalysisTabProps {
  filteredSkus: SKURecord[]
  allSkus: SKURecord[]
  suppliers: Supplier[]
  filterSku: string
  setFilterSku: (v: string) => void
  openSaveDrawer: (prefill: {
    title: string
    text: string
    sourceContext: string
    suggestedTags?: string[]
    relatedEntities?: InternalFactInsight["relatedEntities"]
  }) => void
  onInsightSaved: () => void
}

export function SKUAnalysisTab({
  filteredSkus,
  allSkus,
  suppliers,
  filterSku,
  setFilterSku,
  openSaveDrawer,
  onInsightSaved,
}: SKUAnalysisTabProps) {
  const [skuDrawerOpen, setSkuDrawerOpen] = useState(false)
  const [selectedSkuCode, setSelectedSkuCode] = useState<string | null>(null)
  const [geoView, setGeoView] = useState<"region" | "country">("region")

  // ─── Derived data ──────────────────────────────────────────────────
  // Group by unique SKU code
  const skuAgg = useMemo(() => {
    const map: Record<string, { sku: string; description: string; totalSpend: number; units: number; records: SKURecord[]; supplierSet: Set<string> }> = {}
    filteredSkus.forEach((r) => {
      if (!map[r.sku]) {
        map[r.sku] = { sku: r.sku, description: r.description, totalSpend: 0, units: 0, records: [], supplierSet: new Set() }
      }
      map[r.sku].totalSpend += r.totalSpend
      map[r.sku].units += r.units
      map[r.sku].records.push(r)
      r.supplierIds.forEach((sid) => map[r.sku].supplierSet.add(sid))
    })
    return Object.values(map).sort((a, b) => b.totalSpend - a.totalSpend)
  }, [filteredSkus])

  const totalSpend = useMemo(() => filteredSkus.reduce((a, s) => a + s.totalSpend, 0), [filteredSkus])
  const uniqueSkuCount = skuAgg.length
  const topSkuShare = totalSpend > 0 && skuAgg.length > 0
    ? ((skuAgg[0].totalSpend / totalSpend) * 100).toFixed(1)
    : "0"

  // Rate spread: difference between max and min avg unit price for same SKU
  const rateSpread = useMemo(() => {
    if (skuAgg.length === 0) return "N/A"
    let maxSpread = 0
    skuAgg.forEach((agg) => {
      if (agg.records.length < 2) return
      const prices = agg.records.map((r) => r.avgUnitPrice)
      const spread = Math.max(...prices) - Math.min(...prices)
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length
      const pct = avg > 0 ? (spread / avg) * 100 : 0
      if (pct > maxSpread) maxSpread = pct
    })
    if (maxSpread === 0) return "Low"
    if (maxSpread < 10) return "Low"
    if (maxSpread < 20) return "Medium"
    return "High"
  }, [skuAgg])

  // ─── A) Top Vehicle SKUs by Spend (horizontal bar) ─────────────────
  const topSkuBarData = useMemo(() => {
    return skuAgg.slice(0, 10).map((agg) => ({
      name: agg.sku,
      spend: agg.totalSpend,
      description: agg.description,
    }))
  }, [skuAgg])

  // ─── B) Spend by SKU across BU (stacked bar) ──────────────────────
  const spendBySkuBU = useMemo(() => {
    const top5Skus = skuAgg.slice(0, 5).map((a) => a.sku)
    const buMap: Record<string, Record<string, number>> = {}
    BU_LIST.forEach((bu) => { buMap[bu] = {} })

    filteredSkus.forEach((r) => {
      if (!buMap[r.bu]) buMap[r.bu] = {}
      const key = top5Skus.includes(r.sku) ? r.sku : "Other"
      buMap[r.bu][key] = (buMap[r.bu][key] || 0) + r.totalSpend
    })

    const stackKeys = [...top5Skus]
    if (filteredSkus.some((r) => !top5Skus.includes(r.sku))) stackKeys.push("Other")

    return {
      data: Object.entries(buMap)
        .filter(([, skus]) => Object.values(skus).some((v) => v > 0))
        .map(([bu, skus]) => ({ bu, ...skus })),
      keys: stackKeys,
    }
  }, [filteredSkus, skuAgg])

  // ─── C) Spend by SKU across Region/Country (heatmap table) ────────
  const heatmapData = useMemo(() => {
    const dimension = geoView === "region" ? "region" : "country"
    const geoSet = new Set<string>()
    const map: Record<string, Record<string, number>> = {}

    filteredSkus.forEach((r) => {
      const geo = r[dimension]
      geoSet.add(geo)
      if (!map[r.sku]) map[r.sku] = {}
      map[r.sku][geo] = (map[r.sku][geo] || 0) + r.totalSpend
    })

    const geos = Array.from(geoSet).sort()
    const rows = skuAgg.slice(0, 8).map((agg) => ({
      sku: agg.sku,
      values: geos.map((g) => map[agg.sku]?.[g] ?? 0),
    }))

    let maxValue = 0
    rows.forEach((r) => r.values.forEach((v) => { if (v > maxValue) maxValue = v }))

    return { geos, rows, maxValue }
  }, [filteredSkus, skuAgg, geoView])

  // ─── D) Top Suppliers per SKU (table) ──────────────────────────────
  const supplierPerSku = useMemo(() => {
    return skuAgg.map((agg) => {
      const supplierSpend: Record<string, number> = {}
      agg.records.forEach((r) => {
        r.supplierIds.forEach((sid) => {
          supplierSpend[sid] = (supplierSpend[sid] || 0) + r.totalSpend
        })
      })
      const sorted = Object.entries(supplierSpend).sort((a, b) => b[1] - a[1])
      const topSid = sorted[0]?.[0]
      const topSup = suppliers.find((s) => s.id === topSid)
      const topSpend = sorted[0]?.[1] ?? 0
      const topShare = agg.totalSpend > 0 ? (topSpend / agg.totalSpend) * 100 : 0
      const supplierCount = agg.supplierSet.size

      let note = ""
      if (supplierCount === 1) note = "Single-sourced"
      else if (topShare > 80) note = "Dominant supplier"
      else if (agg.records.some((r) => r.contracted)) note = "FMC contracted"
      else note = "Multi-sourced"

      return {
        sku: agg.sku,
        description: agg.description,
        topSupplier: topSup?.name ?? topSid ?? "-",
        supplierCount,
        topSpend,
        topShare,
        note,
        totalSpend: agg.totalSpend,
        records: agg.records,
      }
    })
  }, [skuAgg, suppliers])

  // ─── E) Pareto / Concentration Curve ───────────────────────────────
  const paretoData = useMemo(() => {
    if (totalSpend === 0) return []
    let cumulative = 0
    return skuAgg.map((agg, i) => {
      cumulative += agg.totalSpend
      return {
        rank: i + 1,
        sku: agg.sku,
        cumPct: Math.round((cumulative / totalSpend) * 1000) / 10,
      }
    })
  }, [skuAgg, totalSpend])

  const skus80Pct = paretoData.findIndex((d) => d.cumPct >= 80)

  // ─── AI Insights ───────────────────────────────────────────────────
  const aiInsights = useMemo(() => {
    const insights: { title: string; text: string; tags: string[] }[] = []

    // Concentration insight
    if (skuAgg.length >= 3) {
      const top3Spend = skuAgg.slice(0, 3).reduce((a, s) => a + s.totalSpend, 0)
      const top3Pct = totalSpend > 0 ? ((top3Spend / totalSpend) * 100).toFixed(0) : 0
      insights.push({
        title: `Top 3 Vehicle SKUs represent ${top3Pct}% of spend`,
        text: `${skuAgg[0].sku}, ${skuAgg[1].sku}, and ${skuAgg[2].sku} account for ${top3Pct}% of total filtered spend (${formatCurrency(top3Spend)}). Consider standardizing trims across BUs to improve volume leverage.`,
        tags: ["SKU", "Cost"],
      })
    }

    // Fragmentation insight
    const fragmented = supplierPerSku.find((s) => s.supplierCount >= 3)
    if (fragmented) {
      insights.push({
        title: `${fragmented.sku} shows high supplier fragmentation`,
        text: `${fragmented.sku} is sourced from ${fragmented.supplierCount} suppliers across regions. The top supplier (${fragmented.topSupplier}) holds only ${fragmented.topShare.toFixed(0)}% share. Consolidation could improve pricing by 8-12%.`,
        tags: ["SKU", "Supplier"],
      })
    }

    // Price parity insight
    const parityIssues = skuAgg.filter((agg) => {
      if (agg.records.length < 2) return false
      const prices = agg.records.map((r) => r.avgUnitPrice)
      const spread = Math.max(...prices) - Math.min(...prices)
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length
      return avg > 0 && (spread / avg) > 0.05
    })
    if (parityIssues.length > 0) {
      const sku = parityIssues[0]
      const prices = sku.records.map((r) => ({ region: r.region, price: r.avgUnitPrice }))
      const maxP = prices.reduce((a, b) => a.price > b.price ? a : b)
      const minP = prices.reduce((a, b) => a.price < b.price ? a : b)
      insights.push({
        title: `Price parity gap on ${sku.sku} across regions`,
        text: `${sku.sku} unit price ranges from ${formatCurrency(minP.price)} (${minP.region}) to ${formatCurrency(maxP.price)} (${maxP.region}), a ${(((maxP.price - minP.price) / minP.price) * 100).toFixed(0)}% spread. Review regional pricing or explore global rate card.`,
        tags: ["SKU", "Price Parity", "Region"],
      })
    }

    // Single-sourced risk
    const singleSourced = supplierPerSku.filter((s) => s.supplierCount === 1 && s.totalSpend > 500_000)
    if (singleSourced.length > 0) {
      insights.push({
        title: `${singleSourced.length} high-spend SKU${singleSourced.length > 1 ? "s" : ""} single-sourced`,
        text: `${singleSourced.map((s) => s.sku).join(", ")} ${singleSourced.length > 1 ? "are" : "is"} sourced from a single supplier with combined spend of ${formatCurrency(singleSourced.reduce((a, s) => a + s.totalSpend, 0))}. Consider qualifying alternate suppliers to mitigate supply risk.`,
        tags: ["SKU", "Risk", "Supplier"],
      })
    }

    // 80% concentration
    if (skus80Pct >= 0) {
      insights.push({
        title: `${skus80Pct + 1} of ${skuAgg.length} SKUs drive 80% of spend`,
        text: `Just ${skus80Pct + 1} vehicle SKUs represent 80% of the total spend. The remaining ${skuAgg.length - skus80Pct - 1} SKUs contribute only 20%, suggesting tail-spend rationalization opportunities.`,
        tags: ["SKU", "Cost"],
      })
    }

    return insights
  }, [skuAgg, totalSpend, supplierPerSku, skus80Pct])

  // ─── Handlers ──────────────────────────────────────────────────────
  const openSkuDrawer = useCallback((skuCode: string) => {
    setSelectedSkuCode(skuCode)
    setSkuDrawerOpen(true)
  }, [])

  const handleSaveInsight = useCallback((insight: { title: string; text: string; tags: string[] }) => {
    if (isDuplicate(insight.title, insight.text, "SKU Analysis tab")) {
      toast.info("Already saved to Internal Fact Base")
      return
    }
    openSaveDrawer({
      title: insight.title,
      text: insight.text,
      sourceContext: "SKU Analysis tab - AI Insight",
      suggestedTags: insight.tags,
      relatedEntities: {},
    })
  }, [openSaveDrawer])

  // ─── Drawer data ───────────────────────────────────────────────────
  const drawerData = useMemo(() => {
    if (!selectedSkuCode) return null
    const agg = skuAgg.find((a) => a.sku === selectedSkuCode)
    if (!agg) return null

    // Supplier breakdown
    const supplierSpend: Record<string, number> = {}
    agg.records.forEach((r) => {
      r.supplierIds.forEach((sid) => {
        supplierSpend[sid] = (supplierSpend[sid] || 0) + r.totalSpend
      })
    })
    const supplierBreakdown = Object.entries(supplierSpend)
      .map(([sid, spend]) => ({
        name: suppliers.find((s) => s.id === sid)?.name ?? sid,
        spend,
        share: agg.totalSpend > 0 ? (spend / agg.totalSpend) * 100 : 0,
      }))
      .sort((a, b) => b.spend - a.spend)

    // BU distribution
    const buDist: Record<string, number> = {}
    agg.records.forEach((r) => { buDist[r.bu] = (buDist[r.bu] || 0) + r.totalSpend })
    const buBreakdown = Object.entries(buDist).map(([bu, spend]) => ({
      bu,
      spend,
      share: agg.totalSpend > 0 ? (spend / agg.totalSpend) * 100 : 0,
    })).sort((a, b) => b.spend - a.spend)

    // Region distribution
    const regionDist: Record<string, number> = {}
    agg.records.forEach((r) => { regionDist[r.region] = (regionDist[r.region] || 0) + r.totalSpend })
    const regionBreakdown = Object.entries(regionDist).map(([region, spend]) => ({
      region,
      spend,
      share: agg.totalSpend > 0 ? (spend / agg.totalSpend) * 100 : 0,
    })).sort((a, b) => b.spend - a.spend)

    return { ...agg, supplierBreakdown, buBreakdown, regionBreakdown }
  }, [selectedSkuCode, skuAgg, suppliers])

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ─── KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Vehicle SKUs" value={String(uniqueSkuCount)} sub="unique codes" />
        <StatCard label="Total SKU Spend" value={formatCurrency(totalSpend)} />
        <StatCard
          label="Top SKU Spend Share"
          value={`${topSkuShare}%`}
          sub={skuAgg[0]?.sku ?? "-"}
        />
        <StatCard
          label="Price Rate Spread"
          value={rateSpread}
          sub="cross-region variance"
        />
      </div>

      {/* ─── A) Top Vehicle SKUs by Spend ─────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Top Vehicle SKUs by Spend</CardTitle>
          <CardDescription className="text-xs">Click a bar to filter by that SKU</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(250, topSkuBarData.length * 36)}>
            <BarChart
              data={topSkuBarData}
              layout="vertical"
              margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(1)}M`} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  const d = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-card p-3 shadow-md text-xs">
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-muted-foreground mt-0.5">{d.description}</p>
                      <p className="font-medium mt-1">{formatCurrency(d.spend)}</p>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="spend"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(data) => {
                  if (data?.name) setFilterSku(data.name === filterSku ? "all" : data.name)
                }}
              >
                {topSkuBarData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={entry.name === filterSku ? COLORS[2] : COLORS[0]}
                    opacity={entry.name === filterSku ? 1 : 0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ─── Row: Stacked Bar + Heatmap ───────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* B) Spend by SKU across BU */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Spend by SKU across Business Unit</CardTitle>
            <CardDescription className="text-xs">Top 5 SKUs + Other, stacked by BU</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={spendBySkuBU.data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bu" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(1)}M`} />
                <RechartsTooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null
                    const total = payload.reduce((a, p) => a + ((p.value as number) || 0), 0)
                    return (
                      <div className="rounded-lg border bg-card p-3 shadow-md text-xs min-w-[180px]">
                        <p className="font-semibold mb-1">{label}</p>
                        {payload.map((p) => (
                          <div key={p.dataKey as string} className="flex justify-between gap-3 py-0.5">
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                              <span className="text-muted-foreground">{p.dataKey as string}</span>
                            </div>
                            <span className="font-medium">{formatCurrency((p.value as number) || 0)}</span>
                          </div>
                        ))}
                        <Separator className="my-1" />
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                      </div>
                    )
                  }}
                />
                {spendBySkuBU.keys.map((key, i) => (
                  <Bar key={key} dataKey={key} stackId="a" fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* C) Spend by SKU across Region/Country - Heatmap */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Spend by SKU across Geography</CardTitle>
                <CardDescription className="text-xs">Heatmap of spend intensity</CardDescription>
              </div>
              <div className="flex items-center rounded-md border bg-muted p-0.5">
                <button
                  onClick={() => setGeoView("region")}
                  className={cn(
                    "rounded px-2 py-1 text-[10px] font-medium transition-colors",
                    geoView === "region"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Region
                </button>
                <button
                  onClick={() => setGeoView("country")}
                  className={cn(
                    "rounded px-2 py-1 text-[10px] font-medium transition-colors",
                    geoView === "country"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Country
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-[110px] sticky left-0 bg-card z-10">SKU</TableHead>
                    {heatmapData.geos.map((g) => (
                      <TableHead key={g} className="text-xs text-center min-w-[90px]">{g}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heatmapData.rows.map((row) => (
                    <TableRow key={row.sku}>
                      <TableCell className="text-xs font-medium sticky left-0 bg-card z-10">{row.sku}</TableCell>
                      {row.values.map((v, i) => (
                        <TableCell key={heatmapData.geos[i]} className="p-1">
                          <HeatmapCell value={v} maxValue={heatmapData.maxValue} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── D) Top Suppliers per SKU (table) ──────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Top Suppliers per Vehicle SKU</CardTitle>
          <CardDescription className="text-xs">Click a row for supplier breakdown, BU/region distribution, and suggested actions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Vehicle SKU</TableHead>
                <TableHead className="text-xs">Top Supplier</TableHead>
                <TableHead className="text-xs text-center"># Suppliers</TableHead>
                <TableHead className="text-xs text-right">Top Supplier Spend</TableHead>
                <TableHead className="text-xs text-right">Share %</TableHead>
                <TableHead className="text-xs">Notes</TableHead>
                <TableHead className="text-xs w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplierPerSku.map((row) => (
                <TableRow
                  key={row.sku}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openSkuDrawer(row.sku)}
                >
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{row.sku}</p>
                      <p className="text-[10px] text-muted-foreground">{row.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{row.topSupplier}</TableCell>
                  <TableCell className="text-sm text-center">{row.supplierCount}</TableCell>
                  <TableCell className="text-sm text-right font-medium">{formatCurrency(row.topSpend)}</TableCell>
                  <TableCell className="text-sm text-right">{row.topShare.toFixed(0)}%</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px]",
                        row.note === "Single-sourced" && "bg-red-50 text-red-700 border-red-200",
                        row.note === "Dominant supplier" && "bg-amber-50 text-amber-700 border-amber-200",
                        row.note === "FMC contracted" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                        row.note === "Multi-sourced" && "bg-sky-50 text-sky-700 border-sky-200",
                      )}
                    >
                      {row.note}
                    </Badge>
                  </TableCell>
                  <TableCell><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── E) SKU Concentration Curve (Pareto) ───────────────── */}
      {paretoData.length > 2 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">SKU Concentration Curve</CardTitle>
                <CardDescription className="text-xs">
                  Cumulative spend share by SKU rank
                  {skus80Pct >= 0 && (
                    <span className="ml-2 font-medium text-foreground">
                      {skus80Pct + 1} SKU{skus80Pct > 0 ? "s" : ""} drive 80% of spend
                    </span>
                  )}
                </CardDescription>
              </div>
              <TooltipProvider delayDuration={200}>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button className="rounded p-1 text-muted-foreground hover:bg-muted">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[220px]">
                    <p className="text-xs">Pareto curve showing how many SKUs drive 80% of total spend. Steeper curves indicate higher concentration.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={paretoData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="rank"
                  tick={{ fontSize: 11 }}
                  label={{ value: "SKU Rank", position: "insideBottom", offset: -2, style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }}
                />
                <YAxis
                  tickFormatter={(v: number) => `${v}%`}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null
                    const d = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-card p-2.5 shadow-md text-xs">
                        <p className="font-medium">Rank #{d.rank}: {d.sku}</p>
                        <p className="text-muted-foreground mt-0.5">Cumulative: {d.cumPct}% of spend</p>
                      </div>
                    )
                  }}
                />
                {/* 80% reference line */}
                <Line
                  dataKey={() => 80}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                  activeDot={false}
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="cumPct"
                  stroke={COLORS[0]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: COLORS[0], strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ─── AI Generated Insights ─────────────────────────────── */}
      {aiInsights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-amber-100 p-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-700" />
              </div>
              <div>
                <CardTitle className="text-sm">AI Generated Insights</CardTitle>
                <CardDescription className="text-xs">
                  {aiInsights.length} insights derived from SKU analysis data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiInsights.map((insight, i) => {
              const saved = isDuplicate(insight.title, insight.text, "SKU Analysis tab - AI Insight")
              return (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.text}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {insight.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <button
                    className={cn(
                      "shrink-0 rounded p-1.5 transition-colors",
                      saved
                        ? "text-emerald-600 bg-emerald-50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    onClick={() => handleSaveInsight(insight)}
                    aria-label={saved ? "Already saved" : "Save insight"}
                  >
                    {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  </button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* ─── SKU Detail Drawer ─────────────────────────────────── */}
      <Sheet open={skuDrawerOpen} onOpenChange={setSkuDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {drawerData && (
            <>
              <SheetHeader>
                <SheetTitle className="text-base">{drawerData.sku}</SheetTitle>
                <SheetDescription className="text-xs">{drawerData.description}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Spend</p>
                    <p className="text-lg font-bold">{formatCurrency(drawerData.totalSpend)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Units</p>
                    <p className="text-lg font-bold">{drawerData.units.toLocaleString()}</p>
                  </div>
                </div>

                <Separator />

                {/* Supplier Breakdown */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Supplier Breakdown</p>
                  <div className="space-y-2">
                    {drawerData.supplierBreakdown.map((s) => (
                      <div key={s.name} className="flex items-center justify-between text-sm">
                        <span className="truncate">{s.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-medium">{formatCurrency(s.spend)}</span>
                          <span className="text-xs text-muted-foreground w-10 text-right">{s.share.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* BU Distribution */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Business Unit Distribution</p>
                  <div className="space-y-2">
                    {drawerData.buBreakdown.map((b) => (
                      <div key={b.bu} className="flex items-center justify-between text-sm">
                        <span>{b.bu}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${b.share}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">{b.share.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Region Distribution */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Region Distribution</p>
                  <div className="space-y-2">
                    {drawerData.regionBreakdown.map((r) => (
                      <div key={r.region} className="flex items-center justify-between text-sm">
                        <span>{r.region}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${r.share}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">{r.share.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Suggested Actions */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Suggested Actions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Review contract", "Check parity", "Open supplier strategy"].map((action) => (
                      <Badge
                        key={action}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors"
                        onClick={() => toast.info(`Action "${action}" would open the relevant workflow`)}
                      >
                        {action}
                      </Badge>
                    ))}
                    {drawerData.supplierBreakdown.length === 1 && (
                      <Badge
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-red-50 hover:border-red-200 text-red-700 border-red-200 bg-red-50/50"
                        onClick={() => toast.info("Would open supplier qualification workflow")}
                      >
                        Qualify alternate supplier
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
