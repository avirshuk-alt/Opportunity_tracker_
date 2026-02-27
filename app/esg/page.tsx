"use client"

import { useCategory } from "@/lib/category-context"
import { getSuppliersByCategory, formatCurrency } from "@/lib/data"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Leaf, Users, ShieldCheck, TrendingUp } from "lucide-react"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts"

const esgScores = [
  { dimension: "Carbon Footprint", score: 72, target: 85 },
  { dimension: "Waste Reduction", score: 68, target: 80 },
  { dimension: "Water Usage", score: 81, target: 85 },
  { dimension: "Labor Practices", score: 88, target: 90 },
  { dimension: "Supply Chain Ethics", score: 75, target: 85 },
  { dimension: "Data Privacy", score: 90, target: 92 },
]

const radarData = esgScores.map((e) => ({
  subject: e.dimension,
  A: e.score,
  B: e.target,
}))

const diversityData = [
  { category: "Minority-owned", spend: 2_100_000, pct: 5.8 },
  { category: "Women-owned", spend: 3_200_000, pct: 8.9 },
  { category: "Veteran-owned", spend: 800_000, pct: 2.2 },
  { category: "Small Business", spend: 4_500_000, pct: 12.5 },
  { category: "Disability-owned", spend: 450_000, pct: 1.3 },
]

const carbonData = [
  { quarter: "Q1 2025", emissions: 1250, target: 1200 },
  { quarter: "Q2 2025", emissions: 1180, target: 1150 },
  { quarter: "Q3 2025", emissions: 1100, target: 1100 },
  { quarter: "Q4 2025", emissions: 1050, target: 1050 },
  { quarter: "Q1 2026", emissions: 980, target: 1000 },
]

export default function ESGPage() {
  const { selectedCategory } = useCategory()
  const suppliers = getSuppliersByCategory(selectedCategory.id)
  const diverseSuppliers = suppliers.filter((s) => s.diversityClassification)
  const avgESG =
    esgScores.reduce((a, e) => a + e.score, 0) / esgScores.length
  const totalDiverseSpend = diversityData.reduce((a, d) => a + d.spend, 0)

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "ESG & Diversity" },
        ]}
        title="ESG & Supplier Diversity"
        description="Environmental, social, and governance metrics with diversity spend tracking"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">ESG Score</p>
            <p className="text-xl font-bold mt-1">{avgESG.toFixed(0)}/100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Diverse Suppliers</p>
            <p className="text-xl font-bold mt-1">{diverseSuppliers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Diversity Spend</p>
            <p className="text-xl font-bold mt-1">
              {formatCurrency(totalDiverseSpend)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Carbon Reduction</p>
            <p className="text-xl font-bold mt-1 text-emerald-600">-21.6%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="esg" className="space-y-4">
        <TabsList>
          <TabsTrigger value="esg">ESG Overview</TabsTrigger>
          <TabsTrigger value="diversity">Diversity</TabsTrigger>
          <TabsTrigger value="carbon">Carbon Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="esg">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ESG Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Actual"
                      dataKey="A"
                      stroke="hsl(215, 80%, 48%)"
                      fill="hsl(215, 80%, 48%)"
                      fillOpacity={0.2}
                    />
                    <Radar
                      name="Target"
                      dataKey="B"
                      stroke="hsl(165, 60%, 40%)"
                      fill="hsl(165, 60%, 40%)"
                      fillOpacity={0.1}
                      strokeDasharray="5 5"
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  ESG Dimension Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {esgScores.map((e) => (
                  <div key={e.dimension} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">{e.dimension}</p>
                      <span className="text-xs font-mono">
                        {e.score}/{e.target}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={e.score} className="h-2" />
                      <div
                        className="absolute top-0 h-2 w-0.5 bg-foreground/40"
                        style={{ left: `${e.target}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diversity">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Diversity Spend Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={diversityData}
                    layout="vertical"
                    margin={{ top: 5, right: 5, bottom: 5, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickFormatter={(v) =>
                        `$${(v / 1_000_000).toFixed(1)}M`
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={110}
                      tick={{ fontSize: 11 }}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar
                      dataKey="spend"
                      fill="hsl(165, 60%, 40%)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Diversity Targets & Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {diversityData.map((d) => (
                  <div key={d.category} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">{d.category}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {formatCurrency(d.spend)}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {d.pct}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={d.pct * 5} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="carbon">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Quarterly Carbon Emissions (tCO2e)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={carbonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar
                    dataKey="emissions"
                    fill="hsl(215, 80%, 48%)"
                    radius={[4, 4, 0, 0]}
                    name="Actual"
                  />
                  <Bar
                    dataKey="target"
                    fill="hsl(165, 60%, 40%)"
                    radius={[4, 4, 0, 0]}
                    name="Target"
                    fillOpacity={0.4}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
