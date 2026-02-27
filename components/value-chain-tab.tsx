"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  ArrowRight,
  Building2,
  AlertTriangle,
  ExternalLink,
  FileText,
  DollarSign,
  Calendar,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  valueChainStages,
  valueChainSuppliers,
  type ValueChainSupplier,
} from "@/lib/external-market-data"
import { AIInsightsCard } from "@/components/ai-insights-card"
import type { ChartContext } from "@/app/api/internal-fact-insights/route"
import { toast } from "sonner"

// ─── Value Chain Node ───────────────────────────────────────────────────────

function ChainNode({
  stage,
  suppliers,
  onSupplierClick,
}: {
  stage: typeof valueChainStages[0]
  suppliers: ValueChainSupplier[]
  onSupplierClick: (s: ValueChainSupplier) => void
}) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <Card className={cn(
        "w-full transition-all",
        stage.isOurs
          ? "border-primary/50 bg-primary/5 shadow-md"
          : "hover:border-primary/20"
      )}>
        <CardContent className="py-3 px-3">
          <div className="text-center mb-2">
            <div className={cn(
              "inline-flex items-center justify-center rounded-lg p-2 mb-1.5",
              stage.isOurs ? "bg-primary/15" : "bg-muted"
            )}>
              <Building2 className={cn("h-4 w-4", stage.isOurs ? "text-primary" : "text-muted-foreground")} />
            </div>
            <h3 className={cn(
              "text-xs font-semibold leading-tight",
              stage.isOurs ? "text-primary" : "text-foreground"
            )}>
              {stage.shortName}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{stage.description}</p>
          </div>

          {/* Suppliers in this stage */}
          {suppliers.length > 0 && (
            <div className="space-y-1 mt-2 pt-2 border-t border-border/50">
              {suppliers.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSupplierClick(s)}
                  className="flex items-center gap-1.5 w-full rounded px-1.5 py-1 text-left hover:bg-muted transition-colors group"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-[10px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {s.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Hotspot */}
          {stage.hotspot && (
            <div className={cn(
              "mt-2 rounded px-2 py-1.5 text-[10px] font-medium flex items-center gap-1.5",
              stage.hotspot.severity === "high" && "bg-red-50 text-red-700",
              stage.hotspot.severity === "medium" && "bg-amber-50 text-amber-700",
              stage.hotspot.severity === "low" && "bg-muted text-muted-foreground",
            )}>
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span className="leading-tight">{stage.hotspot.label}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Contract Type Badge ────────────────────────────────────────────────────

function ContractTypeBadge({ type }: { type: ValueChainSupplier["contractType"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px]",
        type === "Contract" && "bg-emerald-50 text-emerald-700 border-emerald-200",
        type === "PO" && "bg-amber-50 text-amber-700 border-amber-200",
        type === "Subscription" && "bg-blue-50 text-blue-700 border-blue-200",
      )}
    >
      {type}
    </Badge>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface ValueChainTabProps {
  onNavigateToResearch?: (query: string) => void
}

export function ValueChainTab({ onNavigateToResearch }: ValueChainTabProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<ValueChainSupplier | null>(null)

  const suppliersByStage = useMemo(() => {
    const map = new Map<string, ValueChainSupplier[]>()
    valueChainStages.forEach((s) => map.set(s.id, []))
    valueChainSuppliers.forEach((s) => {
      const existing = map.get(s.stageId) ?? []
      existing.push(s)
      map.set(s.stageId, existing)
    })
    return map
  }, [])

  const hotspots = useMemo(() =>
    valueChainStages.filter((s) => s.hotspot),
  [])

  const handleResearchTopic = useCallback((topic: string) => {
    if (onNavigateToResearch) {
      onNavigateToResearch(topic)
    }
    setSelectedSupplier(null)
  }, [onNavigateToResearch])

  const chartContext: ChartContext = useMemo(() => ({
    chartId: "value_chain_analysis",
    chartTitle: "Value Chain Analysis - Pharma Fleet",
    breakdownType: "supplier",
    currency: "USD",
    dataSummary: {
      topItems: valueChainSuppliers.map((s) => ({ name: s.name, value: s.annualSpend * 1e6 })),
      totals: {
        totalSpend: valueChainSuppliers.reduce((a, s) => a + s.annualSpend * 1e6, 0),
      },
    },
  }), [])

  return (
    <div className="space-y-6">
      {/* ─── A) Value Chain Diagram ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Value Chain Map</CardTitle>
          <CardDescription className="text-xs mt-0.5">
            Upstream to downstream ecosystem. Click a supplier name to view details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Horizontal chain for lg+, vertical for mobile */}
          <div className="flex flex-col lg:flex-row items-stretch gap-0 lg:gap-0">
            {valueChainStages.map((stage, i) => (
              <div key={stage.id} className="flex flex-col lg:flex-row items-center flex-1 min-w-0">
                <ChainNode
                  stage={stage}
                  suppliers={suppliersByStage.get(stage.id) ?? []}
                  onSupplierClick={setSelectedSupplier}
                />
                {/* Arrow connector */}
                {i < valueChainStages.length - 1 && (
                  <>
                    <div className="hidden lg:flex items-center px-1 shrink-0">
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex lg:hidden items-center py-1 shrink-0 rotate-90">
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Flow labels */}
          <div className="hidden lg:flex justify-between mt-4 px-4">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Upstream</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Downstream</span>
          </div>
        </CardContent>
      </Card>

      {/* ─── B) Supplier Footprint Table ────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Meridian Current Supplier Footprint</CardTitle>
          <CardDescription className="text-xs mt-0.5">
            {valueChainSuppliers.length} suppliers mapped across the value chain. Click to view details.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Supplier</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Stage</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Provides</th>
                  <th className="text-center px-4 py-2 font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Annual Spend</th>
                  <th className="text-center px-4 py-2 font-medium text-muted-foreground">Renewal</th>
                  <th className="text-center px-4 py-2 font-medium text-muted-foreground">Risks</th>
                </tr>
              </thead>
              <tbody>
                {valueChainSuppliers.map((s) => {
                  const stage = valueChainStages.find((st) => st.id === s.stageId)
                  return (
                    <tr
                      key={s.id}
                      className="border-b cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedSupplier(s)}
                    >
                      <td className="px-4 py-2.5 font-medium text-foreground">{s.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{stage?.shortName ?? "-"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground max-w-[200px] truncate">{s.provides}</td>
                      <td className="px-4 py-2.5 text-center"><ContractTypeBadge type={s.contractType} /></td>
                      <td className="px-4 py-2.5 text-right font-medium">${s.annualSpend.toFixed(1)}M</td>
                      <td className="px-4 py-2.5 text-center text-muted-foreground">{s.renewalDate}</td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge variant="outline" className={cn(
                          "text-[9px]",
                          s.risks.length >= 3 ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {s.risks.length} risk{s.risks.length !== 1 ? "s" : ""}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── C) Hotspot Callouts ────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-foreground mb-3">Where to Focus</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {hotspots.map((s) => (
            <Card key={s.id} className={cn(
              "border-l-4",
              s.hotspot!.severity === "high" && "border-l-red-500",
              s.hotspot!.severity === "medium" && "border-l-amber-500",
              s.hotspot!.severity === "low" && "border-l-muted-foreground",
            )}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className={cn(
                    "h-3.5 w-3.5 mt-0.5 shrink-0",
                    s.hotspot!.severity === "high" && "text-red-600",
                    s.hotspot!.severity === "medium" && "text-amber-600",
                    s.hotspot!.severity === "low" && "text-muted-foreground",
                  )} />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{s.hotspot!.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ─── D) AI Insights ────────────────────────────────────── */}
      <AIInsightsCard
        chartContext={chartContext}
        onEditBeforeSave={(prefill) => {
          toast.success("Insight saved to External Fact Base", { description: prefill.title })
        }}
        onSaved={() => {}}
      />

      {/* ─── Supplier Detail Drawer ─────────────────────────────── */}
      <Sheet open={!!selectedSupplier} onOpenChange={(open) => { if (!open) setSelectedSupplier(null) }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedSupplier && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="text-base">{selectedSupplier.name}</SheetTitle>
                <SheetDescription asChild>
                  <div className="flex items-center gap-2">
                    <ContractTypeBadge type={selectedSupplier.contractType} />
                    <span className="text-xs text-muted-foreground">
                      {valueChainStages.find((st) => st.id === selectedSupplier.stageId)?.name}
                    </span>
                  </div>
                </SheetDescription>
              </SheetHeader>

              <Separator className="my-3" />

              {/* What they provide */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground">What They Provide</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{selectedSupplier.provides}</p>
              </div>

              {/* Contract & Spend */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Annual Spend</p>
                  </div>
                  <p className="text-lg font-bold text-foreground">${selectedSupplier.annualSpend.toFixed(1)}M</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Renewal</p>
                  </div>
                  <p className="text-lg font-bold text-foreground">{selectedSupplier.renewalDate}</p>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Key Risks */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  <h4 className="text-xs font-semibold text-foreground">Key Risks</h4>
                </div>
                <ul className="space-y-2">
                  {selectedSupplier.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                      <span className="text-red-500 mt-0.5 shrink-0 text-[10px] font-bold">{i + 1}.</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator className="my-4" />

              {/* Suggested Research */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground">Suggested Research Topics</h4>
                </div>
                <div className="space-y-1.5">
                  {selectedSupplier.researchTopics.map((topic) => (
                    <Button
                      key={topic}
                      variant="outline"
                      size="sm"
                      className="h-auto w-full justify-start gap-2 text-[11px] py-2 px-3 text-left"
                      onClick={() => handleResearchTopic(topic)}
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="leading-snug">{topic}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
