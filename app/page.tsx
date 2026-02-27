"use client"

import { useCategory } from "@/lib/category-context"
import {
  MODULES,
  getModuleProgressByCategory,
} from "@/lib/module-progress"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useMemo, useCallback } from "react"
import {
  FileText,
  Database,
  Globe,
  Building2,
  ShieldAlert,
  Lightbulb,
  ArrowRight,
  Sparkles,
  DollarSign,
  AlertTriangle,
  Leaf,
  ArrowRightLeft,
  Bookmark,
  MessageSquare,
  Send,
} from "lucide-react"
import { Input } from "@/components/ui/input"

// ─── Icon map (matches module-progress icon strings) ─────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Database,
  Globe,
  Building2,
  ShieldAlert,
  Lightbulb,
  Leaf,
  ArrowRightLeft,
}

// ─── Module tag descriptors ──────────────────────────────────────

const MODULE_TAGS: Record<string, string[]> = {
  strategy:      ["Objectives", "Narrative", "Stakeholder alignment"],
  "fact-base":   ["Spend data", "Compliance", "Contract terms"],
  external:      ["Benchmarks", "Market signals", "Competitor intel"],
  suppliers:     ["Segmentation", "Scorecards", "Playbooks"],
  risks:         ["Risk register", "Mitigation plans", "Heatmap"],
  esg:           ["Sustainability", "EV readiness", "Diversity"],
  opportunities: ["Levers", "Savings analyses", "Initiative pipeline"],
  impact:        ["Scenario modeling", "Sensitivity", "Business case"],
}

// ─── Intent router (keyword to route) ────────────────────────────

const INTENT_MAP: { keywords: string[]; route: string }[] = [
  { keywords: ["risk", "mitigation", "threat", "safety", "accident"],    route: "/risks" },
  { keywords: ["opportunity", "backlog", "initiative", "value", "trim", "lever"], route: "/opportunities" },
  { keywords: ["supplier", "vendor", "scorecard", "oem", "fmc", "dealer"], route: "/suppliers" },
  { keywords: ["external", "market", "intelligence", "news", "leverage"], route: "/external" },
  { keywords: ["internal", "spend", "contract", "lease", "fact", "parity", "fuel", "maintenance", "policy", "compliance"], route: "/fact-base" },
  { keywords: ["strategy", "objective", "narrative", "author", "workspace"], route: "/strategy" },
  { keywords: ["esg", "diversity", "sustainability", "ev", "electric"],  route: "/esg" },
  { keywords: ["impact", "simulator", "scenario"],                       route: "/impact" },
  { keywords: ["roadmap", "execution", "timeline"],                      route: "/roadmap" },
]

function resolveIntent(input: string): string | null {
  const lower = input.toLowerCase().trim()
  if (!lower) return null
  for (const intent of INTENT_MAP) {
    if (intent.keywords.some((kw) => lower.includes(kw))) return intent.route
  }
  return null
}

// ─── Main Page ───────────────────────────────────────────────────

export default function HomePage() {
  const { selectedCategory } = useCategory()
  const router = useRouter()

  const progressData = useMemo(
    () => getModuleProgressByCategory(selectedCategory.id),
    [selectedCategory.id],
  )

  const completedCount = progressData.filter((p) => p.status === "Complete").length
  const totalModules = progressData.length

  // Find next recommended module: lowest progress that isn't complete
  const nextModule = useMemo(() => {
    const incomplete = progressData
      .filter((p) => p.status !== "Complete")
      .sort((a, b) => a.percent - b.percent)
    if (incomplete.length === 0) return MODULES[0]
    return MODULES.find((m) => m.key === incomplete[0].key) || MODULES[0]
  }, [progressData])

  const [chatInput, setChatInput] = useState("")
  const [insightSaved, setInsightSaved] = useState(false)

  const handleChatSubmit = useCallback(() => {
    if (!chatInput.trim()) return
    const route = resolveIntent(chatInput)
    router.push(route || "/strategy")
    setChatInput("")
  }, [chatInput, router])

  // Status pill logic for modules
  function getStatusInfo(key: string, percent: number, status: string) {
    // "Recommended" for the next module
    if (key === nextModule.key && status !== "Complete") {
      return { label: "Recommended", className: "bg-primary/10 text-primary border-primary/20" }
    }
    if (status === "Complete") {
      return { label: "Complete", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    }
    if (percent > 0) {
      return { label: "In progress", className: "bg-amber-50 text-amber-700 border-amber-200" }
    }
    return { label: "Not started", className: "bg-muted text-muted-foreground border-border" }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ═══════════ 1) HERO BANNER ═══════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[hsl(30,30%,97%)] via-[hsl(22,50%,94%)] to-[hsl(36,60%,90%)]">
        {/* Decorative radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(22,92%,52%,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(36,82%,54%,0.06),transparent_50%)]" />

        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight text-balance">
              Welcome back, Sarah.
            </h1>
            <p className="text-base sm:text-lg font-medium text-foreground/70">
              AI-powered Category Strategy Platform
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Build and stress-test your strategy across {totalModules} modules.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {completedCount}/{totalModules} complete
              <span className="mx-1.5 text-border">|</span>
              Next: {nextModule.label}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Link href="/strategy">
              <Button className="gap-2 h-10 px-5 text-sm font-semibold shadow-sm">
                <Sparkles className="h-4 w-4" />
                Generate Executive Brief
              </Button>
            </Link>
            <Link href="/strategy">
              <Button variant="ghost" className="gap-1.5 h-10 text-sm text-foreground/60 hover:text-foreground">
                <MessageSquare className="h-4 w-4" />
                Ask AI
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════ 2) CONTENT: Left + Right columns ═════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

        {/* ─── LEFT COLUMN ────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* ── Value at Stake ────────────────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Value at Stake</h2>
            <div className="flex flex-col gap-3">
              {/* Savings pipeline */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <DollarSign className="h-4.5 w-4.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Savings pipeline</p>
                      <p className="text-xl font-bold text-foreground mt-0.5">$8 - 12M</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Est. annual potential across levers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk exposure */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Risk exposure</p>
                      <p className="text-xl font-bold text-foreground mt-0.5">Medium</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">3 hotspots flagged</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ── AI Spotlight ──────────────────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">AI Spotlight</h2>
            <Card className="shadow-sm border-primary/15">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-xs font-semibold text-foreground">Insight</p>
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        High confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      Trim proliferation reduction could unlock $2 - 4M annually.
                      Tier 1 premium mix is elevated at 42% vs. 25% benchmark.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Link href="/opportunities">
                        <Button size="sm" variant="default" className="h-7 text-xs gap-1">
                          View analysis
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "h-7 text-xs gap-1",
                          insightSaved && "text-primary",
                        )}
                        onClick={() => setInsightSaved(!insightSaved)}
                      >
                        <Bookmark className={cn("h-3 w-3", insightSaved && "fill-primary")} />
                        {insightSaved ? "Saved" : "Save insight"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Module Journey ───────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Module Journey</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODULES.map((mod) => {
              const prog = progressData.find((p) => p.key === mod.key)
              const pct = prog?.percent ?? 0
              const status = prog?.status ?? "Not started"
              const statusInfo = getStatusInfo(mod.key, pct, status)
              const Icon = ICON_MAP[mod.icon]
              const tags = MODULE_TAGS[mod.key] || []

              return (
                <Card
                  key={mod.key}
                  className={cn(
                    "shadow-sm transition-all hover:shadow-md group relative overflow-hidden",
                    mod.key === nextModule.key && status !== "Complete" && "ring-1 ring-primary/25",
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                          {Icon && <Icon className="h-4 w-4 text-foreground/60" />}
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug">{mod.label}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] shrink-0 whitespace-nowrap", statusInfo.className)}
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Progress bar + Open CTA */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold tabular-nums text-muted-foreground w-8 text-right">
                        {pct}%
                      </span>
                      <Link href={mod.href}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 text-foreground/60 hover:text-foreground px-2"
                        >
                          Open
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══════════ 3) FLOATING ASK AI CHIP ═══════════════════════════ */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex items-center gap-2 rounded-full border bg-card shadow-lg px-2 py-1.5">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleChatSubmit() }}
            placeholder="Ask AI anything..."
            className="h-8 w-48 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
          />
          <Button
            onClick={handleChatSubmit}
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0 text-primary hover:text-primary"
            aria-label="Send"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
