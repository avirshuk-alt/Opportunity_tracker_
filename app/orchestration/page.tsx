"use client"

import { useCategory } from "@/lib/category-context"
import { auditEvents, notifications, getUserById } from "@/lib/data"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  Clock,
  FileCheck,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Info,
  Settings,
} from "lucide-react"

const workflows = [
  { id: "wf-1", name: "Strategy Approval", trigger: "Strategy status -> InReview", steps: 4, active: true, lastRun: "2026-01-28", status: "Running" },
  { id: "wf-2", name: "Contract Renewal Alert", trigger: "90 days before renewal date", steps: 3, active: true, lastRun: "2026-02-09", status: "Completed" },
  { id: "wf-3", name: "Risk Threshold Breach", trigger: "Risk score > appetite threshold", steps: 2, active: true, lastRun: "2026-02-08", status: "Completed" },
  { id: "wf-4", name: "Strategy Refresh Reminder", trigger: "N days since last refresh", steps: 2, active: true, lastRun: "2026-02-05", status: "Completed" },
  { id: "wf-5", name: "Initiative Stage Gate", trigger: "Initiative stage change", steps: 5, active: false, lastRun: "2026-01-15", status: "Inactive" },
]

const approvalQueue = [
  { id: "aq-1", type: "Strategy", item: "Professional Services Strategy v1", requester: "u-6", priority: "High", submitted: "2026-02-08", status: "Pending" },
  { id: "aq-2", type: "Initiative", item: "Tail Spend Consolidation", requester: "u-3", priority: "Medium", submitted: "2026-02-06", status: "Pending" },
  { id: "aq-3", type: "Contract", item: "Hardware Components Supply Renewal", requester: "u-2", priority: "High", submitted: "2026-02-04", status: "Pending" },
]

export default function OrchestrationPage() {
  const { selectedCategory } = useCategory()
  const unreadNotifications = notifications.filter((n) => !n.read)

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "Orchestration" },
        ]}
        title="Workflow Orchestration & Governance"
        description="Approval workflows, notifications, audit trail, and governance automation"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Active Workflows</p>
            <p className="text-xl font-bold mt-1">
              {workflows.filter((w) => w.active).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Pending Approvals</p>
            <p className="text-xl font-bold mt-1 text-amber-600">
              {approvalQueue.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Unread Alerts</p>
            <p className="text-xl font-bold mt-1 text-red-600">
              {unreadNotifications.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Audit Events</p>
            <p className="text-xl font-bold mt-1">{auditEvents.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="approvals">Approval Queue</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals">
          <div className="space-y-3">
            {approvalQueue.map((item) => {
              const requester = getUserById(item.requester)
              return (
                <Card key={item.id}>
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                          <FileCheck className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{item.item}</p>
                            <Badge variant="outline" className="text-[10px]">
                              {item.type}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                item.priority === "High"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {item.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Requested by {requester?.name} on {item.submitted}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Reject
                        </Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="workflows">
          <div className="space-y-3">
            {workflows.map((wf) => (
              <Card key={wf.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <GitBranch className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{wf.name}</p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              wf.status === "Running"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : wf.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {wf.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {wf.trigger} | {wf.steps} steps | Last: {wf.lastRun}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 ${
                        !n.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="mt-0.5">
                        {n.type === "alert" && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        {n.type === "approval" && (
                          <FileCheck className="h-4 w-4 text-amber-500" />
                        )}
                        {n.type === "renewal" && (
                          <Clock className="h-4 w-4 text-primary" />
                        )}
                        {n.type === "reminder" && (
                          <Bell className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {n.createdAt}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {auditEvents.map((event) => {
                    const actor = getUserById(event.actorId)
                    return (
                      <div key={event.id} className="flex items-start gap-3 px-4 py-3">
                        <Avatar className="h-7 w-7 mt-0.5">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                            {actor?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {actor?.name}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                event.action === "Approve"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : event.action === "Create"
                                    ? "bg-sky-50 text-sky-700 border-sky-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {event.action}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {event.objectType}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {event.summary}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
