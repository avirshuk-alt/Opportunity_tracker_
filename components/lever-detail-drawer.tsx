"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  type Lever,
  type LeverRecommendation,
  type TrackerInitiative,
  getAnalysisStatusColor,
  getBucketColor,
  getConfidenceColor,
  getLeverStatusColor,
  getLeverAnalysisReadiness,
  getAnalysisReadinessColor,
  leverModelConfigs,
} from "@/lib/opportunity-tracker-data"
import type { UnifiedInsight } from "@/lib/insights-adapter"
import { cn } from "@/lib/utils"
import {
  Beaker,
  BookOpen,
  Brain,
  Calculator,
  ChevronRight,
  Database,
  FileBarChart,
  Lightbulb,
  Plus,
  RefreshCw,
  Ruler,
  Sparkles,
  Target,
  X,
} from "lucide-react"

interface LeverDetailDrawerProps {
  lever: Lever | null
  evidenceInsights: UnifiedInsight[]
  recommendation: LeverRecommendation | null
  open: boolean
  onClose: () => void
  onCreateInitiative: (initiative: TrackerInitiative) => void
  onOpenAnalysis?: (analysisId: string) => void
  onRefreshRecommendation?: () => void
  onAnalyzeSavings?: () => void
}

export function LeverDetailDrawer({
  lever,
  evidenceInsights,
  recommendation,
  open,
  onClose,
  onCreateInitiative,
  onOpenAnalysis,
  onRefreshRecommendation,
  onAnalyzeSavings,
}: LeverDetailDrawerProps) {
  const [showSizing, setShowSizing] = useState(false)
  const [showNewInitiative, setShowNewInitiative] = useState(false)
  const [sizingInputs, setSizingInputs] = useState({
    addressableSpendPct: 60,
    adoptionPct: 40,
    timelineMonths: 12,
    confidence: 70,
  })
  const [newInitiative, setNewInitiative] = useState({
    name: "",
    owner: "",
    targetValue: "",
    dueDate: "",
  })

  if (!lever) return null

  const estimatedSavings = {
    low: Math.round(
      52_400_000 *
        (sizingInputs.addressableSpendPct / 100) *
        (sizingInputs.adoptionPct / 100) *
        0.03 *
        (sizingInputs.confidence / 100),
    ),
    base: Math.round(
      52_400_000 *
        (sizingInputs.addressableSpendPct / 100) *
        (sizingInputs.adoptionPct / 100) *
        0.055 *
        (sizingInputs.confidence / 100),
    ),
    high: Math.round(
      52_400_000 *
        (sizingInputs.addressableSpendPct / 100) *
        (sizingInputs.adoptionPct / 100) *
        0.08 *
        (sizingInputs.confidence / 100),
    ),
  }

  function handleCreateInitiative() {
    if (!newInitiative.name) return
    onCreateInitiative({
      id: `init-${Date.now()}`,
      name: newInitiative.name || lever.name,
      leverId: lever.id,
      owner: newInitiative.owner || "Unassigned",
      targetValue: newInitiative.targetValue || "TBD",
      status: "Planning",
      dueDate: newInitiative.dueDate || "TBD",
    })
    setShowNewInitiative(false)
    setNewInitiative({ name: "", owner: "", targetValue: "", dueDate: "" })
  }

  const sourceIcons: Record<string, typeof Database> = {
    "internal-fact": Database,
    "external-intel": FileBarChart,
    requirement: Target,
    risk: Lightbulb,
    opportunity: Lightbulb,
    objective: Target,
  }

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n}`

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className={cn("text-xs", getBucketColor(lever.bucket))}>
                  {lever.bucket}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", getLeverStatusColor(lever.status))}>
                  {lever.status}
                </Badge>
                {recommendation && (
                  <Badge className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Recommended
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-lg leading-tight">{lever.name}</SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-6">
            {/* Analyze Savings CTA */}
            {onAnalyzeSavings && (
              <Card className="shadow-none border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Savings Analysis</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Model savings scenarios with interactive controls
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-[10px]", getAnalysisReadinessColor(getLeverAnalysisReadiness(lever)))}
                      >
                        {getLeverAnalysisReadiness(lever)}
                      </Badge>
                      <Button size="sm" className="h-8 text-xs gap-1.5" onClick={onAnalyzeSavings}>
                        <Calculator className="h-3.5 w-3.5" />
                        Analyze Savings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 1. Overview */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Overview
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{lever.description}</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Prerequisites</p>
                  <ul className="space-y-1">
                    {lever.prerequisites.map((p) => (
                      <li key={p} className="text-xs text-foreground flex items-start gap-1.5">
                        <ChevronRight className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Common KPIs</p>
                  <ul className="space-y-1">
                    {lever.kpis.map((k) => (
                      <li key={k} className="text-xs text-foreground flex items-start gap-1.5">
                        <ChevronRight className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* 2. Why Recommended (if recommended) */}
            {recommendation && (
              <>
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Why Recommended
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] ml-auto", getConfidenceColor(recommendation.confidence))}
                    >
                      {recommendation.confidence} confidence
                    </Badge>
                  </h3>
                  <div className="rounded-lg border bg-primary/5 p-3 mb-3">
                    <p className="text-sm text-foreground leading-relaxed">
                      {recommendation.reason}
                    </p>
                  </div>
                  {/* Evidence chips */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Evidence</p>
                    {recommendation.evidenceInsights.slice(0, 5).map((insight) => {
                      const Icon = sourceIcons[insight.source] || Lightbulb
                      return (
                        <div key={insight.id} className="rounded-lg border bg-muted/30 p-2.5">
                          <div className="flex items-start gap-2">
                            <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground">{insight.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                {insight.text}
                              </p>
                              <Badge variant="outline" className="text-[10px] h-4 mt-1">
                                {insight.sourceLabel}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {onRefreshRecommendation && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 h-7 text-xs bg-transparent w-full"
                      onClick={onRefreshRecommendation}
                    >
                      <RefreshCw className="mr-1.5 h-3 w-3" />
                      Refresh recommendation
                    </Button>
                  )}
                </section>
                <Separator />
              </>
            )}

            {/* 3. Evidence from Insights (shown when NOT recommended) */}
            {!recommendation && evidenceInsights.length > 0 && (
              <>
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-muted-foreground" />
                    Related Insights
                    <Badge variant="secondary" className="text-[10px] ml-auto">
                      {evidenceInsights.length} linked
                    </Badge>
                  </h3>
                  <div className="space-y-2">
                    {evidenceInsights.slice(0, 5).map((insight) => {
                      const Icon = sourceIcons[insight.source] || Lightbulb
                      return (
                        <div key={insight.id} className="rounded-lg border bg-muted/30 p-2.5">
                          <div className="flex items-start gap-2">
                            <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground">{insight.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{insight.text}</p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-[10px] h-4">{insight.sourceLabel}</Badge>
                                {insight.tags.slice(0, 2).map((t) => (
                                  <Badge key={t} variant="secondary" className="text-[10px] h-4">{t}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
                <Separator />
              </>
            )}

            {/* 4. Analytics Library */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Beaker className="h-4 w-4 text-muted-foreground" />
                Analytics Library
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {lever.analyses.length} analyses
                </Badge>
              </h3>
              <div className="space-y-2">
                {lever.analyses.map((analysis) => (
                  <Card key={analysis.id} className="shadow-none">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{analysis.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{analysis.purpose}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] shrink-0", getAnalysisStatusColor(analysis.status))}
                        >
                          {analysis.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {analysis.requiredDatasets.map((d) => (
                          <Badge key={d} variant="secondary" className="text-[10px] h-4">{d}</Badge>
                        ))}
                      </div>
                      <div className="mt-2">
                        <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Output metrics</p>
                        <p className="text-xs text-foreground">{analysis.outputMetrics.join(" | ")}</p>
                      </div>
                      <div className="mt-2">
                        {analysis.status === "Available" ? (
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onOpenAnalysis?.(analysis.id)}
                          >
                            {analysis.hasDetailView ? "Open Analysis" : "View Details"}
                          </Button>
                        ) : analysis.status === "Needs data" ? (
                          <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                            Request Data
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent" disabled>
                            Not Available
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <Separator />

            {/* 5. Sizing Panel */}
            <section>
              <button
                onClick={() => setShowSizing(!showSizing)}
                className="flex items-center gap-2 text-sm font-semibold text-foreground w-full"
              >
                <Ruler className="h-4 w-4 text-muted-foreground" />
                Sizing
                <ChevronRight
                  className={cn(
                    "h-4 w-4 ml-auto text-muted-foreground transition-transform",
                    showSizing && "rotate-90",
                  )}
                />
              </button>
              {showSizing && (
                <div className="mt-3 space-y-4 rounded-lg border p-4 bg-muted/20">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Addressable Spend %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={sizingInputs.addressableSpendPct}
                        onChange={(e) => setSizingInputs((s) => ({ ...s, addressableSpendPct: Number(e.target.value) }))}
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Adoption %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={sizingInputs.adoptionPct}
                        onChange={(e) => setSizingInputs((s) => ({ ...s, adoptionPct: Number(e.target.value) }))}
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Timeline (months)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={sizingInputs.timelineMonths}
                        onChange={(e) => setSizingInputs((s) => ({ ...s, timelineMonths: Number(e.target.value) }))}
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Confidence %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={sizingInputs.confidence}
                        onChange={(e) => setSizingInputs((s) => ({ ...s, confidence: Number(e.target.value) }))}
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="rounded-lg bg-background border p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Estimated Annual Savings Range</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Low</p>
                        <p className="text-sm font-bold text-foreground">{fmt(estimatedSavings.low)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Base</p>
                        <p className="text-sm font-bold text-primary">{fmt(estimatedSavings.base)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">High</p>
                        <p className="text-sm font-bold text-foreground">{fmt(estimatedSavings.high)}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Based on $52.4M total category spend, {sizingInputs.addressableSpendPct}% addressable,{" "}
                      {sizingInputs.adoptionPct}% adoption, {sizingInputs.confidence}% confidence.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <Separator />

            {/* 6. Create Initiative */}
            <section>
              {!showNewInitiative ? (
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setShowNewInitiative(true)
                    setNewInitiative((s) => ({ ...s, name: lever.name }))
                  }}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create Initiative
                </Button>
              ) : (
                <Card className="shadow-none">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Create Initiative</CardTitle>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNewInitiative(false)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Initiative Name</Label>
                      <Input
                        value={newInitiative.name}
                        onChange={(e) => setNewInitiative((s) => ({ ...s, name: e.target.value }))}
                        className="mt-1 h-8 text-sm"
                        placeholder="Initiative name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Owner</Label>
                        <Input
                          value={newInitiative.owner}
                          onChange={(e) => setNewInitiative((s) => ({ ...s, owner: e.target.value }))}
                          className="mt-1 h-8 text-sm"
                          placeholder="Owner name"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Target Value</Label>
                        <Input
                          value={newInitiative.targetValue}
                          onChange={(e) => setNewInitiative((s) => ({ ...s, targetValue: e.target.value }))}
                          className="mt-1 h-8 text-sm"
                          placeholder="e.g. $500K"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Due Date</Label>
                      <Input
                        type="date"
                        value={newInitiative.dueDate}
                        onChange={(e) => setNewInitiative((s) => ({ ...s, dueDate: e.target.value }))}
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <Button size="sm" className="w-full" onClick={handleCreateInitiative} disabled={!newInitiative.name}>
                      Create
                    </Button>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
