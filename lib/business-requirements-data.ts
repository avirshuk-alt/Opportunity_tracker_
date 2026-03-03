// ─── Business Requirements Data Layer ──────────────────────────
// Renamed from Strategic Objectives per spec: Objective → Requirement

export type RequirementCategory = "Cost" | "Risk" | "Growth" | "Innovation" | "ESG" | "Operations"
export type RequirementPriority = "High" | "Medium" | "Low"
export type RequirementTimeHorizon = "Short-term" | "Mid-term" | "Long-term"
export type RequirementStatus = "Draft" | "Under Review" | "Approved"
export type StakeholderRole = "Owner" | "Reviewer" | "Consulted"
export type StakeholderValidation = "Pending" | "Approved" | "Revision Requested" | "Commented" | "Validation Requested"

export interface VersionEntry {
  version: number
  timestamp: string
  editor: string
  changeLog: string
}

export interface CommentEntry {
  id: string
  author: string
  text: string
  timestamp: string
  resolved?: boolean
  edited?: boolean
  editedAt?: string
}

export interface RequirementStakeholder {
  stakeholderId: string
  name: string
  jobTitle: string
  role: StakeholderRole
  validationStatus: StakeholderValidation
  timestamp: string
}

export interface BusinessRequirement {
  id: string
  parentId: string | null
  name: string
  statement: string
  category: RequirementCategory
  priority: RequirementPriority
  timeHorizon: RequirementTimeHorizon
  status: RequirementStatus
  assignedStakeholders: RequirementStakeholder[]
  comments: CommentEntry[]
  versionHistory: VersionEntry[]
  currentVersion: number
  lastEditedAt: string
  lastEditedBy: string
}

// Re-export org tree & stakeholder types from original module (unchanged)
export {
  ORG_TREE,
  ALL_STAKEHOLDERS,
  groupByDepartment,
  type OrgNode,
  type Stakeholder,
  type ValidationStatus,
} from "./strategic-objectives-data"

// ─── Numbering helpers ──────────────────────────────────────────

export function buildRequirementNumberingMap(requirements: BusinessRequirement[]): Record<string, string> {
  const map: Record<string, string> = {}
  let parentIdx = 0
  const topLevel = requirements.filter((r) => r.parentId === null)
  for (const parent of topLevel) {
    parentIdx++
    map[parent.id] = `${parentIdx}`
    let childIdx = 0
    for (const child of requirements.filter((r) => r.parentId === parent.id)) {
      childIdx++
      map[child.id] = `${parentIdx}.${childIdx}`
    }
  }
  return map
}

// ─── Alignment helpers ──────────────────────────────────────────

export function getAlignmentInfo(requirement: BusinessRequirement): {
  validated: number
  total: number
  percentage: number
  label: string
} {
  const total = requirement.assignedStakeholders.length
  if (total === 0) return { validated: 0, total: 0, percentage: 0, label: "No stakeholders" }
  const validated = requirement.assignedStakeholders.filter(
    (s) => s.validationStatus === "Approved"
  ).length
  const percentage = Math.round((validated / total) * 100)
  return {
    validated,
    total,
    percentage,
    label: `${validated} of ${total} validated`,
  }
}

// ─── Seed Requirements ──────────────────────────────────────────

export const SEED_REQUIREMENTS: BusinessRequirement[] = [
  {
    id: "req-1",
    parentId: null,
    name: "Fleet Cost Reduction via Consolidation",
    statement: "Reduce total fleet cost by 8-10% over 24 months through supplier consolidation and volume-based renegotiation, targeting $3.4-$4.2M in savings against the current $42M annual baseline.",
    category: "Cost",
    priority: "High",
    timeHorizon: "Long-term",
    status: "Under Review",
    assignedStakeholders: [],
    comments: [],
    versionHistory: [
      { version: 1, timestamp: "2026-02-18T10:00:00Z", editor: "System", changeLog: "Generated from insights" },
      { version: 2, timestamp: "2026-02-20T09:10:00Z", editor: "Sarah Mitchell", changeLog: "Updated baseline figure and savings range" },
    ],
    currentVersion: 2,
    lastEditedAt: "2026-02-20T09:10:00Z",
    lastEditedBy: "Sarah Mitchell",
  },
  {
    id: "req-1a",
    parentId: "req-1",
    name: "Supplier Consolidation to 6 Partners",
    statement: "Consolidate fleet suppliers from 12 to 6 strategic partners to reduce management overhead and unlock 12-15% unit cost improvements through increased volume leverage.",
    category: "Cost",
    priority: "High",
    timeHorizon: "Short-term",
    status: "Approved",
    assignedStakeholders: [],
    comments: [],
    versionHistory: [
      { version: 1, timestamp: "2026-02-18T10:00:00Z", editor: "System", changeLog: "Generated from insights" },
    ],
    currentVersion: 1,
    lastEditedAt: "2026-02-18T10:00:00Z",
    lastEditedBy: "System",
  },
  {
    id: "req-1b",
    parentId: "req-1",
    name: "Contract Term Optimization",
    statement: "Optimize contract terms and renewal cycles by aligning with market timing and introducing performance-based pricing models for an additional 3-5% savings.",
    category: "Cost",
    priority: "Medium",
    timeHorizon: "Mid-term",
    status: "Draft",
    assignedStakeholders: [],
    comments: [],
    versionHistory: [
      { version: 1, timestamp: "2026-02-18T10:00:00Z", editor: "System", changeLog: "Generated from insights" },
    ],
    currentVersion: 1,
    lastEditedAt: "2026-02-18T10:00:00Z",
    lastEditedBy: "System",
  },
  {
    id: "req-2",
    parentId: null,
    name: "Dual-Source Critical Tier-1 SKUs",
    statement: "Dual-source 80% of critical Tier-1 SKUs within 18 months to eliminate single-source dependencies and create competitive pricing dynamics across the supply base.",
    category: "Risk",
    priority: "High",
    timeHorizon: "Mid-term",
    status: "Under Review",
    assignedStakeholders: [],
    comments: [],
    versionHistory: [
      { version: 1, timestamp: "2026-02-18T10:00:00Z", editor: "System", changeLog: "Generated from insights" },
      { version: 2, timestamp: "2026-02-20T16:10:00Z", editor: "Karen Washington", changeLog: "Added risk committee endorsement context" },
    ],
    currentVersion: 2,
    lastEditedAt: "2026-02-20T16:10:00Z",
    lastEditedBy: "Karen Washington",
  },
  {
    id: "req-3",
    parentId: null,
    name: "Supplier Innovation Programs",
    statement: "Improve supplier innovation contribution by 20% through structured co-development programs and joint workshops to accelerate EV and telematics product pipeline.",
    category: "Innovation",
    priority: "Medium",
    timeHorizon: "Short-term",
    status: "Draft",
    assignedStakeholders: [],
    comments: [],
    versionHistory: [
      { version: 1, timestamp: "2026-02-18T10:00:00Z", editor: "System", changeLog: "Generated from insights" },
    ],
    currentVersion: 1,
    lastEditedAt: "2026-02-18T10:00:00Z",
    lastEditedBy: "System",
  },
  {
    id: "req-4",
    parentId: null,
    name: "Tier-1 Risk Exposure Reduction",
    statement: "Reduce Tier-1 supplier risk exposure by 30% through geographic diversification and continuous financial health monitoring programs aligned with the enterprise risk framework.",
    category: "Risk",
    priority: "High",
    timeHorizon: "Short-term",
    status: "Approved",
    assignedStakeholders: [],
    comments: [],
    versionHistory: [
      { version: 1, timestamp: "2026-02-18T10:00:00Z", editor: "System", changeLog: "Generated from insights" },
      { version: 2, timestamp: "2026-02-19T09:05:00Z", editor: "Karen Washington", changeLog: "Aligned with updated enterprise risk framework" },
      { version: 3, timestamp: "2026-02-19T15:00:00Z", editor: "Tom Alvarez", changeLog: "Added financial health monitoring details" },
    ],
    currentVersion: 3,
    lastEditedAt: "2026-02-19T15:00:00Z",
    lastEditedBy: "Tom Alvarez",
  },
  {
    id: "req-5",
    parentId: null,
    name: "EV Fleet Penetration Target",
    statement: "Achieve 25% EV fleet penetration within 24 months by leveraging government incentive programmes and favourable TCO economics in qualifying regions.",
    category: "ESG",
    priority: "Medium",
    timeHorizon: "Long-term",
    status: "Under Review",
    assignedStakeholders: [],
    comments: [],
    versionHistory: [
      { version: 1, timestamp: "2026-02-18T10:00:00Z", editor: "System", changeLog: "Generated from insights" },
    ],
    currentVersion: 1,
    lastEditedAt: "2026-02-18T10:00:00Z",
    lastEditedBy: "System",
  },
]

// ─── Category colour mapping ────────────────────────────────────

export const REQUIREMENT_CATEGORY_COLORS: Record<RequirementCategory, { bg: string; text: string; border: string }> = {
  Cost:       { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  Risk:       { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
  Growth:     { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Innovation: { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200" },
  ESG:        { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200" },
  Operations: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
}

export const REQUIREMENT_PRIORITY_COLORS: Record<RequirementPriority, { bg: string; text: string }> = {
  High:   { bg: "bg-red-50",    text: "text-red-700" },
  Medium: { bg: "bg-amber-50",  text: "text-amber-700" },
  Low:    { bg: "bg-slate-50",  text: "text-slate-600" },
}

export const STATUS_COLORS: Record<RequirementStatus, { bg: string; text: string; border: string }> = {
  Draft:         { bg: "bg-slate-50",   text: "text-slate-600",  border: "border-slate-200" },
  "Under Review": { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  Approved:      { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
}

export const TIME_HORIZON_COLORS: Record<RequirementTimeHorizon, { bg: string; text: string }> = {
  "Short-term": { bg: "bg-sky-50",    text: "text-sky-700" },
  "Mid-term":   { bg: "bg-indigo-50", text: "text-indigo-700" },
  "Long-term":  { bg: "bg-purple-50", text: "text-purple-700" },
}
