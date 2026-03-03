"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Radio, ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock,
  XCircle, AlertCircle, FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type NegotiationWorkspace,
  type NegotiationRound,
  type RoundOffer,
} from "@/lib/negotiations-data"

interface LiveNegotiationSectionProps {
  workspace: NegotiationWorkspace
  onUpdate: (ws: NegotiationWorkspace) => void
}

const OFFER_STATUS_MAP: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  draft: { icon: FileText, color: "text-muted-foreground", label: "Draft" },
  sent: { icon: ArrowUpRight, color: "text-blue-600", label: "Sent" },
  countered: { icon: ArrowDownLeft, color: "text-amber-600", label: "Countered" },
  accepted: { icon: CheckCircle2, color: "text-emerald-600", label: "Accepted" },
  rejected: { icon: XCircle, color: "text-red-600", label: "Rejected" },
  expired: { icon: Clock, color: "text-muted-foreground", label: "Expired" },
}

const APPROVAL_STATUS_MAP: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  approved: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  rejected: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  "not-required": { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted" },
}

export function LiveNegotiationSection({ workspace }: LiveNegotiationSectionProps) {
  const rounds = workspace.rounds

  if (rounds.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Live Negotiation</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Round-based offer tracking, decision log, and approval gates</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Radio className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No rounds started</p>
              <p className="text-xs text-muted-foreground mt-1">Complete Narrative to begin live negotiations.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderOffer = (offer: RoundOffer) => {
    const st = OFFER_STATUS_MAP[offer.status]
    const isOutgoing = offer.direction === "outgoing"
    return (
      <div
        key={offer.id}
        className={cn(
          "rounded-lg border px-4 py-3",
          isOutgoing ? "border-primary/20 bg-primary/[0.02] ml-0 mr-8" : "border-border ml-8 mr-0"
        )}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            {isOutgoing ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
            ) : (
              <ArrowDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-xs font-medium">{isOutgoing ? "Our Offer" : "Counter-Offer"}</span>
            <Badge variant="outline" className={cn("text-[9px]", st.color)}>{st.label}</Badge>
          </div>
          <span className="text-lg font-bold">${offer.price.toFixed(2)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{offer.terms}</p>
        <div className="flex items-center gap-4 mt-2">
          {offer.concessions.length > 0 && (
            <div className="text-[10px]">
              <span className="text-muted-foreground">Giving: </span>
              <span>{offer.concessions.join(", ")}</span>
            </div>
          )}
        </div>
        {offer.asks.length > 0 && (
          <div className="text-[10px] mt-1">
            <span className="text-muted-foreground">Asking: </span>
            <span className="font-medium">{offer.asks.join(", ")}</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
          <span>{offer.createdBy}</span>
          <span>&middot;</span>
          <span>{offer.createdAt}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Live Negotiation</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Round-by-round offer tracking with decision log and approvals</p>
      </div>

      {rounds.map((round) => (
        <Card key={round.id}>
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                  round.status === "active" ? "bg-primary text-primary-foreground" :
                  round.status === "complete" ? "bg-emerald-100 text-emerald-700" :
                  "bg-muted text-muted-foreground"
                )}>
                  {round.roundNumber}
                </div>
                <CardTitle className="text-sm">Round {round.roundNumber}</CardTitle>
                <Badge variant="outline" className={cn("text-[9px]",
                  round.status === "active" ? "bg-primary/10 text-primary" :
                  round.status === "complete" ? "bg-emerald-50 text-emerald-700" :
                  "bg-muted text-muted-foreground"
                )}>{round.status}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">{round.date}</span>
            </div>
          </CardHeader>
          <CardContent className="pb-4 space-y-3">
            {/* Offers timeline */}
            <div className="space-y-2">
              {round.offers.map(renderOffer)}
            </div>

            {/* Decision Log */}
            {round.decisionLog.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Decision Log</p>
                  <div className="space-y-1">
                    {round.decisionLog.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-muted-foreground shrink-0 mt-0.5">&bull;</span>
                        <span className="text-muted-foreground leading-relaxed">{entry}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {round.notes && (
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Notes</p>
                <p className="text-xs text-muted-foreground">{round.notes}</p>
              </div>
            )}

            {/* Approval gates */}
            {round.approvals.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Approval Gates</p>
                  <div className="flex flex-wrap gap-2">
                    {round.approvals.map((ap) => {
                      const ast = APPROVAL_STATUS_MAP[ap.status]
                      return (
                        <div key={ap.id} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2", ast.bg)}>
                          <ast.icon className={cn("h-3.5 w-3.5", ast.color)} />
                          <div>
                            <p className="text-xs font-medium capitalize">{ap.gate}</p>
                            <p className="text-[10px] text-muted-foreground">{ap.approver} &middot; {ap.status}</p>
                            {ap.comments && <p className="text-[10px] text-muted-foreground italic mt-0.5">{ap.comments}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
