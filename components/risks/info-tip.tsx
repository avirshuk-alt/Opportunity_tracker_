"use client"

import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const DEFINITIONS: Record<string, string> = {
  "Risk Exposure":
    "Where risk is concentrated across procurement categories and suppliers, weighted by spend and IRR severity.",
  "Current Exposure":
    "Spend-weighted exposure based on each category's Inherent Risk Rating (IRR) relative to the organisation's appetite threshold.",
  IRR: "Inherent Risk Rating -- the pre-mitigation risk level assigned to a supplier or category across 8 standardised risk domains.",
  "Aggregated IRR":
    "The weighted combination of individual supplier IRRs rolled up to a procurement category level, reflecting the highest-severity contributors.",
  "Risk Domain":
    "One of 8 standardised assessment areas (e.g., Financial Stability, Operational Continuity) used to evaluate inherent supply risk.",
  "Estimated cost reduction":
    "Projected annual cost savings if the recommended mitigation action is fully implemented. This is a demo assumption based on percentage of supplier spend.",
}

interface InfoTipProps {
  term: string
  className?: string
}

export function InfoTip({ term, className }: InfoTipProps) {
  const text = DEFINITIONS[term]
  if (!text) return null

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors ${className ?? ""}`}
            aria-label={`Info about ${term}`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">
          <p>
            <span className="font-semibold">{term}:</span> {text}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
