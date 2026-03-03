"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Swords, Handshake, Eye, BarChart3, Cog, Landmark,
  Sparkles, AlertTriangle, ChevronRight,
  CheckCircle2, Circle, Clock, Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type NegotiationWorkspace,
  type LeverCategory,
  type Lever,
  LEVER_LABELS,
  LEVER_DESCRIPTIONS,
  getLeverAdviceForQuadrant,
} from "@/lib/negotiations-data"
import { LeverDetailWorkspace } from "./lever-detail-workspace"

interface LeversSectionProps {
  workspace: NegotiationWorkspace
  onUpdate: (ws: NegotiationWorkspace) => void
}

const LEVER_ICONS: Record<LeverCategory, React.ElementType> = {
  competition: Swords,
  commitment: Handshake,
  transparency: Eye,
  performance: BarChart3,
  engineering: Cog,
  "working-capital": Landmark,
}

const LEVER_COLORS: Record<LeverCategory, { bg: string; text: string; border: string }> = {
  competition: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  commitment: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  transparency: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  performance: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  engineering: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  "working-capital": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
}

const STATUS_CONFIG: Record<Lever["status"], { label: string; icon: React.ElementType; className: string }> = {
  "not-started": { label: "Not Started", icon: Circle, className: "bg-muted text-muted-foreground" },
  "in-progress": { label: "In Progress", icon: Clock, className: "bg-blue-50 text-blue-700" },
  complete: { label: "Complete", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700" },
}

export function LeversSection({ workspace, onUpdate }: LeversSectionProps) {
  const [activeLeverId, setActiveLeverId] = useState<string | null>(null)
  const levers = workspace.levers

  const quadrant = workspace.spectrumPlacements[0]?.quadrant
  const advice = quadrant ? getLeverAdviceForQuadrant(quadrant) : null

  const allCategories = useMemo(() => {
    const cats: LeverCategory[] = ["competition", "commitment", "transparency", "performance", "engineering", "working-capital"]
    return cats.filter((c) => levers.some((l) => l.category === c))
  }, [levers])

  const activeLever = activeLeverId ? levers.find((l) => l.id === activeLeverId) : null

  // Summary counts
  const selectedCount = levers.filter((l) => l.status !== "not-started" || l.recommendation?.recommended).length

  if (activeLever) {
    return (
      <LeverDetailWorkspace
        lever={activeLever}
        workspace={workspace}
        onBack={() => setActiveLeverId(null)}
        onUpdate={onUpdate}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Levers</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose and run levers to build evidence and negotiation asks.
          </p>
        </div>
        {selectedCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {selectedCount} lever{selectedCount !== 1 ? "s" : ""} selected
          </span>
        )}
      </div>

      {/* AI Recommendation Banner */}
      {advice && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Recommended for {workspace.spectrumPlacements[0]?.supplierName} ({workspace.spectrumPlacements[0]?.quadrant?.replace(/-/g, " ")})
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {advice.recommended.map((cat) => {
                    const Icon = LEVER_ICONS[cat]
                    const colors = LEVER_COLORS[cat]
                    return (
                      <TooltipProvider key={cat}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className={cn("text-[10px] gap-1", colors.bg, colors.text, colors.border)}>
                              <Icon className="h-3 w-3" />
                              {LEVER_LABELS[cat]}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[240px]">
                            <p className="text-xs">{advice.reasoning[cat]}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                  {advice.discouraged.length > 0 && (
                    <>
                      {advice.discouraged.map((cat) => {
                        const Icon = LEVER_ICONS[cat]
                        return (
                          <TooltipProvider key={cat}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-[10px] gap-1 bg-muted text-muted-foreground line-through opacity-60">
                                  <Icon className="h-3 w-3" />
                                  {LEVER_LABELS[cat]}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[240px]">
                                <p className="text-xs"><AlertTriangle className="h-3 w-3 inline mr-1 text-amber-500" />{advice.reasoning[cat]}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {levers.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Wrench className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No levers configured</p>
              <p className="text-xs text-muted-foreground mt-1">Complete Spectrum classification to get AI-powered lever recommendations.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lever Cards by Category */}
      {allCategories.map((cat) => {
        const Icon = LEVER_ICONS[cat]
        const colors = LEVER_COLORS[cat]
        const catLevers = levers.filter((l) => l.category === cat)
        const isRecommended = advice?.recommended.includes(cat)
        const isDiscouraged = advice?.discouraged.includes(cat)

        return (
          <div key={cat} className="space-y-2">
            {/* Category header */}
            <div className="flex items-center gap-2">
              <div className={cn("h-5 w-5 rounded flex items-center justify-center", colors.bg)}>
                <Icon className={cn("h-3 w-3", colors.text)} />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {LEVER_LABELS[cat]}
              </h3>
              {isRecommended && (
                <Badge variant="outline" className="text-[9px] gap-0.5 bg-primary/5 text-primary border-primary/20 ml-auto">
                  <Sparkles className="h-2.5 w-2.5" />Recommended
                </Badge>
              )}
              {isDiscouraged && (
                <Badge variant="outline" className="text-[9px] gap-0.5 bg-amber-50 text-amber-600 border-amber-200 ml-auto">
                  <AlertTriangle className="h-2.5 w-2.5" />Caution
                </Badge>
              )}
            </div>

            {/* Lever list */}
            <div className="space-y-2">
              {catLevers.map((lever) => {
                const st = STATUS_CONFIG[lever.status]
                const StIcon = st.icon

                return (
                  <Card
                    key={lever.id}
                    className={cn(
                      "group transition-all hover:shadow-sm cursor-pointer",
                      lever.status === "in-progress" && "border-blue-200",
                      lever.status === "complete" && "border-emerald-200",
                    )}
                    onClick={() => setActiveLeverId(lever.id)}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {/* Status icon */}
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", st.className.split(" ")[0])}>
                          <StIcon className={cn("h-4 w-4", st.className.split(" ")[1])} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">{lever.name}</span>
                            <Badge variant="outline" className={cn("text-[9px] shrink-0", st.className)}>
                              {st.label}
                            </Badge>
                            {lever.recommendation?.recommended && (
                              <Badge variant="outline" className="text-[9px] gap-0.5 bg-primary/5 text-primary border-primary/20 shrink-0">
                                <Sparkles className="h-2.5 w-2.5" />Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {lever.description}
                          </p>
                        </div>

                        {/* Open CTA */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-xs gap-1 text-muted-foreground group-hover:text-primary"
                        >
                          Open <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
