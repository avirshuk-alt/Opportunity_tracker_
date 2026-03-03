"use client"

import { useMemo } from "react"
import { useRiskFilters } from "@/lib/risk-filter-context"
import {
  getProcurementCategories,
  getIRRSummary,
  formatSpend,
  type IRRLevel,
} from "@/lib/risk-module-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { InfoTip } from "@/components/risks/info-tip"
import { FilterPill, ShowAllButton } from "@/components/risks/filter-pill"

const irrBadgeStyle: Record<IRRLevel, string> = {
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-red-50 text-red-700 border-red-200",
  Critical: "bg-red-100 text-red-800 border-red-300",
}

const irrSummaryBg: Record<IRRLevel, string> = {
  Critical: "bg-red-50",
  High: "bg-red-50/50",
  Medium: "bg-amber-50/50",
  Low: "bg-emerald-50/50",
}

export function RegisterTab() {
  const { navigateWithFilter, filters, setFilter } = useRiskFilters()

  const categories = useMemo(() => getProcurementCategories(), [])
  const irrSummary = useMemo(() => getIRRSummary(), [])

  // Filter by procurement category if set from Overview
  const activeCategoryFilter = filters.procurementCategory !== "all" ? filters.procurementCategory : null

  const filteredCategories = useMemo(() => {
    if (activeCategoryFilter) {
      return categories.filter((c) => c.category === activeCategoryFilter)
    }
    return categories
  }, [categories, activeCategoryFilter])

  const totalSpend = categories.reduce((s, c) => s + c.spend, 0)

  const clearFilter = () => {
    setFilter("procurementCategory", "all")
  }

  // Drilldown: click a category row to navigate to Supply Risk > Segmentation filtered by that category
  const handleCategoryClick = (categoryName: string) => {
    navigateWithFilter("supply-risk", {
      procurementCategory: categoryName,
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">
              Total Procurement Categories
            </p>
            <p className="text-xl font-bold mt-1 text-foreground">
              {categories.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">
              Categories Above Appetite
            </p>
            <p className="text-xl font-bold mt-1 text-red-600">
              {categories.filter((c) => c.aboveAppetite).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">
              Total Spend Under Management
            </p>
            <p className="text-xl font-bold mt-1 text-foreground">
              {formatSpend(totalSpend)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                High/Critical IRR Categories <InfoTip term="Aggregated IRR" />
              </span>
            </p>
            <p className="text-xl font-bold mt-1 text-red-600">
              {
                categories.filter(
                  (c) =>
                    c.aggregatedIRR === "High" ||
                    c.aggregatedIRR === "Critical"
                ).length
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Procurement Category Risk Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Procurement Category Risk Registration
            </CardTitle>
            <div className="flex items-center gap-2">
              {activeCategoryFilter && (
                <FilterPill
                  label="Category"
                  value={activeCategoryFilter}
                  onClear={clearFilter}
                />
              )}
              <ShowAllButton onClick={clearFilter} className={activeCategoryFilter ? "" : "opacity-50"} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Procurement Category</TableHead>
                <TableHead className="text-center">
                  <span className="inline-flex items-center gap-1">
                    Aggregated IRR <InfoTip term="Aggregated IRR" />
                  </span>
                </TableHead>
                <TableHead className="text-center">Impact (1-5)</TableHead>
                <TableHead className="text-center">
                  Likelihood (1-5)
                </TableHead>
                <TableHead className="text-center">
                  Appetite Threshold
                </TableHead>
                <TableHead>Rationale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((cat) => (
                <TableRow
                  key={cat.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    cat.aboveAppetite && "bg-red-50/30"
                  )}
                  onClick={() => handleCategoryClick(cat.category)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {cat.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cat.supplierCount} supplier
                        {cat.supplierCount !== 1 ? "s" : ""} | {formatSpend(cat.spend)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-semibold",
                        irrBadgeStyle[cat.aggregatedIRR]
                      )}
                    >
                      {cat.aggregatedIRR}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "text-sm font-mono font-semibold underline decoration-dotted underline-offset-2 cursor-help",
                            cat.impact >= 4
                              ? "text-red-600"
                              : cat.impact >= 3
                                ? "text-amber-600"
                                : "text-foreground"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {cat.impact}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="top" className="w-72 text-xs">
                        <p className="font-semibold text-foreground mb-1">Rationale</p>
                        <p className="text-muted-foreground leading-relaxed whitespace-normal break-words">
                          {cat.rationale}
                        </p>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="text-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "text-sm font-mono font-semibold underline decoration-dotted underline-offset-2 cursor-help",
                            cat.likelihood >= 4
                              ? "text-red-600"
                              : cat.likelihood >= 3
                                ? "text-amber-600"
                                : "text-foreground"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {cat.likelihood}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="top" className="w-72 text-xs">
                        <p className="font-semibold text-foreground mb-1">Rationale</p>
                        <p className="text-muted-foreground leading-relaxed whitespace-normal break-words">
                          {cat.rationale}
                        </p>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Badge variant="outline" className="text-xs">
                        {cat.appetiteThreshold}
                      </Badge>
                      {cat.aboveAppetite ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="text-xs text-muted-foreground whitespace-normal break-words leading-relaxed">
                      {cat.rationale}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Overall IRR Summary Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            <span className="inline-flex items-center gap-1">
              Overall IRR Summary <InfoTip term="Aggregated IRR" />
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IRR Level</TableHead>
                <TableHead className="text-center">
                  # of Categories
                </TableHead>
                <TableHead className="text-center">% of Spend</TableHead>
                <TableHead className="text-center">
                  Above Appetite
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {irrSummary.map((row) => (
                <TableRow
                  key={row.level}
                  className={cn(irrSummaryBg[row.level])}
                >
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-semibold",
                        irrBadgeStyle[row.level]
                      )}
                    >
                      {row.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm font-semibold text-foreground">
                    {row.categoryCount}
                  </TableCell>
                  <TableCell className="text-center text-sm text-foreground">
                    {row.pctOfSpend}%
                  </TableCell>
                  <TableCell className="text-center">
                    {row.aboveAppetite ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-red-50 text-red-700 border-red-200"
                      >
                        Yes
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        No
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
