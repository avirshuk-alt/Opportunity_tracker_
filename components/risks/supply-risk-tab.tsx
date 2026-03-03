"use client"

import { useState, useMemo, useCallback } from "react"
import { useRiskFilters } from "@/lib/risk-filter-context"
import {
  getSupplierEngagements,
  getMonitoringItems,
  getSegmentSummary,
  getSegmentationSuppliers,
  getIRQDetail,
  getSupplierHeatmap,
  getCategoriesForSupplier,
  getSuppliersForCategory,
  getAllProcurementCategoryNames,
  ALL_IRR_DOMAINS,
  formatSpend,
  type SupplierEngagement,
  type IRRLevel,
  type IRRDomain,
} from "@/lib/risk-module-data"
import { fleetSuppliers, formatCurrencyShort } from "@/lib/supplier-strategy-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { InfoTip } from "@/components/risks/info-tip"
import { FilterPill, ShowAllButton } from "@/components/risks/filter-pill"
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  RotateCcw,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"

const irrBadgeStyle: Record<IRRLevel, string> = {
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-red-50 text-red-700 border-red-200",
  Critical: "bg-red-100 text-red-800 border-red-300",
}

const heatmapColor: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-red-100 text-red-800",
  "N/A": "bg-muted text-muted-foreground",
}

const monitoringStatusIcon: Record<string, typeof CheckCircle2> = {
  "On Track": CheckCircle2,
  "Due Soon": Clock,
  Overdue: XCircle,
  Complete: CheckCircle2,
}

const monitoringStatusStyle: Record<string, string> = {
  "On Track": "text-emerald-600",
  "Due Soon": "text-amber-600",
  Overdue: "text-red-600",
  Complete: "text-emerald-500",
}

export function SupplyRiskTab() {
  const { filters, setFilter, navigateWithFilter } = useRiskFilters()
  const [subTab, setSubTab] = useState("segmentation")

  // Dual-dropdown state for 3B
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("all")
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("all")

  const segments = useMemo(() => getSegmentSummary(), [])
  const engagements = useMemo(() => getSupplierEngagements(), [])
  const segmentationSuppliers = useMemo(() => getSegmentationSuppliers(), [])
  const monitoringItems = useMemo(() => getMonitoringItems(), [])
  const allCategoryNames = useMemo(() => getAllProcurementCategoryNames(), [])

  // Category filter (from Risk Registration drilldown)
  const activeCategoryFilter = filters.procurementCategory !== "all" ? filters.procurementCategory : null

  // --- 3A: Filter suppliers by category if drilled down ---
  const filteredSegmentationSuppliers = useMemo(() => {
    if (!activeCategoryFilter) return segmentationSuppliers
    return segmentationSuppliers.filter((s) =>
      s.categoriesServed.includes(activeCategoryFilter)
    )
  }, [segmentationSuppliers, activeCategoryFilter])

  // --- 3B: Engagement filtering ---
  const filteredEngagements = useMemo(() => {
    let result = engagements
    if (filters.segment !== "all") {
      result = result.filter((e) => e.segment === filters.segment)
    }
    if (filters.irrLevel !== "all") {
      result = result.filter((e) => {
        if (filters.irrLevel === "High")
          return e.irrLevel === "High" || e.irrLevel === "Critical"
        return e.irrLevel === filters.irrLevel
      })
    }
    return result
  }, [engagements, filters])

  // Dual-dropdown locking logic
  const constrainedCategories = useMemo(() => {
    if (selectedSupplierId !== "all") {
      return getCategoriesForSupplier(selectedSupplierId)
    }
    return allCategoryNames
  }, [selectedSupplierId, allCategoryNames])

  const constrainedSupplierIds = useMemo(() => {
    if (selectedCategoryName !== "all") {
      return getSuppliersForCategory(selectedCategoryName)
    }
    return fleetSuppliers.map((s) => s.id)
  }, [selectedCategoryName])

  const handleSupplierDropdownChange = useCallback((val: string) => {
    setSelectedSupplierId(val)
    if (val !== "all") {
      // Constrain category: if current category is not in the supplier's categories, reset
      const cats = getCategoriesForSupplier(val)
      setSelectedCategoryName((prev) => {
        if (prev !== "all" && !cats.includes(prev)) return "all"
        return prev
      })
    }
  }, [])

  const handleCategoryDropdownChange = useCallback((val: string) => {
    setSelectedCategoryName(val)
    if (val !== "all") {
      const sups = getSuppliersForCategory(val)
      setSelectedSupplierId((prev) => {
        if (prev !== "all" && !sups.includes(prev)) return "all"
        return prev
      })
    }
  }, [])

  const resetDualSelection = useCallback(() => {
    setSelectedSupplierId("all")
    setSelectedCategoryName("all")
  }, [])

  // IRQ detail for selected supplier
  const irqDetail = useMemo(() => {
    if (selectedSupplierId === "all") return null
    return getIRQDetail(selectedSupplierId)
  }, [selectedSupplierId])

  // Heatmap data
  const heatmapData = useMemo(() => {
    if (selectedSupplierId === "all") return []
    return getSupplierHeatmap(selectedSupplierId)
  }, [selectedSupplierId])

  const selectedSupplier = useMemo(() => {
    return fleetSuppliers.find((s) => s.id === selectedSupplierId)
  }, [selectedSupplierId])

  // Filter monitoring items
  const filteredMonitoring = useMemo(() => {
    let result = monitoringItems
    if (filters.segment !== "all") {
      const segSuppliers = fleetSuppliers
        .filter((s) => s.segment === filters.segment)
        .map((s) => s.id)
      result = result.filter((d) => segSuppliers.includes(d.supplierId))
    }
    if (filters.overdueOnly === "true") {
      result = result.filter((d) => d.overdueFlag)
    }
    return result
  }, [monitoringItems, filters])

  // Click supplier row to jump to stratification
  const handleSupplierRowClick = useCallback(
    (supplierId: string) => {
      setSelectedSupplierId(supplierId)
      setSelectedCategoryName("all")
      setSubTab("stratification")
    },
    []
  )

  // Spend by segment for chart
  const spendBySegment = segments.map((s) => ({
    segment: s.segment,
    spend: Math.round((s.spend / 1_000_000) * 10) / 10,
    highIRR: s.highIRR,
  }))

  const clearCategoryFilter = useCallback(() => {
    setFilter("procurementCategory", "all")
  }, [setFilter])

  return (
    <div className="space-y-4">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList>
          <TabsTrigger value="segmentation">Segmentation</TabsTrigger>
          <TabsTrigger value="stratification">
            {"Risk Stratification & IRR"}
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            {"Ongoing Risk & Performance Monitoring"}
          </TabsTrigger>
        </TabsList>

        {/* ────── 3A: Segmentation ────── */}
        <TabsContent value="segmentation" className="space-y-4 mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {segments.map((s) => (
              <Card key={s.segment}>
                <CardContent className="py-3 px-4">
                  <p className="text-xs text-muted-foreground">{s.segment}</p>
                  <p className="text-xl font-bold mt-1 text-foreground">
                    {s.count} suppliers
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatCurrencyShort(s.spend)}
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
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Spend by Segment Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Spend by Supplier Segment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={spendBySegment}
                  margin={{ top: 10, right: 20, bottom: 5, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Spend ($M)",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: 12 },
                    }}
                  />
                  <RechartsTooltip
                    content={({ payload }) => {
                      if (!payload?.[0]) return null
                      const d = payload[0].payload
                      return (
                        <div className="rounded-md border bg-card p-2 shadow-md">
                          <p className="text-sm font-medium text-foreground">
                            {d.segment}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${d.spend}M | {d.highIRR} High IRR
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="spend"
                    fill="hsl(22, 92%, 52%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Supplier Table */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Suppliers by Segment</CardTitle>
                <div className="flex items-center gap-2">
                  {activeCategoryFilter && (
                    <FilterPill
                      label="Category"
                      value={activeCategoryFilter}
                      onClear={clearCategoryFilter}
                    />
                  )}
                  {activeCategoryFilter && (
                    <ShowAllButton onClick={clearCategoryFilter} />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead className="text-right">Spend ($)</TableHead>
                    <TableHead>Categories Served</TableHead>
                    <TableHead>What They Supply</TableHead>
                    <TableHead className="text-center">
                      <span className="inline-flex items-center gap-1">
                        Highest IRR <InfoTip term="IRR" />
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      Next Review
                    </TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSegmentationSuppliers.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSupplierRowClick(s.id)}
                    >
                      <TableCell className="font-medium text-sm text-foreground">
                        {s.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {s.segment}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono text-foreground">
                        {formatCurrencyShort(s.spend)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {s.categoriesServed.map((cat) => (
                            <Badge
                              key={cat}
                              variant="outline"
                              className="text-[10px] bg-muted/50 whitespace-normal"
                            >
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[220px] whitespace-normal break-words">
                        {s.whatTheySupply}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            irrBadgeStyle[s.highestIRR]
                          )}
                        >
                          {s.highestIRR}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {s.nextReview}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────── 3B: Risk Stratification & Inherent Risk Rating ────── */}
        <TabsContent value="stratification" className="space-y-4 mt-4">
          {/* Top Section: Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={filters.segment}
              onValueChange={(v) => setFilter("segment", v)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                <SelectItem value="Strategic">Strategic</SelectItem>
                <SelectItem value="Preferred">Preferred</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Transactional">Transactional</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.irrLevel}
              onValueChange={(v) => setFilter("irrLevel", v)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="IRR Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High / Critical</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {filteredEngagements.length} engagements
            </span>
          </div>

          {/* Engagement Risk Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Engagement Risk Table
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Categories Served</TableHead>
                    <TableHead className="text-center">
                      <span className="inline-flex items-center gap-1">
                        IRR Level <InfoTip term="IRR" />
                      </span>
                    </TableHead>
                    <TableHead>Rationale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEngagements.map((eng) => {
                    const rationale = getRationale(eng)
                    const cats = getCategoriesForSupplier(eng.supplierId)
                    return (
                      <TableRow
                        key={eng.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          selectedSupplierId === eng.supplierId &&
                            "bg-primary/5 border-l-2 border-l-primary"
                        )}
                        onClick={() => {
                          setSelectedSupplierId(eng.supplierId)
                          setSelectedCategoryName("all")
                        }}
                      >
                        <TableCell className="font-medium text-sm text-foreground">
                          {eng.supplierName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[180px] whitespace-normal break-words">
                          {eng.engagement}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {eng.segment}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {cats.map((cat) => (
                              <Badge
                                key={cat}
                                variant="outline"
                                className="text-[10px] bg-muted/50 whitespace-normal"
                              >
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              irrBadgeStyle[eng.irrLevel]
                            )}
                          >
                            {eng.irrLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[280px] whitespace-normal break-words">
                          {rationale}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Bottom Section: Dual Selector + Heatmap + IRQ Detail */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Left: Dual-dropdown + IRR by Risk Domain */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    <span className="inline-flex items-center gap-1">
                      IRR by Risk Domain <InfoTip term="Risk Domain" />
                    </span>
                  </CardTitle>
                  {(selectedSupplierId !== "all" || selectedCategoryName !== "all") && (
                    <button
                      onClick={resetDualSelection}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset selection
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dual Dropdowns */}
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedSupplierId}
                    onValueChange={handleSupplierDropdownChange}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select Supplier..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select Supplier...</SelectItem>
                      {fleetSuppliers.map((s) => (
                        <SelectItem
                          key={s.id}
                          value={s.id}
                          disabled={!constrainedSupplierIds.includes(s.id)}
                        >
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedCategoryName}
                    onValueChange={handleCategoryDropdownChange}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select Category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select Category...</SelectItem>
                      {allCategoryNames.map((cat) => (
                        <SelectItem
                          key={cat}
                          value={cat}
                          disabled={!constrainedCategories.includes(cat)}
                        >
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Heatmap Table */}
                {selectedSupplierId !== "all" && heatmapData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left py-2 pr-2 font-medium text-muted-foreground">
                            Risk Domain
                          </th>
                          <th className="text-center py-2 px-2 font-medium text-muted-foreground">
                            Level
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ALL_IRR_DOMAINS.map((domain) => {
                          const cell = heatmapData.find(
                            (c) => c.domain === domain
                          )
                          const level = cell?.level ?? "N/A"
                          return (
                            <tr key={domain} className="border-t border-border">
                              <td className="py-2 pr-2 text-foreground">
                                {domain}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span
                                  className={cn(
                                    "inline-block rounded px-2 py-0.5 text-[10px] font-semibold",
                                    heatmapColor[level]
                                  )}
                                >
                                  {level}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <ShieldAlert className="h-8 w-8 mb-2" />
                    <p className="text-sm">
                      Select a supplier from the table above or the dropdown to
                      view their risk domain heatmap.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: IRQ Detail OR simplified summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {selectedSupplier?.segment === "Strategic"
                    ? "IRQ Results"
                    : "Risk Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSupplierId === "all" ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <ShieldAlert className="h-8 w-8 mb-2" />
                    <p className="text-sm">
                      Select a supplier to view their risk assessment.
                    </p>
                  </div>
                ) : selectedSupplier?.segment === "Strategic" && irqDetail ? (
                  <div className="space-y-4">
                    {/* Overall IRR Badge */}
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          <span className="inline-flex items-center gap-1">
                            Overall IRR Score <InfoTip term="IRR" />
                          </span>
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-sm px-3 py-1.5 font-bold",
                            irrBadgeStyle[irqDetail.overallIRR]
                          )}
                        >
                          {irqDetail.overallIRR}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Triggered Domains
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {
                            irqDetail.domains.filter((d) => d.triggered)
                              .length
                          }
                          /{irqDetail.domains.length}
                        </p>
                      </div>
                    </div>

                    {/* Risk Domain Table */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Risk Domain Assessment
                      </p>
                      <div className="space-y-1.5">
                        {irqDetail.domains.map((d) => (
                          <div
                            key={d.domain}
                            className={cn(
                              "rounded-lg border p-3",
                              d.triggered && d.riskLevel === "High"
                                ? "border-l-2 border-l-red-400"
                                : d.triggered && d.riskLevel === "Medium"
                                  ? "border-l-2 border-l-amber-400"
                                  : ""
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-foreground">
                                {d.domain}
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                    heatmapColor[d.riskLevel]
                                  )}
                                >
                                  {d.riskLevel}
                                </span>
                                {d.triggered ? (
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                )}
                              </div>
                            </div>
                            {d.keyDrivers.length > 0 && (
                              <ul className="mt-1 space-y-0.5">
                                {d.keyDrivers.map((driver, i) => (
                                  <li
                                    key={i}
                                    className="text-[11px] text-muted-foreground flex items-start gap-1.5"
                                  >
                                    <span className="mt-1 shrink-0">
                                      {"--"}
                                    </span>
                                    {driver}
                                  </li>
                                ))}
                              </ul>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1 italic">
                              {d.additionalInsights}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* IRR Challenges */}
                    {irqDetail.challenges.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          IRR Challenges
                        </p>
                        <ul className="space-y-1">
                          {irqDetail.challenges.map((c, i) => (
                            <li
                              key={i}
                              className="text-xs text-muted-foreground flex items-start gap-1.5"
                            >
                              <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : selectedSupplier ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-dashed p-4 bg-muted/30">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Strategic IRQ Only
                      </p>
                      <p className="text-xs text-muted-foreground">
                        IRQ results are displayed for Strategic suppliers. 
                        <span className="font-medium text-foreground"> {selectedSupplier.name}</span> is 
                        classified as <span className="font-medium text-foreground">{selectedSupplier.segment}</span>.
                      </p>
                    </div>
                    {heatmapData.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {heatmapData.map((cell) => (
                          <div
                            key={cell.domain}
                            className="flex items-center justify-between rounded border px-2.5 py-2"
                          >
                            <span className="text-xs text-foreground mr-2 whitespace-normal break-words">
                              {cell.domain}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0",
                                heatmapColor[cell.level]
                              )}
                            >
                              {cell.level}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ────── 3C: Ongoing Risk & Performance Monitoring ────── */}
        <TabsContent value="monitoring" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={filters.segment}
              onValueChange={(v) => setFilter("segment", v)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                <SelectItem value="Strategic">Strategic</SelectItem>
                <SelectItem value="Preferred">Preferred</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Transactional">Transactional</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.overdueOnly}
              onValueChange={(v) => setFilter("overdueOnly", v)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">All Items</SelectItem>
                <SelectItem value="true">Overdue Only</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {filteredMonitoring.length} items
              {filteredMonitoring.filter((d) => d.overdueFlag).length > 0 && (
                <span className="text-red-600 ml-1">
                  (
                  {filteredMonitoring.filter((d) => d.overdueFlag).length}{" "}
                  overdue)
                </span>
              )}
            </span>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>
                      <span className="inline-flex items-center gap-1">
                        Risk Domain <InfoTip term="Risk Domain" />
                      </span>
                    </TableHead>
                    <TableHead>Monitoring Activity</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-center">Cadence</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Overdue Flag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMonitoring.slice(0, 40).map((item) => {
                    const StatusIcon = monitoringStatusIcon[item.status]
                    return (
                      <TableRow
                        key={item.id}
                        className={cn(item.overdueFlag && "bg-red-50/40")}
                      >
                        <TableCell className="font-medium text-sm text-foreground">
                          {item.supplierName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-normal break-words max-w-[160px]">
                          {item.category}
                        </TableCell>
                        <TableCell className="text-sm text-foreground whitespace-normal break-words">
                          {item.riskDomain}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs whitespace-normal">
                            {item.monitoringActivity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.owner.split(" ")[0]}
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {item.cadence}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <StatusIcon
                              className={cn(
                                "h-3.5 w-3.5",
                                monitoringStatusStyle[item.status]
                              )}
                            />
                            <span
                              className={cn(
                                "text-xs",
                                monitoringStatusStyle[item.status]
                              )}
                            >
                              {item.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.overdueFlag && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-red-50 text-red-700 border-red-200"
                            >
                              OVERDUE
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Helper: Generate engagement rationale ──────────────────────────────────

function getRationale(eng: SupplierEngagement): string {
  const highDomains = eng.domains
    .filter((d) => d.inScope && d.riskLevel === "High")
    .map((d) => d.domain.toLowerCase())

  if (eng.irrLevel === "Critical") {
    return `Critical due to ${highDomains.slice(0, 2).join(" and ")} exposure${eng.triggeredDomainCount > 2 ? ` (+${eng.triggeredDomainCount - 2} more domains)` : ""}`
  }
  if (eng.irrLevel === "High") {
    return `High due to ${highDomains.slice(0, 2).join(" and ")}${highDomains.length > 2 ? ` and ${highDomains.length - 2} more` : ""}`
  }
  if (eng.irrLevel === "Medium") {
    const medDomains = eng.domains
      .filter((d) => d.inScope && d.riskLevel === "Medium")
      .map((d) => d.domain.toLowerCase())
    return `Medium risk from ${medDomains.slice(0, 2).join(" and ")} factors`
  }
  return "Low overall risk profile across assessed domains"
}
