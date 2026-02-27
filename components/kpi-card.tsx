"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RAG } from "@/lib/data"

interface KPICardProps {
  name: string
  value: string | number
  unit?: string
  target?: string | number
  rag: RAG
  trend: "up" | "down" | "flat"
  compact?: boolean
}

export function KPICard({ name, value, unit, target, rag, trend, compact }: KPICardProps) {
  const ragDot = {
    Green: "bg-emerald-500",
    Amber: "bg-amber-500",
    Red: "bg-red-500",
  }

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus

  return (
    <Card className={cn("relative overflow-hidden", compact && "shadow-none border-border/40")}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate pr-2">
            {name}
          </p>
          <div className={cn("h-2 w-2 rounded-full shrink-0 mt-1", ragDot[rag])} />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className={cn("font-bold tracking-tight text-foreground", compact ? "text-xl" : "text-2xl")}>
            {value}
          </span>
          {unit && (
            <span className="text-xs font-medium text-muted-foreground">{unit}</span>
          )}
        </div>
        {target !== undefined && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Target: {target}{unit ? ` ${unit}` : ""}</span>
            <TrendIcon className={cn(
              "h-3 w-3",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "flat" && "text-muted-foreground"
            )} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
