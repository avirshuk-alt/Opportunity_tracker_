"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import {
  ArrowLeft, Sparkles, CheckCircle2, Circle, Clock, AlertTriangle,
  Zap, BarChart3, FileText, Play, Download, ExternalLink,
  ArrowRight, ChevronRight, MessageSquareText, Target,
  Swords, Handshake, Eye, Cog, Landmark, TrendingUp, TrendingDown,
  Scale, Search, X, Plus, Minus, ArrowUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type NegotiationWorkspace,
  type Lever,
  type LeverCategory,
  type LeverOutputItem,
  type QuoteEntry,
  type IndexWeight,
  type AllocationScenario,
  type SlaSimRow,
  type VaveOpportunity,
  type TermsScenario,
  type CatalogIndex,
  type IndexGroup,
  type TransferableSpendRow,
  LEVER_LABELS,
  formatCurrencyCompact,
  getLeverAdviceForQuadrant,
  INDEX_CATALOG,
  INDEX_GROUP_LABELS,
  suggestIndicesForCategory,
  alphaTransferableSpend,
} from "@/lib/negotiations-data"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  Cell, ReferenceLine, PieChart as RechartsPie, Pie,
  ComposedChart, Area,
} from "recharts"

// ─── Constants ─────────────────────────────────────────────────────────────

const LEVER_ICONS: Record<LeverCategory, React.ElementType> = {
  competition: Swords,
  commitment: Handshake,
  transparency: Eye,
  performance: BarChart3,
  engineering: Cog,
  "working-capital": Landmark,
}

const LEVER_COLORS: Record<LeverCategory, { bg: string; text: string; border: string; hex: string }> = {
  competition: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", hex: "#dc2626" },
  commitment: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", hex: "#2563eb" },
  transparency: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", hex: "#d97706" },
  performance: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", hex: "#059669" },
  engineering: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", hex: "#7c3aed" },
  "working-capital": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", hex: "#0891b2" },
}

const WF_STATUS_MAP = {
  pending: { icon: Circle, color: "text-muted-foreground", label: "Pending" },
  active: { icon: Clock, color: "text-blue-600", label: "Active" },
  done: { icon: CheckCircle2, color: "text-emerald-600", label: "Done" },
}

const OUTPUT_ICONS: Record<LeverOutputItem["type"], React.ElementType> = {
  "value-range": TrendingUp,
  "argument-card": MessageSquareText,
  "ask-clause": FileText,
  task: CheckCircle2,
  "offer-package": Target,
}

const TARGET_LABELS: Record<string, string> = {
  "fact-base": "Fact Base",
  objectives: "Negotiation Targets",
  narrative: "Negotiation Plan",
  "live-negotiation": "Live Negotiation",
}

// ─── Main Component ────────────────────────────────────────────────────────

interface LeverDetailWorkspaceProps {
  lever: Lever
  workspace: NegotiationWorkspace
  onBack: () => void
  onUpdate: (ws: NegotiationWorkspace) => void
}

export function LeverDetailWorkspace({ lever, workspace, onBack }: LeverDetailWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"run" | "evidence" | "outputs">("run")
  const [copilotOpen, setCopilotOpen] = useState(false)

  const Icon = LEVER_ICONS[lever.category]
  const colors = LEVER_COLORS[lever.category]
  const run = lever.run
  const completedSteps = lever.workflows.filter((w) => w.status === "done").length
  const totalSteps = lever.workflows.length
  const progressPct = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  const quadrant = workspace.spectrumPlacements[0]?.quadrant
  const advice = quadrant ? getLeverAdviceForQuadrant(quadrant) : null
  const leverReasoning = advice?.reasoning[lever.category]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="text-xs gap-1.5 text-muted-foreground hover:text-foreground mb-2 -ml-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Levers
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", colors.bg)}>
              <Icon className={cn("h-5 w-5", colors.text)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{lever.name}</h2>
                <Badge variant="outline" className={cn("text-[10px]",
                  lever.status === "complete" ? "bg-emerald-50 text-emerald-700" :
                  lever.status === "in-progress" ? "bg-blue-50 text-blue-700" :
                  "bg-muted text-muted-foreground"
                )}>
                  {lever.status === "complete" ? "Complete" : lever.status === "in-progress" ? "In Progress" : "Not Started"}
                </Badge>
                {lever.recommendation?.recommended && (
                  <Badge variant="outline" className="text-[9px] gap-0.5 bg-primary/5 text-primary border-primary/20">
                    <Sparkles className="h-2.5 w-2.5" />AI Recommended
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{lever.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-muted-foreground">
                  Supplier: <span className="font-medium text-foreground">{workspace.spectrumPlacements[0]?.supplierName}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  Scope: <span className="font-medium text-foreground">{workspace.scope.skuGroups.join(", ")}</span>
                </span>
                {run && (
                  <span className="text-xs text-muted-foreground">
                    Confidence: <span className="font-medium text-foreground">{run.confidenceScore}%</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Copilot trigger */}
          <Sheet open={copilotOpen} onOpenChange={setCopilotOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                AI Copilot
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[380px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Copilot
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {/* AI Reasoning */}
                {leverReasoning && (
                  <div className="rounded-lg border border-primary/20 bg-primary/[0.02] p-3">
                    <p className="text-xs font-medium text-primary mb-1">Why this lever?</p>
                    <p className="text-xs text-muted-foreground">{leverReasoning}</p>
                  </div>
                )}

                {/* Data Needed Checklist */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Data Needed</p>
                  <div className="space-y-1.5">
                    {lever.inputs.map((inp, i) => {
                      const isAvailable = lever.status !== "not-started" || i < 1
                      return (
                        <div key={inp} className="flex items-center gap-2 text-xs">
                          {isAvailable ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className={cn(isAvailable ? "text-foreground" : "text-muted-foreground")}>{inp}</span>
                        </div>
                      )
                    })}
                    {lever.recommendation?.prerequisites.map((p) => {
                      if (lever.inputs.includes(p)) return null
                      return (
                        <div key={p} className="flex items-center gap-2 text-xs">
                          <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">{p}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Data Gaps */}
                {run && run.dataGaps.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />Data Gaps
                    </p>
                    <div className="space-y-1.5">
                      {run.dataGaps.map((gap) => (
                        <div key={gap} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1.5">{gap}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Suggestions */}
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">AI Suggestions</p>
                  <div className="space-y-2">
                    {lever.category === "competition" && (
                      <>
                        <AiSuggestionCard
                          title="Normalize for total landed cost"
                          content="Include freight, tooling amortization, and quality cost in comparison. Raw unit price is misleading."
                        />
                        <AiSuggestionCard
                          title="Consider dual-source award"
                          content="70/30 split maintains competitive pressure long-term while reducing transition risk."
                        />
                      </>
                    )}
                    {lever.category === "transparency" && (
                      <>
                        <AiSuggestionCard
                          title="PP Resin should dominate weighting"
                          content="For injection molding, resin is 40-50% of cost. Current -8% YoY creates strong clawback argument."
                        />
                        <AiSuggestionCard
                          title="Challenge unexplained margin"
                          content="Price rose 4.2% while basket declined 2.6%. The 6.8% gap is margin expansion, not cost recovery."
                        />
                      </>
                    )}
                    {lever.category === "commitment" && (
                      <AiSuggestionCard
                        title="Bundle volume with term extension"
                        content="Pair 20% volume increase with 1-year extension for maximum carrot value."
                      />
                    )}
                    {lever.category === "performance" && (
                      <AiSuggestionCard
                        title="Focus on OTD gap"
                        content="91% OTD vs 95% target represents significant business impact. Quantify excess inventory cost."
                      />
                    )}
                    {lever.category === "engineering" && (
                      <AiSuggestionCard
                        title="Start with Pareto of cost drivers"
                        content="Top 20% of SKUs likely represent 80% of cost. Focus VA/VE on highest-impact items."
                      />
                    )}
                    {lever.category === "working-capital" && (
                      <AiSuggestionCard
                        title="Model WACC trade-off"
                        content="Net 30 to Net 60 at 8% WACC = ~0.66% price equivalent. Worth trading if price concession exceeds this."
                      />
                    )}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <Progress value={progressPct} className="h-2 flex-1" />
        <span className="text-xs text-muted-foreground shrink-0">{completedSteps}/{totalSteps} steps</span>
        {lever.estimatedImpact && (
          <Badge variant="outline" className="text-[10px] gap-1 text-primary border-primary/20">
            <Zap className="h-3 w-3" />{lever.estimatedImpact}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="run" className="text-xs gap-1.5">
            <Play className="h-3.5 w-3.5" />Run
          </TabsTrigger>
          <TabsTrigger value="evidence" className="text-xs gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />Evidence
            {run && run.artifacts.length > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-1">{run.artifacts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outputs" className="text-xs gap-1.5">
            <Zap className="h-3.5 w-3.5" />Outputs
            {run && run.outputs.length > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-1">{run.outputs.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="run" className="mt-4">
          <RunTab lever={lever} workspace={workspace} />
        </TabsContent>

        <TabsContent value="evidence" className="mt-4">
          <EvidenceTab lever={lever} />
        </TabsContent>

        <TabsContent value="outputs" className="mt-4">
          <OutputsTab lever={lever} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── AI Suggestion Card ────────────────────────────────────────────────────

function AiSuggestionCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-md border p-2.5">
      <p className="text-xs font-medium text-foreground">{title}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{content}</p>
    </div>
  )
}

// ─── Run Tab ──────────────────────────────────────────────────��────────────

function RunTab({ lever, workspace }: { lever: Lever; workspace: NegotiationWorkspace }) {
  return (
    <div className="space-y-5">
      {/* Workflow Steps */}
      <Card>
        <CardContent className="py-4 px-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Workflow Steps</h3>
          <div className="space-y-1">
            {lever.workflows.map((wf, i) => {
              const wfSt = WF_STATUS_MAP[wf.status]
              return (
                <div key={wf.id} className={cn("flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors", wf.status === "active" ? "bg-blue-50/50 border border-blue-100" : "")}>
                  <div className="flex flex-col items-center gap-0.5 pt-0.5">
                    <wfSt.icon className={cn("h-4 w-4", wfSt.color)} />
                    {i < lever.workflows.length - 1 && (
                      <div className="w-px h-5 bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{wf.step}</p>
                      <Badge variant="outline" className={cn("text-[9px]",
                        wf.status === "done" ? "bg-emerald-50 text-emerald-700" :
                        wf.status === "active" ? "bg-blue-50 text-blue-700" :
                        "bg-muted text-muted-foreground"
                      )}>{wfSt.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{wf.description}</p>
                    {wf.output && (
                      <p className="text-xs text-emerald-700 mt-1 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />{wf.output}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Per-lever content */}
      {lever.category === "competition" && lever.run?.quotes && (
        <CompetitionRunContent quotes={lever.run.quotes} scenarios={lever.run.allocationScenarios ?? []} />
      )}
      {lever.category === "transparency" && lever.run?.indexWeights && (
        <TransparencyRunContent indexWeights={lever.run.indexWeights} workspace={workspace} />
      )}
      {lever.category === "commitment" && (
        <CommitmentRunContent lever={lever} workspace={workspace} />
      )}
      {lever.category === "performance" && (
        <PerformanceRunContent lever={lever} workspace={workspace} />
      )}
      {lever.category === "engineering" && (
        <EngineeringRunContent lever={lever} />
      )}
      {lever.category === "working-capital" && (
        <WorkingCapitalRunContent lever={lever} />
      )}
    </div>
  )
}

// ─── Competition Lever Content ─────────────────────────────────────────────

function CompetitionRunContent({ quotes, scenarios }: { quotes: QuoteEntry[]; scenarios: AllocationScenario[] }) {
  // Chart data
  const chartData = quotes.map((q) => ({
    name: q.supplierName.length > 15 ? q.supplierName.substring(0, 15) + "..." : q.supplierName,
    unitPrice: q.unitPrice,
    freight: q.freightPerUnit,
    tooling: q.totalLandedCost - q.unitPrice - q.freightPerUnit,
    totalLanded: q.totalLandedCost,
    isIncumbent: q.supplierName.includes("incumbent"),
  }))

  const minLanded = Math.min(...quotes.map((q) => q.totalLandedCost))
  const maxLanded = Math.max(...quotes.map((q) => q.totalLandedCost))
  const incumbent = quotes.find((q) => q.supplierName.includes("incumbent"))

  return (
    <>
      {/* Quote Comparison Chart */}
      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Quote Comparison (Landed Cost)</h3>
            <Button variant="ghost" size="sm" className="text-[10px] gap-1 text-muted-foreground">
              <Download className="h-3 w-3" />Export
            </Button>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0.6, 1.1]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  formatter={(value: number, name: string) => [`$${value.toFixed(3)}`, name]}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="unitPrice" stackId="cost" fill="#6366f1" name="Unit Price" radius={[0, 0, 0, 0]} />
                <Bar dataKey="freight" stackId="cost" fill="#a5b4fc" name="Freight" />
                <Bar dataKey="tooling" stackId="cost" fill="#e0e7ff" name="Tooling (amortized)" radius={[0, 4, 4, 0]} />
                {incumbent && (
                  <ReferenceLine x={incumbent.totalLandedCost} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "Current", position: "top", fontSize: 10, fill: "#dc2626" }} />
                )}
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Quote Table */}
      <Card>
        <CardContent className="py-4 px-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Normalized Quote Details</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Supplier</TableHead>
                <TableHead className="text-[10px] text-right">Unit Price</TableHead>
                <TableHead className="text-[10px] text-right">MOQ</TableHead>
                <TableHead className="text-[10px] text-right">Lead Time</TableHead>
                <TableHead className="text-[10px] text-right">Tooling</TableHead>
                <TableHead className="text-[10px] text-right">Freight/Unit</TableHead>
                <TableHead className="text-[10px] text-right">Landed Cost</TableHead>
                <TableHead className="text-[10px] text-right">vs. Incumbent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((q) => {
                const delta = incumbent ? ((q.totalLandedCost - incumbent.totalLandedCost) / incumbent.totalLandedCost) * 100 : 0
                const isBest = q.totalLandedCost === minLanded
                return (
                  <TableRow key={q.id} className={cn(isBest && "bg-emerald-50/50")}>
                    <TableCell className="text-xs font-medium">
                      {q.supplierName}
                      {isBest && <Badge variant="outline" className="text-[8px] ml-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">Best</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-right">${q.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right">{q.moq.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">{q.leadTimeDays}d</TableCell>
                    <TableCell className="text-xs text-right">${q.toolingCost.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">${q.freightPerUnit.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right font-medium">${q.totalLandedCost.toFixed(2)}</TableCell>
                    <TableCell className={cn("text-xs text-right font-medium", delta < 0 ? "text-emerald-600" : delta > 0 ? "text-red-600" : "text-muted-foreground")}>
                      {delta === 0 ? "Baseline" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {quotes.filter((q) => q.notes).length > 0 && (
            <div className="mt-3 space-y-1">
              {quotes.filter((q) => q.notes).map((q) => (
                <p key={q.id} className="text-[10px] text-muted-foreground">
                  <span className="font-medium">{q.supplierName}:</span> {q.notes}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Award Split Scenarios */}
      {scenarios.length > 0 && (
        <Card>
          <CardContent className="py-4 px-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Award Split Scenarios</h3>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {scenarios.map((sc) => (
                <div key={sc.id} className={cn(
                  "rounded-lg border p-3 transition-all hover:shadow-sm",
                  sc.totalSavings > 0 && "border-emerald-200 bg-emerald-50/30"
                )}>
                  <p className="text-xs font-semibold text-foreground">{sc.name}</p>
                  <div className="mt-2 space-y-1">
                    {sc.splits.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">{s.supplierName}</span>
                        <span className="font-medium">{s.pct}% @ ${s.unitPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Blended</span>
                    <span className="text-xs font-bold">${sc.blendedPrice.toFixed(2)}</span>
                  </div>
                  {sc.totalSavings > 0 && (
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-emerald-600">Annual Savings</span>
                      <span className="text-xs font-bold text-emerald-600">${(sc.totalSavings / 1000).toFixed(0)}K</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

// ─── Transparency Lever Content ────────────────────────────────────────────

function TransparencyRunContent({ indexWeights: initialIndices, workspace }: { indexWeights: IndexWeight[]; workspace: NegotiationWorkspace }) {
  // Selected index IDs and their weights
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialIndices.map((iw) => {
      const found = INDEX_CATALOG.find((c) => c.name === iw.indexName)
      return found?.id ?? iw.indexName
    })
  )
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(initialIndices.map((iw) => {
      const found = INDEX_CATALOG.find((c) => c.name === iw.indexName)
      return [found?.id ?? iw.indexName, iw.weight]
    }))
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState("")

  const selectedCatalogItems = useMemo(
    () => selectedIds.map((id) => INDEX_CATALOG.find((c) => c.id === id)).filter(Boolean) as CatalogIndex[],
    [selectedIds]
  )

  // Grouped catalog for picker
  const groupedCatalog = useMemo(() => {
    const groups: Record<IndexGroup, CatalogIndex[]> = { commodities: [], freight: [], fx: [], labor: [], energy: [], other: [] }
    INDEX_CATALOG.forEach((idx) => { groups[idx.group].push(idx) })
    return groups
  }, [])

  const filteredGroups = useMemo(() => {
    if (!pickerSearch) return groupedCatalog
    const q = pickerSearch.toLowerCase()
    const out: Record<IndexGroup, CatalogIndex[]> = { commodities: [], freight: [], fx: [], labor: [], energy: [], other: [] }
    for (const [group, items] of Object.entries(groupedCatalog)) {
      out[group as IndexGroup] = items.filter((i) => i.name.toLowerCase().includes(q) || i.source.toLowerCase().includes(q))
    }
    return out
  }, [groupedCatalog, pickerSearch])

  const toggleIndex = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      return [...prev, id]
    })
    setWeights((prev) => {
      if (prev[id] !== undefined) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: 10 }
    })
  }, [])

  const handleSuggestIndices = useCallback(() => {
    const suggested = suggestIndicesForCategory(workspace.category)
    setSelectedIds(suggested)
    const equalWeight = Math.round(100 / suggested.length)
    setWeights(Object.fromEntries(suggested.map((id, i) => [id, i === suggested.length - 1 ? 100 - equalWeight * (suggested.length - 1) : equalWeight])))
  }, [workspace.category])

  // Build chart data from selected catalog indices
  const supplierPriceIndex = [
    { period: "Q1 2024", price: 100 },
    { period: "Q2 2024", price: 100 },
    { period: "Q3 2024", price: 102.2 },
    { period: "Q4 2024", price: 104.3 },
    { period: "Q1 2025", price: 104.3 },
    { period: "Q2 2025", price: 104.3 },
  ]

  const periods = ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025"]

  const chartData = useMemo(() => {
    return periods.map((period) => {
      let basketValue = 0
      let totalWeight = 0
      selectedCatalogItems.forEach((idx) => {
        const w = weights[idx.id] ?? 0
        const point = idx.series.find((s) => s.period === period)
        if (point && w > 0) {
          basketValue += point.value * (w / 100)
          totalWeight += w
        }
      })
      if (totalWeight > 0) basketValue = basketValue / (totalWeight / 100)
      const supplierPrice = supplierPriceIndex.find((p) => p.period === period)?.price ?? 100
      return { period, basket: Number(basketValue.toFixed(1)), supplierPrice }
    })
  }, [selectedCatalogItems, weights])

  // Goodness-of-fit: correlation (R) between supplier price and basket
  const { rSquared, totalWeightSum, gapPct } = useMemo(() => {
    const twSum = Object.entries(weights).filter(([id]) => selectedIds.includes(id)).reduce((a, [, w]) => a + w, 0)
    const n = chartData.length
    if (n < 3) return { rSquared: 0, totalWeightSum: twSum, gapPct: 0 }

    const xs = chartData.map((d) => d.basket)
    const ys = chartData.map((d) => d.supplierPrice)
    const meanX = xs.reduce((a, b) => a + b, 0) / n
    const meanY = ys.reduce((a, b) => a + b, 0) / n
    let ssXY = 0, ssXX = 0, ssYY = 0
    for (let i = 0; i < n; i++) {
      ssXY += (xs[i] - meanX) * (ys[i] - meanY)
      ssXX += (xs[i] - meanX) ** 2
      ssYY += (ys[i] - meanY) ** 2
    }
    const r = ssXX > 0 && ssYY > 0 ? ssXY / Math.sqrt(ssXX * ssYY) : 0
    const lastBasket = xs[xs.length - 1]
    const lastPrice = ys[ys.length - 1]
    const gap = lastPrice - lastBasket

    return { rSquared: Number((r * r).toFixed(3)), totalWeightSum: twSum, gapPct: Number(gap.toFixed(1)) }
  }, [chartData, weights, selectedIds])

  const fitLabel = rSquared >= 0.7 ? "Good" : rSquared >= 0.3 ? "Fair" : "Poor"
  const fitColor = rSquared >= 0.7 ? "text-emerald-600" : rSquared >= 0.3 ? "text-amber-600" : "text-red-600"
  const weightStatus = Math.abs(totalWeightSum - 100) < 2 ? "balanced" : totalWeightSum > 100 ? "over" : "under"

  return (
    <>
      {/* Index Picker */}
      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Index Basket Configuration</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-[10px] gap-1.5" onClick={handleSuggestIndices}>
                <Sparkles className="h-3 w-3 text-primary" />Suggest Indices
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] gap-1.5" onClick={() => setPickerOpen(!pickerOpen)}>
                <Plus className="h-3 w-3" />{pickerOpen ? "Close Picker" : "Add Index"}
              </Button>
            </div>
          </div>

          {/* Collapsible multi-select picker */}
          {pickerOpen && (
            <div className="mb-4 rounded-lg border bg-muted/30 p-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search indices..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <div className="max-h-[260px] overflow-y-auto space-y-3">
                {(Object.entries(filteredGroups) as [IndexGroup, CatalogIndex[]][])
                  .filter(([, items]) => items.length > 0)
                  .map(([group, items]) => (
                    <div key={group}>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{INDEX_GROUP_LABELS[group]}</p>
                      <div className="space-y-1">
                        {items.map((idx) => {
                          const isSelected = selectedIds.includes(idx.id)
                          return (
                            <label key={idx.id} className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-1.5 cursor-pointer transition-colors", isSelected ? "bg-primary/5" : "hover:bg-muted")}>
                              <Checkbox checked={isSelected} onCheckedChange={() => toggleIndex(idx.id)} className="h-3.5 w-3.5" />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-medium text-foreground">{idx.name}</span>
                                <span className="text-[9px] text-muted-foreground ml-1.5">{idx.source} / {idx.frequency}</span>
                              </div>
                              <Badge variant="outline" className={cn("text-[9px] shrink-0",
                                idx.latestYoY < 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                idx.latestYoY > 3 ? "bg-red-50 text-red-700 border-red-200" :
                                "bg-muted text-muted-foreground"
                              )}>
                                {idx.latestYoY > 0 ? "+" : ""}{idx.latestYoY}% YoY
                              </Badge>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Fit / weight summary bar */}
          <div className="flex items-center gap-4 mb-4 rounded-md bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">R-squared:</span>
              <span className={cn("text-xs font-bold", fitColor)}>{rSquared.toFixed(2)} ({fitLabel})</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">Total Weight:</span>
              <span className={cn("text-xs font-bold", weightStatus === "balanced" ? "text-emerald-600" : "text-amber-600")}>
                {totalWeightSum}%
                {weightStatus === "over" && " (over)"}
                {weightStatus === "under" && " (under)"}
              </span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">Gap (latest):</span>
              <span className={cn("text-xs font-bold", gapPct > 0 ? "text-red-600" : "text-emerald-600")}>
                {gapPct > 0 ? "+" : ""}{gapPct}pts
              </span>
            </div>
          </div>

          {/* Weight sliders for selected indices */}
          {selectedCatalogItems.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No indices selected. Use the picker or "Suggest Indices" to begin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedCatalogItems.map((idx) => (
                <div key={idx.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-foreground truncate">{idx.name}</span>
                      <Badge variant="outline" className={cn("text-[9px] shrink-0",
                        idx.latestYoY < 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        idx.latestYoY > 3 ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {idx.latestYoY > 0 ? "+" : ""}{idx.latestYoY}% YoY
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-foreground w-8 text-right">{weights[idx.id] ?? 0}%</span>
                      <button onClick={() => toggleIndex(idx.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <Slider
                    value={[weights[idx.id] ?? 0]}
                    onValueChange={([val]) => setWeights((prev) => ({ ...prev, [idx.id]: val }))}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price vs Index Basket Chart */}
      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Supplier Price vs Index Basket</h3>
            <Button variant="ghost" size="sm" className="text-[10px] gap-1 text-muted-foreground">
              <Download className="h-3 w-3" />Export
            </Button>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 15, right: 15, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis domain={[85, 115]} tick={{ fontSize: 10 }} tickFormatter={(v: number) => v.toString()} />
                <RechartsTooltip contentStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="supplierPrice" name="Supplier Price (indexed)" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="basket" name="Index Basket (weighted)" stroke="#6366f1" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} />
                <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="2 2" />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {gapPct !== 0 && (
            <div className={cn("mt-3 rounded-lg px-3 py-2 border",
              gapPct > 0 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
            )}>
              <p className={cn("text-xs", gapPct > 0 ? "text-amber-800" : "text-emerald-800")}>
                <span className="font-semibold">Gap Analysis:</span>{" "}
                {gapPct > 0
                  ? <>Supplier price is <span className="font-bold text-red-700">{gapPct}pts above</span> the weighted index basket. This gap may represent margin expansion beyond cost pass-through.</>
                  : <>Supplier price is <span className="font-bold text-emerald-700">{Math.abs(gapPct)}pts below</span> the weighted index basket, indicating cost compression or delayed adjustment.</>
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

// ─── Commitment Lever Content ──────────────────────────────────────────────

function CommitmentRunContent({ lever, workspace }: { lever: Lever; workspace: NegotiationWorkspace }) {
  const transferableData = alphaTransferableSpend
  const incumbentName = workspace.spectrumPlacements[0]?.supplierName ?? "Incumbent"

  // Allocation scenario builder -- slider per SKU row
  const [transferPcts, setTransferPcts] = useState<Record<string, number>>(
    Object.fromEntries(transferableData.map((r) => [`${r.sku}-${r.currentSupplier}`, 30]))
  )

  // Derive implied totals
  const scenarioTotals = useMemo(() => {
    let totalTransferUnits = 0
    let totalTransferSpend = 0
    transferableData.forEach((r) => {
      const pct = transferPcts[`${r.sku}-${r.currentSupplier}`] ?? 0
      totalTransferUnits += Math.round(r.currentAnnualVolume * pct / 100)
      totalTransferSpend += Math.round(r.currentAnnualSpend * pct / 100)
    })
    return { totalTransferUnits, totalTransferSpend }
  }, [transferPcts, transferableData])

  // Chart data: current vs proposed allocation
  const chartData = useMemo(() => {
    const skus = [...new Set(transferableData.map((r) => r.sku))]
    return skus.map((sku) => {
      const rows = transferableData.filter((r) => r.sku === sku)
      let transferredUnits = 0
      let originalOtherUnits = 0
      rows.forEach((r) => {
        const pct = transferPcts[`${r.sku}-${r.currentSupplier}`] ?? 0
        transferredUnits += Math.round(r.currentAnnualVolume * pct / 100)
        originalOtherUnits += r.currentAnnualVolume
      })
      // Current incumbent allocation for this SKU (from lever data)
      const incumbentCurrent = sku === "ABS Housing Shell" ? 850_000 : sku === "PP Bracket Assembly" ? 300_000 : 200_000
      return {
        name: sku.length > 18 ? sku.substring(0, 18) + "..." : sku,
        currentIncumbent: incumbentCurrent,
        currentOther: originalOtherUnits,
        proposedIncumbent: incumbentCurrent + transferredUnits,
        proposedOther: originalOtherUnits - transferredUnits,
      }
    })
  }, [transferableData, transferPcts])

  // Tier pricing table
  const tierData = [
    { tier: "Base (current)", volume: "1.25M units", term: "1 year", expectedPrice: "$0.96" },
    { tier: `+${Math.round(scenarioTotals.totalTransferUnits / 1000)}K vol transfer`, volume: `${((1_250_000 + scenarioTotals.totalTransferUnits) / 1_000_000).toFixed(2)}M units`, term: "1 year", expectedPrice: "$0.90-$0.92" },
    { tier: `+vol + 2yr term`, volume: `${((1_250_000 + scenarioTotals.totalTransferUnits) / 1_000_000).toFixed(2)}M units`, term: "2 years", expectedPrice: "$0.86-$0.88" },
    { tier: `Max consolidation + 2yr`, volume: `${((1_250_000 + scenarioTotals.totalTransferUnits * 1.5) / 1_000_000).toFixed(2)}M units`, term: "2 years", expectedPrice: "$0.84-$0.86" },
  ]

  // Give-get draft
  const carrotValue = scenarioTotals.totalTransferSpend
  const impliedPriceAsk = carrotValue > 50_000 ? "4-6%" : carrotValue > 20_000 ? "2-4%" : "1-2%"

  return (
    <>
      {/* Transferable Spend Table */}
      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Transferable Volume from Other Suppliers</h3>
            <Badge variant="outline" className="text-[10px] gap-1 text-primary border-primary/20">
              <ArrowUpDown className="h-3 w-3" />
              {transferableData.length} SKU-supplier rows
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">SKU</TableHead>
                <TableHead className="text-[10px]">Current Supplier</TableHead>
                <TableHead className="text-[10px] text-right">Annual Vol</TableHead>
                <TableHead className="text-[10px] text-right">Annual Spend</TableHead>
                <TableHead className="text-[10px]">Contract End</TableHead>
                <TableHead className="text-[10px] text-right">Switchability</TableHead>
                <TableHead className="text-[10px] text-right">Transfer %</TableHead>
                <TableHead className="text-[10px] text-right">Transfer Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transferableData.map((r) => {
                const key = `${r.sku}-${r.currentSupplier}`
                const pct = transferPcts[key] ?? 0
                const transferVal = Math.round(r.currentAnnualSpend * pct / 100)
                const contractSoon = new Date(r.contractEnd) < new Date("2026-09-01")
                return (
                  <TableRow key={key}>
                    <TableCell className="text-xs font-medium">{r.sku}</TableCell>
                    <TableCell className="text-xs">{r.currentSupplier}</TableCell>
                    <TableCell className="text-xs text-right">{r.currentAnnualVolume.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">${r.currentAnnualSpend.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">
                      <span className={cn(contractSoon && "text-amber-600 font-medium")}>{r.contractEnd}</span>
                      {contractSoon && <Badge variant="outline" className="text-[8px] ml-1 bg-amber-50 text-amber-700 border-amber-200">Soon</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${r.switchabilityScore}%` }} />
                        </div>
                        <span className="font-medium">{r.switchabilityScore}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Slider
                          value={[pct]}
                          onValueChange={([val]) => setTransferPcts((prev) => ({ ...prev, [key]: val }))}
                          max={100}
                          step={5}
                          className="w-16"
                        />
                        <span className="text-xs font-bold w-8 text-right">{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium text-emerald-600">${transferVal.toLocaleString()}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {/* Summary row */}
          <div className="mt-3 flex items-center justify-between rounded-md bg-primary/[0.03] border border-primary/10 px-4 py-2.5">
            <div className="text-xs text-muted-foreground">
              Total transferable to <span className="font-semibold text-foreground">{incumbentName}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs"><span className="font-bold text-foreground">{scenarioTotals.totalTransferUnits.toLocaleString()}</span> units</span>
              <span className="text-xs font-bold text-primary">${scenarioTotals.totalTransferSpend.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current vs Proposed Allocation Chart */}
      <Card>
        <CardContent className="py-4 px-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Current vs Proposed Allocation</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 15, right: 15 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                <RechartsTooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [v.toLocaleString(), ""]} />
                <Bar dataKey="currentIncumbent" stackId="current" fill="#6366f1" name={`Current: ${incumbentName}`} />
                <Bar dataKey="currentOther" stackId="current" fill="#e0e7ff" name="Current: Others" />
                <Bar dataKey="proposedIncumbent" stackId="proposed" fill="#059669" name={`Proposed: ${incumbentName}`} />
                <Bar dataKey="proposedOther" stackId="proposed" fill="#d1fae5" name="Proposed: Others" />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Volume/Term Tier Table */}
      <Card>
        <CardContent className="py-4 px-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Volume/Term Tier Pricing</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Tier</TableHead>
                <TableHead className="text-[10px]">Volume</TableHead>
                <TableHead className="text-[10px]">Term</TableHead>
                <TableHead className="text-[10px] text-right">Expected Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tierData.map((row, i) => (
                <TableRow key={i} className={cn(i === 1 && "bg-primary/[0.02] border-l-2 border-l-primary")}>
                  <TableCell className="text-xs font-medium">{row.tier}</TableCell>
                  <TableCell className="text-xs">{row.volume}</TableCell>
                  <TableCell className="text-xs">{row.term}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{row.expectedPrice}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Give-Get Draft */}
      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Draft Give-Get Proposal</h3>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/[0.02] p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1">Give (Carrot)</p>
                <ul className="space-y-1">
                  <li className="text-xs text-foreground flex items-start gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                    Transfer <span className="font-bold">{scenarioTotals.totalTransferUnits.toLocaleString()} units</span> ({formatCurrencyCompact(scenarioTotals.totalTransferSpend)} spend) from other suppliers
                  </li>
                  <li className="text-xs text-foreground flex items-start gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                    2-year term extension (from current 1yr)
                  </li>
                  <li className="text-xs text-foreground flex items-start gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                    Forecasting visibility (quarterly rolling forecast)
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1">Get (Ask)</p>
                <ul className="space-y-1">
                  <li className="text-xs text-foreground flex items-start gap-1.5">
                    <Target className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <span className="font-bold">{impliedPriceAsk} price reduction</span> on all in-scope SKUs
                  </li>
                  <li className="text-xs text-foreground flex items-start gap-1.5">
                    <Target className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    Volume tier pricing locked for term duration
                  </li>
                  <li className="text-xs text-foreground flex items-start gap-1.5">
                    <Target className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    Raw material index pass-through clause (floor + ceiling)
                  </li>
                </ul>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Implied carrot value: <span className="font-bold text-foreground">{formatCurrencyCompact(carrotValue)}</span>
              </p>
              <Button variant="outline" size="sm" className="text-[10px] gap-1">
                <ArrowRight className="h-3 w-3" />Push to Narrative
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ─── Performance Lever Content ─────────────────────────────────────────────

function PerformanceRunContent({ lever, workspace }: { lever: Lever; workspace: NegotiationWorkspace }) {
  const slaData = [
    { period: "Q1 2024", otd: 93, rejectRate: 1.6, otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q2 2024", otd: 91, rejectRate: 1.9, otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q3 2024", otd: 89, rejectRate: 2.1, otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q4 2024", otd: 92, rejectRate: 1.7, otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q1 2025", otd: 90, rejectRate: 1.8, otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q2 2025", otd: 91, rejectRate: 1.8, otdTarget: 95, rejectTarget: 1.5 },
  ]

  const penaltySimData = [
    { threshold: "OTD < 95%", currentPerf: "91%", creditPerUnit: "$0.005", estAnnualCredit: "$6,250" },
    { threshold: "OTD < 90%", currentPerf: "91%", creditPerUnit: "$0.015", estAnnualCredit: "$4,700" },
    { threshold: "Rejects > 1.5%", currentPerf: "1.8%", creditPerUnit: "$0.010", estAnnualCredit: "$3,750" },
    { threshold: "Rejects > 2.0%", currentPerf: "1.8%", creditPerUnit: "$0.025", estAnnualCredit: "$2,100" },
  ]

  return (
    <>
      <Card>
        <CardContent className="py-4 px-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">SLA Performance Trend</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={slaData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="otd" domain={[85, 100]} tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
                <YAxis yAxisId="reject" orientation="right" domain={[0, 3]} tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
                <RechartsTooltip contentStyle={{ fontSize: 11 }} />
                <Bar yAxisId="reject" dataKey="rejectRate" fill="#fca5a5" name="Reject Rate %" radius={[2, 2, 0, 0]} />
                <Line yAxisId="otd" type="monotone" dataKey="otd" stroke="#6366f1" strokeWidth={2} name="OTD %" dot={{ r: 3 }} />
                <Line yAxisId="otd" type="monotone" dataKey="otdTarget" stroke="#dc2626" strokeWidth={1} strokeDasharray="4 4" name="OTD Target" dot={false} />
                <ReferenceLine yAxisId="reject" y={1.5} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "Reject Target", position: "right", fontSize: 9, fill: "#dc2626" }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 px-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Penalty/Credit Simulation</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Threshold</TableHead>
                <TableHead className="text-[10px]">Current Performance</TableHead>
                <TableHead className="text-[10px] text-right">Credit/Unit</TableHead>
                <TableHead className="text-[10px] text-right">Est. Annual Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {penaltySimData.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{row.threshold}</TableCell>
                  <TableCell className="text-xs">{row.currentPerf}</TableCell>
                  <TableCell className="text-xs text-right">{row.creditPerUnit}</TableCell>
                  <TableCell className="text-xs text-right font-medium text-emerald-600">{row.estAnnualCredit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Total estimated annual credits:</span> ~$16,800 based on trailing 12-month performance. Represents <span className="font-bold">1.4% of annual spend</span>.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ─── Engineering Lever Content ─────────────────────────────────────────────

function EngineeringRunContent({ lever }: { lever: Lever }) {
  const paretoData = [
    { sku: "ABS Housing Shell", costPct: 53, cumPct: 53, variants: 3 },
    { sku: "PP Bracket Assembly", costPct: 31, cumPct: 84, variants: 2 },
    { sku: "Nylon Clip Set", costPct: 15, cumPct: 99, variants: 5 },
  ]

  const opportunities = [
    { initiative: "Consolidate clip variants (5 to 2)", savings: "8-12%", effort: "Medium", timeline: "3-4 months", owner: "Engineering" },
    { initiative: "Substitute ABS grade (GP to recycled)", savings: "3-5%", effort: "Low", timeline: "6-8 weeks", owner: "Quality" },
    { initiative: "Redesign bracket for moldability", savings: "4-6%", effort: "High", timeline: "6 months", owner: "Engineering" },
    { initiative: "Reduce wall thickness (Housing)", savings: "2-3%", effort: "Medium", timeline: "4 months", owner: "Engineering" },
  ]

  return (
    <>
      <Card>
        <CardContent className="py-4 px-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Cost Pareto by SKU</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sku" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="pct" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
                <YAxis yAxisId="cum" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
                <RechartsTooltip contentStyle={{ fontSize: 11 }} />
                <Bar yAxisId="pct" dataKey="costPct" fill="#6366f1" name="Cost %" radius={[4, 4, 0, 0]} />
                <Line yAxisId="cum" type="monotone" dataKey="cumPct" stroke="#dc2626" strokeWidth={2} name="Cumulative %" dot={{ r: 4 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 px-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">VA/VE Opportunity Map</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Initiative</TableHead>
                <TableHead className="text-[10px] text-right">Est. Savings</TableHead>
                <TableHead className="text-[10px]">Effort</TableHead>
                <TableHead className="text-[10px]">Timeline</TableHead>
                <TableHead className="text-[10px]">Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((opp, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{opp.initiative}</TableCell>
                  <TableCell className="text-xs text-right font-medium text-emerald-600">{opp.savings}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[9px]",
                      opp.effort === "Low" ? "bg-emerald-50 text-emerald-700" :
                      opp.effort === "Medium" ? "bg-amber-50 text-amber-700" :
                      "bg-red-50 text-red-700"
                    )}>{opp.effort}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{opp.timeline}</TableCell>
                  <TableCell className="text-xs">{opp.owner}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

// ─── Working Capital Lever Content ─────────────────────────────────────────

function WorkingCapitalRunContent({ lever }: { lever: Lever }) {
  const termsData = [
    { name: "Current (Net 30)", days: 30, priceEquiv: "0%", cashImpact: "Baseline", recommendation: "" },
    { name: "Net 45", days: 45, priceEquiv: "+0.33%", cashImpact: "$4K freed", recommendation: "Neutral" },
    { name: "Net 60", days: 60, priceEquiv: "+0.66%", cashImpact: "$8K freed", recommendation: "Accept if price concession > 0.7%" },
    { name: "Net 15 (carrot)", days: 15, priceEquiv: "-0.33%", cashImpact: "$4K locked", recommendation: "Offer as carrot for 2%+ price reduction" },
    { name: "2% 10 Net 30", days: 30, priceEquiv: "-2.0%", cashImpact: "$24K cost", recommendation: "Only if cash-rich and discount is negotiated down" },
  ]

  const chartData = termsData.map((t) => ({
    name: t.name,
    days: t.days,
    priceEquiv: parseFloat(t.priceEquiv.replace("%", "").replace("+", "")),
  }))

  return (
    <>
      <Card>
        <CardContent className="py-4 px-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Terms-to-Price Equivalency (8% WACC)</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}%`} />
                <RechartsTooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="priceEquiv" name="Price Equivalent %" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.priceEquiv > 0 ? "#22c55e" : entry.priceEquiv < 0 ? "#ef4444" : "#94a3b8"} />
                  ))}
                </Bar>
                <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 px-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Scenario Comparison</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Scenario</TableHead>
                <TableHead className="text-[10px] text-right">Days</TableHead>
                <TableHead className="text-[10px] text-right">Price Equiv.</TableHead>
                <TableHead className="text-[10px]">Cash Impact</TableHead>
                <TableHead className="text-[10px]">Recommendation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {termsData.map((row, i) => (
                <TableRow key={i} className={cn(i === 0 && "bg-muted/30")}>
                  <TableCell className="text-xs font-medium">{row.name}</TableCell>
                  <TableCell className="text-xs text-right">{row.days}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{row.priceEquiv}</TableCell>
                  <TableCell className="text-xs">{row.cashImpact}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.recommendation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

// ─── Evidence Tab ──────────────────────────────────────────────────────────

function EvidenceTab({ lever }: { lever: Lever }) {
  const run = lever.run
  if (!run || run.artifacts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No evidence generated yet</p>
            <p className="text-xs text-muted-foreground mt-1">Run the lever workflow to generate charts, tables, and analysis artifacts.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{run.artifacts.length} artifacts generated from this lever run</p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {run.artifacts.map((art) => {
          const ArtIcon = art.type === "chart" ? BarChart3 : art.type === "table" ? Scale : FileText
          return (
            <Card key={art.id} className="hover:shadow-sm transition-all">
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ArtIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{art.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{art.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[9px] capitalize">{art.type}</Badge>
                      <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 gap-1 text-muted-foreground">
                        <ExternalLink className="h-3 w-3" />View
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── Outputs Tab ───────────────────────────────────────────────────────────

function OutputsTab({ lever }: { lever: Lever }) {
  const run = lever.run
  if (!run || run.outputs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No outputs generated yet</p>
            <p className="text-xs text-muted-foreground mt-1">Complete the lever run to generate quantified values, argument cards, and clause drafts.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const STATUS_COLORS = {
    draft: "bg-muted text-muted-foreground",
    saved: "bg-blue-50 text-blue-700",
    pushed: "bg-emerald-50 text-emerald-700",
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{run.outputs.length} outputs from this lever</p>
        <Button variant="outline" size="sm" className="text-xs gap-1">
          <ArrowRight className="h-3 w-3" />Push All to Sections
        </Button>
      </div>
      <div className="space-y-2">
        {run.outputs.map((output) => {
          const OutputIcon = OUTPUT_ICONS[output.type]
          return (
            <Card key={output.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                    <OutputIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{output.title}</p>
                      <Badge variant="outline" className={cn("text-[9px]", STATUS_COLORS[output.status])}>{output.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{output.content}</p>
                    {output.quantifiedValue && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-600">
                          {formatCurrencyCompact(output.quantifiedValue.low)} - {formatCurrencyCompact(output.quantifiedValue.high)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{output.quantifiedValue.unit}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {output.targetSection && (
                        <Badge variant="outline" className="text-[9px] gap-0.5">
                          <ArrowRight className="h-2.5 w-2.5" />{TARGET_LABELS[output.targetSection]}
                        </Badge>
                      )}
                      {output.status !== "pushed" && (
                        <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 gap-1 text-primary">
                          <ArrowRight className="h-3 w-3" />Push
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
