"use client"

import { useMemo, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  TrendingUp,
  Building2,
  Activity,
  DollarSign,
  BarChart3,
  Info,
} from "lucide-react"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts"
import { cn } from "@/lib/utils"
import {
  valueChainGrowthAbsolute,
  valueChainGrowthIndex,
  VALUE_CHAIN_STAGE_LABELS,
  VALUE_CHAIN_STAGE_COLORS,
  TYPE_SUPPLIER_COUNTS,
  TYPE_SUPPLY_DEMAND,
  leverageFactors,
  getCompositeScore,
  getLeverageLabel,
} from "@/lib/external-market-data"
import { AIInsightsCard } from "@/components/ai-insights-card"
import type { ChartContext } from "@/app/api/internal-fact-insights/route"
import { toast } from "sonner"

// ─── Shared constants ───────────────────────────────────────────────────────

const TYPE_KEYS = Object.keys(VALUE_CHAIN_STAGE_LABELS) as (keyof typeof VALUE_CHAIN_STAGE_LABELS)[]

// ─── Derived KPI helpers ────────────────────────────────────────────────────

function sumForYear(year: string, keys: string[]): number {
  const row = valueChainGrowthAbsolute.find((d) => d.year === year)
  if (!row) return 0
  return keys.reduce((s, k) => s + (row[k as keyof typeof row] as number ?? 0), 0)
}

function computeKPIs(selected: string[]) {
  const keys = selected.length === 0 ? [...TYPE_KEYS] : selected
  const latest = sumForYear("2024", keys)
  const earliest = sumForYear("2021", keys)
  const growth = latest - earliest
  const cagr = earliest > 0 ? (Math.pow(latest / earliest, 1 / 3) - 1) * 100 : 0

  // Supplier count: sum unique counts for selected types
  const suppliers = keys.reduce((s, k) => s + (TYPE_SUPPLIER_COUNTS[k] ?? 0), 0)

  // Supply/demand: tally scores and pick majority
  const sdScores = keys.map((k) => TYPE_SUPPLY_DEMAND[k] ?? "Balanced")
  const sdMap: Record<string, number> = {}
  sdScores.forEach((v) => { sdMap[v] = (sdMap[v] ?? 0) + 1 })
  const supplyDemand = Object.entries(sdMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Balanced"

  return {
    marketSize: latest,
    growth,
    cagr,
    suppliers,
    supplyDemand,
  }
}

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, sub, className }: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  className?: string
}) {
  return (
    <Card className={className}>
      <CardContent className="py-4 px-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
            <p className="text-xl font-bold text-foreground mt-0.5 text-balance">{value}</p>
            {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Leverage Meter ─────────────────────────────────────────────────────────

function LeverageMeter({ score }: { score: number }) {
  const leverage = getLeverageLabel(score)
  return (
    <div className="space-y-3">
      {/* Gauge bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Market Leverage Index</span>
          <Badge variant="outline" className={cn("text-[10px] font-semibold", leverage.color)}>
            {leverage.label}
          </Badge>
        </div>
        <div className="relative h-4 rounded-full bg-muted overflow-hidden">
          {/* Background gradient: green → amber → red */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(to right, #059669 0%, #059669 35%, #d97706 45%, #d97706 55%, #dc2626 65%, #dc2626 100%)",
              opacity: 0.2,
            }}
          />
          {/* Score indicator */}
          <div
            className="absolute top-0 h-full w-1 rounded-full bg-foreground shadow-md transition-all duration-500"
            style={{ left: `${score}%`, transform: "translateX(-50%)" }}
          />
          {/* Score label */}
          <div
            className="absolute -top-6 text-[10px] font-bold text-foreground transition-all duration-500"
            style={{ left: `${score}%`, transform: "translateX(-50%)" }}
          >
            {score}
          </div>
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>{"Buyer's Market (0)"}</span>
          <span>Balanced (50)</span>
          <span>{"Seller's Market (100)"}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Factor Row ─────────────────────────────────────────────────────────────

function FactorRow({ factor }: { factor: typeof leverageFactors[0] }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{factor.name}</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-1.5 py-0 h-4",
              factor.direction === "buyer" && "bg-emerald-50 text-emerald-700 border-emerald-200",
              factor.direction === "seller" && "bg-red-50 text-red-700 border-red-200",
              factor.direction === "neutral" && "bg-amber-50 text-amber-700 border-amber-200",
            )}
          >
            {factor.direction === "buyer" ? "Favors Buyer" : factor.direction === "seller" ? "Favors Seller" : "Neutral"}
          </Badge>
        </div>
        <span className="text-xs font-mono font-semibold text-foreground">{factor.score}</span>
      </div>
      {/* Bar */}
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "absolute top-0 left-0 h-full rounded-full transition-all duration-500",
            factor.score <= 40 ? "bg-emerald-500" : factor.score <= 60 ? "bg-amber-500" : "bg-red-500",
          )}
          style={{ width: `${factor.score}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{factor.explanation}</p>
    </div>
  )
}

// ─── Market Growth by Type Chart ─────────────────────────────────────────────

type ChartMode = "index" | "absolute"

function MarketGrowthByTypeChart({ selectedTypes, onToggleType }: {
  selectedTypes: Set<string>
  onToggleType: (key: string) => void
}) {
  const [mode, setMode] = useState<ChartMode>("absolute")

  const visibleKeys = TYPE_KEYS.filter((k) => selectedTypes.has(k))

  const data = useMemo(() => {
    if (mode === "absolute") return valueChainGrowthAbsolute
    // Build index view: normalize each type's 2021 value to 100
    const base = valueChainGrowthAbsolute[0]
    if (!base) return valueChainGrowthIndex
    return valueChainGrowthAbsolute.map((row) => {
      const indexed: Record<string, number | string> = { year: row.year }
      TYPE_KEYS.forEach((k) => {
        const baseVal = base[k as keyof typeof base] as number
        const curVal = row[k as keyof typeof row] as number
        indexed[k] = baseVal > 0 ? Math.round((curVal / baseVal) * 1000) / 10 : 100
      })
      return indexed
    })
  }, [mode])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Market Growth by Type</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {"Fleet \u2014 Market growth by type (2021\u20132024)"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <div className="flex items-center rounded-md border bg-muted p-0.5">
              <button
                onClick={() => setMode("absolute")}
                className={cn(
                  "rounded px-2 py-1 text-[10px] font-medium transition-colors",
                  mode === "absolute"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                $ Market Size
              </button>
              <button
                onClick={() => setMode("index")}
                className={cn(
                  "rounded px-2 py-1 text-[10px] font-medium transition-colors",
                  mode === "index"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Index (2021=100)
              </button>
            </div>
            <TooltipProvider delayDuration={200}>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button className="rounded p-1 text-muted-foreground hover:bg-muted">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[260px]">
                  <p className="text-xs">Area chart comparing growth across fleet value chain types. Use the chips to filter which types are shown. KPI cards above update to match.</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ─── Type Filter Chips ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Types</span>
              <span className="text-[10px] text-muted-foreground">
                Showing {visibleKeys.length} of {TYPE_KEYS.length} types
              </span>
            </div>
            <button
              onClick={() => {
                // If all selected, deselect none (keep all); otherwise select all
                if (selectedTypes.size === TYPE_KEYS.length) return
                TYPE_KEYS.forEach((k) => {
                  if (!selectedTypes.has(k)) onToggleType(k)
                })
              }}
              className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Select all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_KEYS.map((key) => {
              const active = selectedTypes.has(key)
              const color = VALUE_CHAIN_STAGE_COLORS[key]
              return (
                <button
                  key={key}
                  onClick={() => onToggleType(key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                    active
                      ? "border-transparent text-foreground shadow-sm"
                      : "border-border text-muted-foreground hover:border-foreground/30 bg-transparent",
                  )}
                  style={active ? { backgroundColor: `${color}15`, borderColor: `${color}40` } : undefined}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: active ? color : "currentColor", opacity: active ? 1 : 0.3 }}
                  />
                  {VALUE_CHAIN_STAGE_LABELS[key]}
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── Area Chart ─── */}
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              {TYPE_KEYS.map((key) => (
                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={VALUE_CHAIN_STAGE_COLORS[key]} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={VALUE_CHAIN_STAGE_COLORS[key]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={mode === "absolute" ? (v: number) => `$${v}B` : (v: number) => `${v}`}
              domain={mode === "index" ? [90, "auto"] : [0, "auto"]}
              width={48}
            />
            <RechartsTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null
                // Sort descending by value
                const sorted = [...payload].sort((a, b) => (b.value as number) - (a.value as number))
                return (
                  <div className="rounded-lg border bg-card p-3 shadow-md min-w-[220px]">
                    <p className="text-xs font-semibold text-foreground mb-2">{label}</p>
                    {sorted.map((p) => {
                      const key = p.dataKey as string
                      const val = p.value as number
                      return (
                        <div key={key} className="flex items-center justify-between gap-4 text-xs py-0.5">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-muted-foreground">{VALUE_CHAIN_STAGE_LABELS[key] ?? key}</span>
                          </div>
                          <span className="font-medium tabular-nums">
                            {mode === "absolute" ? `$${val}B` : val}
                          </span>
                        </div>
                      )
                    })}
                    {mode === "absolute" && sorted.length > 1 && (
                      <>
                        <Separator className="my-1.5" />
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Total</span>
                          <span className="tabular-nums">
                            ${sorted.reduce((a, p) => a + (p.value as number), 0).toFixed(1)}B
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )
              }}
            />
            {TYPE_KEYS.map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={VALUE_CHAIN_STAGE_COLORS[key]}
                strokeWidth={2}
                fill={`url(#gradient-${key})`}
                fillOpacity={1}
                dot={{ r: 3, fill: VALUE_CHAIN_STAGE_COLORS[key], strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                name={VALUE_CHAIN_STAGE_LABELS[key]}
                hide={!selectedTypes.has(key)}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function MarketContextTab() {
  const compositeScore = useMemo(() => getCompositeScore(), [])

  // Shared filter state drives both KPIs and chart
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(() => new Set(TYPE_KEYS))

  const toggleType = useCallback((key: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      // Prevent deselecting last one
      if (next.has(key) && next.size === 1) return prev
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const kpis = useMemo(() => computeKPIs([...selectedTypes]), [selectedTypes])

  const chartContext: ChartContext = useMemo(() => ({
    chartId: "market_context_overview",
    chartTitle: "Market Growth by Type - Pharma Fleet",
    breakdownType: "valueChainStage",
    currency: "USD",
    dataSummary: {
      topItems: [
        { name: "Market Size (selected)", value: kpis.marketSize * 1e9 },
        { name: "3yr CAGR", value: kpis.cagr },
        { name: "Leverage Score", value: compositeScore },
      ],
      totals: { totalSpend: kpis.marketSize * 1e9 },
    },
  }), [compositeScore, kpis])

  const allSelected = selectedTypes.size === TYPE_KEYS.length

  return (
    <div className="space-y-6">
      {/* ─── A) Dynamic KPIs ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KPICard
          icon={DollarSign}
          label="Market Size"
          value={`$${kpis.marketSize.toFixed(1)}B`}
          sub={allSelected ? "2024 estimated (all types)" : `2024 est. (${selectedTypes.size} types)`}
        />
        <KPICard
          icon={TrendingUp}
          label="3-Year CAGR"
          value={`${kpis.cagr.toFixed(1)}%`}
          sub="2021 - 2024"
        />
        <KPICard
          icon={BarChart3}
          label="3-Year Growth"
          value={`+$${kpis.growth.toFixed(1)}B`}
          sub="Absolute change"
        />
        <KPICard
          icon={Building2}
          label="Major Suppliers"
          value={`${kpis.suppliers}`}
          sub={allSelected ? "Moderate fragmentation" : `Across ${selectedTypes.size} types`}
        />
        <KPICard
          icon={Activity}
          label="Supply / Demand"
          value={kpis.supplyDemand}
          sub="Current market balance"
        />
      </div>

      {/* ─── B) Market Growth by Type Chart ────────────────────── */}
      <MarketGrowthByTypeChart selectedTypes={selectedTypes} onToggleType={toggleType} />

      {/* ─── C) Buyer vs Seller Leverage Meter ──────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{"Buyer vs Seller Market Leverage"}</CardTitle>
          <CardDescription className="text-xs mt-0.5">
            Composite index based on 5 market structure factors. Higher score = stronger supplier leverage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="pt-4">
            <LeverageMeter score={compositeScore} />
          </div>

          <Separator />

          {/* Factor Sub-scores */}
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-3">Contributing Factors</h4>
            <div className="space-y-4">
              {leverageFactors.map((f) => (
                <FactorRow key={f.id} factor={f} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── D) AI Generated Insights ───────────────────────────── */}
      <AIInsightsCard
        chartContext={chartContext}
        onEditBeforeSave={(prefill) => {
          toast.success("Insight saved to External Fact Base", { description: prefill.title })
        }}
        onSaved={() => {}}
      />
    </div>
  )
}
