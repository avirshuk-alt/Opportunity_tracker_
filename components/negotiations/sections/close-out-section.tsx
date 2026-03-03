"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, TrendingUp, FileText, Lightbulb, ArrowRight } from "lucide-react"
import {
  type NegotiationWorkspace,
  formatCurrencyCompact,
} from "@/lib/negotiations-data"

interface CloseOutSectionProps {
  workspace: NegotiationWorkspace
  onUpdate: (ws: NegotiationWorkspace) => void
}

export function CloseOutSection({ workspace }: CloseOutSectionProps) {
  const closeOut = workspace.closeOut

  if (!closeOut) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Close-out</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Document final terms, savings, and lessons learned</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Not yet closed</p>
              <p className="text-xs text-muted-foreground mt-1">Complete the live negotiation rounds to close out this strategy.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Close-out</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Final terms, realized savings, and retrospective</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {closeOut.finalPrice != null && (
          <Card>
            <CardContent className="py-3 px-4 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Final Price</p>
              <p className="text-xl font-bold mt-1">${closeOut.finalPrice.toFixed(2)}</p>
            </CardContent>
          </Card>
        )}
        {closeOut.savingsRealized != null && (
          <Card>
            <CardContent className="py-3 px-4 text-center">
              <TrendingUp className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Savings Realized</p>
              <p className="text-xl font-bold mt-1 text-emerald-700">{formatCurrencyCompact(closeOut.savingsRealized)}</p>
            </CardContent>
          </Card>
        )}
        {closeOut.savingsPct != null && (
          <Card>
            <CardContent className="py-3 px-4 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Reduction</p>
              <p className="text-xl font-bold mt-1 text-emerald-700">{closeOut.savingsPct.toFixed(1)}%</p>
            </CardContent>
          </Card>
        )}
      </div>

      {closeOut.finalTerms && (
        <Card>
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Final Terms</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xs leading-relaxed text-muted-foreground">{closeOut.finalTerms}</p>
          </CardContent>
        </Card>
      )}

      {closeOut.lessonsLearned.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Lessons Learned</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-4 space-y-1.5">
            {closeOut.lessonsLearned.map((lesson, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 shrink-0">&bull;</span>
                <span className="leading-relaxed">{lesson}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {closeOut.nextSteps.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Next Steps</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-4 space-y-1.5">
            {closeOut.nextSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Badge variant="outline" className="text-[9px] shrink-0">{i + 1}</Badge>
                <span className="leading-relaxed text-muted-foreground">{step}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
