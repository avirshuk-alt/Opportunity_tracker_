"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  MapPin, ArrowRight, ShieldCheck, Zap, Target,
  ArrowLeftRight, AlertTriangle, ChevronRight, ChevronDown,
  Crosshair, MessageSquareText, BookOpen, Users,
  CircleDot, Sparkles, FileText, Eye, EyeOff,
  ListChecks, HelpCircle, RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type NegotiationWorkspace,
  type NegotiationPlan,
  type RoundPlan,
  type PlanArgument,
  type GiveGetItem,
  type RoundPurpose,
  generateNegotiationPlan,
  ROUND_PURPOSE_CONFIG,
  LEVER_LABELS,
  QUADRANT_LABELS,
  getSuppliersByIds,
} from "@/lib/negotiations-data"

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface NegotiationPlanSectionProps {
  workspace: NegotiationWorkspace
  onUpdate: (ws: NegotiationWorkspace) => void
}

/* ─── Sub-component: Round Timeline Step ─────────────────────────────── */

function RoundTimelineNode({
  round,
  isActive,
  isLast,
  onClick,
}: {
  round: RoundPlan
  isActive: boolean
  isLast: boolean
  onClick: () => void
}) {
  const cfg = ROUND_PURPOSE_CONFIG[round.purpose]
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 group text-left w-full",
        !isLast && "pb-3"
      )}
    >
      {/* Node + connector */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
            isActive
              ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : round.status === "completed"
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-border bg-background text-muted-foreground group-hover:border-primary/40"
          )}
        >
          R{round.roundNumber}
        </div>
        {!isLast && (
          <div
            className={cn(
              "w-px flex-1 min-h-[32px]",
              round.status === "completed" ? "bg-emerald-300" : "bg-border"
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-1.5">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={cn(
              "text-sm font-medium truncate transition-colors",
              isActive ? "text-primary" : "text-foreground group-hover:text-primary"
            )}
          >
            {round.name}
          </span>
          <Badge
            variant="outline"
            className={cn("text-[9px] shrink-0", cfg.bg, cfg.color)}
          >
            {cfg.label}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {cfg.description}. {round.arguments.length} argument(s), {round.leverIds.length} lever(s).
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Crosshair className="h-2.5 w-2.5" />
            Confidence: {round.confidence}%
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px]",
              round.status === "completed"
                ? "bg-emerald-50 text-emerald-700"
                : round.status === "active"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
            )}
          >
            {round.status}
          </Badge>
        </div>
      </div>
      <ChevronRight
        className={cn(
          "h-4 w-4 mt-2 shrink-0 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"
        )}
      />
    </button>
  )
}

/* ─── Sub-component: Give/Get Matrix ────────────────────────────────── */

function GiveGetMatrix({
  items,
  rounds,
}: {
  items: GiveGetItem[]
  rounds: RoundPlan[]
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">
            No give/get items defined yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getRoundLabel = (roundId: string) => {
    const r = rounds.find((rd) => rd.id === roundId)
    return r ? `R${r.roundNumber}` : "TBD"
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Give / Get Matrix</CardTitle>
        </div>
        <p className="text-[11px] text-muted-foreground">
          What we concede vs. what we require -- mapped to each round.
        </p>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] w-12 text-center">Round</TableHead>
                <TableHead className="text-[10px] w-[30%]">We Give</TableHead>
                <TableHead className="text-[10px] w-[30%]">We Get</TableHead>
                <TableHead className="text-[10px]">Condition</TableHead>
                <TableHead className="text-[10px] text-right">Value Est.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[9px]">
                      {getRoundLabel(item.roundId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium">{item.give}</p>
                        {item.notes && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <p className="text-xs font-medium">{item.get}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-[11px] text-muted-foreground">{item.condition}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs font-semibold text-emerald-700">
                      {item.valueEstimate}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Sub-component: Argument Panel ─────────────────────────────────── */

function ArgumentPanel({ arg }: { arg: PlanArgument }) {
  const [expanded, setExpanded] = useState(false)
  const priorityCfg = {
    critical: { label: "Critical", color: "bg-red-50 text-red-700 border-red-200", accent: "border-l-red-400", icon: ShieldCheck },
    supporting: { label: "Supporting", color: "bg-amber-50 text-amber-700 border-amber-200", accent: "border-l-amber-500", icon: Zap },
    fallback: { label: "Fallback", color: "bg-muted text-muted-foreground", accent: "border-l-border", icon: Target },
  }
  const cfg = priorityCfg[arg.priority]

  return (
    <div className={cn("rounded-lg border border-l-[3px] transition-colors", cfg.accent)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <cfg.icon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            arg.priority === "critical"
              ? "text-red-500"
              : arg.priority === "supporting"
                ? "text-amber-500"
                : "text-muted-foreground"
          )}
        />
        <span className="text-xs font-medium flex-1 truncate">{arg.claim.slice(0, 80)}...</span>
        <Badge variant="outline" className={cn("text-[9px] shrink-0", cfg.color)}>
          {cfg.label}
        </Badge>
        {arg.useInScript && (
          <Badge variant="outline" className="text-[9px] bg-primary/5 text-primary">
            In script
          </Badge>
        )}
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-border/50 pt-2.5">
          {/* Claim */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
              Claim
            </p>
            <p className="text-xs leading-relaxed">{arg.claim}</p>
          </div>

          {/* Evidence */}
          {arg.evidenceRefs.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                Supporting Evidence
              </p>
              <div className="flex flex-wrap gap-1.5">
                {arg.evidenceRefs.map((ev, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-[10px]"
                  >
                    <BookOpen className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="font-medium">{ev.metricName}</span>
                    {ev.value && (
                      <span className="text-muted-foreground">({ev.value})</span>
                    )}
                    <span className="text-muted-foreground/60">{ev.confidence}% conf.</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ask */}
          <div className="rounded-md bg-primary/5 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-0.5">
              Ask
            </p>
            <p className="text-xs font-medium">{arg.ask}</p>
          </div>

          {/* Rebuttal & Response */}
          <div className="rounded-md bg-muted px-3 py-2">
            <div className="flex items-center gap-1 mb-0.5">
              <RotateCcw className="h-2.5 w-2.5 text-muted-foreground" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Anticipated Rebuttal
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {arg.anticipatedRebuttal}
            </p>
            <Separator className="my-1.5" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-0.5">
              Our Response
            </p>
            <p className="text-xs leading-relaxed">{arg.suggestedResponse}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Sub-component: Round Detail View ──────────────────────────────── */

function RoundDetail({
  round,
  plan,
  workspace,
}: {
  round: RoundPlan
  plan: NegotiationPlan
  workspace: NegotiationWorkspace
}) {
  const cfg = ROUND_PURPOSE_CONFIG[round.purpose]
  const levers = workspace.levers.filter((l) => round.leverIds.includes(l.id))
  const giveGetsForRound = plan.giveGets.filter((g) => g.roundId === round.id)

  return (
    <div className="space-y-4">
      {/* Round header */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-2",
            round.status === "completed"
              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : "border-primary bg-primary text-primary-foreground"
          )}
        >
          R{round.roundNumber}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{round.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className={cn("text-[9px]", cfg.bg, cfg.color)}>
              {cfg.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              Confidence: {round.confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* Close criteria */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="py-3 px-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
            Close Criteria
          </p>
          <p className="text-xs leading-relaxed">{round.closeCriteria}</p>
        </CardContent>
      </Card>

      {/* Starting Positions */}
      {round.startingPositions.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <CardTitle className="text-xs">Starting Positions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">Dimension</TableHead>
                    <TableHead className="text-[10px] text-center">Anchor (Open)</TableHead>
                    <TableHead className="text-[10px] text-center">Target</TableHead>
                    <TableHead className="text-[10px] text-center">Walk-away</TableHead>
                    <TableHead className="text-[10px]">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {round.startingPositions.map((pos, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium">{pos.dimension}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs font-semibold text-emerald-700">{pos.anchor}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs font-semibold text-amber-700">{pos.target}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs font-semibold text-red-600">{pos.laa}</span>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground max-w-[180px] truncate">
                        {pos.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Levers for this round */}
      {levers.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Levers to deploy
          </p>
          <div className="flex flex-wrap gap-2">
            {levers.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                <div
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    l.status === "complete"
                      ? "bg-emerald-400"
                      : l.status === "in-progress"
                        ? "bg-amber-400"
                        : "bg-muted-foreground/30"
                  )}
                />
                <div>
                  <p className="text-xs font-medium">{l.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {LEVER_LABELS[l.category]} &middot; {l.impact} impact
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arguments */}
      {round.arguments.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Arguments ({round.arguments.length})
          </p>
          <div className="space-y-2">
            {round.arguments.map((arg) => (
              <ArgumentPanel key={arg.id} arg={arg} />
            ))}
          </div>
        </div>
      )}

      {/* Supplier Moves */}
      {round.supplierMoves.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-amber-600" />
              <CardTitle className="text-xs">Anticipated Supplier Moves</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-3 space-y-2">
            {round.supplierMoves.map((mv) => (
              <div key={mv.id} className="rounded-md border px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px]",
                      mv.probability === "high"
                        ? "bg-red-50 text-red-700"
                        : mv.probability === "medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {mv.probability} probability
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed mb-1.5">
                  <span className="font-medium">Likely move:</span>{" "}
                  <span className="text-muted-foreground">{mv.likelyMove}</span>
                </p>
                <div className="rounded-md bg-primary/5 px-2.5 py-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-0.5">
                    Our response
                  </p>
                  <p className="text-xs leading-relaxed">{mv.ourResponse}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Give/Gets for this round */}
      {giveGetsForRound.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
              <CardTitle className="text-xs">Trade-offs for this Round</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-3 space-y-2">
            {giveGetsForRound.map((gg) => (
              <div
                key={gg.id}
                className="flex items-start gap-3 rounded-md border px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                      Give
                    </span>
                  </div>
                  <p className="text-xs">{gg.give}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mt-3 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                      Get
                    </span>
                  </div>
                  <p className="text-xs">{gg.get}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 shrink-0 mt-3">
                  {gg.valueEstimate}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Prerequisites */}
      {round.prerequisites.length > 0 && (
        <div className="rounded-md bg-muted/50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Prerequisites
          </p>
          <div className="flex flex-wrap gap-1.5">
            {round.prerequisites.map((p, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">
                {p}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Sub-component: Risks & Gaps ───────────────────────────────────── */

function RisksAndGaps({ plan }: { plan: NegotiationPlan }) {
  return (
    <div className="space-y-4">
      {/* Risks */}
      {plan.risks.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <CardTitle className="text-xs">Key Risks</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-3 space-y-2">
            {plan.risks.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "rounded-md border-l-[3px] border px-3 py-2.5",
                  r.severity === "high"
                    ? "border-l-red-400"
                    : r.severity === "medium"
                      ? "border-l-amber-400"
                      : "border-l-border"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px]",
                      r.severity === "high"
                        ? "bg-red-50 text-red-700"
                        : r.severity === "medium"
                          ? "bg-amber-50 text-amber-700"
                          : "text-muted-foreground"
                    )}
                  >
                    {r.severity}
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed mb-1">{r.description}</p>
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">Mitigation:</span>{" "}
                  {r.mitigation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Open Questions */}
      {plan.openQuestions.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
              <CardTitle className="text-xs">Open Questions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <ul className="space-y-1.5">
              {plan.openQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <CircleDot className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground leading-relaxed">{q}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Data Gaps */}
      {plan.dataGaps.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
              <CardTitle className="text-xs">Data Gaps</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <ul className="space-y-1.5">
              {plan.dataGaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground mt-0.5 shrink-0">&bull;</span>
                  <span className="text-muted-foreground leading-relaxed">{g}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Assumptions */}
      {plan.assumptions.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
              <CardTitle className="text-xs">Assumptions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <ul className="space-y-1.5">
              {plan.assumptions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground mt-0.5 shrink-0">&bull;</span>
                  <span className="text-muted-foreground leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ─── Sub-component: Supplier Plan Tab ──────────────────────────────── */

function SupplierPlanView({
  plan,
  workspace,
}: {
  plan: NegotiationPlan
  workspace: NegotiationWorkspace
}) {
  const [selectedRoundIdx, setSelectedRoundIdx] = useState(0)
  const [activeTab, setActiveTab] = useState<"round" | "give-get" | "risks">("round")
  const selectedRound = plan.rounds[selectedRoundIdx]

  const totalGiveGets = plan.giveGets.length
  const totalArguments = plan.rounds.reduce((acc, r) => acc + r.arguments.length, 0)

  return (
    <div className="space-y-4">
      {/* Plan header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-foreground">
              {plan.supplierName}
            </h3>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px]",
                plan.status === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : plan.status === "draft"
                    ? "bg-muted text-muted-foreground"
                    : plan.status === "locked"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-amber-50 text-amber-700"
              )}
            >
              {plan.status}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {plan.rationale.slice(0, 160)}...
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary">
          {plan.rounds.length} Rounds
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {totalArguments} Arguments
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {totalGiveGets} Give/Gets
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {plan.risks.length} Risks
        </Badge>
        {plan.dataGaps.length > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] bg-amber-50 text-amber-700"
          >
            {plan.dataGaps.length} data gap(s)
          </Badge>
        )}
      </div>

      {/* Layout: timeline left, detail right */}
      <div className="flex gap-5">
        {/* Timeline column */}
        <div className="w-64 shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Round Timeline
          </p>
          <div>
            {plan.rounds.map((rd, idx) => (
              <RoundTimelineNode
                key={rd.id}
                round={rd}
                isActive={idx === selectedRoundIdx && activeTab === "round"}
                isLast={idx === plan.rounds.length - 1}
                onClick={() => {
                  setSelectedRoundIdx(idx)
                  setActiveTab("round")
                }}
              />
            ))}
          </div>

          {/* Quick nav buttons */}
          <div className="mt-4 space-y-1">
            <button
              onClick={() => setActiveTab("give-get")}
              className={cn(
                "w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors text-left",
                activeTab === "give-get"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Give/Get Matrix
            </button>
            <button
              onClick={() => setActiveTab("risks")}
              className={cn(
                "w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors text-left",
                activeTab === "risks"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Risks & Gaps
            </button>
          </div>
        </div>

        {/* Detail column */}
        <div className="flex-1 min-w-0">
          {activeTab === "round" && selectedRound && (
            <RoundDetail round={selectedRound} plan={plan} workspace={workspace} />
          )}
          {activeTab === "give-get" && (
            <GiveGetMatrix items={plan.giveGets} rounds={plan.rounds} />
          )}
          {activeTab === "risks" && <RisksAndGaps plan={plan} />}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Section ──────────────────────────────────────────────────── */

export function NegotiationPlanSection({
  workspace,
  onUpdate,
}: NegotiationPlanSectionProps) {
  const planSet = useMemo(() => generateNegotiationPlan(workspace), [workspace])
  const plans = planSet.plans

  const hasPrerequisites =
    workspace.objectives.length > 0 &&
    workspace.arguments.length > 0 &&
    workspace.levers.length > 0

  if (!hasPrerequisites) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Negotiation Plan
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated round-by-round strategy with arguments, trade-offs, and risk
            mitigation
          </p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Not enough upstream data</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Complete Objectives, Levers, and Narrative sections first. The
                plan generator synthesizes all upstream data into a structured
                negotiation strategy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Negotiation Plan
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            No plans could be generated. Check spectrum placements.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Negotiation Plan
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Round-by-round strategy: opening positions, arguments, trade-offs,
            and anticipated supplier moves
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary gap-1">
            <Sparkles className="h-2.5 w-2.5" />
            AI-generated
          </Badge>
        </div>
      </div>

      {/* Plan summary cards */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Suppliers
            </p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {plans.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Total Rounds
            </p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {plans.reduce((acc, p) => acc + p.rounds.length, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Trade-offs
            </p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {plans.reduce((acc, p) => acc + p.giveGets.length, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Key Risks
            </p>
            <p className="text-lg font-bold text-amber-700 mt-0.5">
              {plans.reduce((acc, p) => acc + p.risks.filter((r) => r.severity === "high").length, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Multi-supplier tabs or single view */}
      {plans.length === 1 ? (
        <SupplierPlanView plan={plans[0]} workspace={workspace} />
      ) : (
        <Tabs defaultValue={plans[0].supplierId}>
          <TabsList>
            {plans.map((p) => (
              <TabsTrigger key={p.supplierId} value={p.supplierId} className="text-xs gap-1.5">
                <Users className="h-3 w-3" />
                {p.supplierName}
              </TabsTrigger>
            ))}
          </TabsList>
          {plans.map((p) => (
            <TabsContent key={p.supplierId} value={p.supplierId} className="mt-4">
              <SupplierPlanView plan={p} workspace={workspace} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
