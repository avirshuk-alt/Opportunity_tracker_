"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useCategory } from "@/lib/category-context"
import { getStrategyByCategory, getUserById } from "@/lib/data"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileText,
  GitCompare,
  ArrowRight,
  RefreshCw,
  Send,
  BarChart3,
  Users,
  Database,
  Globe,
  Leaf,
  Building2,
  ShieldAlert,
  Lightbulb,
  CalendarRange,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { NarrativeAuthoring } from "@/components/narrative-authoring"

// ─── Strategy Module Progress Config ──────────────────────────────────────────

interface StrategyModule {
  key: string
  name: string
  description: string
  icon: LucideIcon
  href: string
  pctComplete: number
  itemsDone: number
  itemsTotal: number
}

function getModulesForCategory(categoryId: string): StrategyModule[] {
  // Mock progress data - isolated so it can be replaced with real data later
  const progressByCat: Record<string, Partial<Record<string, { pct: number; done: number; total: number }>>> = {
    "cat-1": {
      "fact-base": { pct: 85, done: 6, total: 7 },
      stakeholders: { pct: 90, done: 9, total: 10 },
      external: { pct: 60, done: 3, total: 5 },
      esg: { pct: 40, done: 2, total: 5 },
      suppliers: { pct: 95, done: 19, total: 20 },
      risks: { pct: 80, done: 8, total: 10 },
      opportunities: { pct: 70, done: 7, total: 10 },
      roadmap: { pct: 55, done: 4, total: 7 },
    },
    "cat-2": {
      "fact-base": { pct: 50, done: 3, total: 6 },
      stakeholders: { pct: 70, done: 5, total: 7 },
      external: { pct: 30, done: 1, total: 4 },
      esg: { pct: 20, done: 1, total: 5 },
      suppliers: { pct: 60, done: 6, total: 10 },
      risks: { pct: 45, done: 3, total: 7 },
      opportunities: { pct: 35, done: 3, total: 8 },
      roadmap: { pct: 25, done: 1, total: 4 },
    },
  }

  const catProgress = progressByCat[categoryId] ?? {}

  return [
    {
      key: "fact-base",
      name: "Internal Fact Base",
      description: "Spend analytics, contract portfolio, and internal data",
      icon: Database,
      href: "/fact-base",
      pctComplete: catProgress["fact-base"]?.pct ?? 0,
      itemsDone: catProgress["fact-base"]?.done ?? 0,
      itemsTotal: catProgress["fact-base"]?.total ?? 0,
    },
    {
      key: "stakeholders",
      name: "Stakeholders",
      description: "Stakeholder mapping, influence, and engagement tracking",
      icon: Users,
      href: "/fact-base?tab=stakeholders",
      pctComplete: catProgress.stakeholders?.pct ?? 0,
      itemsDone: catProgress.stakeholders?.done ?? 0,
      itemsTotal: catProgress.stakeholders?.total ?? 0,
    },
    {
      key: "external",
      name: "External Intelligence",
      description: "Market trends, benchmarks, and industry insights",
      icon: Globe,
      href: "/external",
      pctComplete: catProgress.external?.pct ?? 0,
      itemsDone: catProgress.external?.done ?? 0,
      itemsTotal: catProgress.external?.total ?? 0,
    },
    {
      key: "esg",
      name: "ESG & Diversity",
      description: "Environmental, social, and governance metrics",
      icon: Leaf,
      href: "/esg",
      pctComplete: catProgress.esg?.pct ?? 0,
      itemsDone: catProgress.esg?.done ?? 0,
      itemsTotal: catProgress.esg?.total ?? 0,
    },
    {
      key: "suppliers",
      name: "Supplier Strategy",
      description: "Supplier segmentation, performance, and portfolio view",
      icon: Building2,
      href: "/suppliers",
      pctComplete: catProgress.suppliers?.pct ?? 0,
      itemsDone: catProgress.suppliers?.done ?? 0,
      itemsTotal: catProgress.suppliers?.total ?? 0,
    },
    {
      key: "risks",
      name: "Risk Management",
      description: "Risk register, heat map, and mitigation plans",
      icon: ShieldAlert,
      href: "/risks",
      pctComplete: catProgress.risks?.pct ?? 0,
      itemsDone: catProgress.risks?.done ?? 0,
      itemsTotal: catProgress.risks?.total ?? 0,
    },
    {
      key: "opportunities",
      name: "Opportunity Backlog",
      description: "Savings initiatives pipeline and qualification",
      icon: Lightbulb,
      href: "/opportunities",
      pctComplete: catProgress.opportunities?.pct ?? 0,
      itemsDone: catProgress.opportunities?.done ?? 0,
      itemsTotal: catProgress.opportunities?.total ?? 0,
    },
    {
      key: "roadmap",
      name: "Roadmap & Execution",
      description: "Implementation timeline, milestones, and tracking",
      icon: CalendarRange,
      href: "/roadmap",
      pctComplete: catProgress.roadmap?.pct ?? 0,
      itemsDone: catProgress.roadmap?.done ?? 0,
      itemsTotal: catProgress.roadmap?.total ?? 0,
    },
  ]
}

function getStatusFromPct(pct: number): { label: string; variant: string } {
  if (pct === 0) return { label: "Not started", variant: "bg-muted text-muted-foreground" }
  if (pct >= 100) return { label: "Complete", variant: "bg-emerald-50 text-emerald-700 border-emerald-200" }
  return { label: "In progress", variant: "bg-sky-50 text-sky-700 border-sky-200" }
}

// ─── (Objectives now come from lib/data.ts via getObjectivesByCategory) ──────

// ─── Main Component ──────────────────────────────────────────────────────────

export default function StrategyPage() {
  const { selectedCategory } = useCategory()
  const strategy = getStrategyByCategory(selectedCategory.id)
  const owner = strategy ? getUserById(strategy.ownerId) : null
  const [activeTab, setActiveTab] = useState("progress")
  const [diffOpen, setDiffOpen] = useState(false)

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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Strategy Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Create a new category strategy using the playbook templates.
              Strategies help you define objectives, document assumptions, and
              track execution.
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
  const overallPct = Math.round(modules.reduce((sum, m) => sum + m.pctComplete, 0) / modules.length)
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
        description={`Version ${strategy.version} \u00b7 ${strategy.objectives.length} objectives \u00b7 ${completedModules}/${modules.length} modules complete`}
        status={strategy.status}
        statusVariant={
          strategy.status === "Approved"
            ? "default"
            : strategy.status === "InReview"
              ? "secondary"
              : "outline"
        }
        owner={owner?.name}
        lastUpdated={strategy.updatedAt}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDiffOpen(true)}>
              <GitCompare className="mr-1.5 h-3.5 w-3.5" />
              Version Diff
            </Button>
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

      {/* Overall Completion Bar */}
      <Card className="mb-6">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Overall Strategy Completion</span>
              <span className="text-xs text-muted-foreground">
                Aggregated from {modules.length} modules
              </span>
            </div>
            <span className="text-sm font-semibold">{overallPct}%</span>
          </div>
          <Progress value={overallPct} className="h-2" />
          {overallPct < 100 && (
            <p className="text-xs text-muted-foreground mt-2">
              {modules.length - completedModules} module{modules.length - completedModules !== 1 ? "s" : ""} remaining
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="progress">
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="authoring">
            <Edit3 className="mr-1.5 h-3.5 w-3.5" />
            Authoring
          </TabsTrigger>

        </TabsList>

        {/* ─── Progress Tab ─────────────────────────────────────────────── */}
        <TabsContent value="progress" className="mt-4">
          <div className="grid gap-3">
            {modules.map((mod) => {
              const status = getStatusFromPct(mod.pctComplete)
              return (
                <Card key={mod.key} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-4">
                      {/* Icon */}
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        mod.pctComplete >= 100
                          ? "bg-emerald-50 text-emerald-600"
                          : mod.pctComplete > 0
                            ? "bg-sky-50 text-sky-600"
                            : "bg-muted text-muted-foreground"
                      )}>
                        <mod.icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-semibold truncate">{mod.name}</h3>
                          <Badge variant="outline" className={cn("text-[10px] shrink-0", status.variant)}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Progress value={mod.pctComplete} className="h-1.5 flex-1 max-w-xs" />
                          <span className="text-xs font-medium tabular-nums text-muted-foreground">
                            {mod.itemsDone}/{mod.itemsTotal} complete
                          </span>
                        </div>
                      </div>

                      {/* CTA */}
                      <Button variant="outline" size="sm" asChild className="shrink-0">
                        <Link href={mod.href}>
                          {mod.pctComplete === 0 ? "Start" : mod.pctComplete >= 100 ? "Review" : "Continue"}
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                    {/* Bottom progress accent line */}
                    <div className="h-0.5 bg-muted">
                      <div
                        className={cn(
                          "h-full transition-all",
                          mod.pctComplete >= 100 ? "bg-emerald-500" : mod.pctComplete > 0 ? "bg-primary" : "bg-transparent"
                        )}
                        style={{ width: `${mod.pctComplete}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ─── Authoring Tab (Narrative Builder) ──────────────────────── */}
        <TabsContent value="authoring" className="mt-4">
          <NarrativeAuthoring categoryId={selectedCategory.id} />
        </TabsContent>
      </Tabs>

      {/* Version Diff Dialog */}
      <Dialog open={diffOpen} onOpenChange={setDiffOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Version Comparison: v{strategy.version - 1} vs v{strategy.version}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {(["executiveSummary", "currentState", "futureState", "approach", "risks", "timeline"] as const).map((key) => {
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
