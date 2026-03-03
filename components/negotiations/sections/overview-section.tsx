"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DollarSign, Users, MapPin, Building2, Package, ArrowRight,
  Crosshair, Wrench, Target, MessageSquareText, Radio, Database,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type NegotiationWorkspace,
  type WorkspaceSection,
  negotiationSuppliers,
  formatCurrencyCompact,
  LEVER_LABELS,
  STATUS_COLORS,
  QUADRANT_LABELS,
} from "@/lib/negotiations-data"

interface OverviewSectionProps {
  workspace: NegotiationWorkspace
  onNavigate: (section: WorkspaceSection) => void
}

export function OverviewSection({ workspace, onNavigate }: OverviewSectionProps) {
  const suppliers = workspace.supplierIds
    .map((sid) => negotiationSuppliers.find((s) => s.id === sid))
    .filter(Boolean) as (typeof negotiationSuppliers)[number][]
  const totalSpend = suppliers.reduce((s, sup) => s + sup.annualSpend, 0)

  const completedLevers = workspace.levers.filter((l) => l.status === "complete").length
  const totalRounds = workspace.rounds.length
  const pendingApprovals = workspace.rounds.reduce((count, r) => count + r.approvals.filter((a) => a.status === "pending").length, 0)

  const quickStats = [
    { label: "Total Spend", value: formatCurrencyCompact(totalSpend), icon: DollarSign },
    { label: "Suppliers", value: String(suppliers.length), icon: Users },
    { label: "Levers Active", value: `${completedLevers}/${workspace.levers.length}`, icon: Wrench },
    { label: "Rounds", value: String(totalRounds), icon: Radio },
  ]

  const sections: { key: WorkspaceSection; label: string; icon: React.ElementType; status: string; color: string }[] = [
    { key: "fact-base", label: "Fact Base", icon: Database, status: workspace.factSections.length > 0 ? `${workspace.factSections.reduce((s, fs) => s + fs.items.length, 0)} items` : "Not started", color: workspace.factSections.length > 0 ? "text-emerald-600" : "text-muted-foreground" },
    { key: "spectrum", label: "Spectrum", icon: Crosshair, status: workspace.spectrumPlacements.length > 0 ? workspace.spectrumPlacements.map((p) => QUADRANT_LABELS[p.quadrant]).join(", ") : "Not classified", color: workspace.spectrumPlacements.length > 0 ? "text-emerald-600" : "text-muted-foreground" },
    { key: "levers", label: "Levers", icon: Wrench, status: workspace.levers.length > 0 ? `${completedLevers} complete, ${workspace.levers.length - completedLevers} remaining` : "Not started", color: completedLevers > 0 ? "text-emerald-600" : "text-muted-foreground" },
    { key: "objectives", label: "Negotiation Targets", icon: Target, status: workspace.objectives.length > 0 ? `${workspace.objectives.length} defined` : "Not set", color: workspace.objectives.length > 0 ? "text-emerald-600" : "text-muted-foreground" },
    { key: "narrative", label: "Negotiation Plan", icon: MessageSquareText, status: workspace.arguments.length > 0 && workspace.objectives.length > 0 ? "Plan ready" : "Not built", color: workspace.arguments.length > 0 && workspace.objectives.length > 0 ? "text-emerald-600" : "text-muted-foreground" },
    { key: "live-negotiation", label: "Live Negotiation", icon: Radio, status: totalRounds > 0 ? `Round ${totalRounds}${pendingApprovals > 0 ? ` (${pendingApprovals} approvals pending)` : ""}` : "Not started", color: totalRounds > 0 ? "text-primary" : "text-muted-foreground" },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{workspace.name}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{workspace.category}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scope */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm">Scope</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">Regions:</span>
              {workspace.scope.regions.map((r) => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">BUs:</span>
              {workspace.scope.businessUnits.map((b) => <Badge key={b} variant="outline" className="text-[10px]">{b}</Badge>)}
            </div>
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">SKUs:</span>
              {workspace.scope.skuGroups.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
            </div>
          </div>
          {/* Suppliers */}
          <div className="mt-3 flex flex-wrap gap-2">
            {suppliers.map((sup) => (
              <div key={sup.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  {sup.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-medium">{sup.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatCurrencyCompact(sup.annualSpend)} &middot; {sup.country}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section status grid */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((sec) => (
          <Card
            key={sec.key}
            className="cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
            onClick={() => onNavigate(sec.key)}
          >
            <CardContent className="py-3.5 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <sec.icon className={cn("h-4 w-4 shrink-0", sec.color)} />
                <div className="min-w-0">
                  <p className="text-xs font-medium">{sec.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{sec.status}</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
