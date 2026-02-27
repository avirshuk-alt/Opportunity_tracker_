"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Building2,
  TrendingUp,
  Shield,
  Globe,
  FileText,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fleetSuppliers,
  segmentDefinitions,
  formatCurrencyShort,
  SUPPLIER_TYPE_COLORS,
  ALL_SUPPLIER_TYPES,
  getKraljicQuadrant,
  KRALJIC_GUIDANCE,
  type SupplierType,
  type KraljicQuadrant,
} from "@/lib/supplier-strategy-data"

// ─── KPI helpers ──────────────────────────────────────────────────────────────

const totalSpend = fleetSuppliers.reduce((a, s) => a + s.annualSpend, 0)
const tier1 = fleetSuppliers.filter((s) => s.tier === 1)
const top3Spend = [...fleetSuppliers].sort((a, b) => b.annualSpend - a.annualSpend).slice(0, 3)
const top3Share = totalSpend > 0 ? (top3Spend.reduce((a, s) => a + s.annualSpend, 0) / totalSpend) * 100 : 0

const allRegions = new Set(fleetSuppliers.flatMap((s) => s.regions))
const allCapabilities = new Set(fleetSuppliers.flatMap((s) => s.capabilities))
const coverageScore = Math.round((allRegions.size / 4) * 50 + (Math.min(allCapabilities.size, 30) / 30) * 50)

const singleSourceTypes = new Set<SupplierType>()
const typeGroups = new Map<SupplierType, number>()
fleetSuppliers.forEach((s) => { typeGroups.set(s.type, (typeGroups.get(s.type) ?? 0) + 1) })
typeGroups.forEach((count, type) => { if (count === 1) singleSourceTypes.add(type) })
const geoConc = fleetSuppliers.filter((s) => s.regions.length === 1).length
const riskExposure = Math.round(singleSourceTypes.size * 12 + geoConc * 4 + fleetSuppliers.filter((s) => s.riskScore >= 40).length * 6)

const contractCoverage = Math.round((fleetSuppliers.filter((s) => s.contractCoverage).length / fleetSuppliers.length) * 100)

// ─── Segment badge styles ─────────────────────────────────────────────────────

const segBadge: Record<string, string> = {
  Strategic: "bg-primary/10 text-primary border-primary/20",
  Preferred: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Approved: "bg-sky-50 text-sky-700 border-sky-200",
  Transactional: "bg-slate-100 text-slate-600 border-slate-200",
}

// ─── Quadrant styles ──────────────────────────────────────────────────────────

const quadrantStyles: Record<KraljicQuadrant, { bg: string; text: string; border: string }> = {
  "Strategic Partnership":   { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "Supplier Leverage Risk":  { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
  "Customer Leverage":       { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  "Easy Manage":             { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200" },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SupplierOverviewTab({ onSelectSupplier }: { onSelectSupplier?: (id: string) => void }) {
  const [typeFilter, setTypeFilter] = useState<SupplierType | "All">("All")
  const [hoveredSupplier, setHoveredSupplier] = useState<string | null>(null)

  const filteredSuppliers = useMemo(() => {
    if (typeFilter === "All") return fleetSuppliers
    return fleetSuppliers.filter((s) => s.type === typeFilter)
  }, [typeFilter])

  // Group suppliers by quadrant for the guidance table
  const quadrantGroups = useMemo(() => {
    const groups = new Map<KraljicQuadrant, typeof fleetSuppliers>()
    for (const s of filteredSuppliers) {
      const q = getKraljicQuadrant(s.ourDependencyScore, s.accountAttractivenessScore)
      if (!groups.has(q)) groups.set(q, [])
      groups.get(q)!.push(s)
    }
    return groups
  }, [filteredSuppliers])

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KPICard icon={Building2} label="Tier 1 Suppliers" value={`${tier1.length}`} sub={`${fleetSuppliers.length} total suppliers`} />
        <KPICard icon={TrendingUp} label="Spend Concentration" value={`${top3Share.toFixed(0)}%`} sub="Top 3 supplier share" />
        <KPICard icon={Globe} label="Coverage Score" value={`${coverageScore}/100`} sub={`${allRegions.size} regions, ${allCapabilities.size} capabilities`} />
        <KPICard icon={Shield} label="Risk Exposure" value={`${riskExposure}`} sub={`${singleSourceTypes.size} single-source types`} />
        <KPICard icon={FileText} label="Contract Coverage" value={`${contractCoverage}%`} sub={`${fleetSuppliers.filter((s) => s.contractCoverage).length} of ${fleetSuppliers.length} covered`} />
      </div>

      {/* Segmentation Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Supplier Segmentation</CardTitle>
          <CardDescription className="text-xs">Fleet supplier base by strategic segment</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Segment</TableHead>
                <TableHead className="text-center w-[80px]"># Suppliers</TableHead>
                <TableHead className="text-right w-[120px]">Spend</TableHead>
                <TableHead className="text-right w-[90px]">% of Total</TableHead>
                <TableHead>Rationale</TableHead>
                <TableHead>Recommended Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segmentDefinitions.map((row) => {
                const segSup = fleetSuppliers.filter((s) => s.segment === row.segment)
                const segSpend = segSup.reduce((a, s) => a + s.annualSpend, 0)
                const pct = totalSpend > 0 ? (segSpend / totalSpend) * 100 : 0
                return (
                  <TableRow key={row.segment}>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", segBadge[row.segment])}>
                        {row.segment}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">{segSup.length}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatCurrencyShort(segSpend)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={pct} className="w-16 h-1.5" />
                        <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[220px]">{row.rationale}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[220px]">{row.recommendedAction}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Kraljic Matrix */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm">Relationship Positioning: Supplier Importance vs Our Importance</CardTitle>
              <CardDescription className="text-xs">
                Kraljic-style matrix plotting each supplier by mutual dependency. Click a point to open supplier profile.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setTypeFilter("All")}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium border transition-colors",
                    typeFilter === "All"
                      ? "bg-foreground text-background border-transparent"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/30",
                  )}
                >
                  All
                </button>
                {ALL_SUPPLIER_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(typeFilter === t ? "All" : t)}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium border transition-colors",
                      typeFilter === t
                        ? "text-foreground border-transparent"
                        : "bg-transparent text-muted-foreground border-border hover:border-foreground/30",
                    )}
                    style={typeFilter === t ? { backgroundColor: `${SUPPLIER_TYPE_COLORS[t]}20`, borderColor: `${SUPPLIER_TYPE_COLORS[t]}50` } : undefined}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TooltipProvider delayDuration={100}>
            {/* Scatter plot area */}
            <div className="relative w-full" style={{ paddingBottom: "60%" }}>
              <div className="absolute inset-0">
                {/* Grid background with quadrant labels */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                  {/* Top-left: Supplier Leverage Risk */}
                  <div className="relative border-r border-b border-dashed border-border/60 bg-red-50/30">
                    <span className="absolute top-2 left-2 text-[10px] font-medium text-red-600/70">Supplier Leverage Risk</span>
                  </div>
                  {/* Top-right: Strategic Partnership */}
                  <div className="relative border-b border-dashed border-border/60 bg-emerald-50/30">
                    <span className="absolute top-2 right-2 text-[10px] font-medium text-emerald-600/70">Strategic Partnership</span>
                  </div>
                  {/* Bottom-left: Easy Manage */}
                  <div className="relative border-r border-dashed border-border/60 bg-slate-50/30">
                    <span className="absolute bottom-2 left-2 text-[10px] font-medium text-slate-500/70">Easy Manage</span>
                  </div>
                  {/* Bottom-right: Customer Leverage */}
                  <div className="relative bg-amber-50/30">
                    <span className="absolute bottom-2 right-2 text-[10px] font-medium text-amber-600/70">Customer Leverage</span>
                  </div>
                </div>

                {/* Axis labels */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-medium">
                  {"Meridian's importance to supplier (Account Attractiveness) \u2192"}
                </div>
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                  {"Supplier importance to Meridian \u2192"}
                </div>

                {/* Data points */}
                {filteredSuppliers.map((s) => {
                  const x = (s.accountAttractivenessScore / 100) * 100
                  const y = (1 - s.ourDependencyScore / 100) * 100
                  const isHovered = hoveredSupplier === s.id

                  return (
                    <Tooltip key={s.id}>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            "absolute rounded-full border-2 border-background shadow-sm transition-all duration-150 z-10",
                            isHovered ? "scale-150 z-20" : "hover:scale-125",
                          )}
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: `translate(-50%, -50%)${isHovered ? " scale(1.5)" : ""}`,
                            width: Math.max(10, Math.min(24, s.annualSpend / 1_000_000 * 2.4)),
                            height: Math.max(10, Math.min(24, s.annualSpend / 1_000_000 * 2.4)),
                            backgroundColor: SUPPLIER_TYPE_COLORS[s.type],
                          }}
                          onClick={() => onSelectSupplier?.(s.id)}
                          onMouseEnter={() => setHoveredSupplier(s.id)}
                          onMouseLeave={() => setHoveredSupplier(null)}
                          aria-label={`${s.name} - ${s.type}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{s.name}</p>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: SUPPLIER_TYPE_COLORS[s.type] }}
                            />
                            <span className="text-xs text-muted-foreground">{s.type} | {s.segment}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs pt-1">
                            <span className="text-muted-foreground">{"Supplier importance:"}</span>
                            <span className="font-medium">{s.ourDependencyScore}/100</span>
                            <span className="text-muted-foreground">{"Our importance:"}</span>
                            <span className="font-medium">{s.accountAttractivenessScore}/100</span>
                            <span className="text-muted-foreground">Annual spend:</span>
                            <span className="font-medium">{formatCurrencyShort(s.annualSpend)}</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-8 pt-3 border-t">
              <span className="text-[10px] text-muted-foreground font-medium">Bubble size = annual spend</span>
              <span className="text-[10px] text-muted-foreground">|</span>
              {ALL_SUPPLIER_TYPES.map((t) => (
                <div key={t} className="flex items-center gap-1">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: SUPPLIER_TYPE_COLORS[t] }}
                  />
                  <span className="text-[10px] text-muted-foreground">{t}</span>
                </div>
              ))}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Engagement Stance by Quadrant */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Recommended Engagement Stance by Quadrant</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">Auto-generated engagement recommendations based on each supplier{"'"}s position in the Kraljic matrix above.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {(["Strategic Partnership", "Supplier Leverage Risk", "Customer Leverage", "Easy Manage"] as KraljicQuadrant[]).map((quadrant) => {
              const suppliers = quadrantGroups.get(quadrant) ?? []
              const style = quadrantStyles[quadrant]
              const guidance = KRALJIC_GUIDANCE[quadrant]

              return (
                <div key={quadrant} className={cn("rounded-lg border p-4 space-y-3", style.bg, style.border)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={cn("text-xs font-semibold", style.text)}>{quadrant}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Stance: <span className="font-medium">{guidance.stance}</span>
                      </p>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px]", style.text, style.border)}>
                      {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  {suppliers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {suppliers.map((s) => (
                        <Badge
                          key={s.id}
                          variant="outline"
                          className="text-[10px] cursor-pointer hover:bg-background/80 transition-colors"
                          style={{
                            backgroundColor: `${SUPPLIER_TYPE_COLORS[s.type]}08`,
                            color: SUPPLIER_TYPE_COLORS[s.type],
                            borderColor: `${SUPPLIER_TYPE_COLORS[s.type]}30`,
                          }}
                          onClick={() => onSelectSupplier?.(s.id)}
                        >
                          {s.name.split(" ")[0]}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <ul className="space-y-1">
                    {guidance.actions.map((action) => (
                      <li key={action} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <span className={cn("mt-1 h-1 w-1 rounded-full shrink-0", style.text.replace("text-", "bg-"))} />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="py-4 px-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
            {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
