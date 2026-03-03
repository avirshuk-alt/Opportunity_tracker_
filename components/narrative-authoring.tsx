"use client"

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Eye,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowRight,
  GripVertical,
  Library,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  X,
  Send,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getAllInsightsForCategory,
  generateMacroObservations,
  generateObservations,
  generateRoadmapNarrative,
  getRoadmapPhasesForCategory,
  type UnifiedInsight,
  type InsightSource,
} from "@/lib/insights-adapter"
import {
  getInitiativesByCategory,
  type Initiative,
} from "@/lib/data"

// ─── Types ──────────────────────────────────────────────────────────────────

interface MacroObservation {
  id: string
  title: string
  text: string
  sourceIds: string[]
}

interface ObservationCard {
  id: string
  title: string
  evidence: string[]
  impact: string
  leadsTo: string[]
}

interface NarrativeAuthoringProps {
  categoryId: string
}

// ─── Source badge colors ────────────────────────────────────────────────────

const SOURCE_STYLES: Record<InsightSource, string> = {
  requirement: "bg-amber-50 text-amber-700 border-amber-200",
  objective: "bg-primary/10 text-primary border-primary/20",
  risk: "bg-red-50 text-red-700 border-red-200",
  opportunity: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "internal-fact": "bg-sky-50 text-sky-700 border-sky-200",
  "external-intel": "bg-violet-50 text-violet-700 border-violet-200",
}

const SOURCE_LABELS: Record<InsightSource, string> = {
  requirement: "Requirement",
  objective: "Objective",
  risk: "Risk",
  opportunity: "Opportunity",
  "internal-fact": "Internal Fact",
  "external-intel": "External Intel",
}

// ─── Tone options ───────────────────────────────────────────────────────────

const TONE_OPTIONS = ["Executive", "Board-ready", "Detailed", "One-page"] as const

// ─── Collapsible Section ────────────────────────────────────────────────────

function StorySection({
  number,
  title,
  subtitle,
  children,
  actions,
  defaultOpen = true,
}: {
  number: number
  title: string
  subtitle: string
  children: React.ReactNode
  actions?: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="rounded-2xl shadow-sm border border-border">
      <CardHeader
        className="cursor-pointer select-none py-4 px-5"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
              {number}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              <CardDescription className="text-xs">{subtitle}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 px-5 pb-5">
          {children}
        </CardContent>
      )}
    </Card>
  )
}

// ─── Source pills ───────────────────────────────────────────────────────────

function SourcePills({
  ids,
  allInsights,
  onClickId,
}: {
  ids: string[]
  allInsights: UnifiedInsight[]
  onClickId: (id: string) => void
}) {
  if (ids.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      <span className="text-[10px] text-muted-foreground leading-5">Sources:</span>
      {ids.map((sid) => {
        const insight = allInsights.find((i) => i.id === sid)
        if (!insight) return null
        return (
          <button
            key={sid}
            type="button"
            onClick={() => onClickId(sid)}
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors hover:opacity-80",
              SOURCE_STYLES[insight.source],
            )}
          >
            {insight.sourceLabel}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function NarrativeAuthoring({ categoryId }: NarrativeAuthoringProps) {
  // ─── Shared State ───────────────────────────────────────────────

  const [authoringContext, setAuthoringContext] = useState("")
  const [contextInput, setContextInput] = useState("")
  const [selectedTone, setSelectedTone] = useState<(typeof TONE_OPTIONS)[number]>("Executive")

  // Evidence drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerInsightId, setDrawerInsightId] = useState<string | null>(null)
  const [drawerFilter, setDrawerFilter] = useState<InsightSource | null>(null)
  const [drawerSearch, setDrawerSearch] = useState("")

  // Section data
  const [macros, setMacros] = useState<MacroObservation[]>([])
  const [observations, setObservations] = useState<ObservationCard[]>([])
  const [opportunitySort, setOpportunitySort] = useState<"impact" | "feasibility" | "strategic">("impact")

  // Section narratives (per-section editable text)
  const [sectionText, setSectionText] = useState<Record<string, string>>({})

  // Compiled narrative panel open
  const [compiledOpen, setCompiledOpen] = useState(false)

  // Loading states for AI generation buttons
  const [loadingMacro, setLoadingMacro] = useState(false)
  const [loadingObservations, setLoadingObservations] = useState(false)
  const [loadingRoadmap, setLoadingRoadmap] = useState(false)
  const mountedRef = useRef(true)
  useEffect(() => { return () => { mountedRef.current = false } }, [])

  // ─── Data ───────────────────────────────────────────────────────

  const allInsights = useMemo(
    () => getAllInsightsForCategory(categoryId),
    [categoryId],
  )

  const initiatives = useMemo(
    () => getInitiativesByCategory(categoryId),
    [categoryId],
  )

  const roadmapPhases = useMemo(
    () => getRoadmapPhasesForCategory(categoryId),
    [categoryId],
  )

  // Drawer filtered insights
  const drawerInsights = useMemo(() => {
    return getAllInsightsForCategory(categoryId, {
      sources: drawerFilter ? [drawerFilter] : undefined,
      search: drawerSearch || undefined,
    })
  }, [categoryId, drawerFilter, drawerSearch])

  const drawerSelectedInsight = useMemo(
    () => (drawerInsightId ? allInsights.find((i) => i.id === drawerInsightId) : null),
    [drawerInsightId, allInsights],
  )

  // ─── Sorted opportunities ──────────────────────────────────────

  const sortedInitiatives = useMemo(() => {
    const copy = [...initiatives]
    if (opportunitySort === "impact") copy.sort((a, b) => b.targetSavings - a.targetSavings)
    else if (opportunitySort === "feasibility") copy.sort((a, b) => b.confidence - a.confidence)
    else copy.sort((a, b) => (b.targetSavings * b.confidence) - (a.targetSavings * a.confidence))
    return copy
  }, [initiatives, opportunitySort])

  // ─── Handlers ──────────────────────────────────────────────────

  const applyContext = useCallback(() => {
    if (contextInput.trim()) {
      setAuthoringContext(contextInput.trim())
    }
  }, [contextInput])

  const openInsightInDrawer = useCallback((id: string) => {
    setDrawerInsightId(id)
    setDrawerOpen(true)
  }, [])

  const generateMacro = useCallback(() => {
    setLoadingMacro(true)
    setTimeout(() => {
      if (!mountedRef.current) return
      const obs = generateMacroObservations(categoryId)
      setMacros(
        obs.map((o, idx) => ({
          id: `macro-${idx}`,
          title: o.title,
          text: o.text,
          sourceIds: o.sourceIds,
        })),
      )
      setLoadingMacro(false)
    }, 1000)
  }, [categoryId])

  const aiSuggestObservations = useCallback(() => {
    setLoadingObservations(true)
    setTimeout(() => {
      if (!mountedRef.current) return
      const obs = generateObservations(categoryId)
      setObservations(
        obs.map((o, idx) => ({
          id: `obs-${idx}`,
          title: o.title,
          evidence: o.evidence,
          impact: o.impact,
          leadsTo: o.leadsTo,
        })),
      )
      setLoadingObservations(false)
    }, 1000)
  }, [categoryId])

  const generateRoadmap = useCallback(() => {
    setLoadingRoadmap(true)
    setTimeout(() => {
      if (!mountedRef.current) return
      const text = generateRoadmapNarrative(categoryId)
      setSectionText((prev) => ({ ...prev, roadmap: text }))
      setLoadingRoadmap(false)
    }, 1000)
  }, [categoryId])

  const updateSectionText = useCallback((key: string, value: string) => {
    setSectionText((prev) => ({ ...prev, [key]: value }))
  }, [])

  // ─── Compiled narrative ────────────────────────────────────────

  const compiledNarrative = useMemo(() => {
    const parts: string[] = []

    // Macro
    if (macros.length > 0 || sectionText.macro) {
      parts.push("\nBIG PICTURE")
      if (sectionText.macro) parts.push(sectionText.macro)
      else parts.push(macros.map((m) => `- ${m.title}: ${m.text}`).join("\n"))
    }

    // Observations
    if (observations.length > 0) {
      parts.push("\nKEY OBSERVATIONS")
      parts.push(observations.map((o) => `- ${o.title}: ${o.impact}`).join("\n"))
    }

    // Opportunities
    if (sortedInitiatives.length > 0) {
      parts.push("\nOPPORTUNITIES")
      parts.push(
        sortedInitiatives
          .slice(0, 5)
          .map((i) => `- ${i.title}: $${(i.targetSavings / 1e6).toFixed(1)}M potential (${i.confidence}% confidence)`)
          .join("\n"),
      )
    }

    // Roadmap
    if (sectionText.roadmap) {
      parts.push("\nROADMAP")
      parts.push(sectionText.roadmap)
    }

    return parts.join("\n\n") || "Generate content in each section above to see the compiled narrative here."
  }, [macros, observations, sortedInitiatives, sectionText])

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-10">
      {/* ─── Header + Context Input ─────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-balance">
            {"Let\u2019s help you communicate your strategy."}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Use insights from your fact base to craft a clear, executive-ready story.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={contextInput}
            onChange={(e) => setContextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && contextInput.trim()) {
                e.preventDefault()
                applyContext()
              }
            }}
            placeholder="Add context (e.g., constraints, leadership priorities, tone, audience)..."
            className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40 transition-colors"
          />
          <Button size="sm" onClick={applyContext} disabled={!contextInput.trim()}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Apply
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDrawerOpen(true)}
          >
            <Library className="mr-1.5 h-3.5 w-3.5" />
            Evidence
          </Button>
        </div>

        {authoringContext && (
          <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <p className="text-xs text-foreground flex-1">
              <span className="font-medium">Active context:</span> {authoringContext}
            </p>
            <button
              type="button"
              onClick={() => setAuthoringContext("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ─── 1. Macro Perspective ───────────────────────────── */}
      <StorySection
        number={1}
        title="Big picture: what's happening in the category"
        subtitle="Executive-level observations blending internal and external signals"
        actions={
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={generateMacro} disabled={loadingMacro}>
            {loadingMacro ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            {loadingMacro ? "Generating..." : "Generate macro narrative"}
          </Button>
        }
      >
        {macros.length === 0 && !sectionText.macro ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Eye className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-xs text-muted-foreground max-w-xs">
              Generate a macro narrative to synthesise market context, supply/demand dynamics, and cost drivers into executive observations.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {macros.map((m) => (
              <div key={m.id} className="rounded-lg border p-3 space-y-2">
                <h4 className="text-sm font-semibold">{m.title}</h4>
                <Textarea
                  value={m.text}
                  onChange={(e) => {
                    setMacros((prev) =>
                      prev.map((x) => (x.id === m.id ? { ...x, text: e.target.value } : x)),
                    )
                  }}
                  rows={3}
                  className="text-xs resize-none"
                />
                <SourcePills ids={m.sourceIds} allInsights={allInsights} onClickId={openInsightInDrawer} />
              </div>
            ))}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                Or write your own macro summary
              </label>
              <Textarea
                value={sectionText.macro ?? ""}
                onChange={(e) => updateSectionText("macro", e.target.value)}
                rows={4}
                className="text-sm"
                placeholder="Write a cohesive macro summary..."
              />
            </div>
          </div>
        )}
      </StorySection>

      {/* ─── 2. Observations ────────────────────────────────── */}
      <StorySection
        number={2}
        title="What we're seeing (behaviors & observations)"
        subtitle="Patterns, gaps, and signals from your data"
        actions={
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={aiSuggestObservations} disabled={loadingObservations}>
            {loadingObservations ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            {loadingObservations ? "Generating..." : "AI suggest observations"}
          </Button>
        }
      >
        {observations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-xs text-muted-foreground max-w-xs">
              Let AI synthesise your saved insights into crisp observation cards with evidence and impact statements.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {observations.map((obs) => (
              <div key={obs.id} className="w-full rounded-lg border p-4">
                <div className="flex w-full gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-1 shrink-0 cursor-grab" />
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Row 1: title + remove */}
                    <div className="flex items-start justify-between gap-3">
                      <input
                        type="text"
                        value={obs.title}
                        onChange={(e) => {
                          setObservations((prev) =>
                            prev.map((x) => (x.id === obs.id ? { ...x, title: e.target.value } : x)),
                          )
                        }}
                        className="flex-1 min-w-0 text-sm font-semibold bg-transparent border-none p-0 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setObservations((prev) => prev.filter((x) => x.id !== obs.id))}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Row 2: full-width textarea */}
                    <Textarea
                      value={obs.impact}
                      onChange={(e) => {
                        setObservations((prev) =>
                          prev.map((x) => (x.id === obs.id ? { ...x, impact: e.target.value } : x)),
                        )
                      }}
                      rows={3}
                      className="w-full text-xs resize-y min-h-[72px]"
                      placeholder="Impact statement..."
                    />

                    {/* Sources */}
                    <SourcePills ids={obs.evidence} allInsights={allInsights} onClickId={openInsightInDrawer} />

                    {/* Leads to */}
                    {obs.leadsTo.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-[10px] text-muted-foreground">Leads to:</span>
                        {obs.leadsTo.map((lid) => {
                          const init = initiatives.find((i) => i.id === lid)
                          return init ? (
                            <Badge key={lid} variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                              {init.title}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </StorySection>

      {/* ─── 3. Opportunities ───────────────────────────────── */}
      <StorySection
        number={3}
        title="Opportunities"
        subtitle="Value creation and risk reduction levers"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border bg-muted p-0.5">
              {(["impact", "feasibility", "strategic"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setOpportunitySort(s)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] font-medium transition-colors capitalize",
                    opportunitySort === s
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          {sortedInitiatives.map((init) => (
            <OpportunityCard
              key={init.id}
              initiative={init}
              allInsights={allInsights}
              onClickInsight={openInsightInDrawer}
            />
          ))}
          {sortedInitiatives.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No initiatives found for this category. Create opportunities in the Opportunity Backlog module.
            </p>
          )}
        </div>
      </StorySection>

      {/* ─── 4. Roadmap ─────────────────────────────────────── */}
      <StorySection
        number={4}
        title="How we'll deliver: roadmap"
        subtitle="Phased execution plan"
        actions={
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={generateRoadmap} disabled={loadingRoadmap}>
            {loadingRoadmap ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            {loadingRoadmap ? "Generating..." : "Generate roadmap narrative"}
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Phase cards */}
          <div className="grid gap-3 md:grid-cols-3">
            {([
              { key: "stabilize", label: "Phase 1: Stabilize", sub: "0-3 months", items: roadmapPhases.stabilize },
              { key: "optimize", label: "Phase 2: Optimize", sub: "3-9 months", items: roadmapPhases.optimize },
              { key: "transform", label: "Phase 3: Transform", sub: "9-18 months", items: roadmapPhases.transform },
            ] as const).map((phase) => (
              <div key={phase.key} className="rounded-lg border p-3 space-y-2">
                <div>
                  <p className="text-xs font-semibold">{phase.label}</p>
                  <p className="text-[10px] text-muted-foreground">{phase.sub}</p>
                </div>
                {phase.items.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground italic">No items in this phase</p>
                ) : (
                  phase.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs py-1">
                      <span className="truncate flex-1">{item.title}</span>
                      <Badge variant="outline" className="text-[9px] ml-2 shrink-0">
                        {item.progress}%
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
          {/* Roadmap narrative text */}
          <Textarea
            value={sectionText.roadmap ?? ""}
            onChange={(e) => updateSectionText("roadmap", e.target.value)}
            rows={4}
            className="text-sm"
            placeholder="Write or generate the roadmap narrative..."
          />
        </div>
      </StorySection>

      {/* ─── 5. Compiled Narrative ──────────────────────────── */}
      <Card className="border-primary/20 rounded-2xl shadow-sm">
        <CardHeader
          className="cursor-pointer py-4 px-5"
          onClick={() => setCompiledOpen((v) => !v)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <CardTitle className="text-sm font-semibold">Compiled Narrative</CardTitle>
                <CardDescription className="text-xs">
                  Auto-assembled from all sections above. Fully editable.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-md border bg-muted p-0.5" onClick={(e) => e.stopPropagation()}>
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTone(t)}
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
                      selectedTone === t
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {compiledOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
        {compiledOpen && (
          <CardContent className="pt-0 px-5 pb-5">
            <Textarea
              value={compiledNarrative}
              rows={16}
              className="text-sm font-mono"
              readOnly={false}
            />
            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(compiledNarrative)}
              >
                Copy to clipboard
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ─── Evidence Drawer (Sheet) ─────────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px] p-0 flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-3 border-b shrink-0">
            <SheetTitle className="text-sm">
              {drawerSelectedInsight ? "Insight Detail" : "Evidence Library"}
            </SheetTitle>
          </SheetHeader>

          {drawerSelectedInsight ? (
            /* Detail view */
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs -ml-2"
                onClick={() => setDrawerInsightId(null)}
              >
                {"<- Back to list"}
              </Button>
              <div className="space-y-3">
                <Badge
                  variant="outline"
                  className={cn("text-[10px]", SOURCE_STYLES[drawerSelectedInsight.source])}
                >
                  {SOURCE_LABELS[drawerSelectedInsight.source]}
                </Badge>
                <h3 className="text-base font-semibold">{drawerSelectedInsight.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{drawerSelectedInsight.text}</p>
                {drawerSelectedInsight.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {drawerSelectedInsight.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* List view */
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Filters */}
              <div className="px-5 py-3 border-b space-y-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    placeholder="Search insights..."
                    className="w-full rounded-md border border-input bg-card pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setDrawerFilter(null)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                      !drawerFilter
                        ? "bg-primary text-primary-foreground border-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    All
                  </button>
                  {(Object.keys(SOURCE_LABELS) as InsightSource[]).map((src) => (
                    <button
                      key={src}
                      onClick={() => setDrawerFilter(src)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                        drawerFilter === src
                          ? SOURCE_STYLES[src]
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {SOURCE_LABELS[src]}
                    </button>
                  ))}
                </div>
              </div>
              {/* Results */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {drawerInsights.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No insights match your filters.</p>
                )}
                {drawerInsights.map((ins) => (
                  <button
                    key={ins.id}
                    type="button"
                    onClick={() => setDrawerInsightId(ins.id)}
                    className="w-full text-left rounded-md border p-3 hover:bg-muted/50 transition-colors space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[9px] shrink-0", SOURCE_STYLES[ins.source])}>
                        {SOURCE_LABELS[ins.source]}
                      </Badge>
                      <span className="text-xs font-medium truncate">{ins.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{ins.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ─── Opportunity Card ───────────────────────────────────────────────────────

function OpportunityCard({
  initiative,
  allInsights,
  onClickInsight,
}: {
  initiative: Initiative
  allInsights: UnifiedInsight[]
  onClickInsight: (id: string) => void
}) {
  const isRiskReduction = initiative.risks.length > 0
  const savingsM = (initiative.targetSavings / 1e6).toFixed(1)

  const LEVER_MAP: Record<string, string> = {
    consolidat: "Consolidate",
    rebid: "Rebid",
    renegotiat: "Renegotiate",
    standard: "Standardize",
    governance: "Demand governance",
    ev: "EV transition",
    fuel: "Fuel optimization",
    insourc: "Insource",
    compliance: "Compliance",
    coach: "Driver coaching",
  }

  const levers = Object.entries(LEVER_MAP)
    .filter(([key]) => initiative.title.toLowerCase().includes(key) || initiative.description.toLowerCase().includes(key))
    .map(([, label]) => label)

  if (levers.length === 0) levers.push("Strategic sourcing")

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold truncate">{initiative.title}</h4>
            <Badge variant="outline" className={cn(
              "text-[10px] shrink-0",
              isRiskReduction ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200",
            )}>
              {isRiskReduction ? "Value + Risk" : "Value"}
            </Badge>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {initiative.stage}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{initiative.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold">${savingsM}M</p>
          <p className="text-[10px] text-muted-foreground">{initiative.confidence}% conf.</p>
        </div>
      </div>

      {/* Levers */}
      <div className="flex flex-wrap gap-1">
        {levers.map((l) => (
          <Badge key={l} variant="secondary" className="text-[10px]">{l}</Badge>
        ))}
      </div>

      {/* Linked risks */}
      <SourcePills ids={initiative.risks} allInsights={allInsights} onClickId={onClickInsight} />
    </div>
  )
}
