"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip as RechartsTooltip,
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
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  getTierSummaries,
  getTopPremiumTrims,
  generateTrimInsights,
} from "@/lib/opportunity-tracker-data"
import { createInternalInsight } from "@/lib/internal-insights"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Bookmark,
  Check,
  DollarSign,
  Sparkles,
  BarChart3,
  TableProperties,
  Info,
  Save,
} from "lucide-react"

interface TrimProliferationAnalysisProps {
  onBack: () => void
}

export function TrimProliferationAnalysis({ onBack }: TrimProliferationAnalysisProps) {
  const [activeTab, setActiveTab] = useState("charts")
  const [savedInsights, setSavedInsights] = useState<Set<number>>(new Set())

  // Savings analysis state: selected tiers + slider
  const [selectedTiers, setSelectedTiers] = useState<Set<number>>(new Set([1, 2]))
  const [reductionPercent, setReductionPercent] = useState(30) // 0-100 slider value
  const [scenarioLabel, setScenarioLabel] = useState<string>("Base")

  // Preset scenarios for quick selection
  const presets = [
    { label: "Conservative", value: 15 },
    { label: "Base", value: 30 },
    { label: "Aggressive", value: 45 },
  ]

  // Handle slider change
  const handleSliderChange = useCallback((values: number[]) => {
    const newValue = values[0]
    setReductionPercent(newValue)
    
    // Check if it matches a preset
    const matchingPreset = presets.find(p => p.value === newValue)
    if (matchingPreset) {
      setScenarioLabel(matchingPreset.label)
    } else {
      setScenarioLabel(`Custom (${newValue}%)`)
    }
  }, [])

  // Handle preset selection
  const handlePresetSelect = useCallback((value: string) => {
    const preset = presets.find(p => p.label.toLowerCase() === value)
    if (preset) {
      setReductionPercent(preset.value)
      setScenarioLabel(preset.label)
    }
  }, [])

  const tierSummaries = useMemo(() => getTierSummaries(), [])
  const topTrims = useMemo(() => getTopPremiumTrims(), [])
  const aiInsights = useMemo(() => generateTrimInsights(), [])

  const totalPremiumSpend = tierSummaries.reduce((s, t) => s + t.premiumSpend, 0)
  const totalSpend = tierSummaries.reduce((s, t) => s + t.totalSpend, 0)
  const overallPremPct = Math.round((totalPremiumSpend / totalSpend) * 100)

  // Savings calculations based on selected tiers and slider value (real-time)
  const selectedSummaries = useMemo(
    () => tierSummaries.filter((t) => selectedTiers.has(t.tier)),
    [tierSummaries, selectedTiers]
  )
  const addressableSpend = useMemo(
    () => selectedSummaries.reduce((s, t) => s + t.premiumSpend, 0),
    [selectedSummaries]
  )
  const reductionRate = reductionPercent / 100
  const estimatedSavings = Math.round(addressableSpend * reductionRate)
  const savingsPct = addressableSpend > 0 ? Math.round((estimatedSavings / addressableSpend) * 100) : 0
  const premiumUnitsInScope = useMemo(
    () => selectedSummaries.reduce((s, t) => s + t.premiumVehicles, 0),
    [selectedSummaries]
  )
  
  // Calculate tier breakdown for savings
  const tierBreakdown = useMemo(() => {
    return selectedSummaries.map((t) => ({
      tier: t.tier,
      name: t.name,
      premiumSpend: t.premiumSpend,
      baseSpend: t.totalSpend - t.premiumSpend,
      premiumPct: t.premiumPct,
      savings: Math.round(t.premiumSpend * reductionRate),
    }))
  }, [selectedSummaries, reductionRate])

  // Chart data for stacked bar
  const chartData = tierSummaries.map((t) => ({
    name: `Tier ${t.tier}: ${t.name}`,
    "Base Spend": Math.round(t.totalSpend - t.premiumSpend),
    "Premium Spend": t.premiumSpend,
  }))

  // Avg premium vs base chart data
  const avgCostChartData = tierSummaries.map((t) => ({
    name: `Tier ${t.tier}`,
    "Base Avg": t.avgBaseCost,
    "Premium Avg": t.avgPremiumCost,
  }))

  function handleSaveInsight(idx: number) {
    const insight = aiInsights[idx]
    createInternalInsight({
      title: insight.title,
      text: insight.text,
      sourceContext: "Trim Proliferation Analysis",
      confidence: "High",
      tags: insight.tags,
    })
    setSavedInsights((prev) => new Set(prev).add(idx))
  }

  function toggleTier(tier: number) {
    setSelectedTiers((prev) => {
      const next = new Set(prev)
      if (next.has(tier)) {
        next.delete(tier)
      } else {
        next.add(tier)
      }
      return next
    })
  }

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground">Reduce Trim Proliferation</h2>
          <p className="text-sm text-muted-foreground">
            Analyze premium vs base trim spend by role tier and model savings opportunities
          </p>
        </div>
        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-xs">
          In analysis
        </Badge>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Total Premium Spend</p>
            <p className="text-xl font-bold text-foreground mt-1">{fmt(totalPremiumSpend)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Annual</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Premium Share</p>
            <p className="text-xl font-bold text-foreground mt-1">{overallPremPct}%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Of total fleet spend</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Total Fleet Spend</p>
            <p className="text-xl font-bold text-foreground mt-1">{fmt(totalSpend)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Annual, all tiers</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Est. Savings ({scenarioLabel})</p>
            <p className="text-xl font-bold text-primary mt-1">{fmt(estimatedSavings)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{selectedTiers.size} tier(s), {reductionPercent}% reduction</p>
          </CardContent>
        </Card>
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="charts" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="tables" className="gap-1.5 text-xs">
            <TableProperties className="h-3.5 w-3.5" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="savings" className="gap-1.5 text-xs">
            <DollarSign className="h-3.5 w-3.5" />
            Savings Analysis
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* ─── Charts Tab ──────────────────────────────────────────────── */}
        <TabsContent value="charts" className="space-y-6 mt-4">
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Spend by Role Tier: Premium vs Base</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickFormatter={(v: number) => `$${(v / 1_000_000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [fmt(value), name]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Base Spend" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Premium Spend" stackId="a" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Avg Monthly Cost: Premium vs Base by Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={avgCostChartData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickFormatter={(v: number) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [`$${value}/mo`, name]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Base Avg" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Premium Avg" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tables Tab ──────────────────────────────────────────────── */}
        <TabsContent value="tables" className="space-y-6 mt-4">
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Model Mix by Tier</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Tier</TableHead>
                    <TableHead className="text-right"># Vehicles</TableHead>
                    <TableHead className="text-right">% Base</TableHead>
                    <TableHead className="text-right">% Premium</TableHead>
                    <TableHead className="text-right">Avg Base Cost</TableHead>
                    <TableHead className="text-right">Avg Premium Cost</TableHead>
                    <TableHead className="text-right">Premium %</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tierSummaries.map((t) => (
                    <TableRow key={t.tier}>
                      <TableCell className="font-medium">
                        Tier {t.tier}: {t.name}
                      </TableCell>
                      <TableCell className="text-right">{t.totalVehicles.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{t.basePct}%</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(t.premiumPct > 40 ? "text-primary font-medium" : "")}>
                          {t.premiumPct}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">${t.avgBaseCost.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${t.avgPremiumCost.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            t.premiumPctCost > 30
                              ? "bg-red-50 text-red-700 border-red-200"
                              : t.premiumPctCost > 20
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200",
                          )}
                        >
                          +{t.premiumPctCost}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(t.totalSpend)}</TableCell>
                    </TableRow>
                  ))}
                  {/* Total row */}
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {tierSummaries.reduce((s, t) => s + t.totalVehicles, 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(
                        (tierSummaries.reduce((s, t) => s + t.baseVehicles, 0) /
                          tierSummaries.reduce((s, t) => s + t.totalVehicles, 0)) *
                          100,
                      )}%
                    </TableCell>
                    <TableCell className="text-right">{overallPremPct}%</TableCell>
                    <TableCell className="text-right">--</TableCell>
                    <TableCell className="text-right">--</TableCell>
                    <TableCell className="text-right">--</TableCell>
                    <TableCell className="text-right font-bold">{fmt(totalSpend)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Premium Trims Driving Spend</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model / Trim</TableHead>
                    <TableHead>Tier Mix</TableHead>
                    <TableHead className="text-right">Avg Cost/Mo</TableHead>
                    <TableHead className="text-right">Vehicles</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTrims.map((t) => (
                    <TableRow key={t.model}>
                      <TableCell className="font-medium">
                        {t.model}
                        <Badge variant="outline" className="ml-2 text-[10px] bg-primary/5 text-primary border-primary/20">
                          Premium
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{t.tierMix}</span>
                      </TableCell>
                      <TableCell className="text-right">${t.avgCost.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{t.vehicleCount}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(t.totalSpend)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Savings Analysis Tab ─────────────────────────────────────── */}
        <TabsContent value="savings" className="space-y-6 mt-4">
          {/* Tier selector + Slider control */}
          <Card className="shadow-none">
            <CardContent className="p-5 space-y-5">
              {/* Tier selector */}
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Role tiers in scope</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Select tiers to include in the savings case.
                </p>
                <div className="flex flex-wrap gap-2">
                  {tierSummaries.map((t) => {
                    const isActive = selectedTiers.has(t.tier)
                    return (
                      <button
                        key={t.tier}
                        onClick={() => toggleTier(t.tier)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-muted/50",
                        )}
                      >
                        {isActive && <Check className="h-3 w-3" />}
                        Tier {t.tier}: {t.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Premium Trim Reduction Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Premium trim reduction rate</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Model the savings from reducing premium trim share
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20 font-mono">
                      {reductionPercent}%
                    </Badge>
                    <TooltipProvider>
                      <RechartsTooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[240px]">
                          <p className="text-xs">Percentage of premium trim spend that will be shifted to base trims at next vehicle refresh.</p>
                        </TooltipContent>
                      </RechartsTooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                {/* Slider */}
                <div className="px-1">
                  <Slider
                    value={[reductionPercent]}
                    onValueChange={handleSliderChange}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  {/* Tick marks */}
                  <div className="flex justify-between mt-1.5 px-0.5">
                    {[0, 25, 50, 75, 100].map((tick) => (
                      <button
                        key={tick}
                        onClick={() => handleSliderChange([tick])}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {tick}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Quick presets:</span>
                  <div className="flex gap-1.5">
                    {presets.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handlePresetSelect(preset.label.toLowerCase())}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                          scenarioLabel === preset.label
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80",
                        )}
                      >
                        {preset.label} ({preset.value}%)
                      </button>
                    ))}
                  </div>
                  {scenarioLabel.startsWith("Custom") && (
                    <Badge variant="secondary" className="text-[10px]">
                      {scenarioLabel}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Savings summary -- big numbers */}
          {selectedTiers.size === 0 ? (
            <Card className="shadow-none">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Select at least one tier to see savings estimates.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-none border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Savings Summary</p>
                  <Badge variant="outline" className="text-[10px] ml-auto bg-primary/5 text-primary border-primary/20">
                    {scenarioLabel} ({reductionPercent}%)
                  </Badge>
                  <TooltipProvider>
                    <RechartsTooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground">
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">Save this scenario</p>
                      </TooltipContent>
                    </RechartsTooltip>
                  </TooltipProvider>
                </div>
                <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Addressable Spend</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{fmt(addressableSpend)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Premium spend, selected tiers</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Estimated Savings</p>
                    <p className="text-2xl font-bold text-primary mt-1">{fmt(estimatedSavings)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Annual, at {reductionPercent}% reduction</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Savings % of Addressable</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{savingsPct}%</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Of premium spend in scope</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Premium Units in Scope</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{premiumUnitsInScope.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Vehicles on premium trims</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assumptions */}
          {selectedTiers.size > 0 && (
            <div className="rounded-md border bg-muted/10 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Info className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Assumptions</p>
              </div>
              <ul className="space-y-0.5 text-[11px] text-muted-foreground leading-relaxed">
                <li><span className="font-medium text-foreground">Addressable spend</span> = Premium spend for selected tiers ({selectedTiers.size} tier{selectedTiers.size > 1 ? "s" : ""})</li>
                <li><span className="font-medium text-foreground">Estimated Savings</span> = Addressable Spend x Reduction Rate ({reductionPercent}%)</li>
                <li><span className="font-medium text-foreground">Savings % of Addressable</span> = {savingsPct}% (equals reduction rate)</li>
                <li>Savings realized at next vehicle refresh cycle</li>
                <li>No constraints applied (100% of addressable is shiftable)</li>
              </ul>
            </div>
          )}

          {/* Tier breakdown table */}
          {selectedTiers.size > 0 && (
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Tier Breakdown</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {reductionPercent}% reduction rate applied
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Tier</TableHead>
                      <TableHead className="text-right">Premium Spend</TableHead>
                      <TableHead className="text-right">Base Spend</TableHead>
                      <TableHead className="text-right">Premium %</TableHead>
                      <TableHead className="text-right">Est. Savings ({reductionPercent}%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tierBreakdown.map((t) => (
                      <TableRow key={t.tier}>
                        <TableCell className="font-medium">
                          Tier {t.tier}: {t.name}
                        </TableCell>
                        <TableCell className="text-right">{fmt(t.premiumSpend)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{fmt(t.baseSpend)}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              t.premiumPct > 40
                                ? "bg-red-50 text-red-700 border-red-200"
                                : t.premiumPct > 25
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200",
                            )}
                          >
                            {t.premiumPct}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">{fmt(t.savings)}</TableCell>
                      </TableRow>
                    ))}
                    {/* Total row */}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{fmt(addressableSpend)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {fmt(tierBreakdown.reduce((s, t) => s + t.baseSpend, 0))}
                      </TableCell>
                      <TableCell className="text-right">--</TableCell>
                      <TableCell className="text-right font-bold text-primary">{fmt(estimatedSavings)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── AI Insights Tab ─────────────────────────────────────────── */}
        <TabsContent value="insights" className="space-y-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">AI-Generated Insights</p>
            <Badge variant="secondary" className="text-[10px]">Deterministic</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            These insights are generated from the trim proliferation dataset. Save them to your Internal Fact Base for use across all modules.
          </p>
          {aiInsights.map((insight, idx) => {
            const isSaved = savedInsights.has(idx)
            return (
              <Card key={idx} className="shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{insight.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        {insight.text}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {insight.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] h-4">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant={isSaved ? "secondary" : "outline"}
                      size="sm"
                      className={cn("h-7 text-xs shrink-0", !isSaved && "bg-transparent")}
                      onClick={() => handleSaveInsight(idx)}
                      disabled={isSaved}
                    >
                      {isSaved ? (
                        <>
                          <Check className="mr-1 h-3 w-3" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Bookmark className="mr-1 h-3 w-3" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}
