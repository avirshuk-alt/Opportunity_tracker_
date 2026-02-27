"use client"

import { useState } from "react"
import { useCategory } from "@/lib/category-context"
import {
  getRisksByCategory,
  getUserById,
  getSupplierById,
  riskScoreRAG,
  ragBg,
  type Risk,
} from "@/lib/data"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ShieldAlert, AlertTriangle, Shield, CheckCircle2 } from "lucide-react"
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

const statusIcons = {
  Open: AlertTriangle,
  Mitigating: Shield,
  Accepted: CheckCircle2,
  Closed: CheckCircle2,
}

const statusBadge = {
  Open: "bg-red-50 text-red-700 border-red-200",
  Mitigating: "bg-amber-50 text-amber-700 border-amber-200",
  Accepted: "bg-sky-50 text-sky-700 border-sky-200",
  Closed: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

export default function RisksPage() {
  const { selectedCategory } = useCategory()
  const allRisks = getRisksByCategory(selectedCategory.id)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null)

  const risks =
    statusFilter === "all"
      ? allRisks
      : allRisks.filter((r) => r.status === statusFilter)

  const openCount = allRisks.filter((r) => r.status === "Open").length
  const mitigatingCount = allRisks.filter((r) => r.status === "Mitigating").length
  const aboveThreshold = allRisks.filter((r) => r.riskScore > r.appetiteThreshold).length
  const avgScore =
    allRisks.length > 0
      ? allRisks.reduce((a, r) => a + r.riskScore, 0) / allRisks.length
      : 0

  const heatmapData = allRisks.map((r) => ({
    x: r.likelihood,
    y: r.impact,
    name: r.title,
    score: r.riskScore,
    rag: riskScoreRAG(r.riskScore, r.appetiteThreshold),
  }))

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "Risk Management" },
        ]}
        title="Risk Register & Heatmap"
        description="Identify, assess, and mitigate risks across the category"
        actions={
          <Button size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Risk
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Total Risks</p>
            <p className="text-xl font-bold mt-1">{allRisks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="text-xl font-bold mt-1 text-red-600">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Above Appetite</p>
            <p className="text-xl font-bold mt-1 text-amber-600">
              {aboveThreshold}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Avg Risk Score</p>
            <p className="text-xl font-bold mt-1">{avgScore.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="register" className="space-y-4">
        <TabsList>
          <TabsTrigger value="register">Risk Register</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Mitigating">Mitigating</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {risks.length} risk{risks.length !== 1 ? "s" : ""}
            </span>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risk</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead className="text-center">L</TableHead>
                    <TableHead className="text-center">I</TableHead>
                    <TableHead className="text-center">D</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Appetite</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks.map((risk) => {
                    const owner = getUserById(risk.ownerId)
                    const rag = riskScoreRAG(risk.riskScore, risk.appetiteThreshold)
                    return (
                      <TableRow
                        key={risk.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedRisk(risk)}
                      >
                        <TableCell>
                          <div className="max-w-[250px]">
                            <p className="font-medium text-sm truncate">
                              {risk.title}
                            </p>
                            {risk.supplierId && (
                              <p className="text-xs text-muted-foreground">
                                {getSupplierById(risk.supplierId)?.name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {risk.scope}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {risk.likelihood}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {risk.impact}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {risk.detectability}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn("text-xs font-mono", ragBg(rag))}
                          >
                            {risk.riskScore}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {risk.appetiteThreshold}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", statusBadge[risk.status])}
                          >
                            {risk.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {owner?.name.split(" ")[0]}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Likelihood vs Impact Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[0, 6]}
                    ticks={[1, 2, 3, 4, 5]}
                    name="Likelihood"
                    label={{ value: "Likelihood", position: "bottom", offset: 0 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={[0, 6]}
                    ticks={[1, 2, 3, 4, 5]}
                    name="Impact"
                    label={{ value: "Impact", angle: -90, position: "insideLeft" }}
                  />
                  <RechartsTooltip
                    content={({ payload }) => {
                      if (!payload?.[0]) return null
                      const d = payload[0].payload
                      return (
                        <div className="rounded-md border bg-card p-2 shadow-md">
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Score: {d.score} | L: {d.x} | I: {d.y}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Scatter data={heatmapData}>
                    {heatmapData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.rag === "Red"
                            ? "hsl(0, 72%, 51%)"
                            : entry.rag === "Amber"
                              ? "hsl(35, 90%, 52%)"
                              : "hsl(165, 60%, 40%)"
                        }
                        r={8}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Risk Detail Dialog */}
      <Dialog open={!!selectedRisk} onOpenChange={() => setSelectedRisk(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              {selectedRisk?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedRisk && (
            <div className="space-y-4 mt-2">
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {selectedRisk.scope}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs", statusBadge[selectedRisk.status])}
                >
                  {selectedRisk.status}
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Likelihood</p>
                  <p className="text-lg font-bold">{selectedRisk.likelihood}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Impact</p>
                  <p className="text-lg font-bold">{selectedRisk.impact}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Detectability</p>
                  <p className="text-lg font-bold">{selectedRisk.detectability}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Risk Score</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-sm font-mono mt-0.5",
                      ragBg(
                        riskScoreRAG(
                          selectedRisk.riskScore,
                          selectedRisk.appetiteThreshold
                        )
                      )
                    )}
                  >
                    {selectedRisk.riskScore} / {selectedRisk.appetiteThreshold}
                  </Badge>
                </div>
              </div>
              {selectedRisk.mitigationPlan && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Mitigation Plan
                  </p>
                  <p className="text-sm">{selectedRisk.mitigationPlan}</p>
                </div>
              )}
              {selectedRisk.acceptedRationale && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Acceptance Rationale
                  </p>
                  <p className="text-sm">{selectedRisk.acceptedRationale}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                  Edit Risk
                </Button>
                <Button size="sm" className="flex-1">
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
