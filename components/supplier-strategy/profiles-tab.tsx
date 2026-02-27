"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Building2,
  Globe,
  Zap,
  ShieldAlert,
  Lightbulb,
  FileText,
  Sparkles,
  Save,
  CheckCircle2,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fleetSuppliers,
  ALL_SUPPLIER_TYPES,
  SUPPLIER_TYPE_COLORS,
  formatCurrencyShort,
  supplierScorecards,
  SCORECARD_LABELS,
  type FleetSupplier,
  type SupplierType,
} from "@/lib/supplier-strategy-data"
import { toast } from "sonner"

const segBadge: Record<string, string> = {
  Strategic: "bg-primary/10 text-primary border-primary/20",
  Preferred: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Approved: "bg-sky-50 text-sky-700 border-sky-200",
  Transactional: "bg-slate-100 text-slate-600 border-slate-200",
}

export function SupplierProfilesTab() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<SupplierType | "All">("All")
  const [selected, setSelected] = useState<FleetSupplier>(fleetSuppliers[0])
  const [summaryGenerated, setSummaryGenerated] = useState(false)

  const filtered = useMemo(() => {
    let list = fleetSuppliers
    if (typeFilter !== "All") list = list.filter((s) => s.type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q))
    }
    return list
  }, [search, typeFilter])

  const scorecard = supplierScorecards.find((sc) => sc.supplierId === selected.id)

  return (
    <div className="flex gap-0 rounded-lg border bg-card overflow-hidden" style={{ minHeight: "75vh" }}>
      {/* ─── Left: Supplier List ─── */}
      <div className="w-72 shrink-0 border-r flex flex-col">
        <div className="p-3 space-y-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
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
        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-0.5">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelected(s); setSummaryGenerated(false) }}
                className={cn(
                  "w-full text-left rounded-md px-3 py-2.5 transition-colors",
                  selected.id === s.id ? "bg-accent" : "hover:bg-muted",
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: SUPPLIER_TYPE_COLORS[s.type] }}
                  />
                  <span className="text-[10px] text-muted-foreground">{s.type}</span>
                  <span className="text-[10px] text-muted-foreground">|</span>
                  <span className="text-[10px] text-muted-foreground">{formatCurrencyShort(s.annualSpend)}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No suppliers found</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ─── Right: Supplier Profile Panel ─── */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <Badge variant="outline" className={cn("text-[10px]", segBadge[selected.segment])}>
                  {selected.segment}
                </Badge>
                <Badge variant="outline" className="text-[10px]" style={{ backgroundColor: `${SUPPLIER_TYPE_COLORS[selected.type]}10`, color: SUPPLIER_TYPE_COLORS[selected.type], borderColor: `${SUPPLIER_TYPE_COLORS[selected.type]}30` }}>
                  {selected.type}
                </Badge>
                {selected.evReady && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    EV Ready
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tier {selected.tier} | {selected.country} | {selected.regions.join(", ")}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs bg-transparent"
                onClick={() => {
                  setSummaryGenerated(true)
                  toast.success("Profile summary generated")
                }}
              >
                <Sparkles className="mr-1 h-3 w-3" />
                Generate Summary
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => toast.success("Insight saved to Fact Base")}
              >
                <Save className="mr-1 h-3 w-3" />
                Save as Insight
              </Button>
            </div>
          </div>

          {/* Generated Summary */}
          {summaryGenerated && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-primary mb-1">AI-Generated Profile Summary</p>
                    <p className="text-xs text-foreground leading-relaxed">
                      {selected.name} is a {selected.segment.toLowerCase()} {selected.type} partner operating across {selected.regions.join(" and ")}
                      {". "}Responsible for {selected.roleInEcosystem.split(".")[0].toLowerCase()}.
                      {selected.evReady ? " EV-ready with active transition capabilities." : " EV readiness remains a gap requiring attention."}
                      {" "}Annual spend of {formatCurrencyShort(selected.annualSpend)} with a performance score of {selected.performanceScore}/100 and risk exposure rated at {selected.riskScore}.
                      {selected.keyOpportunities.length > 0 ? ` Key opportunity: ${selected.keyOpportunities[0].toLowerCase()}.` : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overview + Role */}
          <Section icon={Building2} title="Overview & Role in Ecosystem">
            <p className="text-sm text-muted-foreground leading-relaxed">{selected.roleInEcosystem}</p>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <MiniStat label="Annual Spend" value={formatCurrencyShort(selected.annualSpend)} />
              <MiniStat label="Performance" value={`${selected.performanceScore}/100`} />
              <MiniStat label="Risk Score" value={`${selected.riskScore}`} />
            </div>
          </Section>

          <Separator />

          {/* Capability Footprint */}
          <Section icon={Globe} title="Where Else They Play">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Regions</p>
                <div className="flex flex-wrap gap-1">
                  {selected.regions.map((r) => (
                    <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Industry Coverage</p>
                <div className="flex flex-wrap gap-1">
                  {selected.industyCoverage.map((i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{i}</Badge>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Capabilities & Services</p>
                <div className="flex flex-wrap gap-1">
                  {selected.capabilities.map((c) => (
                    <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">EV Readiness</p>
                <Badge variant="outline" className={cn("text-[10px]", selected.evReady ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
                  {selected.evReady ? "EV Ready" : "Not EV Ready"}
                </Badge>
              </div>
            </div>
          </Section>

          <Separator />

          {/* Commercial Model */}
          <Section icon={FileText} title="Commercial Model Summary">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <MiniStat label="Contract Type" value={selected.contractType} small />
              <MiniStat label="Renewal" value={selected.contractRenewal} small />
              <MiniStat label="Rebates / Fees" value={selected.rebateFees} small />
              <MiniStat label="Commercial Model" value={selected.commercialModel} small />
            </div>
          </Section>

          <Separator />

          {/* Scorecard */}
          {scorecard && (
            <>
              <Section icon={Zap} title="Performance Scorecard">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {(Object.keys(SCORECARD_LABELS) as Array<keyof typeof SCORECARD_LABELS>).map((dim) => {
                    const score = scorecard.scores[dim]
                    return (
                      <div key={dim} className="flex items-center gap-3">
                        <p className="text-xs text-muted-foreground w-36 shrink-0">{SCORECARD_LABELS[dim]}</p>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                score >= 85 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-red-500",
                              )}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">{score}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Section>
              <Separator />
            </>
          )}

          {/* Risks */}
          <Section icon={ShieldAlert} title="Key Risks">
            <div className="space-y-1.5">
              {selected.keyRisks.map((risk) => (
                <div key={risk} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{risk}</p>
                </div>
              ))}
            </div>
          </Section>

          <Separator />

          {/* Opportunities */}
          <Section icon={Lightbulb} title="Key Opportunities">
            <div className="space-y-1.5">
              {selected.keyOpportunities.map((opp) => (
                <div key={opp} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{opp}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </ScrollArea>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function MiniStat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className={cn("font-medium mt-0.5", small ? "text-xs" : "text-sm")}>{value}</p>
    </div>
  )
}
