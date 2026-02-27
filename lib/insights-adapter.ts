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
