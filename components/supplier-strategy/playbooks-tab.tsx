"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  BookOpen,
  CheckSquare,
  ShieldAlert,
  BarChart3,
  Zap,
  ArrowRight,
  Calendar,
  User,
  Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  playbooks,
  supplierActions,
  fleetSuppliers,
  SUPPLIER_TYPE_COLORS,
  type ActionStatus,
} from "@/lib/supplier-strategy-data"
import { toast } from "sonner"

const statusBadge: Record<ActionStatus, string> = {
  "Not Started": "bg-slate-100 text-slate-600 border-slate-200",
  "In Progress": "bg-sky-50 text-sky-700 border-sky-200",
  "Complete": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Blocked": "bg-red-50 text-red-700 border-red-200",
}

export function SupplierPlaybooksTab() {
  const [actions, setActions] = useState(supplierActions)

  const cycleStatus = (id: string) => {
    const order: ActionStatus[] = ["Not Started", "In Progress", "Complete", "Blocked"]
    setActions((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const idx = order.indexOf(a.status)
        return { ...a, status: order[(idx + 1) % order.length] }
      }),
    )
  }

  return (
    <div className="space-y-6">
      {/* Playbook Library */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Playbook Library by Supplier Type</CardTitle>
          </div>
          <CardDescription className="text-xs">Negotiation levers, checklists, risks, and QBR KPIs for each supplier type</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <Accordion type="single" collapsible className="w-full">
            {playbooks.map((pb) => (
              <AccordionItem key={pb.type} value={pb.type}>
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold"
                      style={{ backgroundColor: `${SUPPLIER_TYPE_COLORS[pb.type]}15`, color: SUPPLIER_TYPE_COLORS[pb.type] }}
                    >
                      {pb.type.slice(0, 2)}
                    </div>
                    <span className="text-sm font-medium">{pb.type} Playbook</span>
                    <Badge variant="outline" className="text-[10px] ml-1">
                      {pb.levers.length} levers
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pb-2">
                    {/* Levers */}
                    <PlaybookSection icon={Zap} title="Negotiation Levers" color="text-primary">
                      {pb.levers.map((lever) => (
                        <li key={lever} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <ArrowRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                          {lever}
                        </li>
                      ))}
                    </PlaybookSection>

                    {/* Checklist */}
                    <PlaybookSection icon={CheckSquare} title="Negotiation Checklist" color="text-emerald-600">
                      {pb.negotiationChecklist.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckSquare className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </PlaybookSection>

                    {/* Risks */}
                    <PlaybookSection icon={ShieldAlert} title="Risks to Manage" color="text-red-600">
                      {pb.risksToManage.map((risk) => (
                        <li key={risk} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </PlaybookSection>

                    {/* QBR KPIs */}
                    <PlaybookSection icon={BarChart3} title="Suggested KPIs for QBR" color="text-amber-600">
                      {pb.qbrKPIs.map((kpi) => (
                        <li key={kpi} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <BarChart3 className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                          {kpi}
                        </li>
                      ))}
                    </PlaybookSection>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Action Tracker */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm">Action Tracker</CardTitle>
              <CardDescription className="text-xs">Track supplier strategy initiatives. Click status to cycle.</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs bg-transparent shrink-0"
              onClick={() => toast.success("Actions pushed to Roadmap (stub)")}
            >
              <ArrowRight className="mr-1 h-3 w-3" />
              Push to Roadmap
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Initiative</TableHead>
                <TableHead className="w-[120px]">Owner</TableHead>
                <TableHead className="w-[90px]">Due</TableHead>
                <TableHead>Linked Suppliers</TableHead>
                <TableHead className="max-w-[180px]">Linked Objective</TableHead>
                <TableHead className="w-[110px] text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{action.initiative}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">{action.owner}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs">{action.dueDate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {action.linkedSupplierIds.map((sid) => {
                        const supplier = fleetSuppliers.find((s) => s.id === sid)
                        if (!supplier) return null
                        return (
                          <Badge key={sid} variant="outline" className="text-[10px]" style={{ backgroundColor: `${SUPPLIER_TYPE_COLORS[supplier.type]}10`, color: SUPPLIER_TYPE_COLORS[supplier.type], borderColor: `${SUPPLIER_TYPE_COLORS[supplier.type]}30` }}>
                            {supplier.name.split(" ")[0]}
                          </Badge>
                        )
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-1.5">
                      <Link2 className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground">{action.linkedObjective}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => cycleStatus(action.id)}>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] cursor-pointer transition-colors", statusBadge[action.status])}
                      >
                        {action.status}
                      </Badge>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Playbook Section Helper ──────────────────────────────────────────────────

function PlaybookSection({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={cn("h-3.5 w-3.5", color)} />
        <p className="text-xs font-semibold">{title}</p>
      </div>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  )
}
