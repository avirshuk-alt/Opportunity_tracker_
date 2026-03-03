// ─── Strategic Objectives & Alignment Data ──────────────────────

export type ObjectiveCategory = "Cost" | "Risk" | "Growth" | "Innovation" | "ESG" | "Operational"
export type Priority = "High" | "Medium" | "Low"
export type ValidationStatus = "Pending" | "Approved" | "Revision Suggested"

export interface StrategicObjective {
  id: string
  parentId: string | null
  title: string
  category: ObjectiveCategory
  targetMetric: string
  timeHorizon: string
  priority: Priority
  businessRequirements: string
  opportunities: string
  risks: string
  aiSummary: string
  assignedStakeholderIds: string[]
}

export interface OrgNode {
  id: string
  name: string
  title: string
  department: string
  avatarInitials: string
  children?: OrgNode[]
}

export interface Stakeholder {
  id: string
  name: string
  email: string
  title: string
  department: string
  assignedObjectiveIds: string[]
  validationStatus: ValidationStatus
}

// ─── Numbering helpers ──────────────────────────────────────────

/** Build a map  objId -> "1", "1.1", "2" etc based on current order (no leading zeros) */
export function buildNumberingMap(objectives: StrategicObjective[]): Record<string, string> {
  const map: Record<string, string> = {}
  let parentIdx = 0
  const topLevel = objectives.filter((o) => o.parentId === null)
  for (const parent of topLevel) {
    parentIdx++
    map[parent.id] = `${parentIdx}`
    let childIdx = 0
    for (const child of objectives.filter((o) => o.parentId === parent.id)) {
      childIdx++
      map[child.id] = `${parentIdx}.${childIdx}`
    }
  }
  return map
}

// ─── Seed Objectives ─────────────────────────────────────────────
export const SEED_OBJECTIVES: StrategicObjective[] = [
  {
    id: "obj-1", parentId: null,
    title: "Reduce total fleet cost by 8\u201310% over 24 months",
    category: "Cost", targetMetric: "8\u201310% reduction in TCO", timeHorizon: "24 months", priority: "High",
    businessRequirements: "Finance has mandated a total cost of ownership reduction across the fleet portfolio. Current baseline is $42M annually with projected savings target of $3.4\u2013$4.2M.",
    opportunities: "Consolidate suppliers from 12 to 6, renegotiate volume-based contracts, and leverage EV transition incentives.",
    risks: "Supply disruption during consolidation, potential quality regression with new suppliers.",
    aiSummary: "This opportunity targets an 8\u201310% total cost of ownership reduction across the $42M fleet portfolio over 24 months, equating to $3.4\u2013$4.2M in projected savings. The strategy centres on supplier consolidation and volume-based renegotiation, supported by EV transition incentives to further offset costs.",
    assignedStakeholderIds: [],
  },
  {
    id: "obj-1a", parentId: "obj-1",
    title: "Consolidate fleet suppliers from 12 to 6",
    category: "Cost", targetMetric: "50% supplier reduction", timeHorizon: "12 months", priority: "High",
    businessRequirements: "Reduce supplier management overhead and increase leverage for volume-based pricing through strategic consolidation.",
    opportunities: "Achieve 12\u201315% unit cost improvement through consolidated volumes.",
    risks: "Transition risk during supplier changeover periods, potential regional coverage gaps.",
    aiSummary: "Consolidating fleet suppliers from 12 to 6 strategic partners will reduce management overhead while unlocking 12\u201315% unit cost improvements through increased volume leverage. This is a foundational enabler for the broader cost reduction objective.",
    assignedStakeholderIds: [],
  },
  {
    id: "obj-1b", parentId: "obj-1",
    title: "Optimize contract terms and renewal cycles",
    category: "Cost", targetMetric: "15% improvement in contract value", timeHorizon: "18 months", priority: "Medium",
    businessRequirements: "Align contract cycles to leverage market timing and introduce performance-based pricing models.",
    opportunities: "Multi-year commitments with built-in improvement clauses can yield additional 3\u20135% savings.",
    risks: "Lock-in risk if market conditions shift unfavorably.",
    aiSummary: "Aligning contract renewal cycles with market timing and transitioning to performance-based pricing models could unlock an additional 3\u20135% in savings. Multi-year commitments with improvement clauses strengthen long-term cost position.",
    assignedStakeholderIds: [],
  },
  {
    id: "obj-2", parentId: null,
    title: "Dual-source 80% of critical SKUs",
    category: "Risk", targetMetric: "80% dual-sourced", timeHorizon: "18 months", priority: "High",
    businessRequirements: "Supply chain resilience directive requires elimination of single-source dependencies for all Tier-1 critical components.",
    opportunities: "Negotiate competitive pricing through parallel sourcing and reduce single-point-of-failure exposure.",
    risks: "Qualification timelines for secondary sources may exceed 6 months. Quality parity must be validated.",
    aiSummary: "This initiative eliminates single-source dependencies by dual-sourcing 80% of critical Tier-1 SKUs within 18 months. Beyond resilience, parallel sourcing creates competitive pricing dynamics that can contribute to cost reduction targets.",
    assignedStakeholderIds: [],
  },
  {
    id: "obj-3", parentId: null,
    title: "Improve supplier innovation contribution by 20%",
    category: "Innovation", targetMetric: "20% increase in supplier-driven innovation", timeHorizon: "12 months", priority: "Medium",
    businessRequirements: "R&D expects suppliers to co-invest in next-generation fleet technology, particularly around EV integration and telematics.",
    opportunities: "Structured innovation workshops and joint development agreements can accelerate product pipeline.",
    risks: "IP ownership disputes, misaligned development timelines.",
    aiSummary: "Increasing supplier-driven innovation by 20% through structured co-development programs and joint workshops accelerates the EV and telematics product pipeline. This strengthens the category\u2019s strategic value beyond cost savings alone.",
    assignedStakeholderIds: [],
  },
  {
    id: "obj-4", parentId: null,
    title: "Reduce Tier-1 supplier risk exposure by 30%",
    category: "Risk", targetMetric: "30% risk score reduction", timeHorizon: "12 months", priority: "High",
    businessRequirements: "Enterprise risk committee requires all strategic categories to reduce concentrated risk exposure in alignment with updated risk framework.",
    opportunities: "Geographic diversification and financial health monitoring programs can systematically reduce exposure.",
    risks: "New supplier qualification costs, potential near-term price increases from diversification.",
    aiSummary: "A 30% reduction in Tier-1 supplier risk scores through geographic diversification and continuous financial health monitoring directly addresses the enterprise risk committee\u2019s mandate. The programme builds structural resilience into the supply base.",
    assignedStakeholderIds: [],
  },
  {
    id: "obj-5", parentId: null,
    title: "Achieve 25% EV fleet penetration",
    category: "ESG", targetMetric: "25% EV adoption", timeHorizon: "24 months", priority: "Medium",
    businessRequirements: "Corporate sustainability targets mandate progressive EV adoption across all operating fleets.",
    opportunities: "Government incentives, lower TCO for EVs in qualifying regions, and positive brand positioning.",
    risks: "Charging infrastructure gaps, higher upfront acquisition costs, range limitations in certain regions.",
    aiSummary: "Achieving 25% EV fleet penetration within 24 months leverages government incentive programmes and favourable TCO economics in qualifying regions. This positions the organization ahead of tightening emissions regulations while contributing to corporate ESG commitments.",
    assignedStakeholderIds: [],
  },
]

// ─── Org Tree (COO -> 6 VP branches -> ~25 nodes total) ─────────
export const ORG_TREE: OrgNode = {
  id: "org-ceo",
  name: "Thomas Wright",
  title: "Chief Operating Officer",
  department: "Executive",
  avatarInitials: "TW",
  children: [
    {
      id: "org-1",
      name: "Sarah Mitchell",
      title: "VP Procurement",
      department: "Procurement",
      avatarInitials: "SM",
      children: [
        { id: "org-2", name: "Marcus Rodriguez", title: "Category Director", department: "Procurement", avatarInitials: "MR" },
        { id: "org-3", name: "Priya Sharma", title: "Sr. Category Manager", department: "Procurement", avatarInitials: "PS" },
        { id: "org-4", name: "James Chen", title: "Category Manager", department: "Procurement", avatarInitials: "JC" },
      ],
    },
    {
      id: "org-5",
      name: "Natalie Green",
      title: "VP Operations",
      department: "Operations",
      avatarInitials: "NG",
      children: [
        { id: "org-6", name: "Carlos Vega", title: "Fleet Ops Manager", department: "Operations", avatarInitials: "CV" },
        { id: "org-7", name: "Helen Park", title: "Logistics Coordinator", department: "Operations", avatarInitials: "HP" },
        { id: "org-17", name: "Rachel Kim", title: "Distribution Director", department: "Operations", avatarInitials: "RK" },
      ],
    },
    {
      id: "org-8",
      name: "Robert Kim",
      title: "VP Finance",
      department: "Finance",
      avatarInitials: "RK",
      children: [
        { id: "org-9", name: "Anna Petrov", title: "Financial Analyst", department: "Finance", avatarInitials: "AP" },
        { id: "org-10", name: "Daniel Brooks", title: "Cost Accounting Lead", department: "Finance", avatarInitials: "DB" },
        { id: "org-18", name: "Sophia Lee", title: "Budget Planning Manager", department: "Finance", avatarInitials: "SL" },
      ],
    },
    {
      id: "org-15",
      name: "Jennifer Adams",
      title: "VP Human Resources",
      department: "HR",
      avatarInitials: "JA",
      children: [
        { id: "org-16", name: "Michael Torres", title: "Talent Acquisition Lead", department: "HR", avatarInitials: "MT" },
        { id: "org-19", name: "Emily Foster", title: "L&D Manager", department: "HR", avatarInitials: "EF" },
      ],
    },
    {
      id: "org-11",
      name: "Karen Washington",
      title: "VP Risk & Compliance",
      department: "Risk Management",
      avatarInitials: "KW",
      children: [
        { id: "org-12", name: "Tom Alvarez", title: "Risk Analyst", department: "Risk Management", avatarInitials: "TA" },
        { id: "org-20", name: "Grace Liu", title: "Compliance Director", department: "Risk Management", avatarInitials: "GL" },
      ],
    },
    {
      id: "org-13",
      name: "Lisa Thompson",
      title: "VP Sustainability",
      department: "ESG / Sustainability",
      avatarInitials: "LT",
      children: [
        { id: "org-14", name: "David Okafor", title: "ESG Program Manager", department: "ESG / Sustainability", avatarInitials: "DO" },
        { id: "org-21", name: "Nina Patel", title: "Carbon Reporting Analyst", department: "ESG / Sustainability", avatarInitials: "NP" },
      ],
    },
  ],
}

// ─── Flatten org tree to get selectable stakeholders ─────────────
function flattenOrg(node: OrgNode): Stakeholder[] {
  const result: Stakeholder[] = [
    {
      id: node.id,
      name: node.name,
      email: `${node.name.toLowerCase().replace(/\s/g, ".")}@company.com`,
      title: node.title,
      department: node.department,
      assignedObjectiveIds: [],
      validationStatus: "Pending" as ValidationStatus,
    },
  ]
  if (node.children) {
    for (const child of node.children) {
      result.push(...flattenOrg(child))
    }
  }
  return result
}

export const ALL_STAKEHOLDERS: Stakeholder[] = flattenOrg(ORG_TREE)

// ─── Group stakeholders by department ────────────────────────────
export function groupByDepartment(stakeholders: Stakeholder[]): Record<string, Stakeholder[]> {
  const groups: Record<string, Stakeholder[]> = {}
  for (const s of stakeholders) {
    if (!groups[s.department]) groups[s.department] = []
    groups[s.department].push(s)
  }
  return groups
}

// ─── Category colour mapping ────────────────────────────────────
export const CATEGORY_COLORS: Record<ObjectiveCategory, { bg: string; text: string; border: string }> = {
  Cost:        { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  Risk:        { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
  Growth:      { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Innovation:  { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200" },
  ESG:         { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200" },
  Operational: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
}

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string }> = {
  High:   { bg: "bg-red-50",    text: "text-red-700" },
  Medium: { bg: "bg-amber-50",  text: "text-amber-700" },
  Low:    { bg: "bg-slate-50",  text: "text-slate-600" },
}
