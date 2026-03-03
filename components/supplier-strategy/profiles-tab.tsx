"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Search, Building2, Globe, ChevronRight, ChevronDown,
  DollarSign, TrendingUp, TrendingDown, BarChart3, Factory,
  Sparkles, AlertTriangle, CheckCircle2, Clock, Minus,
  Shield, MapPin, Phone, Mail, Lightbulb, Package,
  Newspaper, Users, ShieldCheck, Save, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fleetSuppliers,
  ALL_SUPPLIER_TYPES,
  SUPPLIER_TYPE_COLORS,
  formatCurrencyShort,
  supplierScorecards,
  SCORECARD_LABELS,
  fleetSupplierProfilesFull,
  type FleetSupplier,
  type FleetSupplierProfileFull,
  type SupplierType,
} from "@/lib/supplier-strategy-data"
import { toast } from "sonner"

/* ─── Constants ─────────────────────────────────────────────────────────── */

const segBadge: Record<string, string> = {
  Strategic: "bg-primary/10 text-primary border-primary/20",
  Preferred: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Approved: "bg-sky-50 text-sky-700 border-sky-200",
  Transactional: "bg-slate-100 text-slate-600 border-slate-200",
}

/* ─── RAG helpers ───────────────────────────────────────────────────────── */

function RagDot({ rag }: { rag: "green" | "yellow" | "red" }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full shrink-0",
        rag === "green" && "bg-emerald-500",
        rag === "yellow" && "bg-amber-400",
        rag === "red" && "bg-red-500",
      )}
    />
  )
}

function RagBadge({ rag, label }: { rag: "green" | "yellow" | "red"; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-medium gap-1",
        rag === "green" && "bg-emerald-50 text-emerald-700 border-emerald-200",
        rag === "yellow" && "bg-amber-50 text-amber-700 border-amber-200",
        rag === "red" && "bg-red-50 text-red-700 border-red-200",
      )}
    >
      <RagDot rag={rag} />
      {label}
    </Badge>
  )
}

/* ─── Metric tile ───────────────────────────────────────────────────────── */

function MetricTile({
  label, value, sub, trend, rag,
}: {
  label: string; value: string; sub?: string
  trend?: "up" | "down" | "flat"; rag?: "green" | "yellow" | "red"
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-0.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none">{label}</p>
      <div className="flex items-baseline gap-1.5">
        {rag && <RagDot rag={rag} />}
        <p className="text-sm font-bold text-foreground leading-tight">{value}</p>
      </div>
      {sub && (
        <p className={cn(
          "text-[10px] leading-none",
          trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-muted-foreground",
        )}>
          {trend === "up" && <TrendingUp className="inline h-2.5 w-2.5 mr-0.5 -translate-y-px" />}
          {trend === "down" && <TrendingDown className="inline h-2.5 w-2.5 mr-0.5 -translate-y-px" />}
          {trend === "flat" && <Minus className="inline h-2.5 w-2.5 mr-0.5 -translate-y-px" />}
          {sub}
        </p>
      )}
    </div>
  )
}

function Tbd() {
  return <span className="text-[10px] text-muted-foreground italic">TBD</span>
}

/* ─── Collapsible panel ─────────────────────────────────────────────────── */

function CollapsiblePanel({
  title, icon, children, badge, defaultOpen = true,
}: {
  title: string; icon: React.ReactNode; children: React.ReactNode
  badge?: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center justify-center h-6 w-6 rounded bg-primary/10 shrink-0">
          {icon}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground flex-1 text-left">{title}</span>
        {badge}
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
      </button>
      {open && <CardContent className="pt-4 pb-4">{children}</CardContent>}
    </Card>
  )
}

/* ─── Header band ───────────────────────────────────────────────────────── */

function ProfileHeader({ p }: { p: FleetSupplierProfileFull }) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-primary/5 border-b border-border px-5 py-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-foreground">{p.supplierName}</h2>
              <Badge variant="outline" className="text-[10px] font-medium">{p.supplierType}</Badge>
              <Badge variant="outline" className="text-[10px] font-medium">{p.tier}</Badge>
              <Badge variant="outline" className="text-[10px] font-medium bg-muted">{p.category}</Badge>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {p.regionsServed.map((r) => (
                <Badge key={r} variant="secondary" className="text-[9px] font-normal gap-1">
                  <MapPin className="h-2.5 w-2.5" />{r}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {p.strategicFlags.map((f) => (
                <Badge key={f} className={cn(
                  "text-[9px] font-semibold border",
                  f === "Strategic" && "bg-primary/10 text-primary border-primary/20",
                  f === "Preferred" && "bg-blue-50 text-blue-700 border-blue-200",
                  f === "Innovation" && "bg-violet-50 text-violet-700 border-violet-200",
                  f === "EV-ready" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                  f === "Sole-source" && "bg-amber-50 text-amber-700 border-amber-200",
                  !["Strategic", "Preferred", "Innovation", "EV-ready", "Sole-source"].includes(f) && "bg-muted text-muted-foreground border-border",
                )}>{f}</Badge>
              ))}
            </div>
          </div>
          <div className="shrink-0 rounded-lg border border-border bg-card p-3 space-y-2.5 min-w-[260px]">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Primary Contact</p>
              <p className="text-xs font-medium text-foreground">{p.primaryContact.name} -- {p.primaryContact.title}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="h-2.5 w-2.5" />{p.primaryContact.email}</span>
                {p.primaryContact.phone && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{p.primaryContact.phone}</span>
                )}
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Account Owner (Internal)</p>
              <p className="text-xs font-medium text-foreground">{p.accountOwner.name} -- {p.accountOwner.title}</p>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Mail className="h-2.5 w-2.5" />{p.accountOwner.email}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ─── A) Commercial & Relationship ──────────────────────────────────────── */

function CommercialPanel({ p }: { p: FleetSupplierProfileFull }) {
  const c = p.commercial
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricTile label="Total Annual Spend" value={formatCurrencyShort(c.totalAnnualSpend)}
          sub={`${c.spendTrendYoY > 0 ? "+" : ""}${c.spendTrendYoY}% YoY`}
          trend={c.spendTrendArrow === "up" ? "up" : c.spendTrendArrow === "down" ? "down" : "flat"} />
        <MetricTile label="Contract Type" value={c.contractType} sub={c.commercialModel} />
        <MetricTile label="Contract Period" value={`${c.contractStart} - ${c.renewalDate}`} sub={`${c.terminationNoticeDays}-day notice`} />
        <MetricTile label="Relationship" value={`${c.relationshipYears} years`} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricTile label="Business Criticality" value={c.businessCriticality}
          rag={c.businessCriticality === "High" ? "red" : c.businessCriticality === "Medium" ? "yellow" : "green"} />
        <MetricTile label="Sourcing Status" value={c.sourcingStatus}
          rag={c.sourcingStatus === "Sole" ? "red" : c.sourcingStatus === "Single" ? "yellow" : "green"} />
        <MetricTile label="Payment Terms" value={c.paymentTerms} sub={`Invoice accuracy: ${c.invoiceAccuracy}%`} />
        <MetricTile label="Price Index Clause" value={c.priceIndexClause ? "Yes" : "No"}
          sub={c.priceIndexNote ?? (c.priceIndexClause ? undefined : "Not in contract")} />
      </div>
      <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
        <p className="text-[10px] text-muted-foreground"><span className="font-medium text-foreground">Rebate/Fees:</span> {c.rebateFeesSummary}</p>
      </div>
    </div>
  )
}

/* ─── B) Performance & Governance ───────────────────────────────────────── */

function PerformancePanel({ p }: { p: FleetSupplierProfileFull }) {
  const g = p.performance
  const qbrRag: "green" | "yellow" | "red" = g.qbrRating >= 4 ? "green" : g.qbrRating >= 3 ? "yellow" : "red"
  const slaRag: "green" | "yellow" | "red" = g.slaComplianceT12 >= 95 ? "green" : g.slaComplianceT12 >= 90 ? "yellow" : "red"
  const capaRag: "green" | "yellow" | "red" = g.capaStatus === "On track" ? "green" : g.capaStatus === "At risk" ? "yellow" : "red"

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricTile label="Last QBR" value={g.lastQbrDate} sub={`Rating: ${g.qbrRating}/5`} rag={qbrRag} />
        <MetricTile label="SLA Compliance (LQ)" value={`${g.slaComplianceLq}%`} sub={`T12M: ${g.slaComplianceT12}%`} rag={slaRag} />
        <MetricTile label="On-Time Delivery" value={`${g.otdPct}%`} sub={g.leadTimeScore} rag={g.otdPct >= 95 ? "green" : g.otdPct >= 90 ? "yellow" : "red"} />
        <MetricTile label={g.qualityMetricLabel} value={g.qualityMetricValue} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricTile label="Returns / Claims" value={g.returnsClaimsRate} />
        <MetricTile label="Issue Resolution" value={`${g.issueResolutionDays} days`} sub={`${g.openIncidents} open (${g.incidentAging})`} rag={g.openIncidents > 5 ? "red" : g.openIncidents > 2 ? "yellow" : "green"} />
        <MetricTile label="Reporting Quality" value={g.reportingQualityScore} sub={g.dataTimeliness} />
        <MetricTile label="Compliance / Security" value={g.complianceSecurityScore} />
      </div>
      <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/20 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-foreground">Open CAPAs:</span>
          <span className="text-[10px] text-muted-foreground">{g.openActionItems}</span>
        </div>
        <RagBadge rag={capaRag} label={g.capaStatus} />
      </div>
    </div>
  )
}

/* ─── C) Spend Concentration ────────────────────────────────────────────── */

function SpendConcentrationPanel({ p }: { p: FleetSupplierProfileFull }) {
  const sc = p.spendConcentration
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left font-medium px-3 py-2 text-muted-foreground">SKU / Service</th>
              <th className="text-right font-medium px-3 py-2 text-muted-foreground">% of Spend</th>
              <th className="text-right font-medium px-3 py-2 text-muted-foreground">Volume</th>
            </tr>
          </thead>
          <tbody>
            {sc.topSkus.map((row, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-3 py-2 font-medium text-foreground">{row.skuOrService}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.min(row.pctOfTotal, 100)}%` }} />
                    </div>
                    {row.pctOfTotal}%
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground">{row.volume ?? <Tbd />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 rounded-lg border border-border p-3">
          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Business Units / Sites Served</p>
          <ul className="space-y-0.5">
            {sc.topBusSites.map((site, i) => (
              <li key={i} className="text-[11px] text-foreground flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-primary/40 shrink-0" />{site}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 rounded-lg border border-border p-3">
          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Category Coverage</p>
          <div className="flex flex-wrap gap-1">
            {sc.categoryTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[9px] font-normal">{tag}</Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── D) Internal Risk Snapshot ─────────────────────────────────────────── */

function InternalRiskPanel({ p }: { p: FleetSupplierProfileFull }) {
  const r = p.internalRisk
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="rounded-lg border border-border px-4 py-3 flex items-center gap-3">
          <RagDot rag={r.rag} />
          <div>
            <p className="text-lg font-bold text-foreground leading-none">{r.riskScore}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Risk Score</p>
          </div>
        </div>
        <RagBadge rag={r.rag} label={r.rag === "green" ? "Low Risk" : r.rag === "yellow" ? "Medium Risk" : "High Risk"} />
      </div>
      <div className="rounded-lg border border-border p-3 space-y-1.5">
        <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Top Internal Risks</p>
        {r.topRisks.map((risk, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px] text-foreground">
            <AlertTriangle className={cn("h-3 w-3 shrink-0 mt-0.5", r.rag === "red" ? "text-red-500" : "text-amber-500")} />
            {risk}
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-muted/20 p-3 flex items-start gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] text-foreground"><span className="font-medium">Mitigation:</span> {r.mitigationStatus}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Next milestone: {r.nextMilestoneDate}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/20 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-foreground">Open Action Items / CAPAs:</span>
          <span className="text-[10px] text-muted-foreground">{p.performance.openActionItems}</span>
        </div>
        <RagBadge
          rag={p.performance.capaStatus === "On track" ? "green" : p.performance.capaStatus === "At risk" ? "yellow" : "red"}
          label={p.performance.capaStatus}
        />
      </div>
      {r.opportunities && r.opportunities.length > 0 && (
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.02] p-3 space-y-1.5">
          <p className="text-[9px] font-medium text-primary uppercase tracking-wider flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Value Capture Opportunities
          </p>
          {r.opportunities.map((opp, i) => (
            <p key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
              <span className="text-primary font-medium shrink-0">{i + 1}.</span>{opp}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── External: Financial & Business ────────────────────────────────────── */

function ExternalFinancialsPanel({ p }: { p: FleetSupplierProfileFull }) {
  const f = p.externalFinancials
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        <MetricTile label="Annual Revenue" value={f.annualRevenue ? formatCurrencyShort(f.annualRevenue) : "TBD"} />
        <MetricTile label="Operating Margin" value={f.operatingMargin !== null ? `${f.operatingMargin}%` : "TBD"} />
        <MetricTile label="Credit Rating" value={f.creditRating || "TBD"} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        <MetricTile label="Ownership" value={f.ownershipType} />
        <MetricTile label="HQ Location" value={f.hqLocation} />
        <MetricTile label="Employees" value={f.employees ?? "TBD"} />
      </div>
      <div className="rounded-lg border border-border p-3 space-y-2">
        <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Sustainability & Compliance</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={cn("h-2 w-2 rounded-full", f.diversityStatus ? "bg-emerald-500" : "bg-muted-foreground/30")} />
            <span className="text-muted-foreground">Diversity:</span>
            <span className="font-medium text-foreground">{f.diversityStatus ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={cn("h-2 w-2 rounded-full", f.tier2Reporting ? "bg-emerald-500" : "bg-muted-foreground/30")} />
            <span className="text-muted-foreground">Tier-2 Reporting:</span>
            <span className="font-medium text-foreground">{f.tier2Reporting ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={cn("h-2 w-2 rounded-full", f.sbtiCertified ? "bg-emerald-500" : "bg-muted-foreground/30")} />
            <span className="text-muted-foreground">SBTi Certified:</span>
            <span className="font-medium text-foreground">{f.sbtiCertified ? "Yes" : "No"}</span>
          </div>
        </div>
      </div>
      {f.certifications.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {f.certifications.map((cert) => (
            <Badge key={cert} variant="outline" className="text-[9px] font-normal gap-1">
              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />{cert}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── External: Footprint ───────────────────────────────────────────────── */

function FootprintPanel({ p }: { p: FleetSupplierProfileFull }) {
  const fp = p.externalFootprint
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <MetricTile label="Regions" value={String(fp.regions.length)} sub={fp.regions.join(", ")} />
        <MetricTile label="Countries" value={String(fp.countries)} />
        <MetricTile label="Locations / Sites" value={String(fp.locations)} />
      </div>
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 rounded-lg border border-border p-3">
          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Key Regions</p>
          <ul className="space-y-0.5">
            {fp.keyRegions.map((r, i) => (
              <li key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />{r}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 rounded-lg border border-border p-3">
          <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Industries Served</p>
          <div className="flex flex-wrap gap-1">
            {fp.industries.map((ind) => (
              <Badge key={ind} variant="secondary" className="text-[9px] font-normal">{ind}</Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Bullet list panels ────────────────────────────────────────────────── */

function BulletListPanel({ items, icon }: { items: string[]; icon?: React.ReactNode }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[11px] text-foreground leading-relaxed">
          {icon ?? <span className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0 mt-[7px]" />}
          {item}
        </li>
      ))}
    </ul>
  )
}

/* ─── External: Recent News ─────────────────────────────────────────────── */

function NewsPanel({ p }: { p: FleetSupplierProfileFull }) {
  return (
    <div className="space-y-1.5">
      {p.recentNews.map((news, i) => (
        <div key={i} className="flex items-start gap-2.5 text-[11px]">
          <Badge variant="outline" className="text-[9px] font-mono shrink-0 mt-0.5">{news.date}</Badge>
          <span className="text-foreground">{news.headline}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── External Risks ────────────────────────────────────────────────────── */

function ExternalRisksPanel({ p }: { p: FleetSupplierProfileFull }) {
  return (
    <ul className="space-y-1.5">
      {p.majorExternalRisks.map((risk, i) => {
        const colonIdx = risk.indexOf(":")
        const category = colonIdx > -1 ? risk.slice(0, colonIdx) : null
        const description = colonIdx > -1 ? risk.slice(colonIdx + 1).trim() : risk
        return (
          <li key={i} className="flex items-start gap-2 text-[11px] text-foreground leading-relaxed">
            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
            <span>
              {category && <span className="font-medium">{category}:</span>}{" "}{description}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/* ─── Fallback: simple card for suppliers without full profile ──────────── */

function SimpleProfileView({ supplier }: { supplier: FleetSupplier }) {
  const scorecard = supplierScorecards.find((sc) => sc.supplierId === supplier.id)
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">{supplier.name}</h2>
            <Badge variant="outline" className={cn("text-[10px]", segBadge[supplier.segment])}>{supplier.segment}</Badge>
            <Badge variant="outline" className="text-[10px]" style={{ backgroundColor: `${SUPPLIER_TYPE_COLORS[supplier.type]}10`, color: SUPPLIER_TYPE_COLORS[supplier.type], borderColor: `${SUPPLIER_TYPE_COLORS[supplier.type]}30` }}>{supplier.type}</Badge>
            {supplier.evReady && <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">EV Ready</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Tier {supplier.tier} | {supplier.country} | {supplier.regions.join(", ")}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Overview & Role in Ecosystem</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{supplier.roleInEcosystem}</p>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Annual Spend</p>
            <p className="text-sm font-medium mt-0.5">{formatCurrencyShort(supplier.annualSpend)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Performance</p>
            <p className="text-sm font-medium mt-0.5">{supplier.performanceScore}/100</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Risk Score</p>
            <p className="text-sm font-medium mt-0.5">{supplier.riskScore}</p>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Capabilities & Footprint</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Regions</p>
            <div className="flex flex-wrap gap-1">
              {supplier.regions.map((r) => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Industry Coverage</p>
            <div className="flex flex-wrap gap-1">
              {supplier.industyCoverage.map((i) => <Badge key={i} variant="outline" className="text-[10px]">{i}</Badge>)}
            </div>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Capabilities</p>
            <div className="flex flex-wrap gap-1">
              {supplier.capabilities.map((c) => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {scorecard && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Performance Scorecard</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {(Object.keys(SCORECARD_LABELS) as Array<keyof typeof SCORECARD_LABELS>).map((dim) => {
                const score = scorecard.scores[dim]
                return (
                  <div key={dim} className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground w-36 shrink-0">{SCORECARD_LABELS[dim]}</p>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", score >= 85 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${score}%` }} />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{score}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <Separator />
        </>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Key Risks</h3>
        </div>
        <div className="space-y-1.5">
          {supplier.keyRisks.map((risk) => (
            <div key={risk} className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{risk}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Key Opportunities</h3>
        </div>
        <div className="space-y-1.5">
          {supplier.keyOpportunities.map((opp) => (
            <div key={opp} className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{opp}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Full Profile View ─────────────────────────────────────────────────── */

function FullProfileView({ profile }: { profile: FleetSupplierProfileFull }) {
  return (
    <div className="space-y-4">
      <ProfileHeader p={profile} />

      {/* ── INTERNAL METRICS DASHBOARD ── */}
      <div className="rounded-md bg-primary/[0.04] border border-primary/10 px-4 py-2 flex items-center gap-2.5">
        <div className="h-5 w-1 rounded-full bg-primary" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Internal Metrics Dashboard</span>
        <span className="text-[9px] text-muted-foreground ml-auto italic">Customer view -- not shared with supplier</span>
      </div>

      <div className="space-y-3">
        <CollapsiblePanel title="Commercial & Relationship" icon={<DollarSign className="h-3.5 w-3.5 text-primary" />}>
          <CommercialPanel p={profile} />
        </CollapsiblePanel>

        <CollapsiblePanel title="Performance & Governance (QBR)" icon={<BarChart3 className="h-3.5 w-3.5 text-primary" />}
          badge={<RagBadge rag={profile.performance.capaStatus === "On track" ? "green" : profile.performance.capaStatus === "At risk" ? "yellow" : "red"} label={profile.performance.capaStatus} />}>
          <PerformancePanel p={profile} />
        </CollapsiblePanel>

        <CollapsiblePanel title="Spend Concentration & Top SKUs" icon={<Package className="h-3.5 w-3.5 text-primary" />}>
          <SpendConcentrationPanel p={profile} />
        </CollapsiblePanel>

        <CollapsiblePanel title="Internal Risk Snapshot" icon={<Shield className="h-3.5 w-3.5 text-primary" />}
          badge={<RagBadge rag={profile.internalRisk.rag} label={`Score: ${profile.internalRisk.riskScore}`} />}>
          <InternalRiskPanel p={profile} />
        </CollapsiblePanel>
      </div>

      {/* ── EXTERNAL SUPPLIER PROFILE ── */}
      <div className="rounded-md bg-muted/40 border border-border px-4 py-2 flex items-center gap-2.5 mt-2">
        <div className="h-5 w-1 rounded-full bg-muted-foreground/50" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">External Supplier Profile</span>
        <span className="text-[9px] text-muted-foreground ml-auto italic">Market view -- public / third-party data</span>
      </div>

      <div className="space-y-3">
        <CollapsiblePanel title="Key Financial & Business Metrics" icon={<TrendingUp className="h-3.5 w-3.5 text-primary" />}>
          <ExternalFinancialsPanel p={profile} />
        </CollapsiblePanel>

        <CollapsiblePanel title="Footprint" icon={<Globe className="h-3.5 w-3.5 text-primary" />}>
          <FootprintPanel p={profile} />
        </CollapsiblePanel>

        <CollapsiblePanel title="Key Products & Services" icon={<Factory className="h-3.5 w-3.5 text-primary" />}>
          <BulletListPanel items={profile.keyProducts} />
        </CollapsiblePanel>

        <CollapsiblePanel title="Customers / Market Presence" icon={<Users className="h-3.5 w-3.5 text-primary" />}>
          <BulletListPanel items={profile.customers} />
        </CollapsiblePanel>

        <CollapsiblePanel title="Business Goals & Priorities" icon={<Lightbulb className="h-3.5 w-3.5 text-primary" />}>
          <BulletListPanel items={profile.businessGoals} />
        </CollapsiblePanel>

        <CollapsiblePanel title="Recent News" icon={<Newspaper className="h-3.5 w-3.5 text-primary" />}>
          <NewsPanel p={profile} />
        </CollapsiblePanel>

        <CollapsiblePanel title="Major External Risks" icon={<AlertTriangle className="h-3.5 w-3.5 text-primary" />}>
          <ExternalRisksPanel p={profile} />
        </CollapsiblePanel>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════════════════════════════════════ */

export function SupplierProfilesTab() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<SupplierType | "All">("All")
  const [selected, setSelected] = useState<FleetSupplier>(fleetSuppliers[0])

  const filtered = useMemo(() => {
    let list = fleetSuppliers
    if (typeFilter !== "All") list = list.filter((s) => s.type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q))
    }
    return list
  }, [search, typeFilter])

  const fullProfile = fleetSupplierProfilesFull[selected.id]

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
            {filtered.map((s) => {
              const hasFull = !!fleetSupplierProfilesFull[s.id]
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className={cn(
                    "w-full text-left rounded-md px-3 py-2.5 transition-colors",
                    selected.id === s.id ? "bg-accent" : "hover:bg-muted",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasFull && <span className="h-1.5 w-1.5 rounded-full bg-primary" title="Full profile available" />}
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SUPPLIER_TYPE_COLORS[s.type] }} />
                    <span className="text-[10px] text-muted-foreground">{s.type}</span>
                    <span className="text-[10px] text-muted-foreground">|</span>
                    <span className="text-[10px] text-muted-foreground">{formatCurrencyShort(s.annualSpend)}</span>
                  </div>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No suppliers found</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ─── Right: Supplier Profile Panel ─── */}
      <ScrollArea className="flex-1">
        <div className="p-5">
          {fullProfile ? (
            <FullProfileView profile={fullProfile} />
          ) : (
            <SimpleProfileView supplier={selected} />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
