"use client"

import { useCategory } from "@/lib/category-context"
import {
  getRoadmapByCategory,
  getInitiativesByCategory,
  getUserById,
  formatCurrency,
  type RoadmapItem,
} from "@/lib/data"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Circle, AlertCircle } from "lucide-react"

function getMonthsBetween(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  return (
    (e.getFullYear() - s.getFullYear()) * 12 + e.getMonth() - s.getMonth()
  )
}

function getMonthOffset(start: string, reference: string) {
  const s = new Date(start)
  const r = new Date(reference)
  return (
    (s.getFullYear() - r.getFullYear()) * 12 + s.getMonth() - r.getMonth()
  )
}

export default function RoadmapPage() {
  const { selectedCategory } = useCategory()
  const roadmap = getRoadmapByCategory(selectedCategory.id)
  const initiatives = getInitiativesByCategory(selectedCategory.id)

  const timelineStart = "2025-10-01"
  const totalMonths = 18
  const monthLabels = Array.from({ length: totalMonths }, (_, i) => {
    const d = new Date(2025, 9 + i, 1)
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
  })

  const enriched = roadmap.map((rm) => {
    const init = initiatives.find((i) => i.id === rm.initiativeId)
    return { ...rm, init }
  })

  const totalMilestones = roadmap.reduce(
    (a, rm) => a + rm.milestones.length,
    0
  )
  const completedMilestones = roadmap.reduce(
    (a, rm) => a + rm.milestones.filter((m) => m.completed).length,
    0
  )
  const criticalItems = roadmap.filter((r) => r.criticalPath).length
  const avgProgress =
    roadmap.length > 0
      ? roadmap.reduce((a, r) => a + r.progress, 0) / roadmap.length
      : 0

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "Roadmap & Execution" },
        ]}
        title="Roadmap & Execution Tracker"
        description="Gantt timeline view of initiative execution with milestones and dependencies"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Overall Progress</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={avgProgress} className="flex-1 h-2" />
              <span className="text-sm font-bold">{avgProgress.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Milestones</p>
            <p className="text-xl font-bold mt-1">
              {completedMilestones}/{totalMilestones}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Critical Path Items</p>
            <p className="text-xl font-bold mt-1">{criticalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Active Waves</p>
            <p className="text-xl font-bold mt-1">
              {new Set(roadmap.map((r) => r.wave)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Gantt Timeline</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-4 overflow-x-auto">
              {/* Timeline Header */}
              <div className="flex min-w-[900px]">
                <div className="w-56 shrink-0 text-xs font-medium text-muted-foreground py-2">
                  Initiative
                </div>
                <div className="flex-1 flex">
                  {monthLabels.map((m, i) => (
                    <div
                      key={i}
                      className="flex-1 text-center text-[10px] text-muted-foreground border-l py-2"
                    >
                      {m}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Rows */}
              {enriched
                .sort((a, b) => a.wave - b.wave)
                .map((rm) => {
                  const startOffset = Math.max(
                    0,
                    getMonthOffset(rm.startDate, timelineStart)
                  )
                  const duration = getMonthsBetween(rm.startDate, rm.endDate)
                  const leftPct = (startOffset / totalMonths) * 100
                  const widthPct = (duration / totalMonths) * 100
                  const owners = rm.owners
                    .map((o) => getUserById(o)?.name.split(" ")[0])
                    .join(", ")

                  return (
                    <div
                      key={rm.id}
                      className="flex min-w-[900px] border-t items-center"
                    >
                      <div className="w-56 shrink-0 py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {rm.init?.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                          >
                            Wave {rm.wave}
                          </Badge>
                          {rm.criticalPath && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-red-50 text-red-700 border-red-200"
                            >
                              Critical
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {owners}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 relative h-14">
                        {/* Background grid */}
                        <div className="absolute inset-0 flex">
                          {monthLabels.map((_, i) => (
                            <div key={i} className="flex-1 border-l" />
                          ))}
                        </div>
                        {/* Bar */}
                        <div
                          className="absolute top-3 h-8 rounded-md flex items-center px-2"
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                          }}
                        >
                          <div className="w-full h-full rounded-md bg-primary/15 border border-primary/30 overflow-hidden relative">
                            <div
                              className="h-full bg-primary/30 rounded-l-md"
                              style={{ width: `${rm.progress}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-foreground">
                              {rm.progress}%
                            </span>
                          </div>
                        </div>
                        {/* Milestones */}
                        {rm.milestones.map((ms, idx) => {
                          const msOffset = getMonthOffset(
                            ms.date,
                            timelineStart
                          )
                          const msPct = (msOffset / totalMonths) * 100
                          return (
                            <div
                              key={idx}
                              className="absolute top-1.5"
                              style={{ left: `${msPct}%` }}
                              title={`${ms.name} - ${ms.date}`}
                            >
                              {ms.completed ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Circle className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones">
          <div className="space-y-4">
            {enriched.map((rm) => (
              <Card key={rm.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {rm.init?.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Progress value={rm.progress} className="w-20 h-1.5" />
                      <span className="text-xs font-medium">{rm.progress}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {rm.milestones.map((ms, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-md border p-2.5"
                      >
                        {ms.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex-1">
                          <p
                            className={cn(
                              "text-sm",
                              ms.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {ms.name}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {ms.date}
                        </span>
                        {!ms.completed &&
                          new Date(ms.date) < new Date() && (
                            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                          )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
