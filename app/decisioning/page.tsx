"use client"

import { useState } from "react"
import { useCategory } from "@/lib/category-context"
import {
  getInitiativesByCategory,
  getSuppliersByCategory,
  getRisksByCategory,
  formatCurrency,
  stageColor,
} from "@/lib/data"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  Brain,
  Lightbulb,
  Scale,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

export default function DecisioningPage() {
  const { selectedCategory } = useCategory()
  const initiatives = getInitiativesByCategory(selectedCategory.id)
  const suppliers = getSuppliersByCategory(selectedCategory.id)
  const risks = getRisksByCategory(selectedCategory.id)

  const priorityData = initiatives.map((i) => ({
    x: i.effort === "High" ? 80 : i.effort === "Medium" ? 50 : 20,
    y: i.targetSavings,
    name: i.title,
    confidence: i.confidence,
    stage: i.stage,
  }))

  const recommendations = [
    {
      id: 1,
      type: "Opportunity",
      title: "Accelerate Software License Optimization",
      description:
        "Current license audit shows 22% shelfware. Moving this from Qualify to Source stage could yield $585K in savings with low effort.",
      impact: "High",
      confidence: 82,
      action: "Advance to Source",
    },
    {
      id: 2,
      type: "Risk",
      title: "Address License Compliance Gap",
      description:
        "Risk score (48) significantly exceeds appetite threshold (30). Recommend engaging specialized auditor immediately.",
      impact: "Critical",
      confidence: 90,
      action: "Create Mitigation Plan",
    },
    {
      id: 3,
      type: "Supplier",
      title: "Consolidate Tier 2 Suppliers",
      description:
        "3 Tier 2 suppliers with overlapping capabilities. Consolidation could reduce management overhead and improve pricing leverage.",
      impact: "Medium",
      confidence: 68,
      action: "Initiate Assessment",
    },
    {
      id: 4,
      type: "Contract",
      title: "Renegotiate Expiring Hardware Contract",
      description:
        "Precision Components contract expiring Feb 28. Market conditions favor 8-12% rate improvement. Include cloud migration scope.",
      impact: "High",
      confidence: 75,
      action: "Start Negotiation",
    },
    {
      id: 5,
      type: "Strategy",
      title: "Increase Cloud Migration Confidence",
      description:
        "Cloud Migration Phase 1 confidence at 72%. Recommend pilot with selected workloads to validate assumptions before full commitment.",
      impact: "Medium",
      confidence: 85,
      action: "Schedule Pilot",
    },
  ]

  const scenarioComparisons = [
    {
      name: "Baseline (Current Plan)",
      savings: 5_105_000,
      risk: "Medium",
      timeline: "36 months",
      suppliers: 20,
    },
    {
      name: "Aggressive Consolidation",
      savings: 6_800_000,
      risk: "High",
      timeline: "24 months",
      suppliers: 12,
    },
    {
      name: "Conservative / Low Risk",
      savings: 3_900_000,
      risk: "Low",
      timeline: "42 months",
      suppliers: 28,
    },
  ]

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "Advanced Decisioning" },
        ]}
        title="Advanced Decisioning Engine"
        description="AI-powered recommendations, scenario comparison, and priority matrix"
        actions={
          <Button size="sm">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Generate Insights
          </Button>
        }
      />

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="priority">Priority Matrix</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations">
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                      {rec.type === "Opportunity" && (
                        <Lightbulb className="h-5 w-5 text-primary" />
                      )}
                      {rec.type === "Risk" && (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      )}
                      {rec.type === "Supplier" && (
                        <Scale className="h-5 w-5 text-primary" />
                      )}
                      {rec.type === "Contract" && (
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      )}
                      {rec.type === "Strategy" && (
                        <Brain className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium">{rec.title}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          {rec.type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            rec.impact === "Critical" &&
                              "bg-red-50 text-red-700 border-red-200",
                            rec.impact === "High" &&
                              "bg-amber-50 text-amber-700 border-amber-200",
                            rec.impact === "Medium" &&
                              "bg-sky-50 text-sky-700 border-sky-200"
                          )}
                        >
                          {rec.impact} Impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {rec.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">
                            Confidence:
                          </span>
                          <Progress
                            value={rec.confidence}
                            className="w-16 h-1.5"
                          />
                          <span className="text-xs font-medium">
                            {rec.confidence}%
                          </span>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                          {rec.action}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="priority">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Effort vs Impact Priority Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[0, 100]}
                    name="Effort"
                    label={{
                      value: "Effort",
                      position: "bottom",
                      offset: 0,
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Target Savings"
                    tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
                    label={{
                      value: "Target Savings",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <RechartsTooltip
                    content={({ payload }) => {
                      if (!payload?.[0]) return null
                      const d = payload[0].payload
                      return (
                        <div className="rounded-md border bg-card p-2 shadow-md">
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Savings: {formatCurrency(d.y)} | Confidence:{" "}
                            {d.confidence}%
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Scatter data={priorityData}>
                    {priorityData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.confidence > 75
                            ? "hsl(165, 60%, 40%)"
                            : entry.confidence > 50
                              ? "hsl(35, 90%, 52%)"
                              : "hsl(0, 72%, 51%)"
                        }
                        r={8}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full bg-success" />
                  High confidence ({">"}75%)
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full bg-warning" />
                  Medium (50-75%)
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                  Low ({"<"}50%)
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios">
          <div className="grid gap-4 lg:grid-cols-3">
            {scenarioComparisons.map((scenario, idx) => (
              <Card
                key={scenario.name}
                className={cn(idx === 0 && "border-primary/30")}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {scenario.name}
                    </CardTitle>
                    {idx === 0 && (
                      <Badge className="bg-primary text-primary-foreground text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Savings
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(scenario.savings)}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Risk</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs mt-1",
                          scenario.risk === "Low" &&
                            "bg-emerald-50 text-emerald-700 border-emerald-200",
                          scenario.risk === "Medium" &&
                            "bg-amber-50 text-amber-700 border-amber-200",
                          scenario.risk === "High" &&
                            "bg-red-50 text-red-700 border-red-200"
                        )}
                      >
                        {scenario.risk}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Timeline</p>
                      <p className="text-sm font-medium mt-1">
                        {scenario.timeline}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Suppliers</p>
                      <p className="text-sm font-medium mt-1">
                        {scenario.suppliers}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={idx === 0 ? "default" : "outline"}
                    className="w-full"
                  >
                    {idx === 0 ? "Active Plan" : "Apply Scenario"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
