"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Shield,
  MapPin,
  Activity,
  FileWarning,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fleetSuppliers,
  upstreamDependencies,
  SUPPLIER_TYPE_COLORS,
  formatCurrencyShort,
  type FleetSupplier,
  type UpstreamDependency,
} from "@/lib/supplier-strategy-data"

// Derive risk flags from UpstreamDependency for display
function getRiskFlags(dep: UpstreamDependency): string[] {
  const flags: string[] = []
  if (dep.concentration === "High") flags.push("single-source")
  if (/China|Korea|South Korea/i.test(dep.geoExposure)) flags.push("geo-concentration")
  if (dep.leadTimeSensitivity === "High") flags.push("capacity-constraint")
  return flags
}

const riskFlagLabel: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  "geo-concentration": { label: "Geo Concentration", icon: MapPin, color: "text-amber-600" },
  "single-source": { label: "Single Source", icon: AlertTriangle, color: "text-red-600" },
  "capacity-constraint": { label: "Capacity Constraint", icon: Activity, color: "text-orange-600" },
  "regulatory": { label: "Regulatory Risk", icon: FileWarning, color: "text-violet-600" },
}

// ─── Ecosystem Flow ──────────────────────────────────────────────────────────

const ecosystemFlow = [
  { label: "OEM", types: ["OEM"] as const },
  { label: "Dealer", types: ["Dealer"] as const },
  { label: "FMC", types: ["FMC"] as const },
  { label: "Meridian\nPharma", types: [] as const },
  { label: "Maintenance", types: ["Maintenance"] as const },
  { label: "Telematics", types: ["Telematics"] as const },
  { label: "Insurance", types: ["Insurance"] as const },
  { label: "Remarketing", types: ["Remarketing"] as const },
]

export function SupplierNetworkTab() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [drawerNode, setDrawerNode] = useState<{ supplier: FleetSupplier; deps: UpstreamDependency[] } | null>(null)

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const tier1 = fleetSuppliers.filter((s) => s.tier === 1)

  return (
    <div className="space-y-6">
      {/* Ecosystem Map Visualization */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Fleet Ecosystem Flow</CardTitle>
          <CardDescription className="text-xs">Value chain from OEM to remarketing. Click a node for dependencies.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {ecosystemFlow.map((stage, idx) => {
              const stageSuppliers = fleetSuppliers.filter((s) =>
                (stage.types as readonly string[]).includes(s.type),
              )
              const isCenter = stage.types.length === 0
              const hasRisk = stageSuppliers.some((s) => s.riskScore >= 40)
              const totalRiskFlags = stageSuppliers.reduce((acc, s) => {
                const deps = upstreamDependencies.filter((d) => d.parentId === s.id)
                return acc + deps.reduce((a, d) => a + getRiskFlags(d).length, 0)
              }, 0)

              return (
                <div key={stage.label} className="flex items-center">
                  <div
                    className={cn(
                      "relative rounded-lg border-2 p-3 text-center min-w-[110px] transition-shadow",
                      isCenter
                        ? "border-primary bg-primary/5 shadow-sm"
                        : hasRisk || totalRiskFlags > 0
                          ? "border-amber-300 bg-amber-50"
                          : "border-border bg-card",
                    )}
                  >
                    {!isCenter && (hasRisk || totalRiskFlags > 0) && (
                      <AlertTriangle className="absolute -top-2 -right-2 h-4 w-4 text-amber-600 bg-background rounded-full" />
                    )}
                    <p className="text-xs font-semibold whitespace-pre-line">{stage.label}</p>
                    {stageSuppliers.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {stageSuppliers.length} supplier{stageSuppliers.length !== 1 ? "s" : ""}
                      </p>
                    )}
                    {stageSuppliers.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {stageSuppliers.slice(0, 3).map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              const deps = upstreamDependencies.filter((d) => d.parentId === s.id)
                              setDrawerNode({ supplier: s, deps })
                            }}
                            className="block w-full text-[9px] text-muted-foreground hover:text-foreground truncate text-center transition-colors"
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {idx < ecosystemFlow.length - 1 && (
                    <div className="flex items-center px-1 shrink-0">
                      <div className="w-6 h-px bg-border" />
                      <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-border" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tier 1 -> Tier 2/3 Expandable Tree */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{"Tier 1 \u2192 Tier 2/3 Dependencies"}</CardTitle>
          <CardDescription className="text-xs">Expand each supplier to see downstream dependencies and risk flags</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {tier1.map((supplier) => {
              const deps = upstreamDependencies.filter((d) => d.parentId === supplier.id)
              const isOpen = expanded.has(supplier.id)
              const riskCount = deps.reduce((a, d) => a + getRiskFlags(d).length, 0)

              return (
                <div key={supplier.id}>
                  {/* Tier 1 Row */}
                  <button
                    onClick={() => toggle(supplier.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: `${SUPPLIER_TYPE_COLORS[supplier.type]}15`, color: SUPPLIER_TYPE_COLORS[supplier.type] }}
                    >
                      T1
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{supplier.name}</p>
                        <Badge variant="outline" className="text-[10px]" style={{ backgroundColor: `${SUPPLIER_TYPE_COLORS[supplier.type]}10`, color: SUPPLIER_TYPE_COLORS[supplier.type], borderColor: `${SUPPLIER_TYPE_COLORS[supplier.type]}30` }}>
                          {supplier.type}
                        </Badge>
                        {riskCount > 0 && (
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                            {riskCount} risk flag{riskCount !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{formatCurrencyShort(supplier.annualSpend)} | {supplier.regions.join(", ")}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{deps.length} dep{deps.length !== 1 ? "s" : ""}</span>
                      {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Tier 2/3 Dependencies */}
                  {isOpen && deps.length > 0 && (
                    <div className="bg-muted/30 px-4 py-2 space-y-1.5">
                      {deps.map((dep) => {
                          const riskFlags = getRiskFlags(dep)
                          return (
                        <button
                          key={dep.id}
                          onClick={() => setDrawerNode({ supplier, deps })}
                          className="w-full flex items-start gap-3 rounded-md border bg-card p-3 hover:shadow-sm transition-shadow text-left"
                        >
                          <div className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold shrink-0",
                            dep.impact === "High" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600",
                          )}>
                            {dep.impact === "High" ? "!" : "•"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">{dep.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{dep.dependencyType} · {dep.geoExposure}</p>
                            {riskFlags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {riskFlags.map((flag) => {
                                  const rf = riskFlagLabel[flag]
                                  const FlagIcon = rf.icon
                                  return (
                                    <Badge key={flag} variant="outline" className={cn("text-[9px] gap-0.5", rf.color)}>
                                      <FlagIcon className="h-2.5 w-2.5" />
                                      {rf.label}
                                    </Badge>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </button>
                      )})}
                    </div>
                  )}
                  {isOpen && deps.length === 0 && (
                    <div className="bg-muted/30 px-4 py-4">
                      <p className="text-xs text-muted-foreground text-center">No tracked sub-tier dependencies</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Node Drawer */}
      <Sheet open={!!drawerNode} onOpenChange={() => setDrawerNode(null)}>
        <SheetContent className="sm:max-w-lg">
          {drawerNode && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  {drawerNode.supplier.name}
                </SheetTitle>
                <SheetDescription>
                  Tier 1 {drawerNode.supplier.type} | {drawerNode.supplier.regions.join(", ")} | {formatCurrencyShort(drawerNode.supplier.annualSpend)}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)] pr-4 mt-4">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold mb-2">Role in Ecosystem</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{drawerNode.supplier.roleInEcosystem}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2">Sub-Tier Dependencies ({drawerNode.deps.length})</p>
                    {drawerNode.deps.length === 0 && (
                      <p className="text-xs text-muted-foreground">No tracked sub-tier dependencies.</p>
                    )}
                    <div className="space-y-3">
                      {drawerNode.deps.map((dep) => {
                        const riskFlags = getRiskFlags(dep)
                        return (
                        <div key={dep.id} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn(
                              "text-[10px]",
                              dep.impact === "High" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-slate-100 text-slate-600 border-slate-200",
                            )}>
                              {dep.dependencyType}
                            </Badge>
                            <p className="text-sm font-medium">{dep.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{dep.notes}</p>
                          {riskFlags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {riskFlags.map((flag) => {
                                const rf = riskFlagLabel[flag]
                                const FlagIcon = rf.icon
                                return (
                                  <Badge key={flag} variant="outline" className={cn("text-[9px] gap-0.5", rf.color)}>
                                    <FlagIcon className="h-2.5 w-2.5" />
                                    {rf.label}
                                  </Badge>
                                )
                              })}
                            </div>
                          )}
                          <div className="rounded-md bg-muted/50 p-2">
                            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Mitigation</p>
                            <p className="text-xs text-foreground">{dep.mitigations.join(". ")}</p>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2">Key Risks</p>
                    <div className="space-y-1">
                      {drawerNode.supplier.keyRisks.map((risk) => (
                        <div key={risk} className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                          <p className="text-xs text-muted-foreground">{risk}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2">Suggested Mitigations</p>
                    <ul className="space-y-1.5">
                      <li className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-emerald-600 shrink-0">1.</span>
                        Conduct annual sub-tier risk assessment during QBR cycle
                      </li>
                      <li className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-emerald-600 shrink-0">2.</span>
                        Require {drawerNode.supplier.name} to maintain dual-source arrangements for critical Tier 2 inputs
                      </li>
                      <li className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-emerald-600 shrink-0">3.</span>
                        Establish supply chain transparency reporting as a contract KPI
                      </li>
                    </ul>
                  </div>
                  <div className="pt-2">
                    <Button size="sm" variant="outline" className="w-full bg-transparent" onClick={() => setDrawerNode(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
