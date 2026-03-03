/**
 * Unified insights adapter.
 * Gathers evidence from every data source (requirements, objectives,
 * risks, initiatives, saved internal insights) and normalises them into
 * a single `UnifiedInsight` shape that the authoring UI can reference.
 */

import {
  getObjectivesByCategory,
  getRequirementsByCategory,
  getRisksByCategory,
  getInitiativesByCategory,
  getRoadmapByCategory,
  type BusinessRequirement,
  type Risk,
  type Initiative,
  type Objective,
  type RoadmapItem,
} from "@/lib/data"
import { listInternalInsights, type InternalFactInsight } from "@/lib/internal-insights"

// ─── Unified Insight ────────────────────────────────────────────────────────

export type InsightSource =
  | "requirement"
  | "objective"
  | "risk"
  | "opportunity"     // = initiative
  | "internal-fact"
  | "external-intel"

export interface UnifiedInsight {
  id: string
  title: string
  text: string
  source: InsightSource
  /** Human-readable source label, e.g. "Requirement BR-1" */
  sourceLabel: string
  tags: string[]
  /** Links to objective / risk / initiative IDs for traceability */
  linkedIds: string[]
  /** Impact category for filtering */
  driver?: string
  /** Priority / severity / confidence */
  weight: number
}

// ─── Adapters ───────────────────────────────────────────────────────────────

function fromRequirement(r: BusinessRequirement): UnifiedInsight {
  return {
    id: r.id,
    title: r.title,
    text: r.statement,
    source: "requirement",
    sourceLabel: `Requirement ${r.id.toUpperCase()}`,
    tags: [...r.tags, r.driver],
    linkedIds: r.objectiveId ? [r.objectiveId] : [],
    driver: r.driver,
    weight: r.priority === "Must" ? 3 : r.priority === "Should" ? 2 : 1,
  }
}

function fromObjective(o: Objective): UnifiedInsight {
  return {
    id: o.id,
    title: o.title,
    text: o.description,
    source: "objective",
    sourceLabel: `Objective ${o.id.toUpperCase()}`,
    tags: [],
    linkedIds: o.requirementIds,
    weight: 3,
  }
}

function fromRisk(r: Risk): UnifiedInsight {
  return {
    id: r.id,
    title: r.title,
    text: r.mitigationPlan ?? `Risk score ${r.riskScore} (threshold ${r.appetiteThreshold}). Status: ${r.status}.`,
    source: "risk",
    sourceLabel: `Risk ${r.id.toUpperCase()}`,
    tags: [r.scope, r.status],
    linkedIds: r.linkedInitiativeId ? [r.linkedInitiativeId] : [],
    driver: r.scope,
    weight: r.riskScore >= 30 ? 3 : r.riskScore >= 20 ? 2 : 1,
  }
}

function fromInitiative(i: Initiative): UnifiedInsight {
  return {
    id: i.id,
    title: i.title,
    text: i.description,
    source: "opportunity",
    sourceLabel: `Initiative ${i.id.toUpperCase()}`,
    tags: [i.stage, i.effort],
    linkedIds: i.risks,
    driver: i.effort,
    weight: i.confidence >= 75 ? 3 : i.confidence >= 50 ? 2 : 1,
  }
}

function fromInternalFact(f: InternalFactInsight): UnifiedInsight {
  return {
    id: f.id,
    title: f.title,
    text: f.text,
    source: "internal-fact",
    sourceLabel: `Fact: ${f.sourceContext}`,
    tags: [...f.tags],
    linkedIds: [],
    weight: f.confidence === "High" ? 3 : f.confidence === "Medium" ? 2 : 1,
  }
}

// ─── Main query function ────────────────────────────────────────────────────

export interface InsightFilters {
  sources?: InsightSource[]
  search?: string
}

export function getAllInsightsForCategory(
  categoryId: string,
  filters?: InsightFilters,
): UnifiedInsight[] {
  const reqs = getRequirementsByCategory(categoryId).map(fromRequirement)
  const objs = getObjectivesByCategory(categoryId).map(fromObjective)
  const rsks = getRisksByCategory(categoryId).map(fromRisk)
  const inits = getInitiativesByCategory(categoryId).map(fromInitiative)
  const facts = listInternalInsights().map(fromInternalFact)

  let all = [...reqs, ...objs, ...rsks, ...inits, ...facts]

  if (filters?.sources && filters.sources.length > 0) {
    all = all.filter((i) => filters.sources!.includes(i.source))
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase()
    all = all.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.text.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }
  return all.sort((a, b) => b.weight - a.weight)
}

// ─── Roadmap helper ─────────────────────────────────────────────────────────

export interface RoadmapPhaseItem {
  id: string
  title: string
  initiativeId: string
  objectiveIds: string[]
  wave: number
  progress: number
}

export function getRoadmapPhasesForCategory(categoryId: string): {
  stabilize: RoadmapPhaseItem[]
  optimize: RoadmapPhaseItem[]
  transform: RoadmapPhaseItem[]
} {
  const roadmapItems = getRoadmapByCategory(categoryId)
  const initiatives = getInitiativesByCategory(categoryId)

  function toPhaseItem(rm: RoadmapItem): RoadmapPhaseItem {
    const init = initiatives.find((i) => i.id === rm.initiativeId)
    return {
      id: rm.id,
      title: init?.title ?? rm.initiativeId,
      initiativeId: rm.initiativeId,
      objectiveIds: [], // linkable by UI
      wave: rm.wave,
      progress: rm.progress,
    }
  }

  const all = roadmapItems.map(toPhaseItem)

  return {
    stabilize: all.filter((r) => r.wave === 1),
    optimize: all.filter((r) => r.wave === 2),
    transform: all.filter((r) => r.wave >= 3),
  }
}

// ─── Stub AI generators (deterministic, no LLM) ────────────────────────────

/** Generate objective suggestions from requirements + risks */
export function suggestObjectives(categoryId: string): { title: string; description: string; derivedFrom: string[] }[] {
  const reqs = getRequirementsByCategory(categoryId)
  const risks = getRisksByCategory(categoryId).filter((r) => r.riskScore >= 25)
  const inits = getInitiativesByCategory(categoryId)

  const suggestions: { title: string; description: string; derivedFrom: string[] }[] = []

  // From requirements
  for (const r of reqs.slice(0, 3)) {
    suggestions.push({
      title: `Achieve: ${r.title}`,
      description: r.statement.length > 120 ? r.statement.substring(0, 120) + "..." : r.statement,
      derivedFrom: [r.id],
    })
  }

  // From high-score risks
  for (const r of risks.slice(0, 2)) {
    suggestions.push({
      title: `Mitigate: ${r.title}`,
      description: r.mitigationPlan ?? `Address risk (score ${r.riskScore}) to bring within appetite threshold.`,
      derivedFrom: [r.id],
    })
  }

  // From top initiative
  if (inits.length > 0) {
    const top = inits.sort((a, b) => b.targetSavings - a.targetSavings)[0]
    suggestions.push({
      title: `Deliver: ${top.title}`,
      description: `Realize $${(top.targetSavings / 1e6).toFixed(1)}M in savings through ${top.description.split(".")[0].toLowerCase()}.`,
      derivedFrom: [top.id],
    })
  }

  return suggestions
}

/** Generate macro perspective observations */
export function generateMacroObservations(categoryId: string): { title: string; text: string; sourceIds: string[] }[] {
  const reqs = getRequirementsByCategory(categoryId)
  const risks = getRisksByCategory(categoryId)
  const inits = getInitiativesByCategory(categoryId)

  return [
    {
      title: "Cost pressure is intensifying",
      text: `With ${reqs.filter((r) => r.driver === "Cost").length} cost-driven requirements and total category spend exceeding targets, cost optimization is the dominant theme. The pipeline currently targets $${(inits.reduce((s, i) => s + i.targetSavings, 0) / 1e6).toFixed(1)}M in savings.`,
      sourceIds: reqs.filter((r) => r.driver === "Cost").map((r) => r.id).slice(0, 2),
    },
    {
      title: "Supplier landscape is fragmented",
      text: `The current supplier base exceeds targets, creating administrative overhead and reducing leverage. Consolidation initiatives are in progress but will take 6-12 months to fully realize benefits.`,
      sourceIds: inits.filter((i) => i.title.toLowerCase().includes("consolidat")).map((i) => i.id).slice(0, 1),
    },
    {
      title: "Regulatory and compliance risks are rising",
      text: `${risks.filter((r) => r.status === "Open").length} open risks remain unaddressed, with ${risks.filter((r) => r.riskScore > r.appetiteThreshold).length} exceeding appetite thresholds. Proactive mitigation is critical to avoid downstream cost and compliance exposure.`,
      sourceIds: risks.filter((r) => r.riskScore > r.appetiteThreshold).map((r) => r.id).slice(0, 2),
    },
    {
      title: "Transition initiatives are in motion",
      text: `Key programs are progressing across the pipeline. Confidence levels range from ${Math.min(...inits.map((i) => i.confidence))}% to ${Math.max(...inits.map((i) => i.confidence))}%, with the highest-value initiatives requiring significant organizational change management.`,
      sourceIds: inits.slice(0, 2).map((i) => i.id),
    },
  ]
}

/** Generate observation cards from insights */
export function generateObservations(
  categoryId: string,
): { title: string; evidence: string[]; impact: string; leadsTo: string[] }[] {
  const reqs = getRequirementsByCategory(categoryId)
  const risks = getRisksByCategory(categoryId)
  const inits = getInitiativesByCategory(categoryId)

  return [
    {
      title: "Policy non-compliance is a significant cost leak",
      evidence: risks.filter((r) => r.title.toLowerCase().includes("compliance") || r.title.toLowerCase().includes("policy")).map((r) => r.id),
      impact: "Vehicles out of policy drive 15-20% higher total cost of ownership, eroding savings from other initiatives.",
      leadsTo: inits.filter((i) => i.title.toLowerCase().includes("fuel") || i.title.toLowerCase().includes("policy")).map((i) => i.id),
    },
    {
      title: "Supplier fragmentation limits negotiating leverage",
      evidence: reqs.filter((r) => r.tags.includes("fleet") || r.tags.includes("lease")).map((r) => r.id).slice(0, 2),
      impact: "With 34 active suppliers against a target of 18, spend is diluted and management complexity increases.",
      leadsTo: inits.filter((i) => i.title.toLowerCase().includes("consolidat")).map((i) => i.id),
    },
    {
      title: "EV transition presents both opportunity and risk",
      evidence: [
        ...risks.filter((r) => r.title.toLowerCase().includes("ev")).map((r) => r.id),
        ...inits.filter((i) => i.title.toLowerCase().includes("ev")).map((i) => i.id),
      ].slice(0, 3),
      impact: "EV adoption can reduce fuel and maintenance costs by 20-30%, but infrastructure gaps and residual value uncertainty require careful phasing.",
      leadsTo: inits.filter((i) => i.title.toLowerCase().includes("ev")).map((i) => i.id),
    },
    {
      title: "Maintenance and repair costs are addressable",
      evidence: inits.filter((i) => i.title.toLowerCase().includes("maintenance")).map((i) => i.id),
      impact: "Telematics-based driver coaching and preferred repair networks could reduce incident rates and repair costs.",
      leadsTo: inits.filter((i) => i.title.toLowerCase().includes("maintenance") || i.title.toLowerCase().includes("telematics")).map((i) => i.id),
    },
    {
      title: "Lease standardization reduces complexity",
      evidence: inits.filter((i) => i.title.toLowerCase().includes("lease") || i.title.toLowerCase().includes("contract")).map((i) => i.id),
      impact: "Standardized lease templates accelerate contracting, reduce legal costs, and improve term consistency across OEMs.",
      leadsTo: inits.filter((i) => i.title.toLowerCase().includes("lease")).map((i) => i.id),
    },
  ]
}

// ─── Executive Summary Generator ────────────────────────────────────────────

export interface ExecutiveSummaryData {
  strategicThemes: string[]
  totalValueAtStake: number
  keyTradeOffs: string[]
  topRisks: string[]
  roadmapDirection: string
  version: number
  generatedAt: string
}

export function generateExecutiveSummary(categoryId: string): ExecutiveSummaryData {
  const inits = getInitiativesByCategory(categoryId)
  const risks = getRisksByCategory(categoryId)
  const reqs = getRequirementsByCategory(categoryId)
  const totalValue = inits.reduce((s, i) => s + i.targetSavings, 0)
  const openRisks = risks.filter((r) => r.status === "Open" || r.status === "Mitigating")

  return {
    strategicThemes: [
      "Cost optimization through supplier consolidation and lease restructuring",
      "Supply base resilience via dual-sourcing and geographic diversification",
      "EV transition to meet sustainability mandates and reduce long-term TCO",
      reqs.some((r) => r.driver === "Compliance")
        ? "Compliance enforcement through automated policy governance"
        : "Operational efficiency through process standardization",
    ],
    totalValueAtStake: totalValue,
    keyTradeOffs: [
      "Short-term disruption from supplier consolidation vs. long-term cost savings",
      "Higher upfront EV acquisition costs vs. lower lifecycle TCO",
      "Tighter governance constraints vs. field team flexibility",
    ],
    topRisks: openRisks.slice(0, 4).map((r) => `${r.title} (score: ${r.riskScore}, threshold: ${r.appetiteThreshold})`),
    roadmapDirection: `Execute in three phases over 18-36 months, targeting $${(totalValue / 1e6).toFixed(1)}M in total value through ${inits.length} initiatives.`,
    version: 1,
    generatedAt: new Date().toISOString().slice(0, 10),
  }
}

// ─── Category Diagnosis Generator ───────────────────────────────────────────

export interface CategoryDiagnosisData {
  marketSupplyDemand: string
  costStructuralPressures: string
  supplierLandscape: string
  internalPerformanceGaps: string
  version: number
  generatedAt: string
}

export function generateCategoryDiagnosis(categoryId: string): CategoryDiagnosisData {
  const inits = getInitiativesByCategory(categoryId)
  const risks = getRisksByCategory(categoryId)
  const reqs = getRequirementsByCategory(categoryId)

  return {
    marketSupplyDemand: `The category is experiencing shifting supply-demand dynamics driven by ${reqs.length} business requirements. OEM lead times have extended, and market tightness is creating upward pricing pressure. EV supply chains remain constrained in key regions, with delivery lead times averaging 78 days against a 60-day target.`,
    costStructuralPressures: `Total category spend exceeds targets, with ${reqs.filter((r) => r.driver === "Cost").length} cost-driven requirements highlighting the need for structural cost reduction. Current cost-per-driver metrics sit 22% above pharma fleet benchmarks, driven by supplier fragmentation, policy non-compliance, and sub-optimal lease terms.`,
    supplierLandscape: `The supplier base of 34 active providers is significantly above the target of 18. This fragmentation dilutes negotiating leverage and increases administrative overhead. ${risks.filter((r) => r.scope === "Supplier").length} supplier-specific risks have been identified, with concentration risk in maintenance and EMEA lease services requiring attention.`,
    internalPerformanceGaps: `Policy compliance stands at 79% against a 95% target, representing a $4.1M exposure in exception spend. The savings pipeline of $${(inits.reduce((s, i) => s + i.targetSavings, 0) / 1e6).toFixed(1)}M is healthy but confidence-weighted realization requires active management. ${inits.filter((i) => i.confidence < 60).length} initiatives have confidence below 60%.`,
    version: 1,
    generatedAt: new Date().toISOString().slice(0, 10),
  }
}

// ─── Strategic Themes Generator ─────────────────────────────────────────────

export interface StrategicThemeData {
  id: string
  name: string
  rationale: string
  linkedObjectiveIds: string[]
  linkedInsightIds: string[]
  expectedImpactRange: string
}

export function generateStrategicThemes(categoryId: string): StrategicThemeData[] {
  const inits = getInitiativesByCategory(categoryId)
  const risks = getRisksByCategory(categoryId)
  const reqs = getRequirementsByCategory(categoryId)
  const allInsights = getAllInsightsForCategory(categoryId)

  const costInsights = allInsights.filter((i) => i.source === "requirement" && i.tags.includes("cost-reduction")).map((i) => i.id)
  const riskInsights = allInsights.filter((i) => i.source === "risk").slice(0, 3).map((i) => i.id)
  const evInsights = allInsights.filter((i) => i.tags.some((t) => t.toLowerCase().includes("ev") || t.toLowerCase().includes("sustainability"))).map((i) => i.id)

  return [
    {
      id: "theme-1",
      name: "Cost Optimization & Supplier Consolidation",
      rationale: "Reducing the supplier base and renegotiating contract terms addresses the dominant cost pressure. With ${reqs.filter((r) => r.driver === 'Cost').length} cost-driven requirements, this is the most impactful near-term lever.",
      linkedObjectiveIds: ["obj-1", "obj-1a", "obj-1b"],
      linkedInsightIds: costInsights.slice(0, 3),
      expectedImpactRange: `$${((inits.filter((i) => i.title.toLowerCase().includes("consolidat") || i.title.toLowerCase().includes("rebid") || i.title.toLowerCase().includes("lease")).reduce((s, i) => s + i.targetSavings, 0)) / 1e6).toFixed(1)}M`,
    },
    {
      id: "theme-2",
      name: "Supply Chain Resilience & Risk Mitigation",
      rationale: `With ${risks.filter((r) => r.riskScore > r.appetiteThreshold).length} risks exceeding appetite thresholds, building resilience through dual-sourcing and geographic diversification is critical to protecting both supply continuity and cost position.`,
      linkedObjectiveIds: ["obj-2", "obj-4"],
      linkedInsightIds: riskInsights,
      expectedImpactRange: "30% risk score reduction",
    },
    {
      id: "theme-3",
      name: "EV Transition & Sustainability",
      rationale: "Corporate ESG mandates and favorable lifecycle economics make EV adoption both a compliance requirement and a cost optimization opportunity. The transition requires careful phasing to manage infrastructure gaps.",
      linkedObjectiveIds: ["obj-5"],
      linkedInsightIds: evInsights.slice(0, 3),
      expectedImpactRange: "25% EV penetration / 20-30% fuel cost reduction",
    },
    {
      id: "theme-4",
      name: "Governance & Compliance Enforcement",
      rationale: "Policy non-compliance drives $4.1M in exception spend. Automated governance and standardized processes will close this gap while improving operational consistency.",
      linkedObjectiveIds: ["obj-4"],
      linkedInsightIds: allInsights.filter((i) => i.tags.some((t) => t.toLowerCase().includes("compliance") || t.toLowerCase().includes("policy"))).slice(0, 2).map((i) => i.id),
      expectedImpactRange: "95% compliance / $4.1M exception reduction",
    },
  ]
}

// ─── Initiative Portfolio Summary Generator ─────────────────────────────────

export interface PortfolioInitiativeSummary {
  id: string
  title: string
  impactEstimate: number
  timelineBand: "Short" | "Mid" | "Long"
  feasibility: "Low" | "Medium" | "High"
  stage: string
}

export function generateInitiativePortfolio(categoryId: string): PortfolioInitiativeSummary[] {
  const inits = getInitiativesByCategory(categoryId)
  const roadmap = getRoadmapByCategory(categoryId)

  return inits.map((init) => {
    const rm = roadmap.find((r) => r.initiativeId === init.id)
    let timelineBand: "Short" | "Mid" | "Long" = "Mid"
    if (rm) {
      if (rm.wave === 1) timelineBand = "Short"
      else if (rm.wave === 2) timelineBand = "Mid"
      else timelineBand = "Long"
    } else {
      // Estimate from stage
      if (init.stage === "Idea" || init.stage === "Qualify") timelineBand = "Long"
      else if (init.stage === "Contract" || init.stage === "Source") timelineBand = "Mid"
      else timelineBand = "Short"
    }

    let feasibility: "Low" | "Medium" | "High" = "Medium"
    if (init.confidence >= 75) feasibility = "High"
    else if (init.confidence < 55) feasibility = "Low"

    return {
      id: init.id,
      title: init.title,
      impactEstimate: init.targetSavings,
      timelineBand,
      feasibility,
      stage: init.stage,
    }
  }).sort((a, b) => b.impactEstimate - a.impactEstimate)
}

// ─── Risk & Dependency Summary Generator ────────────────────────────────────

export interface RiskSummaryItem {
  id: string
  title: string
  impactLevel: "Low" | "Medium" | "High"
  mitigationSummary: string
  riskScore: number
  threshold: number
}

export function generateRiskSummary(categoryId: string): RiskSummaryItem[] {
  const risks = getRisksByCategory(categoryId)

  return risks
    .filter((r) => r.status !== "Closed" && r.status !== "Accepted")
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8)
    .map((r) => ({
      id: r.id,
      title: r.title,
      impactLevel: r.riskScore >= 40 ? "High" : r.riskScore >= 25 ? "Medium" : "Low",
      mitigationSummary: r.mitigationPlan ?? "Mitigation plan pending",
      riskScore: r.riskScore,
      threshold: r.appetiteThreshold,
    }))
}

// ─── Roadmap & Phasing Generator ────────────────────────────────────────────

export interface RoadmapPhaseData {
  phase: string
  timeframe: string
  initiatives: { id: string; title: string; progress: number }[]
}

export function generateRoadmapPhasing(categoryId: string): {
  phases: RoadmapPhaseData[]
  valueRamp: { month: string; value: number }[]
  version: number
  generatedAt: string
} {
  const phases = getRoadmapPhasesForCategory(categoryId)
  const inits = getInitiativesByCategory(categoryId)

  const phaseData: RoadmapPhaseData[] = [
    {
      phase: "Phase 1",
      timeframe: "0-6 months",
      initiatives: phases.stabilize.map((p) => ({ id: p.id, title: p.title, progress: p.progress })),
    },
    {
      phase: "Phase 2",
      timeframe: "6-18 months",
      initiatives: phases.optimize.map((p) => ({ id: p.id, title: p.title, progress: p.progress })),
    },
    {
      phase: "Phase 3",
      timeframe: "18-36 months",
      initiatives: phases.transform.map((p) => ({ id: p.id, title: p.title, progress: p.progress })),
    },
  ]

  // Value ramp for sparkline
  const totalValue = inits.reduce((s, i) => s + i.targetSavings, 0)
  const valueRamp = [
    { month: "M3", value: Math.round(totalValue * 0.05) },
    { month: "M6", value: Math.round(totalValue * 0.15) },
    { month: "M9", value: Math.round(totalValue * 0.30) },
    { month: "M12", value: Math.round(totalValue * 0.50) },
    { month: "M18", value: Math.round(totalValue * 0.72) },
    { month: "M24", value: Math.round(totalValue * 0.88) },
    { month: "M36", value: Math.round(totalValue * 1.00) },
  ]

  return {
    phases: phaseData,
    valueRamp,
    version: 1,
    generatedAt: new Date().toISOString().slice(0, 10),
  }
}

/** Generate roadmap narrative */
export function generateRoadmapNarrative(categoryId: string): string {
  const phases = getRoadmapPhasesForCategory(categoryId)
  const parts: string[] = []
  if (phases.stabilize.length > 0) {
    parts.push(`Phase 1 (0-3 months): Stabilize and capture quick wins through ${phases.stabilize.map((p) => p.title.toLowerCase()).join(", ")}.`)
  }
  if (phases.optimize.length > 0) {
    parts.push(`Phase 2 (3-9 months): Optimize by executing ${phases.optimize.map((p) => p.title.toLowerCase()).join(", ")}.`)
  }
  if (phases.transform.length > 0) {
    parts.push(`Phase 3 (9-18 months): Transform through ${phases.transform.map((p) => p.title.toLowerCase()).join(", ")}.`)
  }
  if (parts.length === 0) return "No roadmap items have been defined yet."
  return parts.join(" ") + " This phased approach balances short-term savings realization with longer-term strategic transformation."
}
