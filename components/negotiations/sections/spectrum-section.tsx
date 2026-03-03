"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, Sparkles, AlertTriangle, CheckCircle2, ShieldAlert, Clock, User } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type NegotiationWorkspace,
  type SpectrumQuadrant,
  QUADRANT_LABELS,
  QUADRANT_DESCRIPTIONS,
  LEVER_LABELS,
} from "@/lib/negotiations-data"

interface SpectrumSectionProps {
  workspace: NegotiationWorkspace
}

const QUAD_COLORS: Record<SpectrumQuadrant, { cell: string; dot: string }> = {
  "transactional-competitive": { cell: "bg-blue-50/60 border-blue-200", dot: "bg-blue-500" },
  leverage: { cell: "bg-amber-50/60 border-amber-200", dot: "bg-amber-500" },
  "strategic-critical": { cell: "bg-primary/5 border-primary/30", dot: "bg-primary" },
  bottleneck: { cell: "bg-red-50/60 border-red-200", dot: "bg-red-500" },
}

const CONFIDENCE_TIERS = [
  { min: 80, label: "High", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { min: 50, label: "Medium", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { min: 0, label: "Low", color: "text-red-600 bg-red-50 border-red-200" },
]

function confidenceBadge(pct: number) {
  const tier = CONFIDENCE_TIERS.find((t) => pct >= t.min)!
  return (
    <Badge variant="outline" className={cn("text-[9px]", tier.color)}>
      {tier.label} ({pct}%)
    </Badge>
  )
}

export function SpectrumSection({ workspace }: SpectrumSectionProps) {
  const placements = workspace.spectrumPlacements

  if (placements.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Supplier Matrix</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Classify suppliers on the criticality vs. competitiveness matrix</p>
        </div>
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No suppliers classified yet</p>
            <p className="text-xs text-muted-foreground text-center max-w-sm">Complete the Fact Base to enable matrix analysis. A low-confidence placement will be generated once minimum data is available.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Section header */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">Supplier Matrix</h2>
          <p className="text-sm text-muted-foreground mt-0.5">2x2 matrix: Relationship Criticality vs. Supply Market Constraint</p>
        </div>

        {/* 2x2 Matrix -- centered, responsive, proper axis spacing */}
        <Card>
          <CardContent className="py-6 px-6">
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-2xl">
                {/* Y-axis label -- outside the grid, proper spacing */}
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center whitespace-nowrap">
                  <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Relationship Criticality
                  </span>
                </div>

                {/* Y-axis markers */}
                <div className="absolute -left-3 top-1 text-[9px] text-muted-foreground">High</div>
                <div className="absolute -left-3 bottom-1 text-[9px] text-muted-foreground">Low</div>

                {/* Matrix grid */}
                <div className="ml-6 grid grid-cols-2 grid-rows-2 gap-1.5 aspect-square">
                  {/* Top-left: Bottleneck */}
                  <QuadrantCell
                    label="Bottleneck"
                    quadrant="bottleneck"
                    placements={placements.filter((p) => p.quadrant === "bottleneck")}
                    position="top-left"
                  />
                  {/* Top-right: Strategic */}
                  <QuadrantCell
                    label="Strategic / Critical"
                    quadrant="strategic-critical"
                    placements={placements.filter((p) => p.quadrant === "strategic-critical")}
                    position="top-right"
                  />
                  {/* Bottom-left: Transactional */}
                  <QuadrantCell
                    label="Transactional"
                    quadrant="transactional-competitive"
                    placements={placements.filter((p) => p.quadrant === "transactional-competitive")}
                    position="bottom-left"
                  />
                  {/* Bottom-right: Leverage */}
                  <QuadrantCell
                    label="Leverage"
                    quadrant="leverage"
                    placements={placements.filter((p) => p.quadrant === "leverage")}
                    position="bottom-right"
                  />
                </div>

                {/* X-axis label */}
                <div className="ml-6 mt-3 flex justify-center">
                  <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Supply Market Constraint
                  </span>
                </div>
                {/* X-axis markers */}
                <div className="ml-6 flex justify-between mt-0.5 px-1">
                  <span className="text-[9px] text-muted-foreground">Low</span>
                  <span className="text-[9px] text-muted-foreground">High</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Reasoning + Placement cards */}
        {placements.map((p) => (
          <div key={p.supplierId} className="space-y-3">
            {/* Placement summary card */}
            <Card>
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">{p.supplierName}</CardTitle>
                  <div className="flex items-center gap-2">
                    {p.manualOverride && (
                      <Badge variant="outline" className="text-[9px] gap-0.5 bg-amber-50 text-amber-700 border-amber-200">
                        <User className="h-2.5 w-2.5" />Overridden
                      </Badge>
                    )}
                    <Badge variant="outline" className={cn("text-[10px]", QUAD_COLORS[p.quadrant].cell)}>
                      {QUADRANT_LABELS[p.quadrant]}
                    </Badge>
                    {confidenceBadge(p.confidence)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-4">
                {/* Scores */}
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Criticality: </span>
                    <span className="font-semibold">{p.relationshipCriticality}/100</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Constraint: </span>
                    <span className="font-semibold">{p.supplyMarketConstraint}/100</span>
                  </div>
                </div>

                {/* Override note */}
                {p.manualOverride && p.overrideReason && (
                  <div className="rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-medium">
                      <User className="h-3 w-3" />Manual Override
                      {p.overrideTimestamp && (
                        <span className="text-muted-foreground font-normal ml-auto flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{p.overrideTimestamp}</span>
                      )}
                    </div>
                    <p className="text-xs text-amber-800 mt-1">{p.overrideReason}</p>
                  </div>
                )}

                {/* AI Reasoning block */}
                <div className="rounded-lg border border-primary/20 bg-primary/[0.02] p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">AI Reasoning</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.aiReasoning}</p>

                  {/* Top Drivers with metrics */}
                  <div>
                    <p className="text-[10px] font-semibold text-foreground mb-1.5">Top Drivers</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {(p.topDriverMetrics ?? []).map((d) => (
                        <div key={d.driver} className="flex items-center justify-between text-[10px] py-0.5">
                          <span className="text-muted-foreground">{d.driver}</span>
                          <span className="font-medium text-foreground ml-2">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Missing data checklist */}
                  {(p.missingData ?? []).length > 0 ? (
                    <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 mb-1">
                        <AlertTriangle className="h-3 w-3" />Missing Data ({p.missingData.length})
                      </div>
                      <ul className="space-y-0.5">
                        {p.missingData.map((md) => (
                          <li key={md} className="text-[10px] text-amber-700 flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />{md}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />All key data available
                    </div>
                  )}
                </div>

                {/* Recommended Levers */}
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Recommended Levers</p>
                  <div className="flex flex-wrap gap-1">
                    {p.recommendedLevers.map((l) => (
                      <Badge key={l} className="text-[9px] bg-primary/10 text-primary hover:bg-primary/20">{LEVER_LABELS[l]}</Badge>
                    ))}
                  </div>
                </div>

                {/* Quadrant description */}
                <p className="text-xs text-muted-foreground leading-relaxed">{QUADRANT_DESCRIPTIONS[p.quadrant]}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </TooltipProvider>
  )
}

// ─── Quadrant Cell ──────────────────────────────────────────────────────

interface QuadrantCellProps {
  label: string
  quadrant: SpectrumQuadrant
  placements: NegotiationWorkspace["spectrumPlacements"]
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
}

function QuadrantCell({ label, quadrant, placements, position }: QuadrantCellProps) {
  const isTop = position.startsWith("top")
  const isLeft = position.endsWith("left")

  function computeXY(p: { relationshipCriticality: number; supplyMarketConstraint: number }) {
    const xRaw = isLeft ? p.supplyMarketConstraint / 50 : (p.supplyMarketConstraint - 50) / 50
    const yRaw = isTop ? (p.relationshipCriticality - 50) / 50 : p.relationshipCriticality / 50
    const x = 15 + Math.min(Math.max(xRaw, 0), 1) * 70
    const y = 15 + (1 - Math.min(Math.max(yRaw, 0), 1)) * 70
    return { x, y }
  }

  return (
    <div className={cn("rounded-lg border-2 border-dashed p-3 relative overflow-hidden", QUAD_COLORS[quadrant].cell)}>
      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
      {placements.map((p) => {
        const { x, y } = computeXY(p)
        return (
          <Tooltip key={p.supplierId}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "absolute h-6 w-6 rounded-full border-2 border-card shadow-md flex items-center justify-center text-[9px] font-bold text-card cursor-pointer transition-transform hover:scale-110",
                  QUAD_COLORS[quadrant].dot
                )}
                style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
              >
                {p.supplierName.charAt(0)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">{p.supplierName}</p>
              <p className="text-[10px] text-muted-foreground">Criticality {p.relationshipCriticality} / Constraint {p.supplyMarketConstraint}</p>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
