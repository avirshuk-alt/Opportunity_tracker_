// ─── Risk Module Data Layer ────────────────────────────────────────────────
// Extends core Risk data with IRQ, supply risk, mitigation tracking, and
// computed KPIs used across the 4-tab Risk experience.

import {
  risks,
  type Risk,
  type RAG,
  riskScoreRAG,
  suppliers,
  getUserById,
  getSupplierById,
  getInitiativesByCategory,
  getRisksByCategory,
  contracts,
} from "@/lib/data"
import {
  fleetSuppliers,
  type FleetSupplier,
  upstreamDependencies,
} from "@/lib/supplier-strategy-data"

// ─── Risk Types ──────────────────────────────────────────────────────────────

export type RiskType = "Supply" | "Market" | "Internal"
export type IRRLevel = "Low" | "Medium" | "High" | "Critical"
export type MitigationStatus = "Not Started" | "In Progress" | "Complete" | "Overdue"

// ─── Extended Risk (with computed fields) ────────────────────────────────────

export interface ExtendedRisk extends Risk {
  riskType: RiskType
  inherentScore: number
  residualScore: number
  trend: "improving" | "worsening" | "stable"
  spendExposure: number
}

export function classifyRiskType(risk: Risk): RiskType {
  if (risk.scope === "Supplier" || risk.scope === "Material") return "Supply"
  // Use title keywords for Market vs Internal
  const t = risk.title.toLowerCase()
  if (
    t.includes("currency") ||
    t.includes("residual value") ||
    t.includes("regulatory") ||
    t.includes("market") ||
    t.includes("lead-time") ||
    t.includes("delivery")
  )
    return "Market"
  return "Internal"
}

export function getExtendedRisks(categoryId: string): ExtendedRisk[] {
  const catRisks = getRisksByCategory(categoryId)
  return catRisks.map((r) => {
    const inherentScore = r.likelihood * r.impact * r.detectability
    // Residual = inherent reduced by mitigation effectiveness
    const mitigationFactor = r.mitigationPlan
      ? r.status === "Mitigating"
        ? 0.65
        : r.status === "Accepted"
          ? 0.8
          : r.status === "Closed"
            ? 0.3
            : 0.9
      : 1.0
    const residualScore = Math.round(inherentScore * mitigationFactor)

    // Compute spend exposure
    let spendExposure = 0
    if (r.supplierId) {
      const s = getSupplierById(r.supplierId)
      if (s) spendExposure = s.annualSpend
    } else {
      // Category-level risk: use portion of total category spend
      spendExposure = r.riskScore > r.appetiteThreshold ? 2_500_000 : 1_000_000
    }

    // Trend based on score vs threshold
    const ratio = r.riskScore / r.appetiteThreshold
    const trend: "improving" | "worsening" | "stable" =
      r.status === "Closed" || r.status === "Accepted"
        ? "stable"
        : ratio > 1.5
          ? "worsening"
          : ratio > 1
            ? "stable"
            : "improving"

    return {
      ...r,
      riskType: classifyRiskType(r),
      inherentScore,
      residualScore,
      trend,
      spendExposure,
    }
  })
}

// ─── IRR (Inherent Risk Rating) per Supplier Engagement ──────────────────────

export type IRRDomain =
  | "Financial Stability"
  | "Operational Continuity"
  | "Regulatory & Compliance"
  | "Data Privacy & Security"
  | "ESG & Sustainability"
  | "Geopolitical Exposure"
  | "Concentration Risk"
  | "Contractual Risk"

export const ALL_IRR_DOMAINS: IRRDomain[] = [
  "Financial Stability",
  "Operational Continuity",
  "Regulatory & Compliance",
  "Data Privacy & Security",
  "ESG & Sustainability",
  "Geopolitical Exposure",
  "Concentration Risk",
  "Contractual Risk",
]

export interface DomainAssessment {
  domain: IRRDomain
  riskLevel: "Low" | "Medium" | "High"
  inScope: boolean
  notes: string
}

export interface SupplierEngagement {
  id: string
  supplierId: string
  supplierName: string
  engagement: string
  segment: string
  irrLevel: IRRLevel
  domains: DomainAssessment[]
  reassessmentCadence: string
  nextReviewDate: string
  triggeredDomainCount: number
}

export interface DueDiligenceItem {
  id: string
  supplierId: string
  supplierName: string
  domain: IRRDomain
  requiredAssessment: string
  status: "Complete" | "In Progress" | "Not Started" | "Overdue"
  owner: string
  dueDate: string
  overdue: boolean
}

function computeIRRLevel(supplier: FleetSupplier): IRRLevel {
  const rs = supplier.riskScore
  if (rs >= 45) return "Critical"
  if (rs >= 35) return "High"
  if (rs >= 25) return "Medium"
  return "Low"
}

function buildDomainAssessments(supplier: FleetSupplier): DomainAssessment[] {
  const deps = upstreamDependencies.filter((d) => d.parentId === supplier.id)
  const hasHighConcentration = deps.some((d) => d.concentration === "High")
  const hasGeoRisk = deps.some(
    (d) => d.geoExposure.includes("China") || d.geoExposure.includes("Korea")
  )

  return [
    {
      domain: "Financial Stability",
      riskLevel:
        supplier.signals.financial.creditRisk === "High"
          ? "High"
          : supplier.signals.financial.creditRisk === "Medium"
            ? "Medium"
            : "Low",
      inScope: true,
      notes: supplier.signals.financial.notes || `Margin trend: ${supplier.signals.financial.marginTrend}`,
    },
    {
      domain: "Operational Continuity",
      riskLevel: deps.some((d) => d.impact === "High") ? "High" : deps.length > 2 ? "Medium" : "Low",
      inScope: true,
      notes: `${deps.length} upstream dependencies identified.`,
    },
    {
      domain: "Regulatory & Compliance",
      riskLevel:
        supplier.signals.regulatory.some((r) => r.severity === "High")
          ? "High"
          : supplier.signals.regulatory.length > 1
            ? "Medium"
            : "Low",
      inScope: supplier.signals.regulatory.length > 0,
      notes:
        supplier.signals.regulatory.length > 0
          ? supplier.signals.regulatory[0].title
          : "No regulatory flags.",
    },
    {
      domain: "Data Privacy & Security",
      riskLevel:
        supplier.type === "Telematics"
          ? "High"
          : supplier.type === "FMC"
            ? "Medium"
            : "Low",
      inScope: supplier.type === "Telematics" || supplier.type === "FMC",
      notes:
        supplier.type === "Telematics"
          ? "Telematics data processing requires GDPR/CCPA compliance."
          : "Standard data handling.",
    },
    {
      domain: "ESG & Sustainability",
      riskLevel:
        supplier.signals.esg.level === "Elevated"
          ? "High"
          : supplier.signals.esg.level === "Watch"
            ? "Medium"
            : "Low",
      inScope: supplier.signals.esg.level !== "None",
      notes: supplier.signals.esg.notes || "No ESG concerns.",
    },
    {
      domain: "Geopolitical Exposure",
      riskLevel: hasGeoRisk ? "High" : hasHighConcentration ? "Medium" : "Low",
      inScope: hasGeoRisk || hasHighConcentration,
      notes: hasGeoRisk
        ? "Upstream dependencies in high-risk geographies."
        : "Limited geopolitical exposure.",
    },
    {
      domain: "Concentration Risk",
      riskLevel:
        supplier.ourDependencyScore >= 80
          ? "High"
          : supplier.ourDependencyScore >= 50
            ? "Medium"
            : "Low",
      inScope: supplier.ourDependencyScore >= 50,
      notes: `Our dependency score: ${supplier.ourDependencyScore}/100.`,
    },
    {
      domain: "Contractual Risk",
      riskLevel: !supplier.contractCoverage
        ? "High"
        : supplier.contractRenewal <= "2026-Q2"
          ? "Medium"
          : "Low",
      inScope: true,
      notes: supplier.contractCoverage
        ? `Contract renews ${supplier.contractRenewal}.`
        : "No MSA in place.",
    },
  ]
}

export function getSupplierEngagements(): SupplierEngagement[] {
  return fleetSuppliers.map((s) => {
    const domains = buildDomainAssessments(s)
    const triggeredCount = domains.filter(
      (d) => d.inScope && d.riskLevel !== "Low"
    ).length
    return {
      id: `eng-${s.id}`,
      supplierId: s.id,
      supplierName: s.name,
      engagement: s.contractType,
      segment: s.segment,
      irrLevel: computeIRRLevel(s),
      domains,
      reassessmentCadence:
        s.segment === "Strategic"
          ? "Quarterly"
          : s.segment === "Preferred"
            ? "Semi-Annual"
            : "Annual",
      nextReviewDate:
        s.segment === "Strategic"
          ? "2026-Q2"
          : s.segment === "Preferred"
            ? "2026-Q3"
            : "2026-Q4",
      triggeredDomainCount: triggeredCount,
    }
  })
}

export function getDueDiligenceItems(): DueDiligenceItem[] {
  const items: DueDiligenceItem[] = []
  const engagements = getSupplierEngagements()

  for (const eng of engagements) {
    for (const d of eng.domains) {
      if (!d.inScope) continue
      const isOverdue =
        d.riskLevel === "High" && eng.nextReviewDate <= "2026-Q2"
      items.push({
        id: `dd-${eng.supplierId}-${d.domain.replace(/\s/g, "-")}`,
        supplierId: eng.supplierId,
        supplierName: eng.supplierName,
        domain: d.domain,
        requiredAssessment:
          d.riskLevel === "High"
            ? "Full Assessment"
            : d.riskLevel === "Medium"
              ? "Desktop Review"
              : "Self-Certification",
        status: isOverdue
          ? "Overdue"
          : d.riskLevel === "Low"
            ? "Complete"
            : d.riskLevel === "Medium"
              ? "In Progress"
              : "Not Started",
        owner:
          eng.segment === "Strategic" ? "Marcus Rodriguez" : "Emily Watson",
        dueDate: eng.nextReviewDate,
        overdue: isOverdue,
      })
    }
  }
  return items
}

// ─── Overview KPIs ───────────────────────────────────────────────────────────

export interface RiskKPI {
  id: string
  label: string
  value: string
  trend: "up" | "down" | "flat"
  trendLabel: string
  filterAction?: { tab: string; filter: Record<string, string> }
}

export function getRiskOverviewKPIs(categoryId: string): RiskKPI[] {
  const extended = getExtendedRisks(categoryId)
  const engagements = getSupplierEngagements()

  // Residual Exposure (spend-weighted)
  const totalResidualExposure = extended.reduce(
    (sum, r) =>
      sum + (r.residualScore > r.appetiteThreshold ? r.spendExposure : 0),
    0
  )

  // Critical Spend at Risk
  const criticalSpend = extended
    .filter((r) => r.riskType === "Supply" && r.residualScore > r.appetiteThreshold)
    .reduce((sum, r) => sum + r.spendExposure, 0)

  // High IRR Suppliers
  const highIRR = engagements.filter(
    (e) => e.irrLevel === "High" || e.irrLevel === "Critical"
  ).length

  // Overdue Mitigations
  const overdueMitigations = extended.filter(
    (r) =>
      r.status === "Open" &&
      r.riskScore > r.appetiteThreshold &&
      r.mitigationPlan === undefined
  ).length

  return [
    {
      id: "residual-exposure",
      label: "Residual Exposure",
      value: formatSpend(totalResidualExposure),
      trend: totalResidualExposure > 10_000_000 ? "up" : "flat",
      trendLabel:
        totalResidualExposure > 10_000_000 ? "+8% vs last quarter" : "Stable",
      filterAction: {
        tab: "register",
        filter: { aboveAppetite: "true" },
      },
    },
    {
      id: "critical-spend",
      label: "Critical Spend at Risk",
      value: formatSpend(criticalSpend),
      trend: criticalSpend > 5_000_000 ? "up" : "down",
      trendLabel: criticalSpend > 5_000_000 ? "+$1.2M" : "-$400K",
      filterAction: {
        tab: "register",
        filter: { riskType: "Supply", aboveAppetite: "true" },
      },
    },
    {
      id: "high-irr",
      label: "High IRR Suppliers",
      value: `${highIRR}`,
      trend: highIRR > 3 ? "up" : "flat",
      trendLabel: highIRR > 3 ? "+1 this month" : "No change",
      filterAction: {
        tab: "supply-risk",
        filter: { irrLevel: "High" },
      },
    },
    {
      id: "overdue-mitigations",
      label: "Overdue Mitigations",
      value: `${overdueMitigations}`,
      trend: overdueMitigations > 0 ? "up" : "down",
      trendLabel:
        overdueMitigations > 0
          ? `${overdueMitigations} require action`
          : "All on track",
      filterAction: {
        tab: "mitigation",
        filter: { overdueOnly: "true" },
      },
    },
  ]
}

// ─── Mitigation Actions ──────────────────────────────────────────────────────

export interface MitigationAction {
  id: string
  linkedRiskId: string
  linkedRiskTitle: string
  riskType: RiskType
  supplierName?: string
  owner: string
  dueDate: string
  status: MitigationStatus
  expectedReduction: number
  tasks: { label: string; done: boolean }[]
}

export function getMitigationActions(categoryId: string): MitigationAction[] {
  const extended = getExtendedRisks(categoryId)
  return extended
    .filter((r) => r.mitigationPlan || r.status === "Mitigating")
    .map((r, i) => {
      const owner = getUserById(r.ownerId)
      const supplier = r.supplierId ? getSupplierById(r.supplierId) : undefined
      const reduction = Math.round(
        r.spendExposure * (r.status === "Mitigating" ? 0.35 : 0.15)
      )
      const isOverdue =
        r.status === "Open" && r.riskScore > r.appetiteThreshold
      return {
        id: `ma-${r.id}`,
        linkedRiskId: r.id,
        linkedRiskTitle: r.title,
        riskType: r.riskType,
        supplierName: supplier?.name,
        owner: owner?.name ?? "Unassigned",
        dueDate: isOverdue
          ? "2026-02-15"
          : r.status === "Mitigating"
            ? "2026-Q2"
            : "2026-Q3",
        status: isOverdue
          ? ("Overdue" as MitigationStatus)
          : r.status === "Mitigating"
            ? ("In Progress" as MitigationStatus)
            : r.status === "Closed"
              ? ("Complete" as MitigationStatus)
              : ("Not Started" as MitigationStatus),
        expectedReduction: reduction,
        tasks: r.mitigationPlan
          ? r.mitigationPlan.split(",").map((t, j) => ({
              label: t.trim(),
              done: j === 0 && r.status === "Mitigating",
            }))
          : [{ label: "Define mitigation plan", done: false }],
      }
    })
}

export function getExposureReduction(categoryId: string) {
  const actions = getMitigationActions(categoryId)
  const extended = getExtendedRisks(categoryId)

  const currentResidual = extended.reduce(
    (sum, r) =>
      sum + (r.residualScore > r.appetiteThreshold ? r.spendExposure : 0),
    0
  )
  const expectedReduction = actions
    .filter((a) => a.status !== "Complete")
    .reduce((sum, a) => sum + a.expectedReduction, 0)

  const expectedResidual = Math.max(0, currentResidual - expectedReduction)
  const pctReduction =
    currentResidual > 0
      ? Math.round(((currentResidual - expectedResidual) / currentResidual) * 100)
      : 0

  return {
    currentResidual,
    expectedResidual,
    expectedReduction,
    pctReduction,
  }
}

// ─── What Changed ────────────────────────────────────────────────────────────

export interface RiskChange {
  riskTitle: string
  category: string
  changeType: "Score Increase" | "New Risk" | "Status Change" | "Threshold Breach"
  date: string
}

export function getRecentRiskChanges(categoryId: string): RiskChange[] {
  const catRisks = getRisksByCategory(categoryId)
  const changes: RiskChange[] = []

  // Simulate recent changes based on risk data
  for (const r of catRisks) {
    if (r.riskScore > r.appetiteThreshold * 1.5) {
      changes.push({
        riskTitle: r.title.length > 40 ? r.title.slice(0, 37) + "..." : r.title,
        category: r.scope,
        changeType: "Threshold Breach",
        date: "Feb 10",
      })
    }
    if (r.status === "Open" && r.createdAt >= "2026-01-15") {
      changes.push({
        riskTitle: r.title.length > 40 ? r.title.slice(0, 37) + "..." : r.title,
        category: r.scope,
        changeType: "New Risk",
        date: r.createdAt.slice(5).replace("-", "/"),
      })
    }
    if (r.status === "Mitigating") {
      changes.push({
        riskTitle: r.title.length > 40 ? r.title.slice(0, 37) + "..." : r.title,
        category: r.scope,
        changeType: "Status Change",
        date: "Feb 8",
      })
    }
  }

  return changes.slice(0, 8)
}

// ─── Segment Summary (for Supply Risk tab) ──────────────────────────────────

export interface SegmentSummary {
  segment: string
  count: number
  spend: number
  highIRR: number
  pctHighIRR: number
}

export function getSegmentSummary(): SegmentSummary[] {
  const engagements = getSupplierEngagements()
  const segments = ["Strategic", "Preferred", "Approved", "Transactional"]

  return segments.map((seg) => {
    const inSeg = engagements.filter((e) => e.segment === seg)
    const spend = fleetSuppliers
      .filter((s) => s.segment === seg)
      .reduce((sum, s) => sum + s.annualSpend, 0)
    const highIRR = inSeg.filter(
      (e) => e.irrLevel === "High" || e.irrLevel === "Critical"
    ).length
    return {
      segment: seg,
      count: inSeg.length,
      spend,
      highIRR,
      pctHighIRR: inSeg.length > 0 ? Math.round((highIRR / inSeg.length) * 100) : 0,
    }
  })
}

// ─── Supplier → Procurement Category Mapping ────────────────────────────────

const SUPPLIER_CATEGORY_MAP: Record<string, string[]> = {
  "fs-1":  ["Fleet Vehicles (OEM)"],                     // Ford
  "fs-2":  ["Fleet Vehicles (OEM)"],                     // Stellantis
  "fs-3":  ["Fleet Management (FMC)"],                   // Holman
  "fs-4":  ["Fleet Management (FMC)"],                   // LeasePlan
  "fs-5":  ["Dealer Services"],                          // AutoNation
  "fs-6":  ["Dealer Services"],                          // Pendragon
  "fs-7":  ["Maintenance & Repair"],                     // Penske
  "fs-8":  ["Maintenance & Repair"],                     // Kwik Fit
  "fs-9":  ["Telematics & Connected Vehicle"],           // Geotab
  "fs-10": ["Remarketing & Disposal"],                   // ADESA
  "fs-11": ["Fleet Insurance"],                          // Zurich
  "fs-12": ["Remarketing & Disposal"],                   // Manheim
}

export function getCategoriesForSupplier(supplierId: string): string[] {
  return SUPPLIER_CATEGORY_MAP[supplierId] ?? []
}

export function getSuppliersForCategory(categoryName: string): string[] {
  return Object.entries(SUPPLIER_CATEGORY_MAP)
    .filter(([, cats]) => cats.includes(categoryName))
    .map(([id]) => id)
}

export function getAllProcurementCategoryNames(): string[] {
  return PROCUREMENT_CATEGORIES.map((c) => c.category)
}

// ─── Procurement Category Risk (for Risk Registration tab) ──────────────────

export interface ProcurementCategoryRisk {
  id: string
  category: string
  aggregatedIRR: IRRLevel
  impact: number       // 1-5
  likelihood: number   // 1-5
  appetiteThreshold: string
  rationale: string
  spend: number
  supplierCount: number
  aboveAppetite: boolean
}

const PROCUREMENT_CATEGORIES: ProcurementCategoryRisk[] = [
  {
    id: "pc-1", category: "Fleet Vehicles (OEM)", aggregatedIRR: "High",
    impact: 4, likelihood: 3, appetiteThreshold: "Medium",
    rationale: "Strategic OEM dependency + EV transition risk + delivery lead-time volatility. Weighted by Ford (Critical) and Stellantis (High) exposure.",
    spend: 13_600_000, supplierCount: 2, aboveAppetite: true,
  },
  {
    id: "pc-2", category: "Fleet Management (FMC)", aggregatedIRR: "Medium",
    impact: 5, likelihood: 2, appetiteThreshold: "Medium",
    rationale: "High operational dependency on Holman (single FMC for NA). LeasePlan provides EMEA diversification but merger integration risk persists.",
    spend: 15_800_000, supplierCount: 2, aboveAppetite: false,
  },
  {
    id: "pc-3", category: "Dealer Services", aggregatedIRR: "High",
    impact: 3, likelihood: 4, appetiteThreshold: "Low",
    rationale: "Pendragon (UK) has no MSA and High credit risk. AutoNation stable but regional pricing inconsistency. Critical IRR override from Pendragon.",
    spend: 6_700_000, supplierCount: 2, aboveAppetite: true,
  },
  {
    id: "pc-4", category: "Maintenance & Repair", aggregatedIRR: "Medium",
    impact: 3, likelihood: 2, appetiteThreshold: "Medium",
    rationale: "Penske strong and low risk. Kwik Fit lacks EV capability but Bridgestone backing mitigates financial risk. Weighted aggregate is Medium.",
    spend: 4_600_000, supplierCount: 2, aboveAppetite: false,
  },
  {
    id: "pc-5", category: "Telematics & Connected Vehicle", aggregatedIRR: "Medium",
    impact: 4, likelihood: 2, appetiteThreshold: "Medium",
    rationale: "Geotab is low operational risk but elevated data privacy exposure (GDPR/CCPA). Strategic concentration on single provider.",
    spend: 2_800_000, supplierCount: 1, aboveAppetite: false,
  },
  {
    id: "pc-6", category: "Remarketing & Disposal", aggregatedIRR: "High",
    impact: 3, likelihood: 4, appetiteThreshold: "Low",
    rationale: "EV residual value uncertainty + Manheim has no MSA. ADESA adequate but market volatility drives aggregated risk up.",
    spend: 2_400_000, supplierCount: 2, aboveAppetite: true,
  },
  {
    id: "pc-7", category: "Fleet Insurance", aggregatedIRR: "Low",
    impact: 3, likelihood: 1, appetiteThreshold: "Medium",
    rationale: "Zurich global program is well-structured. Low claims frequency. EV repair cost uncertainty is emerging but manageable.",
    spend: 3_800_000, supplierCount: 1, aboveAppetite: false,
  },
]

export function getProcurementCategories(): ProcurementCategoryRisk[] {
  return PROCUREMENT_CATEGORIES
}

export interface IRRSummaryRow {
  level: IRRLevel
  categoryCount: number
  pctOfSpend: number
  aboveAppetite: boolean
}

export function getIRRSummary(): IRRSummaryRow[] {
  const cats = getProcurementCategories()
  const totalSpend = cats.reduce((s, c) => s + c.spend, 0)
  const levels: IRRLevel[] = ["Critical", "High", "Medium", "Low"]
  return levels.map((level) => {
    const matching = cats.filter((c) => c.aggregatedIRR === level)
    return {
      level,
      categoryCount: matching.length,
      pctOfSpend: totalSpend > 0 ? Math.round((matching.reduce((s, c) => s + c.spend, 0) / totalSpend) * 100) : 0,
      aboveAppetite: matching.some((c) => c.aboveAppetite),
    }
  }).filter((r) => r.categoryCount > 0)
}

// ─── IRQ Detail (for Strategic supplier IRR drill-down) ─────────────────────

export interface IRQRiskDomainDetail {
  domain: IRRDomain
  triggered: boolean
  riskLevel: "Low" | "Medium" | "High"
  keyDrivers: string[]
  additionalInsights: string
}

export interface IRQDetail {
  supplierId: string
  supplierName: string
  overallIRR: IRRLevel
  domains: IRQRiskDomainDetail[]
  challenges: string[]
}

export function getIRQDetail(supplierId: string): IRQDetail | null {
  const eng = getSupplierEngagements().find((e) => e.supplierId === supplierId)
  if (!eng) return null

  const supplier = fleetSuppliers.find((s) => s.id === supplierId)
  if (!supplier) return null

  const domains: IRQRiskDomainDetail[] = eng.domains.map((d) => {
    const triggered = d.inScope && d.riskLevel !== "Low"
    const drivers: string[] = []

    // Generate realistic key risk drivers
    if (d.domain === "Financial Stability") {
      if (d.riskLevel === "High") drivers.push("Credit rating downgrade risk", "Margin compression below industry average")
      else if (d.riskLevel === "Medium") drivers.push("Merger integration uncertainty", "Currency exposure across multiple markets")
      else drivers.push("Stable financials, low credit risk")
    } else if (d.domain === "Operational Continuity") {
      if (d.riskLevel === "High") drivers.push("Single-source upstream dependency", "Capacity constraints during peak demand")
      else if (d.riskLevel === "Medium") drivers.push("Multiple upstream dependencies identified", "Regional service gaps")
      else drivers.push("Redundant operations, minimal disruption risk")
    } else if (d.domain === "Regulatory & Compliance") {
      if (d.riskLevel === "High") drivers.push("Active regulatory investigation", "Non-compliance penalties pending")
      else if (d.riskLevel === "Medium") drivers.push("Audit findings require remediation", "Cross-border compliance complexity")
      else drivers.push("No active regulatory concerns")
    } else if (d.domain === "Data Privacy & Security") {
      if (d.riskLevel === "High") drivers.push("GDPR/CCPA driver tracking exposure", "SOC 2 audit gaps identified")
      else if (d.riskLevel === "Medium") drivers.push("Cross-border data processing", "Driver data consent management")
      else drivers.push("Standard data handling protocols")
    } else if (d.domain === "ESG & Sustainability") {
      if (d.riskLevel === "High") drivers.push("Supply chain labor practices concern", "No published sustainability targets")
      else if (d.riskLevel === "Medium") drivers.push("Under scrutiny for upstream practices", "Limited ESG reporting")
      else drivers.push("ESG commitments align with requirements")
    } else if (d.domain === "Geopolitical Exposure") {
      if (d.riskLevel === "High") drivers.push("Upstream dependencies in high-risk geographies", "Trade restriction vulnerability")
      else if (d.riskLevel === "Medium") drivers.push("Regional supply chain concentration", "Moderate geopolitical sensitivity")
      else drivers.push("Limited geopolitical exposure")
    } else if (d.domain === "Concentration Risk") {
      if (d.riskLevel === "High") drivers.push("Dependency score >80%", "No viable alternative supplier identified")
      else if (d.riskLevel === "Medium") drivers.push("Dependency score 50-80%", "Alternative suppliers available but unqualified")
      else drivers.push("Diversified supply base")
    } else if (d.domain === "Contractual Risk") {
      if (d.riskLevel === "High") drivers.push("No MSA in place", "Unfavorable termination clauses")
      else if (d.riskLevel === "Medium") drivers.push("Contract renewal within 6 months", "Limited SLA coverage")
      else drivers.push("Comprehensive contract coverage")
    }

    return {
      domain: d.domain,
      triggered,
      riskLevel: d.riskLevel,
      keyDrivers: drivers,
      additionalInsights: d.notes,
    }
  })

  const challenges: string[] = []
  if (eng.irrLevel === "Critical" || eng.irrLevel === "High") {
    challenges.push(
      `${eng.triggeredDomainCount} risk domains triggered requiring immediate attention`,
      `Reassessment cadence: ${eng.reassessmentCadence} - next review ${eng.nextReviewDate}`
    )
  }
  if (supplier.ourDependencyScore >= 80) {
    challenges.push(`High dependency score (${supplier.ourDependencyScore}/100) limits negotiation leverage`)
  }

  return {
    supplierId,
    supplierName: eng.supplierName,
    overallIRR: eng.irrLevel,
    domains,
    challenges,
  }
}

// ─── Ongoing Risk & Performance Monitoring ──────────────────────────────────

export interface MonitoringItem {
  id: string
  supplierId: string
  supplierName: string
  category: string
  riskDomain: IRRDomain
  monitoringActivity: string
  owner: string
  cadence: string
  status: "On Track" | "Due Soon" | "Overdue" | "Complete"
  overdueFlag: boolean
}

export function getMonitoringItems(): MonitoringItem[] {
  const engagements = getSupplierEngagements()
  const items: MonitoringItem[] = []

  for (const eng of engagements) {
    const cats = getCategoriesForSupplier(eng.supplierId)
    const categoryLabel = cats.length > 0 ? cats[0] : eng.engagement

    for (const d of eng.domains) {
      if (!d.inScope) continue

      const cadence =
        d.riskLevel === "High" ? "Monthly" :
        d.riskLevel === "Medium" ? "Quarterly" :
        eng.reassessmentCadence

      const isOverdue = d.riskLevel === "High" && eng.nextReviewDate <= "2026-Q2"
      const isDueSoon = !isOverdue && d.riskLevel === "High"
      const isComplete = d.riskLevel === "Low"

      items.push({
        id: `mon-${eng.supplierId}-${d.domain.replace(/\s/g, "-")}`,
        supplierId: eng.supplierId,
        supplierName: eng.supplierName,
        category: categoryLabel,
        riskDomain: d.domain,
        monitoringActivity:
          d.riskLevel === "High" ? "Full Assessment + Executive Review" :
          d.riskLevel === "Medium" ? "Desktop Review + KPI Monitoring" :
          "Self-Certification",
        owner: eng.segment === "Strategic" ? "Marcus Rodriguez" : "Emily Watson",
        cadence,
        status: isOverdue ? "Overdue" : isDueSoon ? "Due Soon" : isComplete ? "Complete" : "On Track",
        overdueFlag: isOverdue,
      })
    }
  }
  return items
}

// ─── Supplier Table for Segmentation ────────────────────────────────────────

export interface SegmentationSupplier {
  id: string
  name: string
  segment: string
  spend: number
  categoriesServed: string[]
  whatTheySupply: string
  highestIRR: IRRLevel
  nextReview: string
}

export function getSegmentationSuppliers(): SegmentationSupplier[] {
  const engagements = getSupplierEngagements()
  return fleetSuppliers.map((s) => {
    const eng = engagements.find((e) => e.supplierId === s.id)
    return {
      id: s.id,
      name: s.name,
      segment: s.segment,
      spend: s.annualSpend,
      categoriesServed: getCategoriesForSupplier(s.id),
      whatTheySupply: s.roleInEcosystem.split(".")[0],
      highestIRR: eng?.irrLevel ?? "Low",
      nextReview: eng?.nextReviewDate ?? "TBD",
    }
  })
}

// ─── Category Heatmap Data ──────────────────────────────────────────────────

export interface HeatmapCell {
  category: string
  domain: string
  level: "Low" | "Medium" | "High" | "N/A"
}

export function getSupplierHeatmap(supplierId: string): HeatmapCell[] {
  const eng = getSupplierEngagements().find((e) => e.supplierId === supplierId)
  if (!eng) return []

  return eng.domains.map((d) => ({
    category: eng.engagement,
    domain: d.domain,
    level: d.inScope ? d.riskLevel : "N/A",
  }))
}

// ─── Mitigation Actions (Updated for High/Critical IRR focus) ───────────────

export interface EnhancedMitigationAction extends MitigationAction {
  irrLevel: IRRLevel
  actionRecommendation: string
  estimatedCostReduction: number
}

export function getEnhancedMitigationActions(categoryId: string): EnhancedMitigationAction[] {
  const engagements = getSupplierEngagements()
  const highCritical = engagements.filter(
    (e) => e.irrLevel === "High" || e.irrLevel === "Critical"
  )

  const actions: EnhancedMitigationAction[] = []

  for (const eng of highCritical) {
    const supplier = fleetSuppliers.find((s) => s.id === eng.supplierId)
    if (!supplier) continue

    const triggeredDomains = eng.domains.filter((d) => d.inScope && d.riskLevel !== "Low")

    for (const domain of triggeredDomains) {
      let recommendation = ""
      let costReduction = 0

      if (domain.domain === "Financial Stability") {
        recommendation = "Establish financial monitoring program with quarterly credit reviews and contingency planning"
        costReduction = Math.round(supplier.annualSpend * 0.02)
      } else if (domain.domain === "Operational Continuity") {
        recommendation = "Dual-source critical components and establish business continuity protocols"
        costReduction = Math.round(supplier.annualSpend * 0.05)
      } else if (domain.domain === "Regulatory & Compliance") {
        recommendation = "Conduct compliance audit and establish regulatory change monitoring"
        costReduction = Math.round(supplier.annualSpend * 0.01)
      } else if (domain.domain === "Data Privacy & Security") {
        recommendation = "Implement data processing agreement review and SOC 2 compliance validation"
        costReduction = Math.round(supplier.annualSpend * 0.015)
      } else if (domain.domain === "ESG & Sustainability") {
        recommendation = "Require ESG disclosure and establish sustainability KPI monitoring"
        costReduction = Math.round(supplier.annualSpend * 0.01)
      } else if (domain.domain === "Geopolitical Exposure") {
        recommendation = "Map upstream supply chain geography and establish alternative sourcing options"
        costReduction = Math.round(supplier.annualSpend * 0.03)
      } else if (domain.domain === "Concentration Risk") {
        recommendation = "Qualify alternative suppliers and develop transition playbook"
        costReduction = Math.round(supplier.annualSpend * 0.04)
      } else if (domain.domain === "Contractual Risk") {
        recommendation = "Negotiate MSA with performance SLAs and penalty clauses"
        costReduction = Math.round(supplier.annualSpend * 0.06)
      }

      actions.push({
        id: `ema-${eng.supplierId}-${domain.domain.replace(/\s/g, "-")}`,
        linkedRiskId: `risk-${eng.supplierId}`,
        linkedRiskTitle: `${domain.domain} risk for ${eng.supplierName}`,
        riskType: "Supply",
        supplierName: eng.supplierName,
        owner: eng.segment === "Strategic" ? "Marcus Rodriguez" : "Emily Watson",
        dueDate: domain.riskLevel === "High" ? "2026-Q2" : "2026-Q3",
        status: domain.riskLevel === "High" ? "In Progress" as MitigationStatus : "Not Started" as MitigationStatus,
        expectedReduction: costReduction,
        tasks: [
          { label: `Assess ${domain.domain.toLowerCase()} exposure`, done: domain.riskLevel === "High" },
          { label: `Implement ${recommendation.split(" ").slice(0, 4).join(" ").toLowerCase()}`, done: false },
          { label: "Validate risk reduction and update IRR", done: false },
        ],
        irrLevel: eng.irrLevel,
        actionRecommendation: recommendation,
        estimatedCostReduction: costReduction,
      })
    }
  }

  return actions
}

export function getEnhancedExposureReduction(categoryId: string) {
  const actions = getEnhancedMitigationActions(categoryId)

  const highCritEngagements = getSupplierEngagements().filter(
    (e) => e.irrLevel === "High" || e.irrLevel === "Critical"
  )
  const currentExposure = highCritEngagements.reduce((sum, e) => {
    const s = fleetSuppliers.find((fs) => fs.id === e.supplierId)
    return sum + (s?.annualSpend ?? 0)
  }, 0)

  const totalReduction = actions.reduce((sum, a) => sum + a.estimatedCostReduction, 0)
  const projectedExposure = Math.max(0, currentExposure - totalReduction)
  const pctReduction = currentExposure > 0 ? Math.round((totalReduction / currentExposure) * 100) : 0

  return {
    currentExposure,
    projectedExposure,
    totalReduction,
    pctReduction,
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatSpend(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

export { formatSpend }
