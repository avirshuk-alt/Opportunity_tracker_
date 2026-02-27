"use client"

import { useState, useMemo } from "react"
import { useCategory } from "@/lib/category-context"
import {
  getInitiativesByCategory,
  getUserById,
  formatCurrency,
  stageColor,
} from "@/lib/data"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Download, RefreshCw } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts"

export default function ImpactPage() {
  const { selectedCategory } = useCategory()
  const initiatives = getInitiativesByCategory(selectedCategory.id)

  const [confidenceOverrides, setConfidenceOverrides] = useState<
    Record<string, number>
  >({})
  const [includedIds, setIncludedIds] = useState<Set<string>>(
    new Set(initiatives.map((i) => i.id))
  )

  const getConfidence = (id: string, defaultVal: number) =>
    confidenceOverrides[id] ?? defaultVal

  const toggleInit = (id: string) => {
    setIncludedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const activeInits = useMemo(
    () => initiatives.filter((i) => includedIds.has(i.id)),
    [initiatives, includedIds]
  )

  const bestCase = useMemo(
    () => activeInits.reduce((a, i) => a + i.targetSavings, 0),
    [activeInits]
  )

  const riskAdjusted = useMemo(
    () =>
      activeInits.reduce(
        (a, i) =>
          a + i.targetSavings * (getConfidence(i.id, i.confidence) / 100),
        0
      ),
    [activeInits, confidenceOverrides]
  )

  const worstCase = useMemo(
    () =>
      activeInits.reduce(
        (a, i) =>
          a +
          i.targetSavings *
            (Math.max(getConfidence(i.id, i.confidence) - 20, 10) / 100),
        0
      ),
    [activeInits, confidenceOverrides]
  )

  const waterfallData = useMemo(() => {
    const sorted = [...activeInits].sort(
      (a, b) => b.targetSavings - a.targetSavings
    )
    let cumulative = 0
    return sorted.map((i) => {
      const val =
        i.targetSavings * (getConfidence(i.id, i.confidence) / 100)
      const start = cumulative
      cumulative += val
      return {
        name:
          i.title.length > 20 ? `${i.title.substring(0, 18)}...` : i.title,
        value: val,
        start,
        cumulative,
      }
    })
  }, [activeInits, confidenceOverrides])

  const timingData = useMemo(() => {
    const months = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027"]
    return months.map((m, idx) => {
      const fraction = (idx + 1) / months.length
      return {
        month: m,
        best: bestCase * fraction,
        riskAdj: riskAdjusted * fraction,
        worst: worstCase * fraction,
      }
    })
  }, [bestCase, riskAdjusted, worstCase])

  const resetOverrides = () => {
    setConfidenceOverrides({})
    setIncludedIds(new Set(initiatives.map((i) => i.id)))
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "Impact Simulator" },
        ]}
        title="Impact & Scenario Simulator"
        description="Model scenarios, adjust confidence, and project benefit timing"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={resetOverrides}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
            <Button size="sm" variant="outline">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        }
      />

      {/* Scenario Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Best Case</p>
            <p className="text-xl font-bold mt-1 text-emerald-700">
              {formatCurrency(bestCase)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Risk-Adjusted</p>
            <p className="text-xl font-bold mt-1 text-primary">
              {formatCurrency(riskAdjusted)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Worst Case</p>
            <p className="text-xl font-bold mt-1 text-red-600">
              {formatCurrency(worstCase)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left - Initiative Controls */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-medium">Initiative Parameters</h3>
          {initiatives.map((init) => {
            const conf = getConfidence(init.id, init.confidence)
            const included = includedIds.has(init.id)
            return (
              <Card
                key={init.id}
                className={cn(!included && "opacity-50")}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={included}
                          onCheckedChange={() => toggleInit(init.id)}
                          className="scale-75"
                        />
                        <p className="text-sm font-medium truncate">
                          {init.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 ml-9">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", stageColor(init.stage))}
                        >
                          {init.stage}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(init.targetSavings)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {included && (
                    <div className="ml-9 space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">
                          Confidence
                        </Label>
                        <span className="text-xs font-mono font-medium">
                          {conf}%
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[conf]}
                        onValueChange={([val]) =>
                          setConfidenceOverrides((prev) => ({
                            ...prev,
                            [init.id]: val,
                          }))
                        }
                        className="h-1"
                      />
                      <p className="text-xs text-muted-foreground">
                        Risk-adjusted:{" "}
                        {formatCurrency(init.targetSavings * (conf / 100))}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Right - Charts */}
        <div className="lg:col-span-3 space-y-6">
          {/* Waterfall Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Value Waterfall (Risk-Adjusted)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={waterfallData} margin={{ top: 5, right: 5, bottom: 40, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      `$${(v / 1_000_000).toFixed(1)}M`
                    }
                  />
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="value" fill="hsl(215, 80%, 48%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Timing Curve */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Cumulative Benefit Timing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timingData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v) =>
                      `$${(v / 1_000_000).toFixed(1)}M`
                    }
                  />
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="best"
                    stroke="hsl(165, 60%, 40%)"
                    fill="hsl(165, 60%, 40%)"
                    fillOpacity={0.1}
                    name="Best Case"
                  />
                  <Area
                    type="monotone"
                    dataKey="riskAdj"
                    stroke="hsl(215, 80%, 48%)"
                    fill="hsl(215, 80%, 48%)"
                    fillOpacity={0.15}
                    name="Risk-Adjusted"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="worst"
                    stroke="hsl(0, 72%, 51%)"
                    fill="hsl(0, 72%, 51%)"
                    fillOpacity={0.1}
                    name="Worst Case"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
