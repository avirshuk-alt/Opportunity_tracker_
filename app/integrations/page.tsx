"use client"

import { useCategory } from "@/lib/category-context"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  Plug,
  Database,
  FileSpreadsheet,
  Cloud,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react"

const integrations = [
  {
    id: "int-1",
    name: "SAP Ariba",
    category: "Source-to-Pay",
    icon: Database,
    status: "Connected",
    lastSync: "2026-02-11 08:30",
    dataPoints: "Purchase Orders, Invoices, Suppliers",
    health: 98,
    enabled: true,
  },
  {
    id: "int-2",
    name: "Workday Finance",
    category: "ERP",
    icon: FileSpreadsheet,
    status: "Connected",
    lastSync: "2026-02-11 06:00",
    dataPoints: "GL Accounts, Cost Centers, Budget Lines",
    health: 95,
    enabled: true,
  },
  {
    id: "int-3",
    name: "Dun & Bradstreet",
    category: "Risk & Compliance",
    icon: Lock,
    status: "Connected",
    lastSync: "2026-02-10 22:00",
    dataPoints: "Financial Health, Compliance, Risk Scores",
    health: 100,
    enabled: true,
  },
  {
    id: "int-4",
    name: "Power BI",
    category: "Analytics",
    icon: Cloud,
    status: "Connected",
    lastSync: "2026-02-11 07:15",
    dataPoints: "Dashboards, Reports, Data Exports",
    health: 92,
    enabled: true,
  },
  {
    id: "int-5",
    name: "DocuSign CLM",
    category: "Contract Management",
    icon: FileSpreadsheet,
    status: "Disconnected",
    lastSync: "2026-02-01 12:00",
    dataPoints: "Contract Drafts, Signatures, Amendments",
    health: 0,
    enabled: false,
  },
  {
    id: "int-6",
    name: "Coupa",
    category: "Procurement",
    icon: Database,
    status: "Pending",
    lastSync: "Never",
    dataPoints: "Requisitions, POs, Supplier Catalogs",
    health: 0,
    enabled: false,
  },
]

export default function IntegrationsPage() {
  const { selectedCategory } = useCategory()
  const connected = integrations.filter((i) => i.status === "Connected").length

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "Integrations" },
        ]}
        title="Integration Hub"
        description="Manage data connections to enterprise systems, APIs, and external data providers"
        actions={
          <Button size="sm">
            <Plug className="mr-1.5 h-3.5 w-3.5" />
            Add Integration
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Total Integrations</p>
            <p className="text-xl font-bold mt-1">{integrations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Connected</p>
            <p className="text-xl font-bold mt-1 text-emerald-600">
              {connected}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Avg Health</p>
            <p className="text-xl font-bold mt-1">
              {(
                integrations
                  .filter((i) => i.status === "Connected")
                  .reduce((a, i) => a + i.health, 0) / connected
              ).toFixed(0)}
              %
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">Pending Setup</p>
            <p className="text-xl font-bold mt-1">
              {integrations.filter((i) => i.status !== "Connected").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((int) => (
          <Card key={int.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <int.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{int.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {int.category}
                    </p>
                  </div>
                </div>
                <Switch checked={int.enabled} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                {int.status === "Connected" && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                )}
                {int.status === "Disconnected" && (
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                )}
                {int.status === "Pending" && (
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                )}
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    int.status === "Connected"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : int.status === "Disconnected"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {int.status}
                </Badge>
              </div>

              {int.status === "Connected" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Health</span>
                    <span>{int.health}%</span>
                  </div>
                  <Progress value={int.health} className="h-1.5" />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {int.dataPoints}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  Last sync: {int.lastSync}
                </p>
                {int.status === "Connected" && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs">
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Sync
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
