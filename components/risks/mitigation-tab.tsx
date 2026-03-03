"use client"

import { useState, useMemo } from "react"
import { useCategory } from "@/lib/category-context"
import { useRiskFilters } from "@/lib/risk-filter-context"
import {
  getEnhancedMitigationActions,
  getEnhancedExposureReduction,
  formatSpend,
  type IRRLevel,
  type EnhancedMitigationAction,
} from "@/lib/risk-module-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { InfoTip } from "@/components/risks/info-tip"
import { FilterPill, ShowAllButton } from "@/components/risks/filter-pill"
import {
  TrendingDown,
  ShieldCheck,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Upload,
} from "lucide-react"

const irrBadgeStyle: Record<IRRLevel, string> = {
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-red-50 text-red-700 border-red-200",
  Critical: "bg-red-100 text-red-800 border-red-300",
}

const statusStyle: Record<string, string> = {
  "Not Started": "bg-muted text-muted-foreground border-border",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  Complete: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Overdue: "bg-red-50 text-red-700 border-red-200",
}

const statusIcon: Record<string, typeof CheckCircle2> = {
  "Not Started": Clock,
  "In Progress": Clock,
  Complete: CheckCircle2,
  Overdue: XCircle,
}

export function MitigationTab() {
  const { selectedCategory } = useCategory()
  const { filters, setFilter, navigateWithFilter } = useRiskFilters()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAction, setSelectedAction] =
    useState<EnhancedMitigationAction | null>(null)

  const allActions = useMemo(
    () => getEnhancedMitigationActions(selectedCategory.id),
    [selectedCategory.id]
  )
  const exposure = useMemo(
    () => getEnhancedExposureReduction(selectedCategory.id),
    [selectedCategory.id]
  )

  // Active supplier/category filters from drilldown
  const activeSupplierFilter = filters.supplier !== "all" ? filters.supplier : null
  const activeCategoryFilter = filters.procurementCategory !== "all" ? filters.procurementCategory : null

  // Apply filters
  const filteredActions = useMemo(() => {
    let result = allActions
    if (activeSupplierFilter) {
      result = result.filter((a) =>
        a.supplierName
          ?.toLowerCase()
          .includes(activeSupplierFilter.toLowerCase())
      )
    }
    if (filters.irrLevel !== "all") {
      result = result.filter((a) => {
        if (filters.irrLevel === "High")
          return a.irrLevel === "High" || a.irrLevel === "Critical"
        return a.irrLevel === filters.irrLevel
      })
    }
    if (filters.overdueOnly === "true") {
      result = result.filter((a) => a.status === "Overdue")
    }
    return result
  }, [allActions, activeSupplierFilter, filters])

  const uniqueSupplierNames = useMemo(() => {
    const names = new Set(
      allActions.filter((a) => a.supplierName).map((a) => a.supplierName!)
    )
    return Array.from(names)
  }, [allActions])

  const clearSupplierFilter = () => setFilter("supplier", "all")
  const clearCategoryFilter = () => setFilter("procurementCategory", "all")
  const clearAllFilters = () => {
    setFilter("supplier", "all")
    setFilter("procurementCategory", "all")
    setFilter("irrLevel", "all")
    setFilter("overdueOnly", "false")
  }

  const openDrawer = (action: EnhancedMitigationAction) => {
    setSelectedAction(action)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Attention Banner */}
      <Card className="border-red-200 bg-red-50/30">
        <CardContent className="py-3 px-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Suppliers Requiring Immediate Attention
              </p>
              <p className="text-xs text-red-600">
                Showing only High and Critical IRR suppliers with active
                mitigation requirements.
              </p>
            </div>
            <Badge
              variant="outline"
              className="ml-auto text-xs bg-red-50 text-red-700 border-red-200 shrink-0"
            >
              {allActions.length} actions
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Exposure Reduction Summary */}
      <Card className="border-primary/20 bg-gradient-to-r from-card to-muted/30">
        <CardContent className="py-4 px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                <span className="inline-flex items-center gap-1">
                  Exposure Reduction Summary <InfoTip term="Current Exposure" />
                </span>
              </p>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      Current Exposure <InfoTip term="Current Exposure" />
                    </span>
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {formatSpend(exposure.currentExposure)}
                  </p>
                </div>
                <ArrowDown className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Projected After Mitigation
                  </p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatSpend(exposure.projectedExposure)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">% Reduction</p>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-emerald-500" />
                  <span className="text-2xl font-bold text-emerald-600">
                    {exposure.pctReduction}%
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    Total Est. Cost Reduction <InfoTip term="Estimated cost reduction" />
                  </span>
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatSpend(exposure.totalReduction)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {activeSupplierFilter && (
          <FilterPill
            label="Supplier"
            value={activeSupplierFilter}
            onClear={clearSupplierFilter}
          />
        )}
        {activeCategoryFilter && (
          <FilterPill
            label="Category"
            value={activeCategoryFilter}
            onClear={clearCategoryFilter}
          />
        )}

        <Select
          value={filters.supplier}
          onValueChange={(v) => setFilter("supplier", v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {uniqueSupplierNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
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
            <SelectItem value="High">High / Critical</SelectItem>
            <SelectItem value="Critical">Critical Only</SelectItem>
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
            <SelectItem value="false">All Actions</SelectItem>
            <SelectItem value="true">Overdue Only</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">
          {filteredActions.length} action
          {filteredActions.length !== 1 ? "s" : ""}
        </span>

        {(activeSupplierFilter || activeCategoryFilter) && (
          <ShowAllButton onClick={clearAllFilters} />
        )}
      </div>

      {/* Actions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-center">
                  <span className="inline-flex items-center gap-1">
                    IRR Level <InfoTip term="IRR" />
                  </span>
                </TableHead>
                <TableHead>Linked Risk</TableHead>
                <TableHead>Action Recommendation</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-center">Due Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">
                  <span className="inline-flex items-center gap-1">
                    Est. Cost Reduction <InfoTip term="Estimated cost reduction" />
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActions.map((action) => {
                const StatusIconComp = statusIcon[action.status]
                return (
                  <TableRow
                    key={action.id}
                    className={cn(
                      "cursor-pointer",
                      action.irrLevel === "Critical" && "bg-red-50/30",
                      action.status === "Overdue" && "bg-red-50/40"
                    )}
                    onClick={() => openDrawer(action)}
                  >
                    <TableCell className="font-medium text-sm text-foreground">
                      {action.supplierName ?? "--"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold",
                          irrBadgeStyle[action.irrLevel]
                        )}
                      >
                        {action.irrLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground max-w-[180px] whitespace-normal break-words">
                        {action.linkedRiskTitle}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground max-w-[220px] whitespace-normal break-words">
                        {action.actionRecommendation}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {action.owner.split(" ")[0]}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {action.dueDate}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          statusStyle[action.status]
                        )}
                      >
                        {action.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium font-mono text-foreground">
                      {formatSpend(action.estimatedCostReduction)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedAction && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Mitigation Detail
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-5 mt-4">
                {/* IRR + Supplier */}
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-sm px-3 py-1",
                      irrBadgeStyle[selectedAction.irrLevel]
                    )}
                  >
                    IRR: {selectedAction.irrLevel}
                  </Badge>
                  {selectedAction.supplierName && (
                    <Badge variant="outline" className="text-sm">
                      {selectedAction.supplierName}
                    </Badge>
                  )}
                </div>

                {/* Linked Risk */}
                <Card>
                  <CardContent className="py-3 px-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      Linked Risk
                    </p>
                    <p className="text-sm font-medium text-foreground whitespace-normal break-words">
                      {selectedAction.linkedRiskTitle}
                    </p>
                  </CardContent>
                </Card>

                {/* Action Recommendation */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Recommended Action
                  </p>
                  <p className="text-sm text-foreground whitespace-normal break-words">
                    {selectedAction.actionRecommendation}
                  </p>
                </div>

                {/* Task Checklist */}
                <div>
                  <p className="text-sm font-medium mb-3 text-foreground">
                    Task Checklist
                  </p>
                  <div className="space-y-2">
                    {selectedAction.tasks.map((task, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Checkbox
                          checked={task.done}
                          className="mt-0.5"
                          disabled
                        />
                        <span
                          className={cn(
                            "text-foreground",
                            task.done &&
                              "line-through text-muted-foreground"
                          )}
                        >
                          {task.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evidence */}
                <div>
                  <p className="text-sm font-medium mb-2 text-foreground">
                    Evidence
                  </p>
                  <div className="border border-dashed rounded-md p-4 flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-5 w-5" />
                    <span className="text-xs">
                      Drop files here or click to upload
                    </span>
                  </div>
                </div>

                {/* Cost Reduction Preview */}
                <Card>
                  <CardContent className="py-3 px-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      <span className="inline-flex items-center gap-1">
                        Estimated Cost Reduction <InfoTip term="Estimated cost reduction" />
                      </span>
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatSpend(selectedAction.estimatedCostReduction)}
                    </p>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setDrawerOpen(false)
                      navigateWithFilter("supply-risk", {})
                    }}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    View Supplier Risk
                  </Button>
                  <Button size="sm" className="flex-1">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Mark Complete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
