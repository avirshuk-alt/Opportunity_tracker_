// ─── Type Definitions ────────────────────────────────────────────────────────

export type Role = "admin" | "category_manager" | "analyst" | "finance_approver" | "stakeholder"
export type StrategyStatus = "Draft" | "InReview" | "Approved"
export type RiskStatus = "Open" | "Mitigating" | "Accepted" | "Closed"
export type InitiativeStage = "Idea" | "Qualify" | "Source" | "Contract" | "Implement" | "Realize"
export type BenefitType = "Hard" | "Soft" | "Avoidance"
export type RAG = "Red" | "Amber" | "Green"

export interface Organization {
  id: string
  name: string
  businessUnits: string[]
  regions: string[]
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatarUrl?: string
  orgId: string
}

export interface Category {
  id: string
  name: string
  taxonomyPath: string
  ownerId: string
  totalSpend: number
  supplierCount: number
  contractCount: number
  riskScore: number
  strategyStatus: StrategyStatus
  lastRefreshAt: string
}

export interface Supplier {
  id: string
  name: string
  normalizedName: string
  parentOrg?: string
  segment: "Strategic" | "Preferred" | "Approved" | "Transactional" | "Phase Out"
  categoryIds: string[]
  annualSpend: number
  riskScore: number
  performanceScore: number
  diversityClassification?: string
  country: string
  tier: number
}

export interface Contract {
  id: string
  supplierId: string
  categoryId: string
  title: string
  startDate: string
  endDate: string
  renewalDate: string
  annualValue: number
  status: "Active" | "Expiring" | "Expired" | "Under Review"
  keyTerms: Record<string, string>
  clauseScores: Record<string, number>
}

export interface Strategy {
  id: string
  categoryId: string
  version: number
  status: StrategyStatus
  title: string
  objectives: string[]
  narrative: {
    executiveSummary: string
    currentState: string
    futureState: string
    approach: string
    risks: string
    timeline: string
  }
  assumptions: { id: string; text: string; owner: string; date: string; status: "Active" | "Validated" | "Invalidated" }[]
  decisionLog: { id: string; decision: string; rationale: string; decidedBy: string; date: string }[]
  refreshCadenceDays: number
  lastRefreshAt: string
  createdAt: string
  updatedAt: string
  ownerId: string
  completionPct: number
}

export interface Initiative {
  id: string
  title: string
  categoryId: string
  strategyId?: string
  stage: InitiativeStage
  baseline: number
  targetSavings: number
  confidence: number
  effort: "Low" | "Medium" | "High"
  ownerId: string
  dependencies: string[]
  risks: string[]
  stakeholders: string[]
  description: string
  createdAt: string
}

export interface Benefit {
  id: string
  initiativeId: string
  type: BenefitType
  amount: number
  timingCurve: { month: string; amount: number }[]
  realizationStatus: "Forecasted" | "InProgress" | "Realized" | "AtRisk"
}

export interface Risk {
  id: string
  title: string
  scope: "Supplier" | "Category" | "Material"
  categoryId?: string
  supplierId?: string
  likelihood: number
  impact: number
  detectability: number
  riskScore: number
  appetiteThreshold: number
  status: RiskStatus
  ownerId: string
  linkedInitiativeId?: string
  acceptedRationale?: string
  mitigationPlan?: string
  createdAt: string
}

export interface KPI {
  id: string
  name: string
  definition: string
  calcMethod: string
  unit: string
  target: number
  actual: number
  rag: RAG
  trend: "up" | "down" | "flat"
  categoryId: string
}

export interface RoadmapItem {
  id: string
  initiativeId: string
  wave: number
  startDate: string
  endDate: string
  milestones: { name: string; date: string; completed: boolean }[]
  owners: string[]
  dependencies: string[]
  criticalPath: boolean
  progress: number
}

export interface SpendData {
  month: string
  amount: number
  bu: string
  region: string
}

export interface AuditEvent {
  id: string
  objectType: string
  objectId: string
  action: "Create" | "Update" | "Delete" | "Approve" | "Reject"
  actorId: string
  timestamp: string
  summary: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "reminder" | "approval" | "renewal" | "alert"
  read: boolean
  createdAt: string
  link?: string
}

export type RequirementDriver = "Cost" | "Risk" | "Growth" | "Compliance" | "Resilience" | "Sustainability"
export type RequirementPriority = "Must" | "Should" | "Could"
export type RequirementStatus = "Proposed" | "Validated" | "Approved"

export interface BusinessRequirement {
  id: string
  title: string
  statement: string
  stakeholderId: string
  stakeholderName: string
  function: string
  driver: RequirementDriver
  priority: RequirementPriority
  status: RequirementStatus
  metricTarget?: string
  evidence?: string
  constraints?: string
  dueDate?: string
  tags: string[]
  impactedModules: string[]
  objectiveId?: string
  updatedAt: string
}

export interface Objective {
  id: string
  title: string
  description: string
  metricTarget?: string
  owner: string
  ownerId?: string
  targetDate?: string
  requirementIds: string[]
  categoryId: string
}

export interface StakeholderProfile {
  userId: string
  name: string
  title: string
  function: string
  influence: "Low" | "Medium" | "High"
  lastTouchpoint: string
  nextTouchpoint: string
  notes: string
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const organization: Organization = {
  id: "org-1",
  name: "Meridian Pharmaceuticals",
  businessUnits: ["Sales", "Market Access", "Medical", "Field Service"],
  regions: ["US", "UK", "Germany", "France", "Japan"],
}

export const users: User[] = [
  { id: "u-1", name: "Sarah Chen", email: "sarah.chen@meridian.com", role: "admin", orgId: "org-1" },
  { id: "u-2", name: "Marcus Rodriguez", email: "marcus.r@meridian.com", role: "category_manager", orgId: "org-1" },
  { id: "u-3", name: "Emily Watson", email: "emily.w@meridian.com", role: "analyst", orgId: "org-1" },
  { id: "u-4", name: "David Park", email: "david.p@meridian.com", role: "finance_approver", orgId: "org-1" },
  { id: "u-5", name: "Lisa Thompson", email: "lisa.t@meridian.com", role: "stakeholder", orgId: "org-1" },
  { id: "u-6", name: "James Mitchell", email: "james.m@meridian.com", role: "category_manager", orgId: "org-1" },
]

export const currentUser = users[0]

export const categories: Category[] = [
  {
    id: "cat-1",
    name: "Pharma Fleet",
    taxonomyPath: "Fleet > Sales & Market Access Vehicles",
    ownerId: "u-2",
    totalSpend: 52_400_000,
    supplierCount: 34,
    contractCount: 22,
    riskScore: 58,
    strategyStatus: "Approved",
    lastRefreshAt: "2026-01-15",
  },
  {
    id: "cat-2",
    name: "Professional Services",
    taxonomyPath: "Services > Professional",
    ownerId: "u-6",
    totalSpend: 28_700_000,
    supplierCount: 52,
    contractCount: 31,
    riskScore: 45,
    strategyStatus: "InReview",
    lastRefreshAt: "2026-01-28",
  },
]

export const suppliers: Supplier[] = [
  { id: "s-1", name: "AutoNation Fleet Solutions", normalizedName: "autonation-fleet", segment: "Strategic", categoryIds: ["cat-1"], annualSpend: 14_800_000, riskScore: 25, performanceScore: 93, country: "US", tier: 1 },
  { id: "s-2", name: "Holman Enterprises", normalizedName: "holman-enterprises", segment: "Strategic", categoryIds: ["cat-1"], annualSpend: 9_600_000, riskScore: 32, performanceScore: 89, country: "US", tier: 1 },
  { id: "s-3", name: "Leaseplan GmbH", normalizedName: "leaseplan-gmbh", segment: "Preferred", categoryIds: ["cat-1"], annualSpend: 6_200_000, riskScore: 40, performanceScore: 86, country: "Germany", tier: 1 },
  { id: "s-4", name: "Donlen Fleet Management", normalizedName: "donlen-fleet", segment: "Preferred", categoryIds: ["cat-1"], annualSpend: 4_800_000, riskScore: 36, performanceScore: 83, country: "US", tier: 1 },
  { id: "s-5", name: "Orix Auto Japan", normalizedName: "orix-auto-japan", segment: "Approved", categoryIds: ["cat-1"], annualSpend: 3_600_000, riskScore: 48, performanceScore: 79, country: "Japan", tier: 2 },
  { id: "s-6", name: "Vertex Consulting", normalizedName: "vertex-consulting", segment: "Strategic", categoryIds: ["cat-2"], annualSpend: 7_800_000, riskScore: 22, performanceScore: 94, country: "US", tier: 1 },
  { id: "s-7", name: "Capstone Advisory", normalizedName: "capstone-advisory", segment: "Strategic", categoryIds: ["cat-2"], annualSpend: 5_400_000, riskScore: 30, performanceScore: 90, country: "UK", tier: 1 },
  { id: "s-8", name: "FleetCor Technologies", normalizedName: "fleetcor-technologies", segment: "Preferred", categoryIds: ["cat-1", "cat-2"], annualSpend: 4_200_000, riskScore: 42, performanceScore: 81, country: "US", tier: 1 },
  { id: "s-9", name: "Alphabet Fleet GmbH", normalizedName: "alphabet-fleet-gmbh", segment: "Approved", categoryIds: ["cat-1"], annualSpend: 2_500_000, riskScore: 50, performanceScore: 76, diversityClassification: "Minority-owned", country: "Germany", tier: 2 },
  { id: "s-10", name: "Pacific Rim Services", normalizedName: "pacific-rim-services", segment: "Transactional", categoryIds: ["cat-2"], annualSpend: 1_800_000, riskScore: 60, performanceScore: 72, country: "Japan", tier: 2 },
]

export const contracts: Contract[] = [
  { id: "c-1", supplierId: "s-1", categoryId: "cat-1", title: "OEM Vehicle Supply & Lease Program", startDate: "2024-06-01", endDate: "2027-05-31", renewalDate: "2027-02-28", annualValue: 10_200_000, status: "Active", keyTerms: { "Payment Terms": "Net 45", "Mileage Band": "30K mi/yr", "Early Termination": "3-month penalty" }, clauseScores: { termination: 85, liability: 78, ip: 92 } },
  { id: "c-2", supplierId: "s-2", categoryId: "cat-1", title: "Fleet Management & Maintenance", startDate: "2025-01-01", endDate: "2027-12-31", renewalDate: "2027-09-30", annualValue: 6_800_000, status: "Active", keyTerms: { "Payment Terms": "Net 30", "Maintenance Inclusions": "Scheduled + wear items", "Replacement Vehicle SLA": "48hr" }, clauseScores: { termination: 72, liability: 80, ip: 88 } },
  { id: "c-3", supplierId: "s-3", categoryId: "cat-1", title: "EMEA Lease & Driver Services", startDate: "2024-03-01", endDate: "2026-02-28", renewalDate: "2025-11-30", annualValue: 4_900_000, status: "Expiring", keyTerms: { "Payment Terms": "Net 30", "Lease Term": "36 months", "Wear-and-Tear": "Fair wear policy" }, clauseScores: { termination: 65, liability: 70, ip: 75 } },
  { id: "c-4", supplierId: "s-4", categoryId: "cat-1", title: "Telematics & Driver Safety Platform", startDate: "2025-04-01", endDate: "2028-03-31", renewalDate: "2027-12-31", annualValue: 3_200_000, status: "Active", keyTerms: { "Payment Terms": "Net 60", "Data Rights": "Client-owned", "Privacy Compliance": "GDPR/CCPA" }, clauseScores: { termination: 90, liability: 85, ip: 95 } },
  { id: "c-5", supplierId: "s-6", categoryId: "cat-2", title: "Strategic Advisory Services", startDate: "2025-01-01", endDate: "2026-12-31", renewalDate: "2026-09-30", annualValue: 6_200_000, status: "Active", keyTerms: { "Payment Terms": "Net 30", "Rate Card": "Blended $285/hr" }, clauseScores: { termination: 80, liability: 82, ip: 70 } },
  { id: "c-6", supplierId: "s-7", categoryId: "cat-2", title: "Management Consulting", startDate: "2024-07-01", endDate: "2026-06-30", renewalDate: "2026-03-31", annualValue: 4_800_000, status: "Active", keyTerms: { "Payment Terms": "Net 45", "Rate Card": "Blended $310/hr" }, clauseScores: { termination: 75, liability: 78, ip: 65 } },
  { id: "c-7", supplierId: "s-5", categoryId: "cat-1", title: "Japan Fleet & Rental Program", startDate: "2025-06-01", endDate: "2026-05-31", renewalDate: "2026-02-28", annualValue: 3_100_000, status: "Active", keyTerms: { "Payment Terms": "Net 30", "Rental Pool": "50 vehicles" }, clauseScores: { termination: 68, liability: 72, ip: 80 } },
  { id: "c-8", supplierId: "s-8", categoryId: "cat-1", title: "Fuel Card & Expense Management", startDate: "2025-03-01", endDate: "2026-02-28", renewalDate: "2025-12-31", annualValue: 2_100_000, status: "Expiring", keyTerms: { "Payment Terms": "Net 30", "Rebate Tiers": "Volume-based 1.5-3%" }, clauseScores: { termination: 60, liability: 65, ip: 90 } },
]

export const strategies: Strategy[] = [
  {
    id: "str-1",
    categoryId: "cat-1",
    version: 2,
    status: "Approved",
    title: "Pharma Fleet Optimization & EV Transition",
    objectives: [
      "Reduce total fleet cost per driver by 15% over 3 years",
      "Consolidate supplier base from 34 to 18 strategic/preferred partners",
      "Achieve 30% EV/hybrid adoption across the fleet by 2028",
      "Improve policy compliance to 95%",
    ],
    narrative: {
      executiveSummary: "This strategy focuses on optimizing total fleet cost through supplier consolidation, lease-vs-buy analysis, and a phased EV transition while improving policy compliance and driver satisfaction across Sales and Market Access teams.",
      currentState: "Currently managing 34 suppliers across 22 contracts. ICE vehicles represent 88% of the fleet. Policy compliance at 79%. Average fleet age 2.8 years with significant cost variation across regions.",
      futureState: "Target state: 18 suppliers, 30% EV/hybrid fleet, 95% policy compliance, 15% cost-per-driver reduction. Strategic partnerships with 2 OEMs and 1 FMC for fleet innovation and sustainability.",
      approach: "Phase 1: Supplier rationalization and lease consolidation. Phase 2: EV pilot program in key metro territories. Phase 3: Scale EV adoption, telematics-driven cost management, and continuous improvement.",
      risks: "Key risks include EV charging infrastructure readiness, driver resistance to new vehicle types, residual value uncertainty for EV leases, and OEM delivery lead times.",
      timeline: "36-month execution horizon with quarterly milestones and semi-annual strategy refresh cycle.",
    },
    assumptions: [
      { id: "a-1", text: "EV charging infrastructure will be adequate in top-20 metro territories within 18 months", owner: "Marcus Rodriguez", date: "2025-11-15", status: "Active" },
      { id: "a-2", text: "OEM incentives for fleet EV purchases will remain at or above current levels", owner: "Emily Watson", date: "2025-11-20", status: "Validated" },
      { id: "a-3", text: "Driver acceptance of EV/hybrid vehicles will reach 70% after pilot phase", owner: "David Park", date: "2025-12-01", status: "Active" },
    ],
    decisionLog: [
      { id: "d-1", decision: "Proceed with 2-OEM short list for EV fleet program", rationale: "Balances competitive tension with relationship depth and service network coverage", decidedBy: "Sarah Chen", date: "2025-10-15" },
      { id: "d-2", decision: "Maintain Leaseplan GmbH as preferred FMC in EMEA despite higher cost", rationale: "Critical for regulatory compliance and driver support across 5 European markets", decidedBy: "Marcus Rodriguez", date: "2025-11-01" },
    ],
    refreshCadenceDays: 90,
    lastRefreshAt: "2026-01-15",
    createdAt: "2025-09-01",
    updatedAt: "2026-01-15",
    ownerId: "u-2",
    completionPct: 92,
  },
  {
    id: "str-2",
    categoryId: "cat-2",
    version: 1,
    status: "InReview",
    title: "Professional Services Demand Management & Rate Optimization",
    objectives: [
      "Reduce average blended rate by 12% through rate card renegotiation",
      "Increase utilization of preferred suppliers to 85%",
      "Implement demand governance framework for all engagements over $100K",
      "Build internal capability to reduce external dependency by 20%",
    ],
    narrative: {
      executiveSummary: "This strategy targets professional services spend optimization through demand management, rate negotiation, and strategic insourcing of repeatable work.",
      currentState: "Professional services spend of $28.7M across 52 suppliers. Low compliance with preferred supplier policy (62%). Average blended rate 15% above benchmark.",
      futureState: "Target: 85% preferred supplier compliance, 12% rate reduction, 20% demand reduction through insourcing. Governance framework for all major engagements.",
      approach: "Phase 1: Rate benchmarking and renegotiation. Phase 2: Demand governance implementation. Phase 3: Strategic insourcing program.",
      risks: "Stakeholder resistance to demand governance, quality risk from rate pressure, insufficient internal capability for insourcing.",
      timeline: "24-month execution with quarterly review cycles.",
    },
    assumptions: [
      { id: "a-4", text: "Market rates will not increase more than 3% annually", owner: "James Mitchell", date: "2026-01-10", status: "Active" },
      { id: "a-5", text: "HR supports internal capability building initiative", owner: "Lisa Thompson", date: "2026-01-15", status: "Active" },
    ],
    decisionLog: [
      { id: "d-3", decision: "Implement tiered governance based on engagement value", rationale: "Full governance for >$100K, light-touch for <$100K to balance control with agility", decidedBy: "James Mitchell", date: "2026-01-20" },
    ],
    refreshCadenceDays: 90,
    lastRefreshAt: "2026-01-28",
    createdAt: "2025-12-01",
    updatedAt: "2026-01-28",
    ownerId: "u-6",
    completionPct: 68,
  },
]

export const initiatives: Initiative[] = [
  { id: "i-1", title: "OEM Lease Consolidation", categoryId: "cat-1", strategyId: "str-1", stage: "Contract", baseline: 14_800_000, targetSavings: 2_220_000, confidence: 85, effort: "High", ownerId: "u-2", dependencies: [], risks: ["r-1"], stakeholders: ["u-4", "u-5"], description: "Consolidate OEM lease arrangements from 5 to 2 strategic partners to achieve volume rebates and simplified fleet management.", createdAt: "2025-10-01" },
  { id: "i-2", title: "EV Pilot Program (Top-20 Metros)", categoryId: "cat-1", strategyId: "str-1", stage: "Implement", baseline: 9_600_000, targetSavings: 1_440_000, confidence: 72, effort: "High", ownerId: "u-2", dependencies: ["i-1"], risks: ["r-2", "r-3"], stakeholders: ["u-3", "u-4"], description: "Deploy EV/hybrid vehicles in 20 metro territories with charging infrastructure support for sales reps.", createdAt: "2025-11-01" },
  { id: "i-3", title: "FMC Services Rebid", categoryId: "cat-1", strategyId: "str-1", stage: "Source", baseline: 6_800_000, targetSavings: 1_020_000, confidence: 78, effort: "Medium", ownerId: "u-2", dependencies: [], risks: ["r-4"], stakeholders: ["u-5"], description: "Competitive rebid for fleet management company services including maintenance, insurance, and roadside assistance.", createdAt: "2025-11-15" },
  { id: "i-4", title: "Fuel Card & Expense Optimization", categoryId: "cat-1", strategyId: "str-1", stage: "Qualify", baseline: 4_200_000, targetSavings: 630_000, confidence: 65, effort: "Low", ownerId: "u-3", dependencies: [], risks: ["r-5"], stakeholders: ["u-2"], description: "Audit fuel card usage, eliminate personal use leakage, and negotiate improved rebate tiers.", createdAt: "2025-12-01" },
  { id: "i-5", title: "Rate Card Renegotiation", categoryId: "cat-2", strategyId: "str-2", stage: "Contract", baseline: 7_800_000, targetSavings: 936_000, confidence: 80, effort: "Medium", ownerId: "u-6", dependencies: [], risks: ["r-6"], stakeholders: ["u-4"], description: "Renegotiate rate cards with top 5 consulting firms leveraging benchmark data.", createdAt: "2026-01-05" },
  { id: "i-6", title: "Demand Governance Framework", categoryId: "cat-2", strategyId: "str-2", stage: "Implement", baseline: 28_700_000, targetSavings: 2_870_000, confidence: 60, effort: "High", ownerId: "u-6", dependencies: [], risks: ["r-7"], stakeholders: ["u-1", "u-5"], description: "Implement governance framework requiring business case for all professional services engagements over $100K.", createdAt: "2026-01-10" },
  { id: "i-7", title: "Maintenance & Accident Cost Reduction", categoryId: "cat-1", strategyId: "str-1", stage: "Idea", baseline: 5_100_000, targetSavings: 510_000, confidence: 55, effort: "Medium", ownerId: "u-3", dependencies: ["i-1"], risks: [], stakeholders: ["u-2"], description: "Reduce maintenance and accident costs through telematics-based driver coaching and preferred repair network.", createdAt: "2026-01-20" },
  { id: "i-8", title: "Strategic Insourcing Program", categoryId: "cat-2", strategyId: "str-2", stage: "Idea", baseline: 5_400_000, targetSavings: 1_080_000, confidence: 45, effort: "High", ownerId: "u-6", dependencies: ["i-6"], risks: ["r-8"], stakeholders: ["u-1", "u-5"], description: "Build internal capability for repeatable consulting work streams.", createdAt: "2026-01-25" },
  { id: "i-9", title: "Lease Contract Standardization", categoryId: "cat-1", strategyId: "str-1", stage: "Qualify", baseline: 2_500_000, targetSavings: 250_000, confidence: 70, effort: "Low", ownerId: "u-3", dependencies: [], risks: [], stakeholders: ["u-4"], description: "Standardize lease contract templates and terms across OEM and FMC suppliers.", createdAt: "2025-12-15" },
  { id: "i-10", title: "Preferred Supplier Compliance", categoryId: "cat-2", strategyId: "str-2", stage: "Source", baseline: 8_600_000, targetSavings: 860_000, confidence: 68, effort: "Medium", ownerId: "u-6", dependencies: ["i-5"], risks: ["r-9"], stakeholders: ["u-5"], description: "Increase utilization of preferred consulting firms from 62% to 85%.", createdAt: "2026-01-15" },
]

export const risks: Risk[] = [
  { id: "r-1", title: "OEM Lock-in Risk (Lease Consolidation)", scope: "Supplier", categoryId: "cat-1", supplierId: "s-1", likelihood: 3, impact: 4, detectability: 2, riskScore: 24, appetiteThreshold: 20, status: "Mitigating", ownerId: "u-2", linkedInitiativeId: "i-1", mitigationPlan: "Ensure multi-OEM vehicle availability, include early termination clauses in lease contracts.", createdAt: "2025-10-05" },
  { id: "r-2", title: "EV Charging Infrastructure Gaps", scope: "Category", categoryId: "cat-1", likelihood: 2, impact: 5, detectability: 3, riskScore: 30, appetiteThreshold: 25, status: "Mitigating", ownerId: "u-2", linkedInitiativeId: "i-2", mitigationPlan: "Map charging coverage in pilot territories, provide home-charging stipends, establish backup rental pool.", createdAt: "2025-11-05" },
  { id: "r-3", title: "EV Residual Value Uncertainty", scope: "Category", categoryId: "cat-1", likelihood: 4, impact: 3, detectability: 2, riskScore: 24, appetiteThreshold: 20, status: "Open", ownerId: "u-3", linkedInitiativeId: "i-2", mitigationPlan: "Negotiate open-ended leases with guaranteed buyback, monitor used-EV market trends.", createdAt: "2025-11-10" },
  { id: "r-4", title: "Single FMC Dependency (Maintenance)", scope: "Supplier", categoryId: "cat-1", supplierId: "s-2", likelihood: 3, impact: 3, detectability: 3, riskScore: 27, appetiteThreshold: 25, status: "Open", ownerId: "u-2", linkedInitiativeId: "i-3", createdAt: "2025-11-20" },
  { id: "r-5", title: "Policy Non-Compliance & Exceptions", scope: "Category", categoryId: "cat-1", likelihood: 3, impact: 4, detectability: 4, riskScore: 48, appetiteThreshold: 30, status: "Open", ownerId: "u-3", linkedInitiativeId: "i-4", mitigationPlan: "Implement automated policy enforcement in fleet ordering system, quarterly exception reviews.", createdAt: "2025-12-05" },
  { id: "r-6", title: "Rate Erosion Push-back", scope: "Supplier", categoryId: "cat-2", supplierId: "s-6", likelihood: 4, impact: 2, detectability: 2, riskScore: 16, appetiteThreshold: 20, status: "Open", ownerId: "u-6", linkedInitiativeId: "i-5", createdAt: "2026-01-08" },
  { id: "r-7", title: "Stakeholder Resistance to Governance", scope: "Category", categoryId: "cat-2", likelihood: 5, impact: 3, detectability: 2, riskScore: 30, appetiteThreshold: 25, status: "Mitigating", ownerId: "u-6", linkedInitiativeId: "i-6", mitigationPlan: "Executive sponsorship, change management program, phased rollout.", createdAt: "2026-01-12" },
  { id: "r-8", title: "Insourcing Talent Availability", scope: "Category", categoryId: "cat-2", likelihood: 4, impact: 4, detectability: 3, riskScore: 48, appetiteThreshold: 30, status: "Open", ownerId: "u-6", linkedInitiativeId: "i-8", createdAt: "2026-01-28" },
  { id: "r-9", title: "Quality Risk from New Suppliers", scope: "Supplier", categoryId: "cat-2", likelihood: 3, impact: 3, detectability: 3, riskScore: 27, appetiteThreshold: 25, status: "Open", ownerId: "u-6", linkedInitiativeId: "i-10", createdAt: "2026-01-18" },
  { id: "r-10", title: "OEM Delivery Lead-Time Delays", scope: "Material", categoryId: "cat-1", likelihood: 3, impact: 5, detectability: 4, riskScore: 60, appetiteThreshold: 30, status: "Mitigating", ownerId: "u-2", mitigationPlan: "Maintain rolling 6-month order pipeline, negotiate priority allocation with OEMs, expand rental pool buffer.", createdAt: "2025-10-15" },
  { id: "r-11", title: "Currency Fluctuation on EMEA Leases", scope: "Category", categoryId: "cat-1", likelihood: 4, impact: 3, detectability: 2, riskScore: 24, appetiteThreshold: 25, status: "Accepted", ownerId: "u-4", acceptedRationale: "Hedging strategy in place covers 80% of FX exposure on EUR-denominated leases.", createdAt: "2025-09-20" },
  { id: "r-12", title: "Regulatory Compliance Changes", scope: "Category", categoryId: "cat-2", likelihood: 3, impact: 4, detectability: 3, riskScore: 36, appetiteThreshold: 30, status: "Open", ownerId: "u-6", createdAt: "2026-01-05" },
  { id: "r-13", title: "Key Person Dependency (Vendor)", scope: "Supplier", categoryId: "cat-2", supplierId: "s-7", likelihood: 3, impact: 3, detectability: 4, riskScore: 36, appetiteThreshold: 25, status: "Open", ownerId: "u-6", createdAt: "2026-01-22" },
  { id: "r-14", title: "Telematics Data Privacy Breach", scope: "Supplier", categoryId: "cat-1", supplierId: "s-5", likelihood: 2, impact: 5, detectability: 3, riskScore: 30, appetiteThreshold: 25, status: "Mitigating", ownerId: "u-2", linkedInitiativeId: "i-2", mitigationPlan: "GDPR/CCPA compliance audit, data anonymization requirements, contractual data-ownership clauses.", createdAt: "2025-11-25" },
  { id: "r-15", title: "Subcontractor Performance Risk", scope: "Supplier", categoryId: "cat-2", supplierId: "s-10", likelihood: 4, impact: 2, detectability: 3, riskScore: 24, appetiteThreshold: 20, status: "Open", ownerId: "u-6", createdAt: "2026-02-01" },
]

export const kpis: KPI[] = [
  { id: "kpi-1", name: "Total Fleet Spend", definition: "Total annual fleet spend under management", calcMethod: "Sum of lease, fuel, insurance, maintenance, telematics", unit: "$M", target: 48, actual: 52.4, rag: "Amber", trend: "up", categoryId: "cat-1" },
  { id: "kpi-2", name: "Savings Pipeline", definition: "Total identified savings in pipeline", calcMethod: "Sum of initiative target savings", unit: "$M", target: 5.5, actual: 6.1, rag: "Green", trend: "up", categoryId: "cat-1" },
  { id: "kpi-3", name: "Policy Compliance", definition: "% vehicles in-policy (model, class, mileage)", calcMethod: "In-policy vehicles / Total fleet", unit: "%", target: 95, actual: 79, rag: "Red", trend: "up", categoryId: "cat-1" },
  { id: "kpi-4", name: "Supplier Count", definition: "Active fleet supplier count", calcMethod: "Count of active suppliers", unit: "#", target: 18, actual: 34, rag: "Amber", trend: "down", categoryId: "cat-1" },
  { id: "kpi-5", name: "Vehicle Delivery Lead Time", definition: "Avg. days from order to delivery", calcMethod: "Avg(delivery date - order date)", unit: "days", target: 60, actual: 78, rag: "Amber", trend: "down", categoryId: "cat-1" },
  { id: "kpi-6", name: "Realized Savings", definition: "Confirmed fleet savings realized", calcMethod: "Sum of realized benefits", unit: "$M", target: 2.8, actual: 2.0, rag: "Amber", trend: "up", categoryId: "cat-1" },
  { id: "kpi-7", name: "Total Category Spend", definition: "Total annual spend under management", calcMethod: "Sum of all PO values", unit: "$M", target: 26, actual: 28.7, rag: "Red", trend: "up", categoryId: "cat-2" },
  { id: "kpi-8", name: "Preferred Supplier Compliance", definition: "% of spend with preferred suppliers", calcMethod: "Preferred spend / Total spend", unit: "%", target: 85, actual: 62, rag: "Red", trend: "flat", categoryId: "cat-2" },
  { id: "kpi-9", name: "Average Blended Rate", definition: "Weighted average hourly rate", calcMethod: "Total fees / Total hours", unit: "$/hr", target: 270, actual: 295, rag: "Red", trend: "up", categoryId: "cat-2" },
  { id: "kpi-10", name: "Savings Pipeline", definition: "Total identified savings in pipeline", calcMethod: "Sum of initiative target savings", unit: "$M", target: 4.0, actual: 5.7, rag: "Green", trend: "up", categoryId: "cat-2" },
  { id: "kpi-11", name: "Demand Governance Compliance", definition: "% of engagements >$100K with approved business case", calcMethod: "Approved / Total over threshold", unit: "%", target: 100, actual: 45, rag: "Red", trend: "up", categoryId: "cat-2" },
  { id: "kpi-12", name: "Driver Satisfaction", definition: "Average driver satisfaction score", calcMethod: "Weighted average of driver survey scores", unit: "/100", target: 90, actual: 87, rag: "Amber", trend: "up", categoryId: "cat-1" },
]

export const roadmapItems: RoadmapItem[] = [
  { id: "rm-1", initiativeId: "i-1", wave: 1, startDate: "2025-10-01", endDate: "2026-06-30", milestones: [{ name: "Vendor evaluation complete", date: "2025-12-15", completed: true }, { name: "Contracts signed", date: "2026-03-31", completed: false }, { name: "Migration complete", date: "2026-06-30", completed: false }], owners: ["u-2"], dependencies: [], criticalPath: true, progress: 55 },
  { id: "rm-2", initiativeId: "i-2", wave: 1, startDate: "2025-11-01", endDate: "2026-09-30", milestones: [{ name: "Assessment complete", date: "2026-01-31", completed: true }, { name: "Pilot migration", date: "2026-04-30", completed: false }, { name: "Full migration", date: "2026-09-30", completed: false }], owners: ["u-2", "u-3"], dependencies: ["rm-1"], criticalPath: true, progress: 35 },
  { id: "rm-3", initiativeId: "i-3", wave: 2, startDate: "2026-01-01", endDate: "2026-07-31", milestones: [{ name: "RFP issued", date: "2026-02-28", completed: true }, { name: "Evaluation complete", date: "2026-04-30", completed: false }, { name: "Contract awarded", date: "2026-07-31", completed: false }], owners: ["u-2"], dependencies: [], criticalPath: false, progress: 30 },
  { id: "rm-4", initiativeId: "i-5", wave: 1, startDate: "2026-01-01", endDate: "2026-06-30", milestones: [{ name: "Benchmark analysis", date: "2026-02-15", completed: true }, { name: "Negotiations complete", date: "2026-04-30", completed: false }, { name: "New rates effective", date: "2026-06-30", completed: false }], owners: ["u-6"], dependencies: [], criticalPath: true, progress: 40 },
  { id: "rm-5", initiativeId: "i-6", wave: 2, startDate: "2026-03-01", endDate: "2026-09-30", milestones: [{ name: "Framework designed", date: "2026-04-15", completed: false }, { name: "Pilot launched", date: "2026-06-30", completed: false }, { name: "Full rollout", date: "2026-09-30", completed: false }], owners: ["u-6", "u-1"], dependencies: ["rm-4"], criticalPath: false, progress: 10 },
]

export const spendData: SpendData[] = [
  { month: "Jul 25", amount: 4_200_000, bu: "Sales", region: "US" },
  { month: "Aug 25", amount: 4_450_000, bu: "Sales", region: "US" },
  { month: "Sep 25", amount: 4_800_000, bu: "Market Access", region: "UK" },
  { month: "Oct 25", amount: 4_350_000, bu: "Sales", region: "US" },
  { month: "Nov 25", amount: 4_520_000, bu: "Market Access", region: "Germany" },
  { month: "Dec 25", amount: 4_900_000, bu: "Field Service", region: "Japan" },
  { month: "Jan 26", amount: 4_280_000, bu: "Sales", region: "US" },
  { month: "Feb 26", amount: 4_600_000, bu: "Market Access", region: "UK" },
]

export const notifications: Notification[] = [
  { id: "n-1", userId: "u-1", title: "Strategy Approval Pending", message: "Professional Services strategy v1 requires your approval.", type: "approval", read: false, createdAt: "2026-02-10", link: "/strategy/str-2" },
  { id: "n-2", userId: "u-1", title: "Contract Expiring", message: "EMEA Lease & Driver Services contract expires in 17 days.", type: "renewal", read: false, createdAt: "2026-02-09", link: "/contracts/c-3" },
  { id: "n-3", userId: "u-1", title: "Risk Threshold Exceeded", message: "Policy Non-Compliance risk score (48) exceeds appetite (30).", type: "alert", read: false, createdAt: "2026-02-08" },
  { id: "n-4", userId: "u-1", title: "Strategy Refresh Due", message: "Pharma Fleet strategy refresh due in 14 days.", type: "reminder", read: true, createdAt: "2026-02-05" },
  { id: "n-5", userId: "u-1", title: "Benefit Realization Review", message: "Q1 benefit realization review scheduled for next week.", type: "reminder", read: true, createdAt: "2026-02-03" },
]

export const auditEvents: AuditEvent[] = [
  { id: "ae-1", objectType: "Strategy", objectId: "str-1", action: "Approve", actorId: "u-1", timestamp: "2026-01-15T14:30:00Z", summary: "Strategy v2 approved after review cycle" },
  { id: "ae-2", objectType: "Initiative", objectId: "i-2", action: "Update", actorId: "u-2", timestamp: "2026-01-28T10:15:00Z", summary: "Stage updated from Qualify to Implement" },
  { id: "ae-3", objectType: "Risk", objectId: "r-7", action: "Update", actorId: "u-6", timestamp: "2026-01-25T09:00:00Z", summary: "Mitigation plan added, status changed to Mitigating" },
  { id: "ae-4", objectType: "Contract", objectId: "c-5", action: "Create", actorId: "u-6", timestamp: "2026-01-20T16:45:00Z", summary: "New contract created for Strategic Advisory Services" },
  { id: "ae-5", objectType: "Strategy", objectId: "str-2", action: "Create", actorId: "u-6", timestamp: "2025-12-01T11:00:00Z", summary: "Draft strategy created for Professional Services" },
]

// ─── Stakeholder Profiles ────────────────────────────────────────────────────

export const stakeholderProfiles: StakeholderProfile[] = [
  { userId: "u-1", name: "Sarah Chen", title: "VP Procurement", function: "Procurement", influence: "High", lastTouchpoint: "2026-02-05", nextTouchpoint: "2026-02-19", notes: "Executive sponsor for fleet category strategy. Needs quarterly updates on savings pipeline and EV transition milestones." },
  { userId: "u-2", name: "Marcus Rodriguez", title: "Fleet Category Manager", function: "Sales Ops", influence: "High", lastTouchpoint: "2026-02-10", nextTouchpoint: "2026-02-17", notes: "Day-to-day strategy owner. Focused on OEM consolidation, EV pilot, and policy compliance." },
  { userId: "u-3", name: "Emily Watson", title: "Procurement Analyst", function: "Finance", influence: "Medium", lastTouchpoint: "2026-02-08", nextTouchpoint: "2026-02-22", notes: "Supports fleet cost analysis and benefits tracking. Prefers data-driven discussions." },
  { userId: "u-4", name: "David Park", title: "Finance Director", function: "Finance", influence: "High", lastTouchpoint: "2026-01-28", nextTouchpoint: "2026-02-15", notes: "Final sign-off on fleet business cases >$500K. Concerned about lease-vs-buy economics and residual value." },
  { userId: "u-5", name: "Lisa Thompson", title: "Sales Ops Director", function: "Sales Ops", influence: "Medium", lastTouchpoint: "2026-02-03", nextTouchpoint: "2026-02-20", notes: "Field sales representative for driver experience. Focused on vehicle delivery timelines and driver satisfaction." },
  { userId: "u-6", name: "James Mitchell", title: "Senior Category Manager", function: "Procurement", influence: "High", lastTouchpoint: "2026-02-11", nextTouchpoint: "2026-02-18", notes: "Leads Professional Services strategy. Advocating for demand governance." },
]

// ─── Business Requirements ───────────────────────────────────────────────────

export const businessRequirements: BusinessRequirement[] = [
  { id: "br-1", title: "Reduce total fleet cost per driver", statement: "Achieve a minimum 15% reduction in total fleet cost per driver over a 3-year period through OEM consolidation, lease optimization, and fuel/maintenance cost management.", stakeholderId: "u-4", stakeholderName: "David Park", function: "Finance", driver: "Cost", priority: "Must", status: "Approved", metricTarget: "15% cost-per-driver reduction by 2028", evidence: "Current cost-per-driver analysis shows 22% above pharma fleet benchmark. Board mandate for cost optimization.", constraints: "Cannot disrupt field sales coverage during transition.", dueDate: "2028-12-31", tags: ["cost-reduction", "fleet", "lease"], impactedModules: ["Internal Fact Base", "Supplier Strategy", "Opportunity Backlog", "Roadmap & Execution"], objectiveId: "obj-1", updatedAt: "2026-02-01" },
  { id: "br-2", title: "Consolidate fleet supplier base", statement: "Reduce the fleet supplier base from 34 to 18 strategic and preferred partners (OEMs, FMCs, dealers) while maintaining service continuity and competitive tension.", stakeholderId: "u-2", stakeholderName: "Marcus Rodriguez", function: "Sales Ops", driver: "Cost", priority: "Must", status: "Approved", metricTarget: "18 or fewer active suppliers", evidence: "Supplier analysis shows 8 partners represent 82% of spend. Tail suppliers add disproportionate admin cost.", dueDate: "2027-06-30", tags: ["consolidation", "supplier-rationalization"], impactedModules: ["Supplier Strategy", "Risk Management"], objectiveId: "obj-2", updatedAt: "2026-01-28" },
  { id: "br-3", title: "Achieve 30% EV/hybrid fleet adoption", statement: "Transition at least 30% of the fleet to EV or hybrid vehicles by 2028 with adequate charging infrastructure support for field reps.", stakeholderId: "u-5", stakeholderName: "Lisa Thompson", function: "Sales Ops", driver: "Sustainability", priority: "Must", status: "Validated", metricTarget: "30% EV/hybrid by 2028", evidence: "Current EV share is 12%. ESG board mandate and driver interest surveys show 68% willingness to switch.", constraints: "Charging infrastructure must be available in rep home territories and key customer sites.", dueDate: "2028-06-30", tags: ["EV", "sustainability", "fleet"], impactedModules: ["Internal Fact Base", "Supplier Strategy", "Risk Management", "Roadmap & Execution"], objectiveId: "obj-3", updatedAt: "2026-02-05" },
  { id: "br-4", title: "Improve fleet policy compliance", statement: "Increase policy compliance to 95% across the fleet, reducing exceptions and ensuring adherence to approved vehicle class, mileage bands, and refresh cycles.", stakeholderId: "u-1", stakeholderName: "Sarah Chen", function: "Procurement", driver: "Compliance", priority: "Should", status: "Validated", metricTarget: "95% policy compliance", evidence: "Current compliance at 79%. $4.1M in exception spend identified in last audit.", dueDate: "2027-03-31", tags: ["compliance", "policy", "governance"], impactedModules: ["Internal Fact Base", "Risk Management"], objectiveId: "obj-4", updatedAt: "2026-01-15" },
  { id: "br-5", title: "Establish ESG requirements for fleet suppliers", statement: "All strategic and preferred fleet suppliers must meet minimum ESG criteria including carbon disclosure, EV transition roadmap, and diversity reporting.", stakeholderId: "u-1", stakeholderName: "Sarah Chen", function: "Procurement", driver: "Sustainability", priority: "Should", status: "Proposed", evidence: "Board ESG mandate requires supply chain transparency by Q3 2027.", dueDate: "2027-09-30", tags: ["ESG", "sustainability", "diversity"], impactedModules: ["ESG & Diversity", "Supplier Strategy", "External Intelligence"], updatedAt: "2026-02-08" },
  { id: "br-6", title: "Vehicles must meet safety rating threshold", statement: "All fleet vehicles must achieve minimum 5-star NCAP safety rating and include ADAS features. AWD required in selected territories.", stakeholderId: "u-2", stakeholderName: "Marcus Rodriguez", function: "Sales Ops", driver: "Risk", priority: "Must", status: "Validated", metricTarget: "100% 5-star NCAP rated vehicles", evidence: "3 accident claims in past year involved sub-standard safety-rated vehicles. HR mandating enhanced safety specs.", constraints: "AWD adds $2-4K per vehicle; limited to Northeast, Midwest, and mountain territories.", dueDate: "2027-06-30", tags: ["safety", "compliance", "ADAS"], impactedModules: ["Risk Management", "Supplier Strategy"], updatedAt: "2026-02-03" },
  { id: "br-7", title: "Telematics must be privacy-compliant", statement: "All telematics solutions must comply with GDPR, CCPA, and company privacy policies. Driver data must be anonymized and company-owned.", stakeholderId: "u-3", stakeholderName: "Emily Watson", function: "Finance", driver: "Compliance", priority: "Must", status: "Proposed", metricTarget: "100% telematics privacy compliance", evidence: "Legal flagged 2 telematics vendors for non-compliant data handling. Privacy audit underway.", dueDate: "2027-09-30", tags: ["privacy", "telematics", "compliance"], impactedModules: ["Risk Management", "External Intelligence"], updatedAt: "2026-02-10" },
  { id: "br-8", title: "Refresh cycle must not exceed 36 months", statement: "All fleet vehicles must be refreshed within 36 months or 75,000 miles to maintain residual value and minimize maintenance costs.", stakeholderId: "u-4", stakeholderName: "David Park", function: "Finance", driver: "Cost", priority: "Must", status: "Approved", metricTarget: "100% fleet refreshed within 36 months", evidence: "Vehicles held beyond 36 months show 40% higher maintenance costs and 15% lower residual values.", dueDate: "2026-09-30", tags: ["refresh", "lifecycle", "cost"], impactedModules: ["Internal Fact Base", "Risk Management", "Roadmap & Execution"], objectiveId: "obj-5", updatedAt: "2026-01-20" },
]

// ─── Objectives (linked from requirements) ──────────────────────────────────

export const objectives: Objective[] = [
  { id: "obj-1", title: "Reduce fleet cost per driver by 15%", description: "Achieve a minimum 15% reduction in total fleet cost per driver through OEM consolidation, lease optimization, and fuel/maintenance management.", metricTarget: "15% cost-per-driver reduction", owner: "Marcus Rodriguez", ownerId: "u-2", targetDate: "2028-12-31", requirementIds: ["br-1"], categoryId: "cat-1" },
  { id: "obj-2", title: "Consolidate to 18 strategic partners", description: "Reduce fleet supplier base from 34 to 18 strategic/preferred partners while maintaining service continuity.", metricTarget: "18 or fewer suppliers", owner: "Marcus Rodriguez", ownerId: "u-2", targetDate: "2027-06-30", requirementIds: ["br-2"], categoryId: "cat-1" },
  { id: "obj-3", title: "Achieve 30% EV/hybrid fleet adoption", description: "Transition at least 30% of the fleet to EV or hybrid vehicles with adequate charging infrastructure.", metricTarget: "30% EV/hybrid by 2028", owner: "Lisa Thompson", ownerId: "u-5", targetDate: "2028-06-30", requirementIds: ["br-3"], categoryId: "cat-1" },
  { id: "obj-4", title: "Achieve 95% policy compliance", description: "Improve fleet policy compliance to 95%, reducing exceptions and ensuring adherence to approved vehicle specs and refresh cycles.", metricTarget: "95% compliance", owner: "Sarah Chen", ownerId: "u-1", targetDate: "2027-03-31", requirementIds: ["br-4"], categoryId: "cat-1" },
  { id: "obj-5", title: "Enforce 36-month refresh cycle", description: "Ensure all fleet vehicles are refreshed within 36 months or 75,000 miles to maintain residual value and minimize maintenance costs.", metricTarget: "100% fleet within 36 months", owner: "David Park", ownerId: "u-4", targetDate: "2026-09-30", requirementIds: ["br-8"], categoryId: "cat-1" },
]

// ─── SKU & Price Data (Internal Fact Base) ───────────────────────────────────

export interface SKURecord {
  id: string
  sku: string
  description: string
  subcategory: string
  supplierIds: string[]
  country: string
  region: string
  bu: string
  units: number
  avgUnitPrice: number
  totalSpend: number
  lastPurchaseDate: string
  contracted: boolean
  paymentType: "PO" | "Non-PO" | "Card"
}

export interface SKUPriceTrend {
  skuId: string
  points: { date: string; price: number }[]
}

export interface IndexTrend {
  id: string
  name: string
  category: string
  points: { date: string; value: number }[]
}

export const skuRecords: SKURecord[] = [
  { id: "sku-1", sku: "VEH-SDN-MID", description: "Midsize Sedan (ICE) - 36mo lease", subcategory: "Lease/Depreciation", supplierIds: ["s-1"], country: "US", region: "North America", bu: "Sales", units: 420, avgUnitPrice: 680, totalSpend: 3_427_200, lastPurchaseDate: "2026-01-15", contracted: true, paymentType: "PO" },
  { id: "sku-2", sku: "VEH-SDN-MID", description: "Midsize Sedan (ICE) - 36mo lease", subcategory: "Lease/Depreciation", supplierIds: ["s-3"], country: "Germany", region: "EMEA", bu: "Sales", units: 280, avgUnitPrice: 720, totalSpend: 2_419_200, lastPurchaseDate: "2026-01-20", contracted: true, paymentType: "PO" },
  { id: "sku-3", sku: "VEH-SUV-CMP", description: "Compact SUV (ICE) - 36mo lease", subcategory: "Lease/Depreciation", supplierIds: ["s-1"], country: "US", region: "North America", bu: "Market Access", units: 320, avgUnitPrice: 780, totalSpend: 2_995_200, lastPurchaseDate: "2025-12-10", contracted: true, paymentType: "PO" },
  { id: "sku-4", sku: "VEH-EV-SDN", description: "Electric Sedan - 36mo lease", subcategory: "Lease/Depreciation", supplierIds: ["s-2"], country: "US", region: "North America", bu: "Sales", units: 150, avgUnitPrice: 850, totalSpend: 1_530_000, lastPurchaseDate: "2026-02-01", contracted: true, paymentType: "PO" },
  { id: "sku-5", sku: "VEH-HYB-SUV", description: "Hybrid SUV - 36mo lease", subcategory: "Lease/Depreciation", supplierIds: ["s-4"], country: "US", region: "North America", bu: "Market Access", units: 180, avgUnitPrice: 820, totalSpend: 1_771_200, lastPurchaseDate: "2026-01-28", contracted: true, paymentType: "PO" },
  { id: "sku-6", sku: "VEH-SDN-MID", description: "Midsize Sedan (ICE) - 36mo lease", subcategory: "Lease/Depreciation", supplierIds: ["s-5"], country: "Japan", region: "APAC", bu: "Sales", units: 120, avgUnitPrice: 750, totalSpend: 1_080_000, lastPurchaseDate: "2025-11-15", contracted: false, paymentType: "PO" },
  { id: "sku-7", sku: "FUEL-STD", description: "Fuel Card - Standard tier", subcategory: "Fuel", supplierIds: ["s-8"], country: "US", region: "North America", bu: "Sales", units: 1200, avgUnitPrice: 380, totalSpend: 5_472_000, lastPurchaseDate: "2026-01-05", contracted: true, paymentType: "PO" },
  { id: "sku-8", sku: "FUEL-STD", description: "Fuel Card - Standard tier", subcategory: "Fuel", supplierIds: ["s-9"], country: "Germany", region: "EMEA", bu: "Sales", units: 550, avgUnitPrice: 420, totalSpend: 2_772_000, lastPurchaseDate: "2025-12-20", contracted: true, paymentType: "PO" },
  { id: "sku-9", sku: "MAINT-FULL", description: "Full Maintenance Program", subcategory: "Maintenance/Repair", supplierIds: ["s-2"], country: "US", region: "North America", bu: "Sales", units: 800, avgUnitPrice: 185, totalSpend: 1_776_000, lastPurchaseDate: "2026-02-05", contracted: true, paymentType: "PO" },
  { id: "sku-10", sku: "MAINT-FULL", description: "Full Maintenance Program", subcategory: "Maintenance/Repair", supplierIds: ["s-3"], country: "Germany", region: "EMEA", bu: "Market Access", units: 400, avgUnitPrice: 210, totalSpend: 1_008_000, lastPurchaseDate: "2025-12-18", contracted: false, paymentType: "Non-PO" },
  { id: "sku-11", sku: "INS-FLEET", description: "Fleet Insurance Policy", subcategory: "Insurance", supplierIds: ["s-4"], country: "US", region: "North America", bu: "Sales", units: 1400, avgUnitPrice: 165, totalSpend: 2_772_000, lastPurchaseDate: "2026-02-10", contracted: true, paymentType: "PO" },
  { id: "sku-12", sku: "TELEM-STD", description: "Telematics Device + Platform", subcategory: "Telematics", supplierIds: ["s-4"], country: "US", region: "North America", bu: "Sales", units: 1400, avgUnitPrice: 42, totalSpend: 705_600, lastPurchaseDate: "2026-02-08", contracted: true, paymentType: "PO" },
  { id: "sku-13", sku: "TIRE-ALL", description: "All-Season Tire Replacement Program", subcategory: "Tires", supplierIds: ["s-2"], country: "US", region: "North America", bu: "Sales", units: 2400, avgUnitPrice: 145, totalSpend: 417_600, lastPurchaseDate: "2026-01-22", contracted: true, paymentType: "PO" },
  { id: "sku-14", sku: "TIRE-ALL", description: "All-Season Tire Replacement Program", subcategory: "Tires", supplierIds: ["s-3"], country: "UK", region: "EMEA", bu: "Market Access", units: 800, avgUnitPrice: 160, totalSpend: 153_600, lastPurchaseDate: "2025-11-30", contracted: false, paymentType: "Non-PO" },
  { id: "sku-15", sku: "TOLL-PARK", description: "Tolls & Parking Expense", subcategory: "Tolls/Parking", supplierIds: ["s-9"], country: "Germany", region: "EMEA", bu: "Sales", units: 550, avgUnitPrice: 95, totalSpend: 627_000, lastPurchaseDate: "2026-01-18", contracted: false, paymentType: "Card" },
  { id: "sku-16", sku: "RENTAL-STD", description: "Short-Term Vehicle Rental", subcategory: "Rentals", supplierIds: ["s-5"], country: "Japan", region: "APAC", bu: "Field Service", units: 200, avgUnitPrice: 320, totalSpend: 768_000, lastPurchaseDate: "2025-10-25", contracted: false, paymentType: "Card" },
]

// 5-year price trends for each unique SKU
function generatePriceTrend(basePrice: number, volatility: number): { date: string; price: number }[] {
  const points: { date: string; price: number }[] = []
  let price = basePrice * 0.88
  for (let y = 2021; y <= 2026; y++) {
    for (let q = 1; q <= 4; q++) {
      if (y === 2026 && q > 1) break
      price = price * (1 + (Math.sin(y * 3 + q) * volatility) + 0.005)
      points.push({ date: `Q${q} ${y}`, price: Math.round(price * 100) / 100 })
    }
  }
  return points
}

export const skuPriceTrends: SKUPriceTrend[] = [
  { skuId: "VEH-SDN-MID", points: generatePriceTrend(700, 0.02) },
  { skuId: "VEH-SUV-CMP", points: generatePriceTrend(780, 0.025) },
  { skuId: "VEH-EV-SDN", points: generatePriceTrend(850, 0.035) },
  { skuId: "VEH-HYB-SUV", points: generatePriceTrend(820, 0.03) },
  { skuId: "FUEL-STD", points: generatePriceTrend(400, 0.06) },
  { skuId: "MAINT-FULL", points: generatePriceTrend(195, 0.025) },
  { skuId: "INS-FLEET", points: generatePriceTrend(165, 0.03) },
  { skuId: "TELEM-STD", points: generatePriceTrend(42, 0.015) },
  { skuId: "TIRE-ALL", points: generatePriceTrend(150, 0.02) },
  { skuId: "TOLL-PARK", points: generatePriceTrend(95, 0.01) },
  { skuId: "RENTAL-STD", points: generatePriceTrend(320, 0.04) },
]

export const indexTrends: IndexTrend[] = [
  { id: "idx-1", name: "Vehicle Residual Value Index", category: "Lease/Depreciation", points: generatePriceTrend(100, 0.04).map((p) => ({ date: p.date, value: p.price / 100 * 105 })) },
  { id: "idx-2", name: "US Retail Gasoline Price", category: "Fuel", points: generatePriceTrend(100, 0.06).map((p) => ({ date: p.date, value: p.price / 100 * 98 })) },
  { id: "idx-3", name: "Auto Insurance Premium Index", category: "Insurance", points: generatePriceTrend(100, 0.03).map((p) => ({ date: p.date, value: p.price / 100 * 110 })) },
  { id: "idx-4", name: "Labor Rate Index (Auto Repair)", category: "Maintenance/Repair", points: generatePriceTrend(100, 0.02).map((p) => ({ date: p.date, value: p.price / 100 * 95 })) },
  { id: "idx-5", name: "USD Trade-Weighted FX", category: "All", points: generatePriceTrend(100, 0.015).map((p) => ({ date: p.date, value: p.price / 100 * 100 })) },
  { id: "idx-6", name: "Rubber / Tire Material Index", category: "Tires", points: generatePriceTrend(100, 0.035).map((p) => ({ date: p.date, value: p.price / 100 * 102 })) },
]

export function getSkusByCategory(categoryId: string) {
  const catSuppliers = getSuppliersByCategory(categoryId)
  const ids = new Set(catSuppliers.map((s) => s.id))
  return skuRecords.filter((sku) => sku.supplierIds.some((sid) => ids.has(sid)))
}

export function getSkuPriceTrend(skuCode: string) {
  return skuPriceTrends.find((t) => t.skuId === skuCode)
}

export function getRelevantIndices(subcategory: string) {
  return indexTrends.filter((i) => i.category === subcategory || i.category === "All")
}

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getCategoryById(id: string) {
  return categories.find((c) => c.id === id)
}

export function getSuppliersByCategory(categoryId: string) {
  return suppliers.filter((s) => s.categoryIds.includes(categoryId))
}

export function getContractsByCategory(categoryId: string) {
  return contracts.filter((c) => c.categoryId === categoryId)
}

export function getStrategyByCategory(categoryId: string) {
  return strategies.find((s) => s.categoryId === categoryId)
}

export function getInitiativesByCategory(categoryId: string) {
  return initiatives.filter((i) => i.categoryId === categoryId)
}

export function getRisksByCategory(categoryId: string) {
  return risks.filter((r) => r.categoryId === categoryId)
}

export function getKPIsByCategory(categoryId: string) {
  return kpis.filter((k) => k.categoryId === categoryId)
}

export function getRoadmapByCategory(categoryId: string) {
  const catInitiatives = getInitiativesByCategory(categoryId)
  const ids = catInitiatives.map((i) => i.id)
  return roadmapItems.filter((r) => ids.includes(r.initiativeId))
}

export function getUserById(id: string) {
  return users.find((u) => u.id === id)
}

export function getSupplierById(id: string) {
  return suppliers.find((s) => s.id === id)
}

export function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

export function ragColor(rag: RAG) {
  switch (rag) {
    case "Green": return "text-success"
    case "Amber": return "text-warning"
    case "Red": return "text-destructive"
  }
}

export function ragBg(rag: RAG) {
  switch (rag) {
    case "Green": return "bg-emerald-500/10 text-emerald-700 border-emerald-200"
    case "Amber": return "bg-amber-500/10 text-amber-700 border-amber-200"
    case "Red": return "bg-red-500/10 text-red-700 border-red-200"
  }
}

export function stageColor(stage: InitiativeStage) {
  const map: Record<InitiativeStage, string> = {
    Idea: "bg-slate-100 text-slate-700 border-slate-200",
    Qualify: "bg-sky-50 text-sky-700 border-sky-200",
    Source: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Contract: "bg-amber-50 text-amber-700 border-amber-200",
    Implement: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Realize: "bg-teal-50 text-teal-700 border-teal-200",
  }
  return map[stage]
}

export function riskScoreRAG(score: number, threshold: number): RAG {
  if (score > threshold * 1.5) return "Red"
  if (score > threshold) return "Amber"
  return "Green"
}

export function getRequirementsByCategory(categoryId: string): BusinessRequirement[] {
  // Return all requirements whose stakeholder is involved in this category
  try {
    const strategy = getStrategyByCategory(categoryId)
    if (!strategy) return businessRequirements // fallback: return all if no strategy found
    const catInitiatives = getInitiativesByCategory(categoryId)
    const involvedIds = new Set<string>()
    involvedIds.add(strategy.ownerId)
    for (const init of catInitiatives) {
      if (init.ownerId) involvedIds.add(init.ownerId)
      if (Array.isArray(init.stakeholders)) {
        for (const s of init.stakeholders) involvedIds.add(s)
      }
    }
    const filtered = businessRequirements.filter((r) => involvedIds.has(r.stakeholderId))
    // If filtering produces nothing (stakeholder IDs don't overlap), return all requirements
    return filtered.length > 0 ? filtered : businessRequirements
  } catch {
    return businessRequirements
  }
}

export function getObjectivesByCategory(categoryId: string) {
  return objectives.filter((o) => o.categoryId === categoryId)
}

export function getStakeholderProfiles() {
  return stakeholderProfiles
}

let requirementCounter = businessRequirements.length

export function createRequirement(
  fields: Omit<BusinessRequirement, "id" | "updatedAt" | "tags" | "impactedModules"> & {
    tags?: string[]
    impactedModules?: string[]
  }
): BusinessRequirement {
  requirementCounter++
  const now = new Date().toISOString().slice(0, 10)
  const req: BusinessRequirement = {
    ...fields,
    id: `br-${requirementCounter}`,
    tags: fields.tags ?? [],
    impactedModules: fields.impactedModules ?? [],
    updatedAt: now,
  }
  businessRequirements.push(req)
  return req
}
