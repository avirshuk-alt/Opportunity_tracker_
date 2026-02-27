"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sparkles, RefreshCw, Bookmark, BookmarkCheck, ChevronDown, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChartContext, GeneratedInsight } from "@/app/api/internal-fact-insights/route"
import type { InternalFactInsight } from "@/lib/internal-insights"
import { createInternalInsight, isDuplicate, getInsightCount } from "@/lib/internal-insights"
import { toast } from "sonner"

// ─── Cache ────────────────────────────────────────────────────────
const insightsCache = new Map<string, GeneratedInsight[]>()

function cacheKey(ctx: ChartContext): string {
  return `${ctx.chartId}|${JSON.stringify(ctx.filters ?? {})}|${JSON.stringify(ctx.timeWindow ?? {})}`
}

// ─── Stable key for de-dup ────────────────────────────────────────
function insightKey(chartId: string, title: string, text: string, filterSig: string): string {
  const raw = `${chartId}|${title.trim().toLowerCase()}|${text.trim().toLowerCase()}|${filterSig}`
  let h = 0
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) - h + raw.charCodeAt(i)) | 0
  }
  return `ai-${Math.abs(h)}`
}

// ─── Props ────────────────────────────────────────────────────────
interface AIInsightsCardProps {
  chartContext: ChartContext
  /** Called when user chooses "Edit before saving..." to open the manual modal */
  onEditBeforeSave?: (prefill: {
    title: string
    text: string
    sourceContext: string
    suggestedTags: string[]
    relatedEntities?: InternalFactInsight["relatedEntities"]
  }) => void
  /** Called after any insight is saved so parent can update counters */
  onSaved?: () => void
  className?: string
}

// ─── Skeleton ─────────────────────────────────────────────────────
function InsightsSkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="h-2 w-2 rounded-full bg-muted-foreground/20 mt-1.5 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted-foreground/15 rounded w-3/4" />
            <div className="h-2.5 bg-muted-foreground/10 rounded w-full" />
            <div className="h-2.5 bg-muted-foreground/10 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Helper: build related entities ───────────────────────────────
function buildRelatedEntities(insight: GeneratedInsight): InternalFactInsight["relatedEntities"] {
  if (!insight.relatedEntities) return {}
  return {
    ...(insight.relatedEntities.supplier ? { supplierId: insight.relatedEntities.supplier } : {}),
    ...(insight.relatedEntities.sku ? { skuId: insight.relatedEntities.sku } : {}),
    ...(insight.relatedEntities.country ? { country: insight.relatedEntities.country } : {}),
    ...(insight.relatedEntities.subcategory ? { subcategory: insight.relatedEntities.subcategory } : {}),
    ...(insight.relatedEntities.bu ? { bu: insight.relatedEntities.bu } : {}),
  }
}

// ─── Single Insight Row ───────────────────────────────────────────
function InsightRow({
  insight,
  sourceContext,
  isSaved,
  onDirectSave,
  onEditSave,
  hasEditOption,
}: {
  insight: GeneratedInsight
  sourceContext: string
  isSaved: boolean
  onDirectSave: () => void
  onEditSave: () => void
  hasEditOption: boolean
}) {
  return (
    <div className="group flex gap-2.5">
      <div className="mt-1 shrink-0">
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            insight.confidence === "High" && "bg-emerald-500",
            insight.confidence === "Medium" && "bg-amber-500",
            insight.confidence === "Low" && "bg-red-400"
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-foreground leading-snug">{insight.title}</p>
          <div className="shrink-0 flex items-center">
            {isSaved ? (
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50">
                <BookmarkCheck className="h-3 w-3" />
                Saved
              </span>
            ) : hasEditOption ? (
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onDirectSave() }}
                  className="rounded-l px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-r-0 border-border transition-colors flex items-center gap-1"
                  aria-label="Save insight"
                >
                  <Bookmark className="h-3 w-3" />
                  Save
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-r px-0.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors" aria-label="More save options">
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    <DropdownMenuItem onClick={onDirectSave} className="text-xs gap-2">
                      <Bookmark className="h-3 w-3" />
                      Save immediately
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onEditSave} className="text-xs gap-2">
                      <Pencil className="h-3 w-3" />
                      Edit before saving...
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onDirectSave() }}
                className="shrink-0 rounded p-1 transition-colors text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted"
                aria-label="Save insight"
              >
                <Bookmark className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{insight.text}</p>
        <div className="flex items-center gap-1 mt-1">
          {insight.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal">
              {tag}
            </Badge>
          ))}
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-1.5 py-0 h-4 font-normal ml-1",
              insight.confidence === "High" && "bg-emerald-50 text-emerald-700 border-emerald-200",
              insight.confidence === "Medium" && "bg-amber-50 text-amber-700 border-amber-200",
              insight.confidence === "Low" && "bg-red-50 text-red-700 border-red-200"
            )}
          >
            {insight.confidence}
          </Badge>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────
export function AIInsightsCard({ chartContext, onEditBeforeSave, onSaved, className }: AIInsightsCardProps) {
  const [insights, setInsights] = useState<GeneratedInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const fetchedRef = useRef<string>("")

  const contextKey = useMemo(() => cacheKey(chartContext), [chartContext])
  const filterSig = useMemo(() => JSON.stringify(chartContext.filters ?? {}), [chartContext.filters])
  const sourceContext = `${chartContext.chartTitle}${chartContext.filters && Object.entries(chartContext.filters).filter(([, v]) => v && v !== "all").length > 0 ? ` (${Object.entries(chartContext.filters).filter(([, v]) => v && v !== "all").map(([k, v]) => `${k}: ${v}`).join(", ")})` : ""}`

  const fetchInsights = useCallback(
    async (force = false) => {
      if (!force && fetchedRef.current === contextKey) return
      fetchedRef.current = contextKey

      if (!force && insightsCache.has(contextKey)) {
        setInsights(insightsCache.get(contextKey)!)
        return
      }

      setLoading(true)
      setError(false)
      try {
        const res = await fetch("/api/internal-fact-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chartContext }),
        })
        if (!res.ok) throw new Error("fetch failed")
        const data = await res.json()
        const results: GeneratedInsight[] = data.insights ?? []
        insightsCache.set(contextKey, results)
        setInsights(results)
      } catch {
        setError(true)
        setInsights([])
      } finally {
        setLoading(false)
      }
    },
    [chartContext, contextKey]
  )

  useEffect(() => {
    const timer = setTimeout(() => fetchInsights(), 300)
    return () => clearTimeout(timer)
  }, [fetchInsights])

  // Check which insights are already persisted (e.g. from a previous save)
  useEffect(() => {
    if (insights.length === 0) return
    const alreadySaved = new Set<string>()
    insights.forEach((ins) => {
      const key = insightKey(chartContext.chartId, ins.title, ins.text, filterSig)
      if (isDuplicate(ins.title, ins.text, sourceContext)) {
        alreadySaved.add(key)
      }
    })
    if (alreadySaved.size > 0) {
      setSavedKeys((prev) => {
        const next = new Set(prev)
        alreadySaved.forEach((k) => next.add(k))
        return next
      })
    }
  }, [insights, chartContext.chartId, filterSig, sourceContext])

  const isInsightSaved = useCallback(
    (insight: GeneratedInsight) => {
      const key = insightKey(chartContext.chartId, insight.title, insight.text, filterSig)
      return savedKeys.has(key)
    },
    [savedKeys, chartContext.chartId, filterSig]
  )

  // ─── Direct (one-click) save ──────────────────────────────────
  const directSave = useCallback(
    (insight: GeneratedInsight) => {
      const key = insightKey(chartContext.chartId, insight.title, insight.text, filterSig)
      if (savedKeys.has(key) || isDuplicate(insight.title, insight.text, sourceContext)) {
        toast.info("Already saved to Internal Fact Base")
        setSavedKeys((prev) => new Set(prev).add(key))
        return
      }

      createInternalInsight({
        title: insight.title,
        text: insight.text,
        confidence: insight.confidence ?? "Medium",
        tags: insight.tags,
        sourceContext,
        relatedEntities: buildRelatedEntities(insight),
      })

      setSavedKeys((prev) => new Set(prev).add(key))
      toast.success("Saved to Internal Fact Base")
      onSaved?.()
    },
    [chartContext.chartId, filterSig, savedKeys, sourceContext, onSaved]
  )

  // ─── Edit before saving (opens modal) ─────────────────────────
  const editSave = useCallback(
    (insight: GeneratedInsight) => {
      onEditBeforeSave?.({
        title: insight.title,
        text: insight.text,
        sourceContext,
        suggestedTags: insight.tags,
        relatedEntities: buildRelatedEntities(insight),
      })
    },
    [onEditBeforeSave, sourceContext]
  )

  // ─── Save All (one-click) ─────────────────────────────────────
  const saveAll = useCallback(() => {
    let count = 0
    insights.forEach((insight) => {
      const key = insightKey(chartContext.chartId, insight.title, insight.text, filterSig)
      if (savedKeys.has(key) || isDuplicate(insight.title, insight.text, sourceContext)) {
        setSavedKeys((prev) => new Set(prev).add(key))
        return
      }
      createInternalInsight({
        title: insight.title,
        text: insight.text,
        confidence: insight.confidence ?? "Medium",
        tags: insight.tags,
        sourceContext,
        relatedEntities: buildRelatedEntities(insight),
      })
      setSavedKeys((prev) => new Set(prev).add(key))
      count++
    })
    if (count > 0) {
      toast.success(`Saved ${count} insight${count !== 1 ? "s" : ""} to Internal Fact Base`)
      onSaved?.()
    } else {
      toast.info("All insights already saved")
    }
  }, [insights, chartContext.chartId, filterSig, savedKeys, sourceContext, onSaved])

  const allSaved = insights.length > 0 && insights.every((ins) => isInsightSaved(ins))

  if (insights.length === 0 && !loading && !error) return null

  return (
    <Card className={cn("border-dashed border-primary/20 bg-primary/[0.02]", className)}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <CardTitle className="text-xs font-semibold">AI Generated Insights</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            {insights.length > 0 && (
              <Button
                variant={allSaved ? "secondary" : "ghost"}
                size="sm"
                className={cn("h-6 text-[10px] gap-1", allSaved ? "text-emerald-700" : "text-muted-foreground")}
                onClick={saveAll}
                disabled={allSaved}
              >
                {allSaved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                {allSaved ? "All Saved" : "Save All"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground"
              onClick={() => fetchInsights(true)}
              disabled={loading}
              aria-label="Refresh insights"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        {loading ? (
          <InsightsSkeleton />
        ) : error ? (
          <p className="text-xs text-muted-foreground py-2">Unable to generate insights. Click refresh to retry.</p>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <InsightRow
                key={`${insight.title}-${i}`}
                insight={insight}
                sourceContext={sourceContext}
                isSaved={isInsightSaved(insight)}
                onDirectSave={() => directSave(insight)}
                onEditSave={() => editSave(insight)}
                hasEditOption={!!onEditBeforeSave}
              />
            ))}
          </div>
        )}
        <Separator className="my-2" />
        <p className="text-[9px] text-muted-foreground">
          Based on: {chartContext.chartTitle}
          {chartContext.filters && Object.entries(chartContext.filters).filter(([, v]) => v && v !== "all").length > 0 && (
            <> + filters ({Object.entries(chartContext.filters).filter(([, v]) => v && v !== "all").map(([k, v]) => `${k}: ${v}`).join(", ")})</>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
