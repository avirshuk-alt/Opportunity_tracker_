"use client"

import { useMemo } from "react"
import { useCategory } from "@/lib/category-context"
import { useRiskFilters } from "@/lib/risk-filter-context"
import {
  getRiskOverviewKPIs,
  getRecentRiskChanges,
  getSegmentSummary,
  getProcurementCategories,
  getEnhancedExposureReduction,
  formatSpend,
  type IRRLevel,
} from "@/lib/risk-module-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { InfoTip } from "@/components/risks/info-tip"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from "lucide-react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
} from "recharts"

const irrColorMap: Record<IRRLevel, string> = {
  Critical: "hsl(0, 72%, 51%)",
  High: "hsl(0, 60%, 60%)",
  Medium: "hsl(35, 90%, 52%)",
  Low: "hsl(155, 50%, 40%)",
}

export function OverviewTab() {
  const { selectedCategory } = useCategory()
  const { navigateWithFilter } = useRiskFilters()

  const kpis = getRiskOverviewKPIs(selectedCategory.id)
  const changes = getRecentRiskChanges(selectedCategory.id)
  const segments = getSegmentSummary()
  const procurementCategories = useMemo(() => getProcurementCategories(), [])
  const exposureReduction = useMemo(
    () => getEnhancedExposureReduction(selectedCategory.id),
    [selectedCategory.id]
  )

  // Heatmap data: 7 dots from the 7 procurement categories
  const heatmapData = useMemo(() => {
    return procurementCategories.map((cat) => {
      const score = cat.impact * cat.likelihood
      const threshold = cat.appetiteThreshold === "Low" ? 6 : cat.appetiteThreshold === "Medium" ? 12 : 20
      const isAbove = cat.aboveAppetite
      const isCritical = score > threshold * 1.5

      return {
        x: cat.likelihood,
        y: cat.impact,
        name: cat.category,
        score,
        threshold: cat.appetiteThreshold,
        rag: isCritical ? "Critical" : isAbove ? "Above" : "Within",
        irr: cat.aggregatedIRR,
      }
    })
  }, [procurementCategories])

  // Category risk bar chart data -- sorted by severity
  const categoryBarData = useMemo(() => {
    const irrOrder: Record<IRRLevel, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    }
    return [...procurementCategories]
      .sort(
        (a, b) =>
          irrOrder[b.aggregatedIRR] - irrOrder[a.aggregatedIRR] ||
          b.spend - a.spend
      )
      .map((c) => ({
        category: c.category.length > 22 ? c.category.slice(0, 19) + "..." : c.category,
        fullCategory: c.category,
        irr: c.aggregatedIRR,
        spend: Math.round(c.spend / 1_000_000 * 10) / 10,
        irrNumeric: irrOrder[c.aggregatedIRR],
        color: irrColorMap[c.aggregatedIRR],
        aboveAppetite: c.aboveAppetite,
      }))
  }, [procurementCategories])

  // Segment risk data
  const segmentData = segments.map((s) => ({
    segment: s.segment,
    spend: s.spend / 1_000_000,
    highIRR: s.highIRR,
    count: s.count,
    pctHighIRR: s.pctHighIRR,
  }))

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "flat" }) => {
    if (trend === "up")
      return <TrendingUp className="h-3.5 w-3.5 text-red-500" />
    if (trend === "down")
      return <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => {
              if (kpi.filterAction) {
                navigateWithFilter(
                  kpi.filterAction.tab,
                  kpi.filterAction.filter
                )
              }
            }}
          >
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <TrendIcon trend={kpi.trend} />
              </div>
              <p className="text-xl font-bold mt-1 text-foreground">
                {kpi.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {kpi.trendLabel}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Exposure by Category */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            <span className="inline-flex items-center gap-1">
              Risk Exposure by Category <InfoTip term="Risk Exposure" />
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={categoryBarData}
              margin={{ top: 10, right: 20, bottom: 60, left: 10 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                label={{
                  value: "Spend ($M)",
                  position: "bottom",
                  offset: 0,
                  style: { fontSize: 11 },
                }}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 11 }}
                width={160}
              />
              <RechartsTooltip
                content={({ payload }) => {
                  if (!payload?.[0]) return null
                  const d = payload[0].payload
                  return (
                    <div className="rounded-md border bg-card p-2.5 shadow-md">
                      <p className="text-sm font-medium text-foreground">
                        {d.fullCategory}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Aggregated IRR: {d.irr}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Spend: ${d.spend}M
                      </p>
                      {d.aboveAppetite && (
                        <p className="text-xs text-red-600 font-medium mt-0.5">
                          Above Appetite Threshold
                        </p>
                      )}
                    </div>
                  )
                }}
              />
              <Bar dataKey="spend" radius={[0, 4, 4, 0]}>
                {categoryBarData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.color}
                    cursor="pointer"
                    onClick={() => {
                      navigateWithFilter("register", {
                        procurementCategory: entry.fullCategory,
                      })
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2">
            {(["Critical", "High", "Medium", "Low"] as IRRLevel[]).map(
              (level) => (
                <div key={level} className="flex items-center gap-1.5">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: irrColorMap[level] }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {level}
                  </span>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap + Segment Risk side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Likelihood vs Impact Heatmap -- 7 category dots, no toggle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Likelihood vs Impact Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[0, 6]}
                  ticks={[1, 2, 3, 4, 5]}
                  name="Likelihood"
                  label={{
                    value: "Likelihood",
                    position: "bottom",
                    offset: 0,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[0, 6]}
                  ticks={[1, 2, 3, 4, 5]}
                  name="Impact"
                  label={{
                    value: "Impact",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <RechartsTooltip
                  content={({ payload }) => {
                    if (!payload?.[0]) return null
                    const d = payload[0].payload
                    return (
                      <div className="rounded-md border bg-card p-2 shadow-md">
                        <p className="text-sm font-medium text-foreground">
                          {d.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          IRR: {d.irr} | Appetite: {d.threshold}
                        </p>
                      </div>
                    )
                  }}
                />
                <Scatter data={heatmapData}>
                  {heatmapData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.rag === "Critical"
                          ? "hsl(0, 72%, 51%)"
                          : entry.rag === "Above"
                            ? "hsl(35, 90%, 52%)"
                            : "hsl(155, 50%, 40%)"
                      }
                      r={9}
                      cursor="pointer"
                      onClick={() => {
                        navigateWithFilter("register", {
                          procurementCategory: entry.name,
                        })
                      }}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">
                  Within Appetite
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-xs text-muted-foreground">
                  Above Appetite
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-xs text-muted-foreground">
                  {"Critical (>1.5x)"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Segment Risk */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Supplier Segment Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {segmentData.map((s) => (
                <button
                  key={s.segment}
                  className="w-full text-left group"
                  onClick={() => {
                    navigateWithFilter("supply-risk", {
                      segment: s.segment,
                    })
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {s.segment}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {s.count} suppliers
                      </span>
                      {s.pctHighIRR > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-red-50 text-red-700 border-red-200"
                        >
                          {s.pctHighIRR}% High IRR
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{
                          width: `${Math.min(100, (s.spend / 12) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-foreground w-14 text-right">
                      ${s.spend.toFixed(1)}M
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exposure Reduction Progress + What Changed */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Exposure Reduction */}
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <span className="inline-flex items-center gap-1">
                Exposure Reduction Progress <InfoTip term="Current Exposure" />
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    Current Exposure <InfoTip term="Current Exposure" />
                  </span>
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatSpend(exposureReduction.currentExposure)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Projected After Mitigation
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatSpend(exposureReduction.projectedExposure)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Expected Reduction
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatSpend(exposureReduction.totalReduction)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">% Reduction</p>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-emerald-500" />
                  <span className="text-lg font-bold text-emerald-600">
                    {exposureReduction.pctReduction}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What Changed? */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">What Changed?</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {changes.slice(0, 5).map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm"
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs shrink-0",
                      c.changeType === "Threshold Breach"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : c.changeType === "New Risk"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    {c.changeType}
                  </Badge>
                  <span className="flex-1 truncate text-foreground">
                    {c.riskTitle}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 w-14 text-right">
                    {c.date}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
