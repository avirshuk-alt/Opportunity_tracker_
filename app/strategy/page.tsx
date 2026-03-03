"use client"

import React, { useState } from "react"
import { useCategory } from "@/lib/category-context"
import { getStrategyByCategory, getUserById } from "@/lib/data"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Target,
  FileText,
  Send,
  Database,
  Globe,
  Leaf,
  Building2,
  ShieldAlert,
  Lightbulb,
  ArrowRightLeft,
  Sparkles,
  Loader2,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ObjectivesOnlyModule } from "@/components/strategic-objectives/objectives-only-module"
import { StrategyContainers } from "@/components/strategy-containers"
import { InsightsProvider, useInsights } from "@/lib/insights-context"
import { toast } from "sonner"

// ─── Module list (exact names from landing page) ──────────────────────────────

interface StrategyModule {
  key: string
  name: string
  icon: LucideIcon
  pctComplete: number
  itemsDone: number
  itemsTotal: number
}

function getModulesForCategory(categoryId: string): StrategyModule[] {
  const progressByCat: Record<
    string,
    Partial<Record<string, { pct: number; done: number; total: number }>>
  > = {
    "cat-1": {
      "strategic-objectives": { pct: 38, done: 3, total: 8 },
      strategy: { pct: 63, done: 5, total: 8 },
      "fact-base": { pct: 62, done: 6, total: 10 },
      external: { pct: 21, done: 1, total: 5 },
      suppliers: { pct: 67, done: 8, total: 12 },
      risks: { pct: 20, done: 2, total: 10 },
      esg: { pct: 32, done: 2, total: 6 },
      opportunities: { pct: 66, done: 7, total: 10 },
      impact: { pct: 22, done: 2, total: 9 },
    },
    "cat-2": {
      "strategic-objectives": { pct: 25, done: 2, total: 8 },
      strategy: { pct: 40, done: 3, total: 8 },
      "fact-base": { pct: 50, done: 3, total: 6 },
      external: { pct: 30, done: 1, total: 4 },
      suppliers: { pct: 60, done: 6, total: 10 },
      risks: { pct: 45, done: 3, total: 7 },
      esg: { pct: 20, done: 1, total: 5 },
      opportunities: { pct: 35, done: 3, total: 8 },
      impact: { pct: 25, done: 1, total: 4 },
    },
  }

  const catProgress = progressByCat[categoryId] ?? {}

  const modules: {
    key: string
    name: string
    icon: LucideIcon
  }[] = [
    { key: "strategic-objectives", name: "Stakeholder Strategy", icon: Target },
    { key: "strategy", name: "Strategy Workspace", icon: FileText },
    { key: "fact-base", name: "Internal Fact Base", icon: Database },
    { key: "external", name: "External Intelligence", icon: Globe },
    { key: "suppliers", name: "Supplier Strategy", icon: Building2 },
    { key: "risks", name: "Risk Management", icon: ShieldAlert },
    { key: "esg", name: "ESG & Supplier Diversity", icon: Leaf },
    { key: "opportunities", name: "Opportunity Tracker", icon: Lightbulb },
    { key: "impact", name: "Impact Simulation", icon: ArrowRightLeft },
  ]

  return modules.map((m) => ({
    ...m,
    pctComplete: catProgress[m.key]?.pct ?? 0,
    itemsDone: catProgress[m.key]?.done ?? 0,
    itemsTotal: catProgress[m.key]?.total ?? 0,
  }))
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function StrategyPage() {
  const { selectedCategory } = useCategory()
  const strategy = getStrategyByCategory(selectedCategory.id)
  const owner = strategy ? getUserById(strategy.ownerId) : null
  const [diffOpen, setDiffOpen] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)

  if (!strategy) {
    return (
      <>
        <PageHeader
          crumbs={[
            { label: "Home", href: "/" },
            { label: selectedCategory.name, href: "/" },
            { label: "Strategy Workspace" },
          ]}
          title="Strategy Workspace"
          description="No strategy exists for this category yet"
          actions={<Button size="sm">Create Strategy</Button>}
        />
        <Card className="rounded-2xl shadow-sm border border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Strategy Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Create a new category strategy using the playbook templates.
            </p>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Create New Strategy
            </Button>
          </CardContent>
        </Card>
      </>
    )
  }

  const modules = getModulesForCategory(selectedCategory.id)
  const overallPct = Math.round(
    modules.reduce((sum, m) => sum + m.pctComplete, 0) / modules.length
  )
  const completedModules = modules.filter((m) => m.pctComplete >= 100).length
  const canApprove = overallPct >= 80

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "Strategy Workspace" },
        ]}
        title={strategy.title}
        description={`Owner: ${owner?.name ?? "Unassigned"} | Version ${strategy.version} | Updated: ${strategy.updatedAt}`}
        status={strategy.status}
        statusVariant={
          strategy.status === "Approved"
            ? "default"
            : strategy.status === "InReview"
              ? "secondary"
              : "outline"
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export PPTX
            </Button>
            {strategy.status === "Draft" && (
              <Button size="sm" disabled={!canApprove}>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Submit for Review
              </Button>
            )}
            {strategy.status === "InReview" && (
              <Button size="sm">
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Approve
              </Button>
            )}
          </div>
        }
      />

      {/* ═══ 1. COLLAPSIBLE PROGRESS SECTION ═══════════════════════════════ */}
      <Card className="mb-12 rounded-2xl shadow-sm border border-border">
        <CardContent className="p-0">
          {/* Header row – always visible */}
          <button
            type="button"
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors rounded-t-2xl"
            onClick={() => setProgressOpen((v) => !v)}
            aria-expanded={progressOpen}
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-foreground">
                Overall Strategy Completion
              </span>
              <span className="text-xs text-muted-foreground">
                Aggregated from {modules.length} modules
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold tabular-nums text-foreground">
                {overallPct}%
              </span>
              {progressOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {/* Progress bar – always visible */}
          <div className="px-5 pb-4">
            <Progress value={overallPct} className="h-2" />
          </div>

          {/* Expanded module rows */}
          {progressOpen && (
            <div className="px-5 pb-4">
              <Separator className="mb-3" />
              <div className="max-h-[340px] overflow-y-auto space-y-0">
                {modules.map((mod, idx) => (
                  <div key={mod.key}>
                    <div className="flex items-center gap-3 py-2.5">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          mod.pctComplete >= 100
                            ? "bg-emerald-50 text-emerald-600"
                            : mod.pctComplete > 0
                              ? "bg-orange-50 text-orange-500"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        <mod.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="w-44 shrink-0 text-sm text-foreground truncate">
                        {mod.name}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${mod.pctComplete}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium tabular-nums text-muted-foreground shrink-0 w-8 text-right">
                        {mod.itemsDone}/{mod.itemsTotal}
                      </span>
                    </div>
                    {idx < modules.length - 1 && (
                      <Separator className="opacity-50" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ 2. HELPER TEXT + GENERATE INSIGHTS ════════════════════════ */}
      <InsightsProvider>
        <GenerateInsightsSection categoryId={selectedCategory.id} />

        {/* ═══ 3. STRATEGIC OBJECTIVES (canonical instance) ═════════════════ */}
        <div className="mb-4">
          <ObjectivesOnlyModule />
        </div>

        {/* ═══ 4. STRATEGY CONTAINERS (driven by shared insights) ══════════ */}
        <StrategyContainers />
      </InsightsProvider>

      {/* ═══ VERSION DIFF DIALOG ══════════════════════════════════════════ */}
      <Dialog open={diffOpen} onOpenChange={setDiffOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Version Comparison: v{strategy.version - 1} vs v
              {strategy.version}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {(
              [
                "executiveSummary",
                "currentState",
                "futureState",
                "approach",
                "risks",
                "timeline",
              ] as const
            ).map((key) => {
              const labels: Record<string, string> = {
                executiveSummary: "Executive Summary",
                currentState: "Current State Analysis",
                futureState: "Future State Vision",
                approach: "Strategic Approach",
                risks: "Risk Assessment",
                timeline: "Timeline & Milestones",
              }
              const current = strategy.narrative[key]
              return (
                <div key={key}>
                  <h4 className="text-sm font-semibold mb-2">{labels[key]}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-md bg-red-50 p-3">
                      <p className="text-[10px] font-medium text-red-600 uppercase tracking-wider mb-1">
                        v{strategy.version - 1} (Previous)
                      </p>
                      <p className="text-xs text-red-900 leading-relaxed">
                        {current
                          ? `${current.substring(0, Math.floor(current.length * 0.7))}...`
                          : "Section was empty"}
                      </p>
                    </div>
                    <div className="rounded-md bg-emerald-50 p-3">
                      <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider mb-1">
                        v{strategy.version} (Current)
                      </p>
                      <p className="text-xs text-emerald-900 leading-relaxed">
                        {current || "No content"}
                      </p>
                    </div>
                  </div>
                  <Separator className="mt-4" />
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Generate Insights Section ──────────────────────────────────────────────

function GenerateInsightsSection({ categoryId }: { categoryId: string }) {
  const { generate, isGenerating, hasGenerated, progress } = useInsights()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleClick = () => {
    if (hasGenerated) {
      setConfirmOpen(true)
    } else {
      generate(categoryId)
      toast.success("Generating insights from all modules...")
    }
  }

  const handleConfirm = () => {
    setConfirmOpen(false)
    generate(categoryId)
    toast.success("Regenerating all insights...")
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-balance">
              {"Let\u2019s help you communicate your strategy."}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Use insights from your fact base to craft a clear, executive-ready story.
            </p>
          </div>
          <Button
            size="sm"
            className="h-9 gap-2 text-sm font-semibold shrink-0"
            onClick={handleClick}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating ? "Generating..." : "Generate Insights"}
          </Button>
        </div>

        {/* Inline progress bar during generation */}
        {isGenerating && (
          <div className="mt-3">
            <Progress value={progress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1">
              Synthesizing insights from all modules...
            </p>
          </div>
        )}
      </div>

      {/* Regeneration confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate all insights?</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite all previously generated content across Strategic Objectives,
              Executive Summary, Category Diagnosis, Strategic Themes, Roadmap, and other sections.
              Manually added objectives will be preserved, but individual refinements will be replaced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
