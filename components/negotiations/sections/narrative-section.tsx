"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  MessageSquareText, ShieldCheck, Zap, Target, RotateCcw,
  Link2, Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type NegotiationWorkspace,
  type ArgumentCard,
} from "@/lib/negotiations-data"

interface NarrativeSectionProps {
  workspace: NegotiationWorkspace
  onUpdate: (ws: NegotiationWorkspace) => void
}

const STRENGTH_MAP = {
  strong: { label: "Strong", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: ShieldCheck, accent: "border-l-emerald-500" },
  moderate: { label: "Moderate", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Zap, accent: "border-l-amber-500" },
  weak: { label: "Weak", color: "bg-red-50 text-red-700 border-red-200", icon: Target, accent: "border-l-red-400" },
}

export function NarrativeSection({ workspace }: NarrativeSectionProps) {
  const args = workspace.arguments

  if (args.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Narrative & Arguments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Build structured argument cards linked to your fact base</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-sm text-muted-foreground text-center">No arguments built yet. Complete Levers and Fact Base first to generate arguments.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const strongCount = args.filter((a) => a.strength === "strong").length
  const moderateCount = args.filter((a) => a.strength === "moderate").length

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Narrative & Arguments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Structured argument cards: Claim, Evidence, Ask, Rebuttal</p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 shrink-0">
          <Download className="h-3 w-3" />
          Export Strategy Pack
        </Button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">{strongCount} Strong</Badge>
        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700">{moderateCount} Moderate</Badge>
        <Badge variant="outline" className="text-[10px]">{args.length} Total Arguments</Badge>
      </div>

      {/* Argument cards */}
      <div className="space-y-3">
        {args.map((arg) => {
          const st = STRENGTH_MAP[arg.strength]
          return (
            <Card key={arg.id} className={cn("border-l-[3px]", st.accent)}>
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <st.icon className={cn("h-4 w-4", arg.strength === "strong" ? "text-emerald-600" : arg.strength === "moderate" ? "text-amber-600" : "text-red-500")} />
                    <CardTitle className="text-sm">{arg.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className={cn("text-[9px]", st.color)}>{st.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-3">
                {/* Claim */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Claim</p>
                  <p className="text-xs leading-relaxed">{arg.claim}</p>
                </div>

                <Separator />

                {/* Evidence */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Evidence</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{arg.evidence}</p>
                </div>

                <Separator />

                {/* Ask */}
                <div className="rounded-md bg-primary/5 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Ask</p>
                  <p className="text-xs font-medium leading-relaxed">{arg.ask}</p>
                </div>

                {/* Rebuttal */}
                <div className="rounded-md bg-muted px-3 py-2">
                  <div className="flex items-center gap-1 mb-1">
                    <RotateCcw className="h-2.5 w-2.5 text-muted-foreground" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rebuttal</p>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{arg.rebuttal}</p>
                </div>

                {/* Links */}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {arg.linkedFactIds.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Link2 className="h-2.5 w-2.5" />
                      {arg.linkedFactIds.length} fact(s) linked
                    </span>
                  )}
                  {arg.linkedLeverIds.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Link2 className="h-2.5 w-2.5" />
                      {arg.linkedLeverIds.length} lever(s) linked
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
