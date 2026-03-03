// ─── Negotiations Module – Data Model & Mock Data ───────────────────────────

// ─── Enums / Literals ───────────────────────────────────────────────────────

export type WorkspaceSection =
  | "overview"
  | "fact-base"
  | "spectrum"
  | "levers"
  | "objectives"
  | "narrative"
  | "team-scripts"
  | "live-negotiation"
  | "close-out"

export type WorkspaceStatus = "draft" | "in-progress" | "live" | "closed-won" | "closed-no-deal"

export type SpectrumQuadrant =
  | "transactional-competitive"
  | "leverage"
  | "strategic-critical"
  | "bottleneck"

export type ObjectiveDomain =
  | "cost-price"
  | "quality"
  | "sla"
  | "min-volumes"
  | "lead-time"
  | "contract-terms"
  | "risk-resiliency"
  | "innovation"

export type LeverCategory =
  | "competition"
  | "commitment"
  | "transparency"
  | "performance"
  | "engineering"
  | "working-capital"

export type ApprovalStatus = "pending" | "approved" | "rejected" | "not-required"
export type OfferStatus = "draft" | "sent" | "countered" | "accepted" | "rejected" | "expired"

// ─── Core Entities ──────────────────────────────────────────────────────────

export interface NegotiationSupplier {
  id: string
  name: string
  category: string
  annualSpend: number
  contractEnd: string
  country: string
  segment: "Strategic" | "Preferred" | "Approved" | "Transactional"
}

export interface WorkspaceScope {
  regions: string[]
  businessUnits: string[]
  skuGroups: string[]
}

export interface SpectrumPlacement {
  supplierId: string
  supplierName: string
  relationshipCriticality: number
  supplyMarketConstraint: number
  quadrant: SpectrumQuadrant
  confidence: number
  topDrivers: string[]
  topDriverMetrics: { driver: string; value: string }[]
  recommendedLevers: LeverCategory[]
  manualOverride: boolean
  overrideReason?: string
  overrideTimestamp?: string
  aiReasoning: string
  missingData: string[]
}

export interface FactSection {
  id: string
  supplierId: string
  type: "external" | "supplier-pack"
  title: string
  items: FactItem[]
}

export interface FactItem {
  id: string
  title: string
  category: "market-growth" | "capacity" | "indices" | "financial-health" | "spend" | "price-history" | "contract" | "sla-performance"
  content: string
  source: string
  confidence: number
  lastUpdated: string
  dataPoints?: { label: string; value: string }[]
}

export type LeverEffort = "low" | "medium" | "high"
export type LeverImpact = "low" | "medium" | "high"

export interface LeverWorkflow {
  id: string
  step: string
  description: string
  status: "pending" | "active" | "done"
  output?: string
}

export interface LeverArtifact {
  id: string
  type: "chart" | "table" | "card" | "document"
  title: string
  description: string
  linkedFactIds?: string[]
  data?: Record<string, unknown>
}

export interface LeverOutputItem {
  id: string
  type: "value-range" | "argument-card" | "ask-clause" | "task" | "offer-package"
  title: string
  content: string
  quantifiedValue?: { low: number; high: number; unit: string }
  targetSection?: "fact-base" | "objectives" | "narrative" | "live-negotiation"
  status: "draft" | "saved" | "pushed"
}

export interface QuoteEntry {
  id: string
  supplierName: string
  unitPrice: number
  moq: number
  leadTimeDays: number
  toolingCost: number
  freightPerUnit: number
  totalLandedCost: number
  status: "received" | "pending" | "declined"
  notes?: string
}

export interface IndexWeight {
  indexName: string
  weight: number
  currentYoY: number
  series: { period: string; value: number }[]
}

export interface AllocationScenario {
  id: string
  name: string
  splits: { supplierName: string; pct: number; unitPrice: number }[]
  blendedPrice: number
  totalSavings: number
}

export interface SlaSimRow {
  threshold: string
  currentPerformance: number
  creditPerUnit: number
  estAnnualCredit: number
}

export interface VaveOpportunity {
  id: string
  initiative: string
  savingsEstPct: number
  effort: LeverEffort
  qualTimeline: string
  owner: string
}

export interface TermsScenario {
  id: string
  name: string
  paymentDays: number
  priceEquivPct: number
  cashImpact: number
  supplierImpact: string
}

export interface LeverRun {
  id: string
  leverId: string
  startedAt: string
  completedAt?: string
  confidenceScore: number
  dataGaps: string[]
  quotes?: QuoteEntry[]
  indexWeights?: IndexWeight[]
  allocationScenarios?: AllocationScenario[]
  slaSimulation?: SlaSimRow[]
  vaveOpportunities?: VaveOpportunity[]
  termsScenarios?: TermsScenario[]
  artifacts: LeverArtifact[]
  outputs: LeverOutputItem[]
}

export interface LeverRecommendation {
  leverId: string
  category: LeverCategory
  recommended: boolean
  reasoning: string
  prerequisites: string[]
  impactEstimate: LeverImpact
  effortEstimate: LeverEffort
  sequenceOrder: number
}

export interface Lever {
  id: string
  category: LeverCategory
  name: string
  description: string
  status: "not-started" | "in-progress" | "complete"
  inputs: string[]
  outputs: string[]
  estimatedImpact?: string
  impact: LeverImpact
  effort: LeverEffort
  workflows: LeverWorkflow[]
  run?: LeverRun
  recommendation?: LeverRecommendation
}

export type ObjectivePriority = "Must-have" | "Important" | "Nice-to-have"
export type ObjectiveSource = "ai" | "user" | "template"
export type ObjectiveMetric =
  | "unit-price" | "pct-reduction" | "rebate-pct" | "otd-pct" | "ppm-defect"
  | "lead-time-days" | "net-terms-days" | "moq-units" | "contract-months"
  | "index-formula" | "custom"

export interface ObjectiveTargets {
  anchor?: string     // opening position (aggressive)
  mdo: string         // Most Desirable Outcome
  laa: string         // Least Acceptable Agreement
}

export interface ObjectiveOverrideEntry {
  field: string
  before: string
  after: string
  userId: string
  timestamp: string
  reason?: string
}

export interface Objective {
  id: string
  domain: ObjectiveDomain
  title: string
  metric?: ObjectiveMetric
  scope?: { supplierIds?: string[]; skuCodes?: string[]; regions?: string[]; bus?: string[] }
  anchor?: string          // opening position
  laa: string              // Least Acceptable Agreement
  mdo: string              // Most Desirable Outcome
  batna: string            // Best Alternative to Negotiated Agreement
  priority: ObjectivePriority
  weight?: number          // 0-100, used for scoring
  rationale: string
  linkedLeverId?: string
  linkedFactIds?: string[]
  owner?: string
  notes?: string
  status: "draft" | "active" | "achieved" | "missed"
  // AI provenance
  source: ObjectiveSource
  aiConfidence?: number    // 0-100
  aiRationale?: string     // why AI chose these values
  missingData?: string[]   // data gaps that would improve confidence
  aiVersion?: number       // tracks regeneration cycles
  userEdited?: boolean     // true once user touches any field
  overrideLog?: ObjectiveOverrideEntry[]
  timing?: { effectiveDate?: string; contractTerm?: string }
}

export interface ObjectiveSetMeta {
  version: number
  source: ObjectiveSource
  status: "draft" | "locked"
  generatedAt: string
  lockedAt?: string
  lockedBy?: string
  assumptions: string[]
}

export interface ArgumentCard {
  id: string
  title: string
  claim: string
  evidence: string
  ask: string
  rebuttal: string
  linkedFactIds: string[]
  linkedLeverIds: string[]
  strength: "strong" | "moderate" | "weak"
}

export interface NegotiationRound {
  id: string
  roundNumber: number
  date: string
  offers: RoundOffer[]
  decisionLog: string[]
  approvals: RoundApproval[]
  notes: string
  status: "planning" | "active" | "complete"
}

export interface RoundOffer {
  id: string
  direction: "outgoing" | "incoming"
  price: number
  terms: string
  status: OfferStatus
  createdBy: string
  createdAt: string
  concessions: string[]
  asks: string[]
}

export interface RoundApproval {
  id: string
  gate: "finance" | "legal" | "procurement-lead"
  approver: string
  status: ApprovalStatus
  requestedAt: string
  decidedAt?: string
  comments?: string
}

export interface CloseOut {
  finalPrice?: number
  finalTerms?: string
  savingsRealized?: number
  savingsPct?: number
  lessonsLearned: string[]
  nextSteps: string[]
}

export interface NegotiationWorkspace {
  id: string
  name: string
  category: string
  status: WorkspaceStatus
  liveRound?: number
  scope: WorkspaceScope
  supplierIds: string[]
  createdBy: string
  createdAt: string
  lastModified: string
  spectrumPlacements: SpectrumPlacement[]
  factSections: FactSection[]
  levers: Lever[]
  objectives: Objective[]
  arguments: ArgumentCard[]
  rounds: NegotiationRound[]
  closeOut?: CloseOut
}

// ─── Master Data Catalogs ──────────────────────────────────────────────────

export interface MasterSKU {
  code: string
  name: string
  category: string
  regions: string[]
}

export const MASTER_CATEGORIES = [
  "Injection Molding", "Semiconductor Components", "Freight & Distribution",
  "Raw Materials", "Packaging Materials", "Electronic Assemblies",
  "Specialty Chemicals", "Industrial Tooling", "MRO Supplies", "IT Services",
] as const

export const MASTER_REGIONS = [
  "North America", "EMEA", "Asia-Pacific", "Latin America", "Middle East & Africa",
] as const

export const MASTER_SKUS: MasterSKU[] = [
  { code: "IM-001", name: "ABS Housing Shell", category: "Injection Molding", regions: ["North America", "EMEA"] },
  { code: "IM-002", name: "PP Bracket Assembly", category: "Injection Molding", regions: ["North America"] },
  { code: "IM-003", name: "Nylon Clip Set", category: "Injection Molding", regions: ["North America", "Asia-Pacific"] },
  { code: "IM-004", name: "PC Cover Plate", category: "Injection Molding", regions: ["EMEA", "Asia-Pacific"] },
  { code: "SC-001", name: "Precision Sensor Module", category: "Semiconductor Components", regions: ["Asia-Pacific"] },
  { code: "SC-002", name: "Logic IC Array", category: "Semiconductor Components", regions: ["Asia-Pacific", "North America"] },
  { code: "SC-003", name: "MEMS Accelerometer", category: "Semiconductor Components", regions: ["Asia-Pacific"] },
  { code: "FD-001", name: "FTL Domestic Freight", category: "Freight & Distribution", regions: ["North America"] },
  { code: "FD-002", name: "Cross-border LTL", category: "Freight & Distribution", regions: ["North America", "Latin America"] },
  { code: "RM-001", name: "Cold-Rolled Steel Coil", category: "Raw Materials", regions: ["North America", "EMEA"] },
  { code: "RM-002", name: "Aluminum Extrusion", category: "Raw Materials", regions: ["EMEA", "Asia-Pacific"] },
  { code: "RM-003", name: "Stainless Rod Stock", category: "Raw Materials", regions: ["North America"] },
  { code: "PK-001", name: "Corrugated Shipper Box", category: "Packaging Materials", regions: ["North America", "Latin America"] },
  { code: "PK-002", name: "ESD Foam Insert", category: "Packaging Materials", regions: ["North America", "Asia-Pacific"] },
  { code: "EA-001", name: "PCB Main Board", category: "Electronic Assemblies", regions: ["Asia-Pacific"] },
  { code: "EA-002", name: "Wire Harness Set", category: "Electronic Assemblies", regions: ["North America", "EMEA"] },
  { code: "CH-001", name: "Epoxy Resin Batch", category: "Specialty Chemicals", regions: ["North America", "Asia-Pacific"] },
  { code: "CH-002", name: "Isocyanate Blend", category: "Specialty Chemicals", regions: ["EMEA"] },
  { code: "TL-001", name: "CNC End Mill Kit", category: "Industrial Tooling", regions: ["North America"] },
  { code: "TL-002", name: "Carbide Insert Set", category: "Industrial Tooling", regions: ["North America", "EMEA"] },
]

export function getSkusForCategory(category: string): MasterSKU[] {
  return MASTER_SKUS.filter((s) => s.category === category)
}

export function getSkusForCategoryAndRegions(category: string, regions: string[]): MasterSKU[] {
  if (regions.length === 0) return getSkusForCategory(category)
  return MASTER_SKUS.filter(
    (s) => s.category === category && s.regions.some((r) => regions.includes(r))
  )
}

// ─── Time-Series Data for Charts ──────────────────────────────────────────

export interface SpendTimeSeries {
  year: number
  total: number
  byRegion: Record<string, number>
  bySku: Record<string, number>
}

export interface PriceVolumePoint {
  period: string
  price: number
  volume: number
  sku?: string
}

export interface SlaDataPoint {
  period: string
  otd: number
  rejectRate: number
  otdTarget: number
  rejectTarget: number
}

export interface SupplierFactPack {
  supplierId: string
  spendHistory: SpendTimeSeries[]
  priceVolume: PriceVolumePoint[]
  slaPerformance: SlaDataPoint[]
}

// ─── Market Overview Data ─────────────────────────────────────────────────

export interface GrowthSeriesPoint {
  year: number
  index: number          // normalized to 100 at start
  absoluteValue?: number // underlying revenue / market size if available
  yoyPct?: number        // YoY % change
}

export interface SupplierGrowthSeries {
  supplierId: string
  name: string
  series: GrowthSeriesPoint[]
  dataProxy?: string              // e.g. "Revenue", "Shipment Volume", "Capacity"
  coverage: number                // 0-100: data completeness %
  confidence: number              // 0-100
  isNegotiatedSupplier: boolean   // always pinned + emphasized
}

export interface MarketGrowthSeries {
  series: GrowthSeriesPoint[]
  label: string                   // e.g. "Overall Market Revenue Index"
  source: string
  confidence: number
}

export interface MarketOverview {
  category: string
  marketSizeB: number
  cagr: number
  regionalGrowth: { region: string; growth: number }[]
  topSuppliers: { name: string; sharePercent: number; growth: number; last12mGrowth: number; coverage: number }[]
  marketGrowthSeries: MarketGrowthSeries
  supplierGrowthSeries: SupplierGrowthSeries[]
  lastUpdated: string
  source: string
}

export interface ExternalInsight {
  id: string
  title: string
  summary: string
  tags: string[]
  source: string
  date: string
  confidence: number
  pinnedTo: "workspace" | string   // "workspace" or a supplierId
  aiImplication?: string
}

// ─── Alpha Plastics Fact Pack (time-series) ───────────────────────────────

export const alphaFactPack: SupplierFactPack = {
  supplierId: "ns-1",
  spendHistory: [
    { year: 2022, total: 980_000,  byRegion: { "North America": 980_000 },  bySku: { "ABS Housing Shell": 520_000, "PP Bracket Assembly": 310_000, "Nylon Clip Set": 150_000 } },
    { year: 2023, total: 1_050_000, byRegion: { "North America": 1_050_000 }, bySku: { "ABS Housing Shell": 560_000, "PP Bracket Assembly": 330_000, "Nylon Clip Set": 160_000 } },
    { year: 2024, total: 1_120_000, byRegion: { "North America": 1_120_000 }, bySku: { "ABS Housing Shell": 600_000, "PP Bracket Assembly": 350_000, "Nylon Clip Set": 170_000 } },
    { year: 2025, total: 1_180_000, byRegion: { "North America": 1_180_000 }, bySku: { "ABS Housing Shell": 630_000, "PP Bracket Assembly": 370_000, "Nylon Clip Set": 180_000 } },
    { year: 2026, total: 1_200_000, byRegion: { "North America": 1_200_000 }, bySku: { "ABS Housing Shell": 640_000, "PP Bracket Assembly": 380_000, "Nylon Clip Set": 180_000 } },
  ],
  priceVolume: [
    // Aggregated (no sku field) -- kept for backward compat
    { period: "Q1 2023", price: 0.88, volume: 290_000 },
    { period: "Q2 2023", price: 0.88, volume: 310_000 },
    { period: "Q3 2023", price: 0.90, volume: 300_000 },
    { period: "Q4 2023", price: 0.92, volume: 320_000 },
    { period: "Q1 2024", price: 0.92, volume: 300_000 },
    { period: "Q2 2024", price: 0.94, volume: 310_000 },
    { period: "Q3 2024", price: 0.96, volume: 305_000 },
    { period: "Q4 2024", price: 0.96, volume: 335_000 },
    { period: "Q1 2025", price: 0.96, volume: 295_000 },
    { period: "Q2 2025", price: 0.96, volume: 310_000 },
    { period: "Q3 2025", price: 0.96, volume: 320_000 },
    { period: "Q4 2025", price: 0.96, volume: 325_000 },
    // Per-SKU: ABS Housing Shell
    { period: "Q1 2023", price: 0.92, volume: 150_000, sku: "ABS Housing Shell" },
    { period: "Q2 2023", price: 0.92, volume: 160_000, sku: "ABS Housing Shell" },
    { period: "Q3 2023", price: 0.94, volume: 155_000, sku: "ABS Housing Shell" },
    { period: "Q4 2023", price: 0.96, volume: 165_000, sku: "ABS Housing Shell" },
    { period: "Q1 2024", price: 0.96, volume: 155_000, sku: "ABS Housing Shell" },
    { period: "Q2 2024", price: 0.98, volume: 160_000, sku: "ABS Housing Shell" },
    { period: "Q3 2024", price: 1.00, volume: 158_000, sku: "ABS Housing Shell" },
    { period: "Q4 2024", price: 1.00, volume: 172_000, sku: "ABS Housing Shell" },
    { period: "Q1 2025", price: 1.00, volume: 152_000, sku: "ABS Housing Shell" },
    { period: "Q2 2025", price: 1.00, volume: 160_000, sku: "ABS Housing Shell" },
    { period: "Q3 2025", price: 1.00, volume: 165_000, sku: "ABS Housing Shell" },
    { period: "Q4 2025", price: 1.00, volume: 168_000, sku: "ABS Housing Shell" },
    // Per-SKU: PP Bracket Assembly
    { period: "Q1 2023", price: 0.82, volume: 90_000, sku: "PP Bracket Assembly" },
    { period: "Q2 2023", price: 0.82, volume: 96_000, sku: "PP Bracket Assembly" },
    { period: "Q3 2023", price: 0.84, volume: 93_000, sku: "PP Bracket Assembly" },
    { period: "Q4 2023", price: 0.86, volume: 99_000, sku: "PP Bracket Assembly" },
    { period: "Q1 2024", price: 0.86, volume: 92_000, sku: "PP Bracket Assembly" },
    { period: "Q2 2024", price: 0.88, volume: 96_000, sku: "PP Bracket Assembly" },
    { period: "Q3 2024", price: 0.90, volume: 94_000, sku: "PP Bracket Assembly" },
    { period: "Q4 2024", price: 0.90, volume: 104_000, sku: "PP Bracket Assembly" },
    { period: "Q1 2025", price: 0.90, volume: 91_000, sku: "PP Bracket Assembly" },
    { period: "Q2 2025", price: 0.90, volume: 96_000, sku: "PP Bracket Assembly" },
    { period: "Q3 2025", price: 0.90, volume: 99_000, sku: "PP Bracket Assembly" },
    { period: "Q4 2025", price: 0.90, volume: 100_000, sku: "PP Bracket Assembly" },
    // Per-SKU: Nylon Clip Set
    { period: "Q1 2023", price: 0.78, volume: 50_000, sku: "Nylon Clip Set" },
    { period: "Q2 2023", price: 0.78, volume: 54_000, sku: "Nylon Clip Set" },
    { period: "Q3 2023", price: 0.78, volume: 52_000, sku: "Nylon Clip Set" },
    { period: "Q4 2023", price: 0.80, volume: 56_000, sku: "Nylon Clip Set" },
    { period: "Q1 2024", price: 0.80, volume: 53_000, sku: "Nylon Clip Set" },
    { period: "Q2 2024", price: 0.80, volume: 54_000, sku: "Nylon Clip Set" },
    { period: "Q3 2024", price: 0.82, volume: 53_000, sku: "Nylon Clip Set" },
    { period: "Q4 2024", price: 0.82, volume: 59_000, sku: "Nylon Clip Set" },
    { period: "Q1 2025", price: 0.82, volume: 52_000, sku: "Nylon Clip Set" },
    { period: "Q2 2025", price: 0.82, volume: 54_000, sku: "Nylon Clip Set" },
    { period: "Q3 2025", price: 0.82, volume: 56_000, sku: "Nylon Clip Set" },
    { period: "Q4 2025", price: 0.82, volume: 57_000, sku: "Nylon Clip Set" },
  ],
  slaPerformance: [
    { period: "Q1 2024", otd: 93, rejectRate: 1.6, otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q2 2024", otd: 91, rejectRate: 1.9, otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q3 2024", otd: 89, rejectRate: 2.1, otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q4 2024", otd: 92, rejectRate: 1.7, otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q1 2025", otd: 90, rejectRate: 1.8, otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q2 2025", otd: 91, rejectRate: 1.8, otdTarget: 95, rejectTarget: 1.5 },
  ],
}

export const betaFactPack: SupplierFactPack = {
  supplierId: "ns-2",
  spendHistory: [
    { year: 2022, total: 3_600_000, byRegion: { "Asia-Pacific": 3_600_000 }, bySku: { "Precision Sensor Module": 2_400_000, "Logic IC Array": 1_200_000 } },
    { year: 2023, total: 3_900_000, byRegion: { "Asia-Pacific": 3_900_000 }, bySku: { "Precision Sensor Module": 2_600_000, "Logic IC Array": 1_300_000 } },
    { year: 2024, total: 4_300_000, byRegion: { "Asia-Pacific": 4_300_000 }, bySku: { "Precision Sensor Module": 2_900_000, "Logic IC Array": 1_400_000 } },
    { year: 2025, total: 4_600_000, byRegion: { "Asia-Pacific": 4_600_000 }, bySku: { "Precision Sensor Module": 3_100_000, "Logic IC Array": 1_500_000 } },
    { year: 2026, total: 4_800_000, byRegion: { "Asia-Pacific": 4_800_000 }, bySku: { "Precision Sensor Module": 3_200_000, "Logic IC Array": 1_600_000 } },
  ],
  priceVolume: [
    // Aggregated
    { period: "Q1 2023", price: 22.10, volume: 42_000 },
    { period: "Q2 2023", price: 22.10, volume: 44_000 },
    { period: "Q3 2023", price: 22.80, volume: 43_000 },
    { period: "Q4 2023", price: 23.40, volume: 45_000 },
    { period: "Q1 2024", price: 23.40, volume: 43_000 },
    { period: "Q2 2024", price: 24.00, volume: 44_500 },
    { period: "Q3 2024", price: 24.80, volume: 44_000 },
    { period: "Q4 2024", price: 24.80, volume: 46_000 },
    { period: "Q1 2025", price: 24.80, volume: 43_500 },
    { period: "Q2 2025", price: 24.80, volume: 45_000 },
    { period: "Q3 2025", price: 24.80, volume: 46_500 },
    { period: "Q4 2025", price: 24.80, volume: 47_000 },
    // Per-SKU: Precision Sensor Module
    { period: "Q1 2023", price: 24.50, volume: 28_000, sku: "Precision Sensor Module" },
    { period: "Q2 2023", price: 24.50, volume: 29_500, sku: "Precision Sensor Module" },
    { period: "Q3 2023", price: 25.20, volume: 28_800, sku: "Precision Sensor Module" },
    { period: "Q4 2023", price: 25.80, volume: 30_000, sku: "Precision Sensor Module" },
    { period: "Q1 2024", price: 25.80, volume: 28_700, sku: "Precision Sensor Module" },
    { period: "Q2 2024", price: 26.50, volume: 29_800, sku: "Precision Sensor Module" },
    { period: "Q3 2024", price: 27.40, volume: 29_500, sku: "Precision Sensor Module" },
    { period: "Q4 2024", price: 27.40, volume: 30_800, sku: "Precision Sensor Module" },
    { period: "Q1 2025", price: 27.40, volume: 29_000, sku: "Precision Sensor Module" },
    { period: "Q2 2025", price: 27.40, volume: 30_200, sku: "Precision Sensor Module" },
    { period: "Q3 2025", price: 27.40, volume: 31_000, sku: "Precision Sensor Module" },
    { period: "Q4 2025", price: 27.40, volume: 31_500, sku: "Precision Sensor Module" },
    // Per-SKU: Logic IC Array
    { period: "Q1 2023", price: 17.30, volume: 14_000, sku: "Logic IC Array" },
    { period: "Q2 2023", price: 17.30, volume: 14_500, sku: "Logic IC Array" },
    { period: "Q3 2023", price: 17.80, volume: 14_200, sku: "Logic IC Array" },
    { period: "Q4 2023", price: 18.20, volume: 15_000, sku: "Logic IC Array" },
    { period: "Q1 2024", price: 18.20, volume: 14_300, sku: "Logic IC Array" },
    { period: "Q2 2024", price: 18.80, volume: 14_700, sku: "Logic IC Array" },
    { period: "Q3 2024", price: 19.40, volume: 14_500, sku: "Logic IC Array" },
    { period: "Q4 2024", price: 19.40, volume: 15_200, sku: "Logic IC Array" },
    { period: "Q1 2025", price: 19.40, volume: 14_500, sku: "Logic IC Array" },
    { period: "Q2 2025", price: 19.40, volume: 14_800, sku: "Logic IC Array" },
    { period: "Q3 2025", price: 19.40, volume: 15_500, sku: "Logic IC Array" },
    { period: "Q4 2025", price: 19.40, volume: 15_500, sku: "Logic IC Array" },
  ],
  slaPerformance: [
    { period: "Q1 2024", otd: 97, rejectRate: 0.4, otdTarget: 98, rejectTarget: 0.5 },
    { period: "Q2 2024", otd: 96, rejectRate: 0.5, otdTarget: 98, rejectTarget: 0.5 },
    { period: "Q3 2024", otd: 95, rejectRate: 0.6, otdTarget: 98, rejectTarget: 0.5 },
    { period: "Q4 2024", otd: 97, rejectRate: 0.3, otdTarget: 98, rejectTarget: 0.5 },
    { period: "Q1 2025", otd: 96, rejectRate: 0.5, otdTarget: 98, rejectTarget: 0.5 },
    { period: "Q2 2025", otd: 97, rejectRate: 0.4, otdTarget: 98, rejectTarget: 0.5 },
  ],
}

/** @deprecated Use getFactPackForSupplierRuntime instead — it includes dynamically registered packs */
export function getFactPackForSupplier(supplierId: string): SupplierFactPack | undefined {
  // Delegate to runtime-aware version so callers using the old name still work
  return getFactPackForSupplierRuntime(supplierId)
}

// ─── Market Overview Mock Data ────────────────────────────────────────────

export const marketOverviews: Record<string, MarketOverview> = {
  "Injection Molding": {
    category: "Injection Molding",
    marketSizeB: 285,
    cagr: 3.2,
    regionalGrowth: [
      { region: "North America", growth: 2.8 },
      { region: "EMEA", growth: 2.1 },
      { region: "Asia-Pacific", growth: 4.6 },
      { region: "Latin America", growth: 3.1 },
    ],
    topSuppliers: [
      { name: "Alpha Plastics", sharePercent: 1.4, growth: 3.8, last12mGrowth: 4.2, coverage: 95 },
      { name: "ProForm Molding", sharePercent: 2.1, growth: 2.5, last12mGrowth: 2.8, coverage: 88 },
      { name: "MexiPlast", sharePercent: 1.8, growth: 5.2, last12mGrowth: 6.1, coverage: 72 },
      { name: "Evco Plastics", sharePercent: 3.2, growth: 3.0, last12mGrowth: 2.4, coverage: 90 },
      { name: "Nypro (Jabil)", sharePercent: 4.5, growth: 1.8, last12mGrowth: 1.2, coverage: 96 },
    ],
    marketGrowthSeries: {
      label: "Overall Market Revenue Index",
      source: "IBISWorld + Mordor Intelligence",
      confidence: 92,
      series: [
        { year: 2021, index: 100,   absoluteValue: 258, yoyPct: undefined },
        { year: 2022, index: 103.2, absoluteValue: 266, yoyPct: 3.2 },
        { year: 2023, index: 106.5, absoluteValue: 275, yoyPct: 3.2 },
        { year: 2024, index: 109.9, absoluteValue: 284, yoyPct: 3.2 },
        { year: 2025, index: 113.4, absoluteValue: 293, yoyPct: 3.2 },
      ],
    },
    supplierGrowthSeries: [
      { supplierId: "ns-1", name: "Alpha Plastics", isNegotiatedSupplier: true, coverage: 95, confidence: 88,
        series: [
          { year: 2021, index: 100, absoluteValue: 42, yoyPct: undefined },
          { year: 2022, index: 104.8, absoluteValue: 44, yoyPct: 4.8 },
          { year: 2023, index: 107.1, absoluteValue: 45, yoyPct: 2.2 },
          { year: 2024, index: 110.7, absoluteValue: 46.5, yoyPct: 3.4 },
          { year: 2025, index: 114.8, absoluteValue: 48.2, yoyPct: 3.7 },
        ] },
      { supplierId: "proform", name: "ProForm Molding", isNegotiatedSupplier: false, coverage: 88, confidence: 80,
        series: [
          { year: 2021, index: 100, absoluteValue: 58, yoyPct: undefined },
          { year: 2022, index: 102.5, absoluteValue: 59.5, yoyPct: 2.5 },
          { year: 2023, index: 104.3, absoluteValue: 60.5, yoyPct: 1.7 },
          { year: 2024, index: 107.0, absoluteValue: 62, yoyPct: 2.6 },
          { year: 2025, index: 109.8, absoluteValue: 63.7, yoyPct: 2.6 },
        ] },
      { supplierId: "mexiplast", name: "MexiPlast", isNegotiatedSupplier: false, coverage: 72, confidence: 68, dataProxy: "Shipment Volume",
        series: [
          { year: 2021, index: 100, yoyPct: undefined },
          { year: 2022, index: 106.0, yoyPct: 6.0 },
          { year: 2023, index: 112.4, yoyPct: 6.0 },
          { year: 2024, index: 117.2, yoyPct: 4.3 },
          { year: 2025, index: 124.3, yoyPct: 6.1 },
        ] },
      { supplierId: "evco", name: "Evco Plastics", isNegotiatedSupplier: false, coverage: 90, confidence: 85,
        series: [
          { year: 2021, index: 100, absoluteValue: 88, yoyPct: undefined },
          { year: 2022, index: 103.2, absoluteValue: 90.8, yoyPct: 3.2 },
          { year: 2023, index: 106.0, absoluteValue: 93.3, yoyPct: 2.7 },
          { year: 2024, index: 109.2, absoluteValue: 96.1, yoyPct: 3.0 },
          { year: 2025, index: 111.8, absoluteValue: 98.4, yoyPct: 2.4 },
        ] },
      { supplierId: "nypro", name: "Nypro (Jabil)", isNegotiatedSupplier: false, coverage: 96, confidence: 92,
        series: [
          { year: 2021, index: 100, absoluteValue: 124, yoyPct: undefined },
          { year: 2022, index: 101.8, absoluteValue: 126.2, yoyPct: 1.8 },
          { year: 2023, index: 103.5, absoluteValue: 128.3, yoyPct: 1.7 },
          { year: 2024, index: 105.4, absoluteValue: 130.7, yoyPct: 1.8 },
          { year: 2025, index: 106.7, absoluteValue: 132.3, yoyPct: 1.2 },
        ] },
    ],
    lastUpdated: "2026-02-01",
    source: "IBISWorld + Mordor Intelligence",
  },
  "Semiconductor Components": {
    category: "Semiconductor Components",
    marketSizeB: 620,
    cagr: 7.2,
    regionalGrowth: [
      { region: "Asia-Pacific", growth: 8.4 },
      { region: "North America", growth: 6.1 },
      { region: "EMEA", growth: 5.3 },
    ],
    topSuppliers: [
      { name: "Beta MicroFab", sharePercent: 2.8, growth: 12.0, last12mGrowth: 14.2, coverage: 85 },
      { name: "TSMC", sharePercent: 28.0, growth: 9.4, last12mGrowth: 8.8, coverage: 98 },
      { name: "Samsung Semi", sharePercent: 14.0, growth: 6.8, last12mGrowth: 5.4, coverage: 97 },
      { name: "Intel Foundry", sharePercent: 8.0, growth: 3.2, last12mGrowth: 2.1, coverage: 98 },
      { name: "GlobalFoundries", sharePercent: 5.5, growth: 4.0, last12mGrowth: 3.8, coverage: 94 },
    ],
    marketGrowthSeries: {
      label: "Overall Semiconductor Revenue Index",
      source: "WSTS + Gartner",
      confidence: 94,
      series: [
        { year: 2021, index: 100,   absoluteValue: 440, yoyPct: undefined },
        { year: 2022, index: 107.2, absoluteValue: 472, yoyPct: 7.2 },
        { year: 2023, index: 114.9, absoluteValue: 506, yoyPct: 7.2 },
        { year: 2024, index: 123.2, absoluteValue: 542, yoyPct: 7.2 },
        { year: 2025, index: 132.1, absoluteValue: 581, yoyPct: 7.2 },
      ],
    },
    supplierGrowthSeries: [
      { supplierId: "ns-2", name: "Beta MicroFab", isNegotiatedSupplier: true, coverage: 85, confidence: 78,
        series: [
          { year: 2021, index: 100, absoluteValue: 2.8, yoyPct: undefined },
          { year: 2022, index: 112.0, absoluteValue: 3.14, yoyPct: 12.0 },
          { year: 2023, index: 125.4, absoluteValue: 3.51, yoyPct: 12.0 },
          { year: 2024, index: 140.5, absoluteValue: 3.93, yoyPct: 12.0 },
          { year: 2025, index: 160.4, absoluteValue: 4.49, yoyPct: 14.2 },
        ] },
      { supplierId: "tsmc", name: "TSMC", isNegotiatedSupplier: false, coverage: 98, confidence: 96,
        series: [
          { year: 2021, index: 100, absoluteValue: 123.2, yoyPct: undefined },
          { year: 2022, index: 109.4, absoluteValue: 134.8, yoyPct: 9.4 },
          { year: 2023, index: 119.7, absoluteValue: 147.4, yoyPct: 9.4 },
          { year: 2024, index: 130.9, absoluteValue: 161.3, yoyPct: 9.4 },
          { year: 2025, index: 142.4, absoluteValue: 175.5, yoyPct: 8.8 },
        ] },
      { supplierId: "samsung", name: "Samsung Semi", isNegotiatedSupplier: false, coverage: 97, confidence: 94,
        series: [
          { year: 2021, index: 100, absoluteValue: 61.6, yoyPct: undefined },
          { year: 2022, index: 106.8, absoluteValue: 65.8, yoyPct: 6.8 },
          { year: 2023, index: 114.1, absoluteValue: 70.3, yoyPct: 6.8 },
          { year: 2024, index: 121.8, absoluteValue: 75.1, yoyPct: 6.8 },
          { year: 2025, index: 128.4, absoluteValue: 79.1, yoyPct: 5.4 },
        ] },
      { supplierId: "intel", name: "Intel Foundry", isNegotiatedSupplier: false, coverage: 98, confidence: 95,
        series: [
          { year: 2021, index: 100, absoluteValue: 35.2, yoyPct: undefined },
          { year: 2022, index: 103.2, absoluteValue: 36.3, yoyPct: 3.2 },
          { year: 2023, index: 106.5, absoluteValue: 37.5, yoyPct: 3.2 },
          { year: 2024, index: 109.9, absoluteValue: 38.7, yoyPct: 3.2 },
          { year: 2025, index: 112.2, absoluteValue: 39.5, yoyPct: 2.1 },
        ] },
      { supplierId: "gf", name: "GlobalFoundries", isNegotiatedSupplier: false, coverage: 94, confidence: 90,
        series: [
          { year: 2021, index: 100, absoluteValue: 24.2, yoyPct: undefined },
          { year: 2022, index: 104.0, absoluteValue: 25.2, yoyPct: 4.0 },
          { year: 2023, index: 108.2, absoluteValue: 26.2, yoyPct: 4.0 },
          { year: 2024, index: 112.5, absoluteValue: 27.2, yoyPct: 4.0 },
          { year: 2025, index: 116.8, absoluteValue: 28.3, yoyPct: 3.8 },
        ] },
    ],
    lastUpdated: "2026-02-01",
    source: "WSTS + Gartner + IHS Markit",
  },
}

export const mockExternalInsights: ExternalInsight[] = [
  { id: "ei-1", title: "PP Resin Index Drops 8% YoY", summary: "Polypropylene resin prices fell 8% year-over-year due to overcapacity in North American refineries. No recovery expected until late 2027.", tags: ["commodity", "resin", "injection-molding"], source: "ICIS", date: "2026-02-10", confidence: 92, pinnedTo: "ns-1" },
  { id: "ei-2", title: "Injection Molding Capacity Utilization at 76%", summary: "Industry-wide capacity utilization at 76%, well below the 85% constraint threshold. Buyer-friendly market conditions persist.", tags: ["capacity", "market-conditions"], source: "IBISWorld", date: "2026-02-01", confidence: 88, pinnedTo: "workspace" },
  { id: "ei-3", title: "DRAM Index Up 14% but Wafer Starts Expanding", summary: "DRAM spot prices up 14% YoY, but wafer starts increased 22% in H2 2025. Easing expected by Q3 2026.", tags: ["semiconductor", "indices", "capacity"], source: "WSTS", date: "2026-02-12", confidence: 82, pinnedTo: "ns-2" },
  { id: "ei-4", title: "Beta MicroFab Fab 4 On Track for Q3 2026", summary: "Beta MicroFab\u2019s new fabrication facility (Fab 4) on track for Q3 2026 commissioning. Adds ~30% capacity. Less than 60% pre-committed.", tags: ["capacity", "supplier-intel", "semiconductor"], source: "Industry Intel + Public Filings", date: "2026-02-15", confidence: 74, pinnedTo: "ns-2" },
  { id: "ei-5", title: "EU CBAM Regulation May Impact Imported Molded Parts", summary: "EU Carbon Border Adjustment Mechanism could add 2-4% cost to injection-molded parts imported from non-EU suppliers starting 2027.", tags: ["regulatory", "tariff", "injection-molding"], source: "European Commission", date: "2026-01-20", confidence: 70, pinnedTo: "workspace" },
]

// ─── Labels & Constants ────────────────────────────────────────────────────

export const SECTION_LABELS: Record<WorkspaceSection, string> = {
  overview: "Overview",
  "fact-base": "Fact Base",
  spectrum: "Supplier Matrix",
  levers: "Levers",
  objectives: "Negotiation Targets",
  narrative: "Negotiation Plan",
  "team-scripts": "Team & Scripts",
  "live-negotiation": "Live Negotiation",
  "close-out": "Close-out",
  }

export const SECTION_ORDER: WorkspaceSection[] = [
  "overview", "fact-base", "spectrum", "levers", "objectives", "narrative", "team-scripts", "live-negotiation", "close-out",
]

export const DOMAIN_LABELS: Record<ObjectiveDomain, string> = {
  "cost-price": "Cost / Price",
  quality: "Quality",
  sla: "SLA / Service Levels",
  "min-volumes": "Minimum Volumes",
  "lead-time": "Lead Time / Delivery",
  "contract-terms": "Contract Terms",
  "risk-resiliency": "Risk & Resiliency",
  innovation: "Innovation / Value Engineering",
}

export const QUADRANT_LABELS: Record<SpectrumQuadrant, string> = {
  "transactional-competitive": "Transactional / Competitive",
  leverage: "Leverage",
  "strategic-critical": "Strategic / Critical",
  bottleneck: "Bottleneck",
}

export const QUADRANT_DESCRIPTIONS: Record<SpectrumQuadrant, string> = {
  "transactional-competitive": "Low criticality, many alternatives. Use competitive pressure, quick quotes, and market benchmarks.",
  leverage: "Low criticality, few alternatives. Consolidate volume, negotiate hard on price, maintain 2-3 qualified alternatives.",
  "strategic-critical": "High criticality, few alternatives. Invest in relationship, use should-cost models, co-develop value.",
  bottleneck: "High criticality, many alternatives. Secure supply continuity, build dual-source plans, manage risk.",
}

export const LEVER_LABELS: Record<LeverCategory, string> = {
  competition: "Competition",
  commitment: "Commitment",
  transparency: "Transparency",
  performance: "Performance",
  engineering: "Engineering",
  "working-capital": "Working Capital",
}

export const LEVER_DESCRIPTIONS: Record<LeverCategory, string> = {
  competition: "Rapid RFQ, alternates, normalize quotes, award split",
  commitment: "Allocation shifts, volume/term carrots",
  transparency: "Price vs indices, cost stack weights, should-cost, clawback",
  performance: "SLA/penalty simulation, chargeback estimates",
  engineering: "VA/VE, spec rationalization, savings + qualification plan",
  "working-capital": "WACC-based terms value model",
}

export const LEVER_QUADRANT_MAP: Record<SpectrumQuadrant, LeverCategory[]> = {
  "transactional-competitive": ["competition", "commitment", "transparency"],
  leverage: ["competition", "commitment", "transparency", "performance"],
  "strategic-critical": ["transparency", "performance", "engineering", "commitment"],
  bottleneck: ["commitment", "engineering", "working-capital", "performance"],
}

// ─── Objective Constants ────────────────────────────────────────────────────

export const METRIC_LABELS: Record<ObjectiveMetric, string> = {
  "unit-price": "Unit Price",
  "pct-reduction": "% Reduction",
  "rebate-pct": "Rebate %",
  "otd-pct": "OTD %",
  "ppm-defect": "PPM / Defect Rate",
  "lead-time-days": "Lead Time (days)",
  "net-terms-days": "Payment Terms (days)",
  "moq-units": "MOQ (units)",
  "contract-months": "Contract Term",
  "index-formula": "Index Formula",
  custom: "Custom",
}

export const DOMAIN_ICONS: Record<ObjectiveDomain, string> = {
  "cost-price": "DollarSign",
  quality: "ShieldCheck",
  sla: "Clock",
  "min-volumes": "Package",
  "lead-time": "Truck",
  "contract-terms": "FileText",
  "risk-resiliency": "Shield",
  innovation: "Lightbulb",
}

export interface ObjectiveTemplate {
  id: string
  domain: ObjectiveDomain
  metric: ObjectiveMetric
  title: string
  description: string
  defaultPriority: ObjectivePriority
}

export const OBJECTIVE_TEMPLATES: ObjectiveTemplate[] = [
  { id: "tpl-price", domain: "cost-price", metric: "unit-price", title: "Reduce unit price", description: "Target absolute or percentage price reduction", defaultPriority: "Must-have" },
  { id: "tpl-index", domain: "cost-price", metric: "index-formula", title: "Index-linked pricing", description: "Tie price adjustments to commodity/market indices", defaultPriority: "Important" },
  { id: "tpl-rebate", domain: "cost-price", metric: "rebate-pct", title: "Volume rebate", description: "Secure rebate based on volume thresholds", defaultPriority: "Nice-to-have" },
  { id: "tpl-otd", domain: "sla", metric: "otd-pct", title: "On-time delivery SLA", description: "Set OTD performance targets with penalty/bonus", defaultPriority: "Important" },
  { id: "tpl-quality", domain: "quality", metric: "ppm-defect", title: "Quality / defect rate", description: "Target defect rate in PPM or percentage", defaultPriority: "Must-have" },
  { id: "tpl-leadtime", domain: "lead-time", metric: "lead-time-days", title: "Lead time reduction", description: "Reduce order-to-delivery cycle time", defaultPriority: "Important" },
  { id: "tpl-payment", domain: "contract-terms", metric: "net-terms-days", title: "Payment terms", description: "Extend payment terms for working capital benefit", defaultPriority: "Nice-to-have" },
  { id: "tpl-moq", domain: "min-volumes", metric: "moq-units", title: "MOQ reduction", description: "Lower minimum order quantities for flexibility", defaultPriority: "Important" },
  { id: "tpl-contract", domain: "contract-terms", metric: "contract-months", title: "Contract duration", description: "Negotiate multi-year term with reopener clauses", defaultPriority: "Nice-to-have" },
  { id: "tpl-risk", domain: "risk-resiliency", metric: "custom", title: "Supply continuity / dual-source", description: "Secure supply through qualification of alternatives", defaultPriority: "Important" },
  { id: "tpl-vave", domain: "innovation", metric: "pct-reduction", title: "VA/VE cost-out", description: "Joint value engineering to reduce total cost", defaultPriority: "Nice-to-have" },
]

export const STATUS_COLORS: Record<WorkspaceStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-muted", text: "text-muted-foreground", label: "Draft" },
  "in-progress": { bg: "bg-blue-50", text: "text-blue-700", label: "In Progress" },
  live: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Live" },
  "closed-won": { bg: "bg-primary/10", text: "text-primary", label: "Closed Won" },
  "closed-no-deal": { bg: "bg-muted", text: "text-muted-foreground", label: "Closed No Deal" },
}

// ─── Spectrum Logic ─────────────────────────────────────────────────────────

export interface SpectrumInput {
  annualSpend: number
  supplierCount: number
  switchingCostEstimate: "low" | "medium" | "high"
  qualityImpact: "low" | "medium" | "high"
  supplyRisk: "low" | "medium" | "high"
  marketAlternatives: number
  contractComplexity: "low" | "medium" | "high"
}

const SCORE_MAP = { low: 15, medium: 50, high: 85 }

export function computeSpectrumPlacement(
  supplierId: string,
  supplierName: string,
  input: SpectrumInput
): SpectrumPlacement {
  const drivers: string[] = []
  let criticality = 0
  const spendWeight = Math.min(input.annualSpend / 5_000_000, 1) * 100
  criticality += spendWeight * 0.25
  drivers.push(`Annual spend: $${(input.annualSpend / 1_000_000).toFixed(1)}M`)

  const switchScore = SCORE_MAP[input.switchingCostEstimate]
  criticality += switchScore * 0.25
  if (switchScore >= 50) drivers.push(`Switching cost: ${input.switchingCostEstimate}`)

  const qualityScore = SCORE_MAP[input.qualityImpact]
  criticality += qualityScore * 0.25
  if (qualityScore >= 50) drivers.push(`Quality impact: ${input.qualityImpact}`)

  const complexityScore = SCORE_MAP[input.contractComplexity]
  criticality += complexityScore * 0.25
  if (complexityScore >= 50) drivers.push(`Contract complexity: ${input.contractComplexity}`)

  let constraint = 0
  const altScore = Math.max(0, 100 - input.marketAlternatives * 10)
  constraint += altScore * 0.35
  if (input.marketAlternatives <= 3) drivers.push(`Only ${input.marketAlternatives} alternatives`)

  const riskScore = SCORE_MAP[input.supplyRisk]
  constraint += riskScore * 0.35
  if (riskScore >= 50) drivers.push(`Supply risk: ${input.supplyRisk}`)

  const supplierConcentration = Math.max(0, 100 - input.supplierCount * 5)
  constraint += supplierConcentration * 0.30

  criticality = Math.round(Math.min(100, Math.max(0, criticality)))
  constraint = Math.round(Math.min(100, Math.max(0, constraint)))

  let quadrant: SpectrumQuadrant
  if (criticality < 50 && constraint < 50) quadrant = "transactional-competitive"
  else if (criticality < 50 && constraint >= 50) quadrant = "leverage"
  else if (criticality >= 50 && constraint >= 50) quadrant = "strategic-critical"
  else quadrant = "bottleneck"

  const topDriverMetrics = drivers.slice(0, 6).map((d) => {
    const parts = d.split(": ")
    return { driver: parts[0], value: parts[1] ?? d }
  })

  const quadrantLabel = quadrant === "transactional-competitive" ? "Transactional/Competitive"
    : quadrant === "strategic-critical" ? "Strategic/Critical"
    : quadrant === "leverage" ? "Leverage" : "Bottleneck"

  const aiReasoning = `${supplierName} is classified as ${quadrantLabel} based on a criticality score of ${criticality}/100 and constraint score of ${constraint}/100. Key drivers include ${drivers.slice(0, 3).join(", ")}. ${constraint >= 50 ? "Supply constraints are significant, favoring relationship-building approaches." : "Competitive conditions support aggressive market-testing levers."}`

  return {
    supplierId,
    supplierName,
    relationshipCriticality: criticality,
    supplyMarketConstraint: constraint,
    quadrant,
    confidence: Math.round(60 + Math.random() * 30),
    topDrivers: drivers.slice(0, 4),
    topDriverMetrics,
    recommendedLevers: LEVER_QUADRANT_MAP[quadrant],
    manualOverride: false,
    aiReasoning,
    missingData: [],
  }
}

// ─── Mock Suppliers ─────────────────────────────────────────────────────────

export const negotiationSuppliers: NegotiationSupplier[] = [
  { id: "ns-1", name: "Alpha Plastics", category: "Injection Molding", annualSpend: 1_200_000, contractEnd: "2026-09-30", country: "US", segment: "Transactional" },
  { id: "ns-2", name: "Beta MicroFab", category: "Semiconductor Components", annualSpend: 4_800_000, contractEnd: "2027-03-15", country: "Taiwan", segment: "Strategic" },
  { id: "ns-3", name: "Gamma Logistics", category: "Freight & Distribution", annualSpend: 2_100_000, contractEnd: "2026-06-30", country: "US", segment: "Preferred" },
  { id: "ns-4", name: "Delta Steel Co.", category: "Raw Materials", annualSpend: 3_600_000, contractEnd: "2026-12-31", country: "Germany", segment: "Preferred" },
  { id: "ns-5", name: "Epsilon Packaging", category: "Packaging Materials", annualSpend: 890_000, contractEnd: "2026-08-15", country: "Mexico", segment: "Approved" },
  { id: "ns-6", name: "Zeta Electronics", category: "Electronic Assemblies", annualSpend: 5_200_000, contractEnd: "2027-06-30", country: "South Korea", segment: "Strategic" },
  { id: "ns-7", name: "Eta Chemicals", category: "Specialty Chemicals", annualSpend: 1_800_000, contractEnd: "2026-11-30", country: "Japan", segment: "Approved" },
  { id: "ns-8", name: "Theta Tooling", category: "Industrial Tooling", annualSpend: 720_000, contractEnd: "2026-07-31", country: "US", segment: "Transactional" },
]

// ─── Alpha Plastics Worked Example ──────────────────────────────────────────

const alphaCompetitionRun: LeverRun = {
  id: "lr-a1", leverId: "lv-a1", startedAt: "2026-01-20", completedAt: "2026-02-15", confidenceScore: 88,
  dataGaps: [],
  quotes: [
    { id: "q-1", supplierName: "Alpha Plastics (incumbent)", unitPrice: 0.96, moq: 50_000, leadTimeDays: 18, toolingCost: 0, freightPerUnit: 0.02, totalLandedCost: 0.98, status: "received" },
    { id: "q-2", supplierName: "ProForm Molding", unitPrice: 0.78, moq: 100_000, leadTimeDays: 14, toolingCost: 12_000, freightPerUnit: 0.03, totalLandedCost: 0.81, status: "received", notes: "Qualification complete. Ready in 6 weeks." },
    { id: "q-3", supplierName: "MexiPlast", unitPrice: 0.71, moq: 200_000, leadTimeDays: 21, toolingCost: 18_000, freightPerUnit: 0.07, totalLandedCost: 0.78, status: "received", notes: "Lowest unit but high MOQ + freight. Cross-border lead time." },
    { id: "q-4", supplierName: "Evco Plastics", unitPrice: 0.82, moq: 75_000, leadTimeDays: 12, toolingCost: 8_000, freightPerUnit: 0.02, totalLandedCost: 0.84, status: "received", notes: "Strong quality, best lead time." },
    { id: "q-5", supplierName: "Nypro (Jabil)", unitPrice: 0.88, moq: 50_000, leadTimeDays: 15, toolingCost: 0, freightPerUnit: 0.02, totalLandedCost: 0.90, status: "received", notes: "Premium priced; capacity guaranteed." },
  ],
  allocationScenarios: [
    { id: "as-1", name: "100% Incumbent", splits: [{ supplierName: "Alpha Plastics", pct: 100, unitPrice: 0.96 }], blendedPrice: 0.96, totalSavings: 0 },
    { id: "as-2", name: "70/30 Alpha + ProForm", splits: [{ supplierName: "Alpha Plastics", pct: 70, unitPrice: 0.84 }, { supplierName: "ProForm", pct: 30, unitPrice: 0.81 }], blendedPrice: 0.83, totalSavings: 162_500 },
    { id: "as-3", name: "Full Switch to ProForm", splits: [{ supplierName: "ProForm Molding", pct: 100, unitPrice: 0.81 }], blendedPrice: 0.81, totalSavings: 187_500 },
    { id: "as-4", name: "3-way Split", splits: [{ supplierName: "Alpha Plastics", pct: 50, unitPrice: 0.84 }, { supplierName: "ProForm", pct: 30, unitPrice: 0.81 }, { supplierName: "Evco", pct: 20, unitPrice: 0.84 }], blendedPrice: 0.83, totalSavings: 162_500 },
  ],
  artifacts: [
    { id: "art-a1", type: "chart", title: "Quote Comparison (Normalized)", description: "Bar chart comparing landed cost across 5 suppliers" },
    { id: "art-a2", type: "chart", title: "Benchmark Range", description: "Current price vs. quote range with market median" },
    { id: "art-a3", type: "table", title: "Award Split Scenarios", description: "Blended pricing under different allocation models" },
  ],
  outputs: [
    { id: "out-a1", type: "value-range", title: "Competition-based price target", content: "Achievable range: $0.81-$0.84/unit (13-16% reduction)", quantifiedValue: { low: 150_000, high: 187_500, unit: "annual savings" }, targetSection: "objectives", status: "pushed" },
    { id: "out-a2", type: "argument-card", title: "Credible alternatives argument", content: "4 qualified alternatives received. Best at $0.78/unit. ProForm ready in 6 weeks.", targetSection: "narrative", status: "pushed" },
    { id: "out-a3", type: "ask-clause", title: "Match-or-lose clause", content: "Match best alternative landed cost of $0.81/unit or lose 30% volume to ProForm within 60 days.", targetSection: "live-negotiation", status: "draft" },
    { id: "out-a4", type: "offer-package", title: "Award split offer", content: "70/30 split at $0.84/$0.81 with 2-year commitment. Total savings: $162K/yr.", targetSection: "live-negotiation", status: "draft" },
  ],
}

const alphaTransparencyRun: LeverRun = {
  id: "lr-a3", leverId: "lv-a3", startedAt: "2026-02-01", confidenceScore: 75,
  dataGaps: ["Missing 2 of 5 target benchmarks", "Energy index lag (last update: Jan 2026)"],
  indexWeights: [
    { indexName: "PP Resin (ICIS)", weight: 45, currentYoY: -8, series: [
      { period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 98 }, { period: "Q3 2024", value: 95 }, { period: "Q4 2024", value: 94 },
      { period: "Q1 2025", value: 93 }, { period: "Q2 2025", value: 92 },
    ] },
    { indexName: "Industrial Energy", weight: 20, currentYoY: 0, series: [
      { period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 101 }, { period: "Q3 2024", value: 102 }, { period: "Q4 2024", value: 101 },
      { period: "Q1 2025", value: 100 }, { period: "Q2 2025", value: 100 },
    ] },
    { indexName: "Mfg. Labor (BLS)", weight: 20, currentYoY: 3, series: [
      { period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 101 }, { period: "Q3 2024", value: 101.5 }, { period: "Q4 2024", value: 102 },
      { period: "Q1 2025", value: 102.5 }, { period: "Q2 2025", value: 103 },
    ] },
    { indexName: "Domestic Freight", weight: 15, currentYoY: 1, series: [
      { period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 100.5 }, { period: "Q3 2024", value: 101 }, { period: "Q4 2024", value: 100.5 },
      { period: "Q1 2025", value: 101 }, { period: "Q2 2025", value: 101 },
    ] },
  ],
  artifacts: [
    { id: "art-a4", type: "chart", title: "Price vs Index Basket", description: "Dual trend: supplier unit price vs weighted index basket over 24 months" },
    { id: "art-a5", type: "chart", title: "Attribution Waterfall", description: "Breakdown of price change into index-explained vs unexplained margin" },
  ],
  outputs: [
    { id: "out-a5", type: "value-range", title: "Index-justified fair price", content: "Basket moved -2.6% vs price +4.2%. Gap = 6.8% unexplained margin expansion.", quantifiedValue: { low: 68_000, high: 82_000, unit: "clawback" }, targetSection: "objectives", status: "draft" },
    { id: "out-a6", type: "argument-card", title: "Price diverged from cost drivers", content: "Your price rose 4.2% while the input cost basket declined 2.6%. This 6.8% gap represents margin expansion, not cost recovery.", targetSection: "narrative", status: "draft" },
    { id: "out-a7", type: "ask-clause", title: "Index-linked pricing clause", content: "Implement quarterly price adjustment formula: Base price * (0.45*PP + 0.20*Energy + 0.20*Labor + 0.15*Freight), rebased to Q1 2025.", targetSection: "live-negotiation", status: "draft" },
  ],
}

const alphaLevers: Lever[] = [
  {
    id: "lv-a1", category: "competition", name: "Rapid RFQ to 4 alternates",
    description: "Send simplified RFQ to pre-qualified injection molding competitors",
    status: "complete", impact: "high", effort: "medium",
    inputs: ["Current spec sheet", "Volume requirements", "Quality criteria"],
    outputs: ["4 competitive quotes received", "Best quote: $0.78/unit (ProForm)", "Range: $0.71-$0.88"],
    estimatedImpact: "10-18% price reduction",
    workflows: [
      { id: "wf-a1a", step: "Prepare RFQ package", description: "Standardize spec + evaluation criteria", status: "done", output: "RFQ package sent to 4 suppliers" },
      { id: "wf-a1b", step: "Normalize quotes", description: "Adjust for quality, logistics, terms differences", status: "done", output: "Normalized range: $0.78-$0.85/unit" },
      { id: "wf-a1c", step: "Award split scenario", description: "Model 70/30 split to maintain competition", status: "done", output: "Dual-source model at $0.82 blended" },
    ],
    run: alphaCompetitionRun,
    recommendation: { leverId: "lv-a1", category: "competition", recommended: true, reasoning: "Transactional supplier in competitive market with 8+ alternatives. RFQ sprint creates strong BATNA.", prerequisites: ["Approved supplier list", "Current spec sheet", "Volume forecast"], impactEstimate: "high", effortEstimate: "medium", sequenceOrder: 1 },
  },
  {
    id: "lv-a2", category: "commitment", name: "Volume commitment for price step-down",
    description: "Offer 20% volume increase in exchange for unit price reduction",
    status: "complete", impact: "medium", effort: "low",
    inputs: ["Current annual volume", "Demand forecast", "Capacity confirmation"],
    outputs: ["Volume +20% = additional $240K spend", "Target: $0.84/unit with commitment"],
    estimatedImpact: "3-5% incremental discount",
    workflows: [
      { id: "wf-a2a", step: "Validate demand forecast", description: "Confirm 20% uplift is sustainable", status: "done", output: "Demand supports +20% for 18 months" },
      { id: "wf-a2b", step: "Term carrot packaging", description: "Bundle volume + 1yr extension", status: "done", output: "Package: +20% vol, 1yr ext, Net 15" },
    ],
    recommendation: { leverId: "lv-a2", category: "commitment", recommended: true, reasoning: "Volume growth gives a carrot to pair with competitive pressure. Low effort, incremental value.", prerequisites: ["Demand forecast sign-off", "Ops capacity check"], impactEstimate: "medium", effortEstimate: "low", sequenceOrder: 2 },
  },
  {
    id: "lv-a3", category: "transparency", name: "Price vs Index Benchmark",
    description: "Show price divergence from weighted input cost basket to challenge margin expansion",
    status: "in-progress", impact: "high", effort: "medium",
    inputs: ["5 market benchmarks", "Industry price reports"],
    outputs: ["Price position: 78th percentile", "Market median: $0.85"],
    estimatedImpact: "Sets anchor for 12%+ reduction",
    workflows: [
      { id: "wf-a3a", step: "Gather benchmarks", description: "Collect 5+ comparable market prices", status: "done", output: "5 sources gathered" },
      { id: "wf-a3b", step: "Build index basket", description: "Weight PP resin, energy, labor, freight indices", status: "active" },
      { id: "wf-a3c", step: "Calculate attribution", description: "Decompose price change into index vs unexplained", status: "pending" },
      { id: "wf-a3d", step: "Draft clawback clause", description: "Write index-linked price adjustment mechanism", status: "pending" },
    ],
    run: alphaTransparencyRun,
    recommendation: { leverId: "lv-a3", category: "transparency", recommended: true, reasoning: "Commodity category with clear indices. Price rose while inputs fell -- strong evidence for clawback.", prerequisites: ["Index data access", "Historical price records"], impactEstimate: "high", effortEstimate: "medium", sequenceOrder: 3 },
  },
]

const alphaArguments: ArgumentCard[] = [
  {
    id: "arg-a1", title: "Price Above Market",
    claim: "Current unit price of $0.96 sits at the 78th percentile of market benchmarks for equivalent injection-molded parts.",
    evidence: "Analysis of 5 independent market sources shows median at $0.85. Low-complexity benchmark at $0.82.",
    ask: "Reduce unit price to $0.84 (market median adjusted for quality requirements).",
    rebuttal: "If supplier claims proprietary tooling justifies premium: tooling was amortized in 2024, no ongoing IP cost applies.",
    linkedFactIds: ["fi-a1", "fi-a2"], linkedLeverIds: ["lv-a1", "lv-a3"], strength: "strong",
  },
  {
    id: "arg-a2", title: "Credible Alternatives Ready",
    claim: "Four pre-qualified alternatives can deliver within 6-8 weeks of transition, with comparable quality.",
    evidence: "ProForm Plastics passed qualification at $0.78/unit. MexiPlast at $0.78 with 8-week lead.",
    ask: "Match or beat best alternative pricing, or volume will be reallocated.",
    rebuttal: "If supplier claims switching risk: qualification is already complete, transition plan ready.",
    linkedFactIds: ["fi-a3"], linkedLeverIds: ["lv-a1"], strength: "strong",
  },
  {
    id: "arg-a3", title: "Volume Growth Opportunity",
    claim: "We are offering 20% volume growth worth $240K in additional annual revenue.",
    evidence: "Demand forecast validated by operations. Growth is incremental, not cannibalization.",
    ask: "In exchange for growth commitment, require 12% unit price reduction and lead time improvement.",
    rebuttal: "If supplier discounts volume value: volume is discretionary and can go to ProForm.",
    linkedFactIds: [], linkedLeverIds: ["lv-a2"], strength: "moderate",
  },
]

const alphaFactSections: FactSection[] = [
  {
    id: "fs-a1", supplierId: "ns-1", type: "external", title: "External Insights",
    items: [
      { id: "fi-a1", title: "Injection Molding Market Growth", category: "market-growth", content: "North American injection molding market growing at 3.2% CAGR. Capacity utilization at 76%, well below constraint levels. Buyer market conditions expected through 2027.", source: "IBISWorld 2026", confidence: 88, lastUpdated: "2026-02-01", dataPoints: [{ label: "Market CAGR", value: "3.2%" }, { label: "Capacity util.", value: "76%" }] },
      { id: "fi-a2", title: "Resin Index Tracking", category: "indices", content: "PP resin index down 8% YoY. PE stable. Energy costs flat. No cost pressure justifying price increase.", source: "ICIS + Platts", confidence: 92, lastUpdated: "2026-02-10", dataPoints: [{ label: "PP Resin", value: "-8% YoY" }, { label: "PE", value: "Stable" }] },
      { id: "fi-a3", title: "Supplier Financial Health", category: "financial-health", content: "Alpha Plastics: revenue $48M (flat YoY), EBITDA margin 14% (healthy). No financial distress signals. Capacity expansion planned in Q4.", source: "D&B + public filings", confidence: 78, lastUpdated: "2026-01-20", dataPoints: [{ label: "Revenue", value: "$48M" }, { label: "EBITDA", value: "14%" }] },
    ],
  },
  {
    id: "fs-a2", supplierId: "ns-1", type: "supplier-pack", title: "Supplier Fact Pack",
    items: [
      { id: "fi-a4", title: "Spend Analysis", category: "spend", content: "Annual spend: $1.2M across 3 SKU groups. Region: 100% US. 85% of spend in top 2 SKUs. No volume from other BUs.", source: "Internal ERP", confidence: 95, lastUpdated: "2026-02-15", dataPoints: [{ label: "Annual spend", value: "$1.2M" }, { label: "SKU groups", value: "3" }] },
      { id: "fi-a5", title: "Price & Volume History", category: "price-history", content: "Price increased 4% in 2024 renewal (from $0.92 to $0.96). Volume stable at ~1.25M units. No discount for volume growth offered.", source: "Contract history", confidence: 97, lastUpdated: "2026-02-15", dataPoints: [{ label: "Current price", value: "$0.96/unit" }, { label: "Last increase", value: "+4% (2024)" }] },
      { id: "fi-a6", title: "Contract Details", category: "contract", content: "Last negotiated: Sep 2024. Term: 2yr. Net 30 payment. No rebate clause. No index-linked pricing. 90-day termination notice.", source: "Legal archive", confidence: 100, lastUpdated: "2026-02-15", dataPoints: [{ label: "Term", value: "2 years" }, { label: "Payment", value: "Net 30" }] },
      { id: "fi-a7", title: "SLA & Performance", category: "sla-performance", content: "OTD: 91% (target 95%). Reject rate: 1.8% (target <1.5%). 3 quality incidents in 12 months. No formal penalty enforcement.", source: "QMS Dashboard", confidence: 94, lastUpdated: "2026-02-15", dataPoints: [{ label: "OTD", value: "91%" }, { label: "Reject rate", value: "1.8%" }] },
    ],
  },
]

const alphaObjectives: Objective[] = [
  { id: "obj-a1", domain: "cost-price", metric: "unit-price", title: "Reduce unit price by 12%", anchor: "$0.76/unit", laa: "$0.89/unit", mdo: "$0.80/unit", batna: "Switch to ProForm at $0.78/unit", priority: "Must-have", weight: 40, rationale: "Market benchmarks support 10-15% below current price", linkedLeverId: "lv-a1", linkedFactIds: ["fi-a-spend-1"], owner: "Sarah Chen", status: "active", source: "ai", aiConfidence: 92, aiRationale: "RFQ results show 4 qualified alternates at $0.78-$0.84. Incumbent at $0.96 is 15-23% above market. Strong BATNA supports aggressive anchor.", missingData: [], aiVersion: 1 },
  { id: "obj-a2", domain: "lead-time", metric: "lead-time-days", title: "Reduce lead time to 10 days", anchor: "7 days", laa: "14 days", mdo: "8 days", batna: "ProForm offers 12-day standard", priority: "Important", weight: 25, rationale: "Current 18-day lead time creates excess buffer stock costs", linkedFactIds: ["fi-a-sla-1"], owner: "Sarah Chen", status: "active", source: "ai", aiConfidence: 78, aiRationale: "SLA data shows persistent 16-18 day lead times vs 12-day industry benchmark. Evco Plastics quotes 12 days, supporting aggressive target.", missingData: ["Supplier capacity utilization data"], aiVersion: 1 },
  { id: "obj-a3", domain: "quality", metric: "ppm-defect", title: "Reject rate below 1.5%", anchor: "<0.8%", laa: "<1.5%", mdo: "<1.0%", batna: "Penalty clause enforcement at 2% rejects", priority: "Must-have", weight: 20, rationale: "Current 1.8% is above industry norm", linkedLeverId: "lv-a3", linkedFactIds: ["fi-a-sla-2"], owner: "Sarah Chen", status: "active", source: "ai", aiConfidence: 85, aiRationale: "Internal QMS data shows 1.8% reject rate trending down from 2.2%. Industry norm for injection molding is 1.0-1.2%. Performance lever supports penalty/bonus structure.", missingData: [], aiVersion: 1 },
  { id: "obj-a4", domain: "contract-terms", metric: "net-terms-days", title: "Extend payment terms to Net 45", anchor: "Net 60", laa: "Net 30", mdo: "Net 45", batna: "Maintain current Net 30", priority: "Nice-to-have", weight: 10, rationale: "Working capital optimization. WACC-adjusted value: ~$8K/yr at Net 45 vs Net 30.", linkedFactIds: [], owner: "Sarah Chen", status: "draft", source: "ai", aiConfidence: 68, aiRationale: "Working capital lever shows payment terms value at $8K/yr. Supplier liquidity ratio of 1.8 can absorb extended terms.", missingData: ["Supplier cash flow sensitivity model"], aiVersion: 1 },
  { id: "obj-a5", domain: "min-volumes", metric: "moq-units", title: "Reduce MOQ to 50K units", anchor: "25K units", laa: "75K units", mdo: "50K units", batna: "Split order across 2 suppliers", priority: "Important", weight: 5, rationale: "Current 100K MOQ ties up working capital. Competitor ProForm offers 100K but Evco at 75K.", linkedFactIds: [], owner: "Sarah Chen", status: "draft", source: "ai", aiConfidence: 65, aiRationale: "Supplier capacity utilization at ~72% means they need volume fill. Low utilization gives room to negotiate lower MOQ in exchange for volume commitment.", missingData: ["Exact inventory carrying cost per SKU"], aiVersion: 1 },
]

const alphaRounds: NegotiationRound[] = [
  {
    id: "rnd-a1", roundNumber: 1, date: "2026-02-22", status: "complete",
    notes: "Opened aggressively at $0.80 per strategy. Alpha countered at $0.91 with minimal movement.",
    offers: [
      { id: "of-a1", direction: "outgoing", price: 0.80, terms: "2yr, Net 15, +20% vol", status: "countered", createdBy: "Sarah Chen", createdAt: "2026-02-22", concessions: ["2-year term", "Net 15 payment", "+20% volume"], asks: ["$0.80/unit", "10-day lead time", "<1.0% rejects"] },
      { id: "of-a2", direction: "incoming", price: 0.91, terms: "1yr, Net 30, current vol", status: "sent", createdBy: "Alpha Plastics", createdAt: "2026-02-25", concessions: ["Quality improvement plan"], asks: ["$0.91/unit", "Status quo terms"] },
    ],
    decisionLog: ["Opened at anchor ($0.80). Alpha countered at $0.91. Gap = $0.11. Strategy: present market data + BATNA in Round 2."],
    approvals: [
      { id: "ap-a1", gate: "finance", approver: "David Kim", status: "approved", requestedAt: "2026-02-20", decidedAt: "2026-02-21", comments: "Walk-away at $0.89 approved." },
      { id: "ap-a2", gate: "legal", approver: "Jennifer Park", status: "pending", requestedAt: "2026-02-20" },
    ],
  },
]

export const exampleWorkspaceAlpha: NegotiationWorkspace = {
  id: "nw-alpha",
  name: "Alpha Plastics Q3 2026 Renewal",
  category: "Injection Molding",
  status: "live",
  liveRound: 1,
  scope: { regions: ["North America"], businessUnits: ["Manufacturing"], skuGroups: ["Housings", "Brackets", "Clips"] },
  supplierIds: ["ns-1"],
  createdBy: "Sarah Chen",
  createdAt: "2026-01-15",
  lastModified: "2026-02-25",
  spectrumPlacements: [{
    supplierId: "ns-1", supplierName: "Alpha Plastics",
    relationshipCriticality: 28, supplyMarketConstraint: 22,
    quadrant: "transactional-competitive", confidence: 87,
    topDrivers: ["Annual spend: $1.2M", "8+ qualified alternatives", "Switching cost: low", "Standard commodity spec"],
    topDriverMetrics: [
      { driver: "Qualified alternatives", value: "8+" },
      { driver: "Switching cost", value: "Low (~$12K tooling)" },
      { driver: "Annual spend", value: "$1.2M" },
      { driver: "Spend concentration", value: "2.1% of category" },
      { driver: "Requalification time", value: "6 weeks" },
      { driver: "Spec complexity", value: "Standard / commodity" },
    ],
    recommendedLevers: ["competition", "commitment", "transparency"],
    manualOverride: false,
    aiReasoning: "Alpha Plastics is classified as Transactional/Competitive because the injection molding market has abundant qualified alternatives (8+), switching costs are minimal (~$12K tooling, 6-week requalification), and the parts are standard commodity specifications. The supplier holds no unique IP or capacity advantage. This classification strongly supports aggressive competitive levers.",
    missingData: [],
  }],
  factSections: alphaFactSections,
  levers: alphaLevers,
  objectives: alphaObjectives,
  arguments: alphaArguments,
  rounds: alphaRounds,
  }

// ─── Beta MicroFab Worked Example ───────────────────────────────────────────

const betaLevers: Lever[] = [
  {
    id: "lv-b1", category: "transparency", name: "Should-cost model presentation",
    description: "Present bottom-up cost model showing supplier margin above industry norm",
    status: "in-progress", impact: "high", effort: "high",
    inputs: ["BOM breakdown", "Wafer pricing", "Assembly labor rates"],
    outputs: ["Should-cost: $22.10-$23.40", "Current margin: 18-22%", "Industry norm: 12-15%"],
    estimatedImpact: "Limits price increase to CPI+1%",
    workflows: [
      { id: "wf-b1a", step: "Build cost model", description: "Bottom-up: wafer, packaging, test, logistics", status: "done", output: "Model complete: $22.75 mid-point" },
      { id: "wf-b1b", step: "Select reference indices", description: "Map to DRAM + Logic IC indices", status: "done", output: "DRAM +14%, Logic +8%, wafer starts +22%" },
      { id: "wf-b1c", step: "Calculate fair adjustment", description: "Apply index to cost components", status: "active" },
      { id: "wf-b1d", step: "Prepare clawback clause", description: "Draft index-linked price adjustment mechanism", status: "pending" },
    ],
    recommendation: { leverId: "lv-b1", category: "transparency", recommended: true, reasoning: "Strategic supplier with above-norm margins. Should-cost is the primary tool to anchor fair pricing without threatening the relationship.", prerequisites: ["BOM data", "Wafer + assembly cost rates", "Index access"], impactEstimate: "high", effortEstimate: "high", sequenceOrder: 1 },
  },
  {
    id: "lv-b2", category: "engineering", name: "VA/VE on next-gen sensor module",
    description: "Joint value engineering to reduce cost and improve performance on 2028 platform",
    status: "not-started", impact: "high", effort: "high",
    inputs: ["Current module spec", "Target cost", "Performance requirements"],
    outputs: ["VA/VE opportunity list", "Estimated savings", "Qualification plan"],
    estimatedImpact: "8-12% cost reduction on next generation",
    workflows: [
      { id: "wf-b2a", step: "Spec rationalization workshop", description: "Identify over-spec areas with engineering", status: "pending" },
      { id: "wf-b2b", step: "Savings quantification", description: "Cost each VA/VE opportunity", status: "pending" },
      { id: "wf-b2c", step: "Qualification plan", description: "Timeline and test requirements for changes", status: "pending" },
    ],
    recommendation: { leverId: "lv-b2", category: "engineering", recommended: true, reasoning: "Strategic partnership lever. Joint cost-out builds relationship value while reducing cost on next-gen platform.", prerequisites: ["Engineering team involvement", "Module specs", "Target cost model"], impactEstimate: "high", effortEstimate: "high", sequenceOrder: 3 },
  },
  {
    id: "lv-b3", category: "performance", name: "SLA penalty structure",
    description: "Implement formal penalty/bonus tied to delivery and quality KPIs",
    status: "not-started", impact: "medium", effort: "medium",
    inputs: ["Current KPI data", "Industry SLA benchmarks", "Penalty calculation model"],
    outputs: ["Penalty/bonus schedule", "Projected chargeback estimates"],
    estimatedImpact: "1-2% cost offset via penalties",
    workflows: [
      { id: "wf-b3a", step: "Benchmark SLA terms", description: "Compare to 3 industry peers", status: "pending" },
      { id: "wf-b3b", step: "Simulate chargebacks", description: "Model penalties on trailing 12-mo data", status: "pending" },
    ],
    recommendation: { leverId: "lv-b3", category: "performance", recommended: true, reasoning: "Despite strong performance, formalizing SLA creates accountability. Bonus structure rewards excellence and aligns incentives.", prerequisites: ["12-month SLA data", "Industry benchmarks"], impactEstimate: "medium", effortEstimate: "medium", sequenceOrder: 2 },
  },
  {
    id: "lv-b4", category: "commitment", name: "Long-term agreement with capacity reservation",
    description: "3-year agreement with guaranteed capacity in exchange for price stability",
    status: "not-started", impact: "medium", effort: "low",
    inputs: ["Volume forecast 3yr", "Capacity requirements", "WACC for NPV calc"],
    outputs: ["NPV of agreement", "Capacity reservation terms", "Price escalation cap"],
    estimatedImpact: "Supply security + price cap at CPI+1%",
    workflows: [
      { id: "wf-b4a", step: "Volume forecast lock", description: "Get ops sign-off on 3yr forecast", status: "pending" },
      { id: "wf-b4b", step: "NPV calculation", description: "Model commitment value vs. market risk", status: "pending" },
    ],
    recommendation: { leverId: "lv-b4", category: "commitment", recommended: true, reasoning: "Capacity reservation secures supply in constrained market. Exchange commitment for price cap at CPI+1%.", prerequisites: ["3yr volume forecast", "WACC rate", "Ops sign-off"], impactEstimate: "medium", effortEstimate: "low", sequenceOrder: 4 },
  },
]

const betaArguments: ArgumentCard[] = [
  {
    id: "arg-b1", title: "Margin Above Industry Norm",
    claim: "Our should-cost model indicates Beta is operating at 18-22% margin vs. the industry norm of 12-15%.",
    evidence: "Bottom-up model: wafer ($12.40) + packaging ($3.20) + test ($1.80) + logistics ($0.60) + 18% overhead = $22.75. Current price $24.80.",
    ask: "Limit increase to CPI+1% (effective fair price: ~$23.40), not the requested CPI+5%.",
    rebuttal: "If supplier claims R&D amortization: their R&D/revenue ratio is 6%, below industry 8-10%. Already reflected in overhead.",
    linkedFactIds: ["fi-b1"], linkedLeverIds: ["lv-b1"], strength: "strong",
  },
  {
    id: "arg-b2", title: "Capacity Easing Reduces Leverage",
    claim: "Beta's new Fab 4 (Q3 2026) adds 30% capacity, reducing the supply constraint they've used to justify premium pricing.",
    evidence: "Industry reports confirm Fab 4 on track. Wafer starts up 22% industry-wide. DRAM cycle peaking.",
    ask: "New capacity should translate to improved pricing, not maintain status quo premiums.",
    rebuttal: "If supplier claims Fab 4 is fully allocated: public data shows <60% of new capacity is committed.",
    linkedFactIds: ["fi-b3"], linkedLeverIds: ["lv-b1"], strength: "moderate",
  },
]

const betaFactSections: FactSection[] = [
  {
    id: "fs-b1", supplierId: "ns-2", type: "external", title: "External Insights",
    items: [
      { id: "fi-b1", title: "Semiconductor Market Outlook", category: "market-growth", content: "Global semiconductor revenue forecast +7.2% for 2026. However, capacity additions outpacing demand growth. Buyer conditions improving H2 2026.", source: "WSTS + Gartner", confidence: 85, lastUpdated: "2026-02-01", dataPoints: [{ label: "Market growth", value: "+7.2%" }, { label: "Outlook", value: "Easing H2" }] },
      { id: "fi-b2", title: "Semiconductor Index Tracking", category: "indices", content: "DRAM index +14% YoY. Logic IC +8%. But wafer starts +22% suggesting easing. Contract formula overstates cost pressure by ~4%.", source: "WSTS + IHS Markit", confidence: 82, lastUpdated: "2026-02-12", dataPoints: [{ label: "DRAM", value: "+14% YoY" }, { label: "Logic IC", value: "+8% YoY" }] },
      { id: "fi-b3", title: "Beta MicroFab Financial & Capacity", category: "capacity", content: "Revenue $320M (+12% YoY). EBITDA 24%. Operating at 87% utilization. Fab 4 online Q3 2026 adds 30% capacity.", source: "Public filings + industry intel", confidence: 74, lastUpdated: "2026-02-15", dataPoints: [{ label: "Revenue", value: "$320M" }, { label: "Utilization", value: "87%" }] },
    ],
  },
  {
    id: "fs-b2", supplierId: "ns-2", type: "supplier-pack", title: "Supplier Fact Pack",
    items: [
      { id: "fi-b4", title: "Spend Analysis", category: "spend", content: "Annual spend: $4.8M across 2 product families. Region: 100% Asia-Pacific (Taiwan fab). We represent 12% of their output.", source: "Internal ERP", confidence: 95, lastUpdated: "2026-02-10", dataPoints: [{ label: "Annual spend", value: "$4.8M" }, { label: "Our share", value: "12%" }] },
      { id: "fi-b5", title: "Price History", category: "price-history", content: "Price: $24.80/unit. +6% in 2024, +4% in 2023. Cumulative 22% increase over 3 years vs. 14% index movement. Margin expansion evident.", source: "Contract history", confidence: 96, lastUpdated: "2026-02-10", dataPoints: [{ label: "Current", value: "$24.80" }, { label: "3yr increase", value: "+22%" }] },
      { id: "fi-b6", title: "Contract Details", category: "contract", content: "2yr agreement expiring Mar 2027. CPI + commodity adjustment formula. 12-month termination notice. Exclusivity clause for sensor module.", source: "Legal archive", confidence: 100, lastUpdated: "2026-02-10", dataPoints: [{ label: "Expiry", value: "Mar 2027" }, { label: "Notice", value: "12 months" }] },
    ],
  },
]

const betaObjectives: Objective[] = [
  { id: "obj-b1", domain: "cost-price", metric: "index-formula", title: "Limit increase to CPI+1%", anchor: "CPI-1%", laa: "CPI+3%", mdo: "CPI+0%", batna: "Begin dual-source qualification (18-month timeline)", priority: "Must-have", weight: 35, rationale: "Should-cost supports CPI+1%. Supplier margin at 18-22% vs 12-15% norm.", linkedLeverId: "lv-b1", linkedFactIds: ["fi-b-price-1"], owner: "James Liu", status: "active", source: "ai", aiConfidence: 88, aiRationale: "Should-cost model shows supplier at 18-22% margin vs 12-15% industry norm. Index analysis (DRAM +14%, Logic +8%) supports CPI-linked formula. Strategic relationship means avoiding aggressive absolute cuts.", missingData: ["Wafer cost breakdown from Fab 4 allocation"], aiVersion: 1 },
  { id: "obj-b2", domain: "risk-resiliency", metric: "custom", title: "Dual-source qualification path", anchor: "Second source qualified Q2 2026", laa: "Qualification plan agreed", mdo: "Second source qualified Q4 2026", batna: "Accelerate in-house design alternative", priority: "Important", weight: 25, rationale: "Single-source risk unacceptable for safety-critical components", linkedFactIds: [], owner: "James Liu", status: "active", source: "ai", aiConfidence: 75, aiRationale: "Single-source dependency on safety-critical MEMS sensor is high-risk per supply chain risk framework. Only 2 global alternatives exist. Zeta Electronics is most viable but requires 18-month requalification.", missingData: ["Zeta Electronics qualification timeline estimate", "In-house design feasibility study"], aiVersion: 1 },
  { id: "obj-b3", domain: "innovation", metric: "custom", title: "Joint next-gen sensor development", anchor: "Full co-development JV", laa: "NDA + roadmap alignment", mdo: "Co-development agreement signed", batna: "Partner with Zeta Electronics instead", priority: "Nice-to-have", weight: 15, rationale: "Both parties benefit from early 2028 platform collaboration", linkedLeverId: "lv-b2", linkedFactIds: [], owner: "James Liu", status: "draft", source: "ai", aiConfidence: 62, aiRationale: "Strategic relationship supports co-development. New COO appointment may shift focus to operational efficiency over R&D partnerships. Assess commitment level.", missingData: ["New COO strategic priorities", "Competitor Zeta R&D roadmap"], aiVersion: 1 },
  { id: "obj-b4", domain: "sla", metric: "otd-pct", title: "Formalize SLA with penalty/bonus", anchor: "99% OTD / $50K penalty pool", laa: "96% OTD / symbolic penalties", mdo: "98% OTD / $25K penalty pool", batna: "Maintain informal quality expectations", priority: "Important", weight: 15, rationale: "Despite strong performance (96-97% OTD), formalizing SLA creates accountability and bonus incentive for sustained excellence.", linkedLeverId: "lv-b3", linkedFactIds: [], owner: "James Liu", status: "draft", source: "ai", aiConfidence: 80, aiRationale: "Performance data shows 96-97% OTD consistently. Formalizing SLA with bonus for >98% creates win-win incentive. Strategic suppliers respond well to mutual accountability frameworks.", missingData: [], aiVersion: 1 },
  { id: "obj-b5", domain: "contract-terms", metric: "contract-months", title: "3-year term with price reopener", anchor: "5-year with annual index reset", laa: "2-year with fixed price", mdo: "3-year with semi-annual index review", batna: "Year-to-year renewal", priority: "Nice-to-have", weight: 10, rationale: "Longer term secures capacity commitment for Fab 4 allocation. Index reopener protects against market volatility.", linkedFactIds: [], owner: "James Liu", status: "draft", source: "ai", aiConfidence: 70, aiRationale: "Fab 4 capacity coming online Q3 2026 with <60% pre-committed. Locking in capacity allocation via longer-term commitment is a lever. Supplier's need to fill new capacity supports this approach.", missingData: ["Fab 4 exact pre-commitment percentages"], aiVersion: 1 },
]

export const exampleWorkspaceBeta: NegotiationWorkspace = {
  id: "nw-beta",
  name: "Beta MicroFab Strategic Partnership 2027",
  category: "Semiconductor Components",
  status: "in-progress",
  scope: { regions: ["Asia-Pacific"], businessUnits: ["Electronics"], skuGroups: ["Sensor Modules", "Logic ICs"] },
  supplierIds: ["ns-2"],
  createdBy: "James Liu",
  createdAt: "2026-01-10",
  lastModified: "2026-02-18",
  spectrumPlacements: [{
    supplierId: "ns-2", supplierName: "Beta MicroFab",
    relationshipCriticality: 82, supplyMarketConstraint: 76,
    quadrant: "strategic-critical", confidence: 79,
    topDrivers: ["Annual spend: $4.8M", "Only 2 alternatives globally", "Switching cost: high (18-mo requalification)", "Quality impact: high (safety-critical)"],
    topDriverMetrics: [
      { driver: "Qualified alternatives", value: "2 (global)" },
      { driver: "Switching cost", value: "High (~$350K + 18 mo)" },
      { driver: "Annual spend", value: "$4.8M" },
      { driver: "Spend concentration", value: "68% of category" },
      { driver: "Requalification time", value: "18 months" },
      { driver: "Quality impact", value: "Safety-critical" },
      { driver: "IP dependency", value: "Proprietary die design" },
    ],
    recommendedLevers: ["transparency", "performance", "engineering", "commitment"],
    manualOverride: false,
    aiReasoning: "Beta MicroFab is classified as Strategic/Critical because only 2 global alternatives exist for precision sensor modules, switching costs are prohibitive ($350K + 18-month requalification), and the components are safety-critical with proprietary die design. The supplier holds significant leverage through IP and capacity constraints. Relationship-building levers are recommended over aggressive competitive approaches.",
    missingData: ["Competitor Zeta Electronics pricing (estimated)", "Fab 4 actual capacity allocation commitments"],
  }],
  factSections: betaFactSections,
  levers: betaLevers,
  objectives: betaObjectives,
  arguments: betaArguments,
  rounds: [],
  }

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getAllWorkspaces(): NegotiationWorkspace[] {
  return [exampleWorkspaceAlpha, exampleWorkspaceBeta]
}

export function getSuppliersByIds(ids: string[]): NegotiationSupplier[] {
  return negotiationSuppliers.filter((s) => ids.includes(s.id))
}

// ─── Index Catalog (for Transparency Lever) ──────────────────���──────────

export type IndexGroup = "commodities" | "freight" | "fx" | "labor" | "energy" | "other"

export interface CatalogIndex {
  id: string
  name: string
  group: IndexGroup
  source: string
  frequency: "daily" | "weekly" | "monthly" | "quarterly"
  latestYoY: number
  series: { period: string; value: number }[]
}

export const INDEX_GROUP_LABELS: Record<IndexGroup, string> = {
  commodities: "Commodities",
  freight: "Freight & Logistics",
  fx: "FX / Currency",
  labor: "Labor",
  energy: "Energy",
  other: "Other",
}

export const INDEX_CATALOG: CatalogIndex[] = [
  { id: "idx-pp-resin", name: "PP Resin (ICIS)", group: "commodities", source: "ICIS", frequency: "weekly", latestYoY: -8,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 98 }, { period: "Q3 2024", value: 95 }, { period: "Q4 2024", value: 94 }, { period: "Q1 2025", value: 93 }, { period: "Q2 2025", value: 92 }] },
  { id: "idx-abs-resin", name: "ABS Resin (Platts)", group: "commodities", source: "S&P Global Platts", frequency: "weekly", latestYoY: -5,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 99 }, { period: "Q3 2024", value: 97 }, { period: "Q4 2024", value: 96 }, { period: "Q1 2025", value: 96 }, { period: "Q2 2025", value: 95 }] },
  { id: "idx-nylon6", name: "Nylon 6 (ICIS)", group: "commodities", source: "ICIS", frequency: "monthly", latestYoY: -3,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 100 }, { period: "Q3 2024", value: 99 }, { period: "Q4 2024", value: 98 }, { period: "Q1 2025", value: 98 }, { period: "Q2 2025", value: 97 }] },
  { id: "idx-steel-crc", name: "Cold-Rolled Steel (CRU)", group: "commodities", source: "CRU Group", frequency: "weekly", latestYoY: -12,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 96 }, { period: "Q3 2024", value: 93 }, { period: "Q4 2024", value: 90 }, { period: "Q1 2025", value: 89 }, { period: "Q2 2025", value: 88 }] },
  { id: "idx-aluminum", name: "Aluminum LME", group: "commodities", source: "LME", frequency: "daily", latestYoY: 2,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 101 }, { period: "Q3 2024", value: 100.5 }, { period: "Q4 2024", value: 101 }, { period: "Q1 2025", value: 102 }, { period: "Q2 2025", value: 102 }] },
  { id: "idx-dram", name: "DRAM Spot (DRAMeXchange)", group: "commodities", source: "TrendForce", frequency: "weekly", latestYoY: 14,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 105 }, { period: "Q3 2024", value: 108 }, { period: "Q4 2024", value: 110 }, { period: "Q1 2025", value: 112 }, { period: "Q2 2025", value: 114 }] },
  { id: "idx-ind-energy", name: "Industrial Energy (EIA)", group: "energy", source: "EIA", frequency: "monthly", latestYoY: 0,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 101 }, { period: "Q3 2024", value: 102 }, { period: "Q4 2024", value: 101 }, { period: "Q1 2025", value: 100 }, { period: "Q2 2025", value: 100 }] },
  { id: "idx-nat-gas", name: "Natural Gas (Henry Hub)", group: "energy", source: "CME", frequency: "daily", latestYoY: -15,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 95 }, { period: "Q3 2024", value: 90 }, { period: "Q4 2024", value: 88 }, { period: "Q1 2025", value: 86 }, { period: "Q2 2025", value: 85 }] },
  { id: "idx-mfg-labor", name: "Mfg. Labor (BLS)", group: "labor", source: "BLS", frequency: "monthly", latestYoY: 3,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 101 }, { period: "Q3 2024", value: 101.5 }, { period: "Q4 2024", value: 102 }, { period: "Q1 2025", value: 102.5 }, { period: "Q2 2025", value: 103 }] },
  { id: "idx-apac-labor", name: "APAC Electronics Labor", group: "labor", source: "JETRO", frequency: "quarterly", latestYoY: 5,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 101.2 }, { period: "Q3 2024", value: 102.5 }, { period: "Q4 2024", value: 103.5 }, { period: "Q1 2025", value: 104.2 }, { period: "Q2 2025", value: 105 }] },
  { id: "idx-dom-freight", name: "Domestic Freight (DAT)", group: "freight", source: "DAT", frequency: "weekly", latestYoY: 1,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 100.5 }, { period: "Q3 2024", value: 101 }, { period: "Q4 2024", value: 100.5 }, { period: "Q1 2025", value: 101 }, { period: "Q2 2025", value: 101 }] },
  { id: "idx-ocean-freight", name: "Ocean Container (Freightos)", group: "freight", source: "Freightos FBX", frequency: "weekly", latestYoY: -20,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 92 }, { period: "Q3 2024", value: 88 }, { period: "Q4 2024", value: 84 }, { period: "Q1 2025", value: 82 }, { period: "Q2 2025", value: 80 }] },
  { id: "idx-usd-cny", name: "USD/CNY", group: "fx", source: "Reuters", frequency: "daily", latestYoY: -1,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 100 }, { period: "Q3 2024", value: 99.5 }, { period: "Q4 2024", value: 99 }, { period: "Q1 2025", value: 99 }, { period: "Q2 2025", value: 99 }] },
  { id: "idx-usd-eur", name: "USD/EUR", group: "fx", source: "Reuters", frequency: "daily", latestYoY: 2,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 101 }, { period: "Q3 2024", value: 101 }, { period: "Q4 2024", value: 101.5 }, { period: "Q1 2025", value: 102 }, { period: "Q2 2025", value: 102 }] },
  { id: "idx-ppi-plastics", name: "PPI: Plastics Products", group: "other", source: "BLS", frequency: "monthly", latestYoY: -2,
    series: [{ period: "Q1 2024", value: 100 }, { period: "Q2 2024", value: 99.5 }, { period: "Q3 2024", value: 99 }, { period: "Q4 2024", value: 98.5 }, { period: "Q1 2025", value: 98 }, { period: "Q2 2025", value: 98 }] },
]

export function suggestIndicesForCategory(category: string): string[] {
  const map: Record<string, string[]> = {
    "Injection Molding": ["idx-pp-resin", "idx-abs-resin", "idx-nylon6", "idx-ind-energy", "idx-mfg-labor", "idx-dom-freight"],
    "Semiconductor Components": ["idx-dram", "idx-ind-energy", "idx-apac-labor", "idx-ocean-freight", "idx-usd-cny"],
    "Raw Materials": ["idx-steel-crc", "idx-aluminum", "idx-ind-energy", "idx-dom-freight"],
    "Packaging Materials": ["idx-pp-resin", "idx-dom-freight", "idx-mfg-labor"],
    "Electronic Assemblies": ["idx-dram", "idx-apac-labor", "idx-ocean-freight", "idx-usd-cny"],
    "Specialty Chemicals": ["idx-nat-gas", "idx-ind-energy", "idx-dom-freight"],
  }
  return map[category] ?? ["idx-ind-energy", "idx-mfg-labor", "idx-dom-freight"]
}

// ─── Transferable Spend Data (for Commitment Lever) ──────────────────────

export interface TransferableSpendRow {
  sku: string
  currentSupplier: string
  currentAnnualVolume: number
  currentAnnualSpend: number
  contractEnd: string
  switchabilityScore: number   // 1-100
  suggestedTransferUnits: number
  suggestedTransferSpend: number
}

export const alphaTransferableSpend: TransferableSpendRow[] = [
  { sku: "ABS Housing Shell", currentSupplier: "ProForm Molding", currentAnnualVolume: 280_000, currentAnnualSpend: 218_400, contractEnd: "2026-09-30", switchabilityScore: 92, suggestedTransferUnits: 84_000, suggestedTransferSpend: 65_520 },
  { sku: "ABS Housing Shell", currentSupplier: "Evco Plastics", currentAnnualVolume: 120_000, currentAnnualSpend: 100_800, contractEnd: "2026-12-31", switchabilityScore: 88, suggestedTransferUnits: 36_000, suggestedTransferSpend: 30_240 },
  { sku: "PP Bracket Assembly", currentSupplier: "MexiPlast", currentAnnualVolume: 95_000, currentAnnualSpend: 67_450, contractEnd: "2026-06-30", switchabilityScore: 78, suggestedTransferUnits: 28_500, suggestedTransferSpend: 20_235 },
  { sku: "Nylon Clip Set", currentSupplier: "Nypro (Jabil)", currentAnnualVolume: 200_000, currentAnnualSpend: 176_000, contractEnd: "2027-03-31", switchabilityScore: 65, suggestedTransferUnits: 40_000, suggestedTransferSpend: 35_200 },
]

export function formatCurrencyCompact(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  if (v < 1 && v > 0) return `$${v.toFixed(2)}`
  return `$${v.toLocaleString()}`
}

// ─── AI Lever Recommendations ────────────────────────────────────────���─────

export interface QuadrantLeverAdvice {
  recommended: LeverCategory[]
  discouraged: LeverCategory[]
  reasoning: Record<LeverCategory, string>
}

const QUADRANT_LEVER_ADVICE: Record<SpectrumQuadrant, QuadrantLeverAdvice> = {
  "transactional-competitive": {
    recommended: ["competition", "commitment", "transparency"],
    discouraged: ["engineering"],
    reasoning: {
      competition: "Many alternatives available. RFQ sprint creates maximum BATNA pressure.",
      commitment: "Volume carrot pairs well with competitive pressure for incremental discount.",
      transparency: "Commodity indices clearly available. Show price vs. market to anchor negotiations.",
      performance: "Use performance data as secondary lever to extract concessions.",
      engineering: "Low strategic value -- avoid deep engineering investment with transactional suppliers.",
      "working-capital": "Terms optimization is always available but secondary to price reduction.",
    },
  },
  leverage: {
    recommended: ["competition", "commitment", "transparency", "performance"],
    discouraged: [],
    reasoning: {
      competition: "Fewer alternatives but still possible. Demonstrate credible BATNA.",
      commitment: "Consolidation offer creates strong carrot for price step-down.",
      transparency: "Show cost structure analysis to challenge margin expansion.",
      performance: "Formalize SLA penalties to create accountability.",
      engineering: "Consider if long-term relationship warrants joint value engineering.",
      "working-capital": "Terms optimization adds incremental value.",
    },
  },
  "strategic-critical": {
    recommended: ["transparency", "performance", "engineering", "commitment"],
    discouraged: ["competition"],
    reasoning: {
      competition: "Avoid aggressive RFQ unless dual-source is feasible (18+ month timeline). Risks relationship.",
      commitment: "Long-term commitment secures capacity and caps price escalation.",
      transparency: "Should-cost models anchor fair pricing without threatening relationship.",
      performance: "Bonus/penalty SLA structure aligns incentives.",
      engineering: "Joint VA/VE builds partnership value while reducing cost.",
      "working-capital": "Terms optimization is always available.",
    },
  },
  bottleneck: {
    recommended: ["commitment", "engineering", "working-capital", "performance"],
    discouraged: ["competition"],
    reasoning: {
      competition: "Very few alternatives. RFQ may backfire and damage relationship.",
      commitment: "Secure supply through volume guarantees and capacity reservations.",
      transparency: "Use cautiously -- supplier may push back on cost transparency.",
      performance: "Formalize SLA to ensure supply reliability.",
      engineering: "Spec rationalization reduces dependency on scarce supply.",
      "working-capital": "Terms optimization and consignment reduce working capital burden.",
    },
  },
}

export function getLeverAdviceForQuadrant(quadrant: SpectrumQuadrant): QuadrantLeverAdvice {
  return QUADRANT_LEVER_ADVICE[quadrant]
}

export const ALL_LEVER_TEMPLATES: { id: string; category: LeverCategory; name: string; description: string; impact: LeverImpact; effort: LeverEffort }[] = [
  { id: "tpl-competition", category: "competition", name: "Rapid RFQ / Quote Sprint", description: "Generate competitive quotes to establish BATNA and market benchmarks", impact: "high", effort: "medium" },
  { id: "tpl-transparency", category: "transparency", name: "Price vs Indices / Should-Cost", description: "Analyze price against input cost indices and build should-cost models", impact: "high", effort: "medium" },
  { id: "tpl-commitment", category: "commitment", name: "Volume / Term / Allocation", description: "Offer volume growth, term extension, or allocation shifts for price concessions", impact: "medium", effort: "low" },
  { id: "tpl-performance", category: "performance", name: "SLA Penalties & Credits", description: "Formalize SLA with penalty/bonus structure tied to delivery and quality KPIs", impact: "medium", effort: "medium" },
  { id: "tpl-engineering", category: "engineering", name: "VA/VE & Spec Rationalization", description: "Joint value engineering to reduce cost through design and spec optimization", impact: "high", effort: "high" },
  { id: "tpl-working-capital", category: "working-capital", name: "Terms & Working Capital", description: "Optimize payment terms, evaluate consignment/VMI, model WACC trade-offs", impact: "low", effort: "low" },
]

// ─── Build Status Tracking ─────────────────────────────────────────────────

export type BuildSectionKey = "fact-base" | "market-overview" | "matrix" | "levers"

export interface BuildSectionStatus {
  key: BuildSectionKey
  label: string
  status: "pending" | "generating" | "complete" | "error"
  progress: number     // 0–100
  startedAt?: string
  completedAt?: string
  dataGaps: string[]
}

export interface StrategyBuildStatus {
  overallProgress: number
  sections: BuildSectionStatus[]
  isComplete: boolean
  lastRefreshed: string
}

export function createInitialBuildStatus(): StrategyBuildStatus {
  return {
    overallProgress: 0,
    isComplete: false,
    lastRefreshed: new Date().toISOString(),
    sections: [
      { key: "fact-base", label: "Fact Base", status: "pending", progress: 0, dataGaps: [] },
      { key: "market-overview", label: "Market Overview", status: "pending", progress: 0, dataGaps: [] },
      { key: "matrix", label: "Supplier Matrix", status: "pending", progress: 0, dataGaps: [] },
      { key: "levers", label: "Lever Recommendations", status: "pending", progress: 0, dataGaps: [] },
    ],
  }
}

// ─── Auto-population Generator ─────────────────────────────────────────────

function generateSpendHistory(supplier: NegotiationSupplier, skuNames: string[]): SpendTimeSeries[] {
  const base = supplier.annualSpend
  const years = [2022, 2023, 2024, 2025, 2026]
  const growth = [0.85, 0.90, 0.95, 1.0, 1.02]
  return years.map((year, i) => {
    const total = Math.round(base * growth[i])
    const skuShare = skuNames.length > 0
      ? Object.fromEntries(skuNames.map((name, j) => {
          const share = j === 0 ? 0.55 : j === 1 ? 0.30 : (0.15 / Math.max(1, skuNames.length - 2))
          return [name, Math.round(total * share)]
        }))
      : { "All SKUs": total }
    const regions = supplier.country === "US" ? { "North America": total }
      : supplier.country === "Taiwan" || supplier.country === "South Korea" || supplier.country === "Japan" ? { "Asia-Pacific": total }
      : supplier.country === "Germany" ? { EMEA: total }
      : supplier.country === "Mexico" ? { "Latin America": total }
      : { "North America": total }
    return { year, total, byRegion: regions, bySku: skuShare }
  })
}

function generatePriceVolume(supplier: NegotiationSupplier, skuNames: string[]): PriceVolumePoint[] {
  const avgPrice = supplier.annualSpend > 3_000_000 ? 18 + Math.random() * 10 : 0.70 + Math.random() * 0.40
  const avgVolume = Math.round(supplier.annualSpend / avgPrice)
  const qVolume = Math.round(avgVolume / 4)
  const quarters = ["Q1 2023", "Q2 2023", "Q3 2023", "Q4 2023", "Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]
  const priceGrowth = [0, 0, 0.02, 0.02, 0.04, 0.04, 0.06, 0.06, 0.08, 0.08, 0.08, 0.08]

  // Aggregated rows
  const agg: PriceVolumePoint[] = quarters.map((period, i) => ({
    period,
    price: Number((avgPrice * (1 + priceGrowth[i])).toFixed(2)),
    volume: Math.round(qVolume * (0.95 + Math.random() * 0.10)),
  }))

  // Per-SKU rows
  const perSku: PriceVolumePoint[] = []
  skuNames.forEach((sku, idx) => {
    const skuShare = idx === 0 ? 0.55 : idx === 1 ? 0.30 : 0.15
    const skuBasePrice = avgPrice * (1 + (idx * 0.08 - 0.04))
    quarters.forEach((period, i) => {
      perSku.push({
        period,
        price: Number((skuBasePrice * (1 + priceGrowth[i])).toFixed(2)),
        volume: Math.round(qVolume * skuShare * (0.95 + Math.random() * 0.10)),
        sku,
      })
    })
  })

  return [...agg, ...perSku]
}

function generateSlaData(): SlaDataPoint[] {
  return [
    { period: "Q1 2024", otd: 90 + Math.round(Math.random() * 8), rejectRate: Number((0.8 + Math.random() * 1.4).toFixed(1)), otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q2 2024", otd: 90 + Math.round(Math.random() * 8), rejectRate: Number((0.8 + Math.random() * 1.4).toFixed(1)), otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q3 2024", otd: 88 + Math.round(Math.random() * 10), rejectRate: Number((0.8 + Math.random() * 1.4).toFixed(1)), otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q4 2024", otd: 90 + Math.round(Math.random() * 8), rejectRate: Number((0.8 + Math.random() * 1.4).toFixed(1)), otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q1 2025", otd: 89 + Math.round(Math.random() * 9), rejectRate: Number((0.8 + Math.random() * 1.4).toFixed(1)), otdTarget: 95, rejectTarget: 1.5 },
    { period: "Q2 2025", otd: 90 + Math.round(Math.random() * 8), rejectRate: Number((0.8 + Math.random() * 1.4).toFixed(1)), otdTarget: 95, rejectTarget: 1.5 },
  ]
}

export function generateAutoPopulation(
  supplierIds: string[],
  category: string,
  skuGroupNames: string[],
  regions: string[],
): {
  factSections: FactSection[]
  spectrumPlacements: SpectrumPlacement[]
  levers: Lever[]
  generatedFactPacks: Map<string, SupplierFactPack>
  buildStatus: StrategyBuildStatus
} {
  const suppliers = negotiationSuppliers.filter((s) => supplierIds.includes(s.id))
  const factSections: FactSection[] = []
  const spectrumPlacements: SpectrumPlacement[] = []
  const allLevers: Lever[] = []
  const generatedFactPacks = new Map<string, SupplierFactPack>()

  // Resolve SKU names from sku group strings (format "Name (CODE)")
  const skuNames = skuGroupNames.map((s) => {
    const match = s.match(/^(.+)\s\([^)]+\)$/)
    return match ? match[1] : s
  })

  for (const supplier of suppliers) {
    // 1. Generate fact pack
    const factPack: SupplierFactPack = {
      supplierId: supplier.id,
      spendHistory: generateSpendHistory(supplier, skuNames),
      priceVolume: generatePriceVolume(supplier, skuNames),
      slaPerformance: generateSlaData(),
    }
    generatedFactPacks.set(supplier.id, factPack)

    // 2. Generate fact sections
    const externalSection: FactSection = {
      id: `fs-gen-${supplier.id}-ext`,
      supplierId: supplier.id,
      type: "external",
      title: "External Insights",
      items: [
        {
          id: `fi-gen-${supplier.id}-1`,
          title: `${category} Market Outlook`,
          category: "market-growth",
          content: `The ${category} market is projected to grow at ${(2 + Math.random() * 5).toFixed(1)}% CAGR. Supply-demand dynamics ${Math.random() > 0.5 ? "favor buyers" : "are balanced"} heading into H2 2026.`,
          source: "IBISWorld + Industry Reports",
          confidence: 80 + Math.round(Math.random() * 15),
          lastUpdated: new Date().toISOString().slice(0, 10),
          dataPoints: [
            { label: "Market growth", value: `+${(2 + Math.random() * 5).toFixed(1)}%` },
            { label: "Outlook", value: Math.random() > 0.5 ? "Buyer-friendly" : "Balanced" },
          ],
        },
        {
          id: `fi-gen-${supplier.id}-2`,
          title: `${supplier.name} Financial & Capacity`,
          category: "capacity",
          content: `${supplier.name} estimated revenue $${(supplier.annualSpend * (8 + Math.random() * 15) / 1_000_000).toFixed(0)}M. Utilization at ${75 + Math.round(Math.random() * 20)}%.`,
          source: "Public filings + industry intel",
          confidence: 65 + Math.round(Math.random() * 20),
          lastUpdated: new Date().toISOString().slice(0, 10),
          dataPoints: [
            { label: "Est. revenue", value: `$${(supplier.annualSpend * (8 + Math.random() * 15) / 1_000_000).toFixed(0)}M` },
            { label: "Utilization", value: `${75 + Math.round(Math.random() * 20)}%` },
          ],
        },
      ],
    }

    const supplierPackSection: FactSection = {
      id: `fs-gen-${supplier.id}-pack`,
      supplierId: supplier.id,
      type: "supplier-pack",
      title: "Supplier Fact Pack",
      items: [
        {
          id: `fi-gen-${supplier.id}-3`,
          title: "Spend Analysis",
          category: "spend",
          content: `Annual spend: ${formatCurrencyCompact(supplier.annualSpend)} across ${skuNames.length} SKU families. Region: ${regions.join(", ")}.`,
          source: "Internal ERP",
          confidence: 95,
          lastUpdated: new Date().toISOString().slice(0, 10),
          dataPoints: [
            { label: "Annual spend", value: formatCurrencyCompact(supplier.annualSpend) },
            { label: "SKU count", value: String(skuNames.length) },
          ],
        },
        {
          id: `fi-gen-${supplier.id}-4`,
          title: "Price History",
          category: "price-history",
          content: `Current average price tracked over 12 quarters. Cumulative increase of ~${(5 + Math.random() * 10).toFixed(0)}% over 3 years.`,
          source: "Contract history",
          confidence: 92,
          lastUpdated: new Date().toISOString().slice(0, 10),
          dataPoints: [
            { label: "3yr increase", value: `+${(5 + Math.random() * 10).toFixed(0)}%` },
          ],
        },
        {
          id: `fi-gen-${supplier.id}-5`,
          title: "Contract Details",
          category: "contract",
          content: `Contract ending ${supplier.contractEnd}. ${supplier.segment} supplier. Location: ${supplier.country}.`,
          source: "Legal archive",
          confidence: 100,
          lastUpdated: new Date().toISOString().slice(0, 10),
          dataPoints: [
            { label: "Expiry", value: supplier.contractEnd },
            { label: "Segment", value: supplier.segment },
          ],
        },
      ],
    }

    factSections.push(externalSection, supplierPackSection)

    // 3. Generate spectrum placement
    const altCount = supplier.segment === "Strategic" ? 2 : supplier.segment === "Preferred" ? 4 : 8
    const placement = computeSpectrumPlacement(supplier.id, supplier.name, {
      annualSpend: supplier.annualSpend,
      supplierCount: altCount,
      switchingCostEstimate: supplier.segment === "Strategic" ? "high" : supplier.segment === "Preferred" ? "medium" : "low",
      qualityImpact: supplier.segment === "Strategic" ? "high" : "medium",
      supplyRisk: supplier.segment === "Strategic" ? "high" : supplier.segment === "Preferred" ? "medium" : "low",
      marketAlternatives: altCount,
      contractComplexity: supplier.segment === "Strategic" ? "high" : "medium",
    })
    spectrumPlacements.push(placement)

    // 4. Generate lever recommendations from quadrant
    const advice = getLeverAdviceForQuadrant(placement.quadrant)
    const recLevers = advice.recommended.map((cat, idx) => {
      const tpl = ALL_LEVER_TEMPLATES.find((t) => t.category === cat)
      return {
        id: `lv-gen-${supplier.id}-${cat}`,
        category: cat,
        name: tpl?.name ?? LEVER_LABELS[cat],
        description: tpl?.description ?? LEVER_DESCRIPTIONS[cat],
        status: "not-started" as const,
        inputs: [],
        outputs: [],
        impact: tpl?.impact ?? ("medium" as LeverImpact),
        effort: tpl?.effort ?? ("medium" as LeverEffort),
        workflows: [],
        recommendation: {
          leverId: `lv-gen-${supplier.id}-${cat}`,
          category: cat,
          recommended: true,
          reasoning: advice.reasoning[cat],
          prerequisites: [],
          impactEstimate: tpl?.impact ?? ("medium" as LeverImpact),
          effortEstimate: tpl?.effort ?? ("medium" as LeverEffort),
          sequenceOrder: idx + 1,
        },
      } satisfies Lever
    })
    allLevers.push(...recLevers)
  }

  // Build status -- simulate instant sync completion for MVP
  const buildStatus: StrategyBuildStatus = {
    overallProgress: 100,
    isComplete: true,
    lastRefreshed: new Date().toISOString(),
    sections: [
      { key: "fact-base", label: "Fact Base", status: "complete", progress: 100, completedAt: new Date().toISOString(), dataGaps: [] },
      { key: "market-overview", label: "Market Overview", status: "complete", progress: 100, completedAt: new Date().toISOString(), dataGaps: [] },
      { key: "matrix", label: "Supplier Matrix", status: "complete", progress: 100, completedAt: new Date().toISOString(), dataGaps: [] },
      { key: "levers", label: "Lever Recommendations", status: "complete", progress: 100, completedAt: new Date().toISOString(), dataGaps: [] },
    ],
  }

  return { factSections, spectrumPlacements, levers: allLevers, generatedFactPacks, buildStatus }
}

// ─── Supplier Revenue & Customer Share Data Model ──────────────────────────

export interface SupplierRevenuePoint {
  year: number
  revenue: number       // supplier total revenue ($)
  source: string        // e.g. "10-K Filing", "D&B Estimate"
  confidence: number    // 0-100
}

export interface CustomerSharePoint {
  year: number
  spend: number           // our spend with this supplier
  supplierRevenue: number // supplier total revenue
  sharePct: number        // spend / supplierRevenue * 100
  confidence: number
}

export type ShareInfluenceBand = "low" | "medium" | "high"

export function getInfluenceBand(sharePct: number): { band: ShareInfluenceBand; label: string; color: string } {
  if (sharePct < 1) return { band: "low", label: "<1% Low Influence", color: "hsl(var(--muted-foreground))" }
  if (sharePct <= 5) return { band: "medium", label: "1-5% Medium Influence", color: "hsl(36, 82%, 54%)" }
  return { band: "high", label: ">5% High Influence", color: "hsl(var(--primary))" }
}

export interface SupplierRevenueData {
  supplierId: string
  revenueSeries: SupplierRevenuePoint[]
  customerShareSeries: CustomerSharePoint[]
  revenueDataAvailable: boolean
  dataProxy?: string   // e.g. "Estimated from industry reports"
  lastUpdated: string
}

// ─── Supplier Profile Data Model ────────────────────────────────────────────

export interface ProfileSection<T> {
  data: T | null
  sources: string[]
  lastUpdated: string | null
  confidence: number      // 0-100
}

export interface FinancialHealthData {
  revenue: number | null
  revenueYoY: number | null
  ebitda: number | null
  ebitdaMargin: number | null
  ebitdaMarginTrend: { year: number; margin: number }[]
  liquidityRatio: number | null
  debtToEquity: number | null
  creditRiskScore: number | null      // 0-100 (higher = riskier)
  redFlags: string[]
  distressSignals: string[]
}

export interface MnaActivity {
  id: string
  type: "acquisition" | "divestiture" | "restructuring" | "leadership-change"
  title: string
  date: string
  description: string
  implications: string
}

export interface RegulatoryFlag {
  id: string
  type: "fda" | "iso" | "environmental" | "sanctions" | "export-control" | "other"
  title: string
  status: "compliant" | "warning" | "non-compliant" | "under-review"
  description: string
  lastChecked: string
}

export interface QualityMetric {
  period: string
  otd: number
  ppmDefect: number
  complaintRate: number
  otdTarget: number
  ppmTarget: number
}

export interface CapacitySignal {
  id: string
  type: "expansion" | "reduction" | "utilization" | "footprint-change"
  title: string
  description: string
  date: string
  implications: string
}

export interface SupplierProfile {
  supplierId: string
  financialHealth: ProfileSection<FinancialHealthData>
  mnaActivity: ProfileSection<MnaActivity[]>
  regulatory: ProfileSection<RegulatoryFlag[]>
  qualityReputation: ProfileSection<{ metrics: QualityMetric[]; externalSignals: string[] }>
  capacitySignals: ProfileSection<CapacitySignal[]>
}

export interface AiInsightCard {
  id: string
  title: string
  summary: string
  evidenceRefs: { label: string; value: string; chartId?: string }[]
  confidence: "High" | "Medium" | "Low"
  recommendedFollowUp: string[]
  sectionKey: string
}

// ─── Full Supplier Profile (Internal + External) ────────────────────────────

export interface SupplierContact {
  name: string
  title: string
  email: string
  phone?: string
}

export interface SpendConcentrationRow {
  skuOrService: string
  pctOfTotal: number
  volume?: string
}

export interface InternalRiskSnapshot {
  riskScore: number                   // 0-100
  rag: "green" | "yellow" | "red"
  topRisks: string[]
  mitigationStatus: string
  nextMilestoneDate: string
  opportunities?: string[]
}

export interface PerformanceGovernance {
  lastQbrDate: string
  qbrRating: number                   // 1-5
  slaComplianceLq: number             // last quarter %
  slaComplianceT12: number            // trailing 12 months %
  otdPct: number
  leadTimeScore: string
  qualityMetricLabel: string
  qualityMetricValue: string
  returnsClaimsRate: string
  issueResolutionDays: number
  openIncidents: number
  incidentAging: string
  reportingQualityScore: string
  dataTimeliness: string
  complianceSecurityScore: string
  openActionItems: number
  capaStatus: "On track" | "At risk" | "Off track"
}

export interface CommercialRelationship {
  totalAnnualSpend: number
  spendTrendYoY: number
  spendTrendArrow: "up" | "down" | "flat"
  contractType: string
  commercialModel: string
  contractStart: string
  renewalDate: string
  terminationNoticeDays: number
  relationshipYears: number
  businessCriticality: "High" | "Medium" | "Low"
  sourcingStatus: "Sole" | "Single" | "Multi"
  rebateFeesSummary: string
  priceIndexClause: boolean
  priceIndexNote?: string
  paymentTerms: string
  invoiceAccuracy: number
}

export interface ExternalFinancials {
  annualRevenue: number | null
  operatingMargin: number | null
  creditRating: string
  ownershipType: string
  hqLocation: string
  employees?: string
  diversityStatus: boolean
  tier2Reporting: boolean
  sbtiCertified: boolean
  certifications: string[]
}

export interface ExternalFootprint {
  regions: string[]
  countries: number
  locations: number
  keyRegions: string[]
  industries: string[]
}

export interface ExternalNews {
  date: string
  headline: string
}

export interface SupplierProfileFull {
  supplierId: string
  // Header
  supplierName: string
  supplierType: string
  tier: string
  category: string
  regionsServed: string[]
  strategicFlags: string[]
  primaryContact: SupplierContact
  accountOwner: SupplierContact
  // TOP HALF: Internal
  commercial: CommercialRelationship
  performance: PerformanceGovernance
  spendConcentration: {
    topSkus: SpendConcentrationRow[]
    topBusSites: string[]
    categoryTags: string[]
  }
  internalRisk: InternalRiskSnapshot
  // BOTTOM HALF: External
  externalFinancials: ExternalFinancials
  externalFootprint: ExternalFootprint
  keyProducts: string[]
  customers: string[]
  businessGoals: string[]
  recentNews: ExternalNews[]
  majorExternalRisks: string[]
}

// ─── Mock Full Supplier Profiles ────────────────────────────────────────────

export const supplierProfilesFull: Record<string, SupplierProfileFull> = {
  "ns-1": {
    supplierId: "ns-1",
    supplierName: "Alpha Plastics",
    supplierType: "Manufacturer",
    tier: "Tier 2",
    category: "Injection Molding",
    regionsServed: ["North America", "LATAM"],
    strategicFlags: ["Preferred", "EV-ready"],
    primaryContact: { name: "Mark Jensen", title: "VP Sales", email: "m.jensen@alphaplastics.com", phone: "+1 555-0142" },
    accountOwner: { name: "Sarah Chen", title: "Category Manager", email: "s.chen@company.com" },
    commercial: {
      totalAnnualSpend: 1_200_000,
      spendTrendYoY: 5.2,
      spendTrendArrow: "up",
      contractType: "MSA + PO",
      commercialModel: "Volume rebates (2% at $1M+)",
      contractStart: "2022-Q1",
      renewalDate: "2026-Q3",
      terminationNoticeDays: 90,
      relationshipYears: 4,
      businessCriticality: "Medium",
      sourcingStatus: "Multi",
      rebateFeesSummary: "2% annual rebate above $1M threshold",
      priceIndexClause: false,
      paymentTerms: "Net 30",
      invoiceAccuracy: 94,
    },
    performance: {
      lastQbrDate: "2026-01-15",
      qbrRating: 3.2,
      slaComplianceLq: 91,
      slaComplianceT12: 90,
      otdPct: 91,
      leadTimeScore: "18 days avg (target: 14)",
      qualityMetricLabel: "Reject Rate",
      qualityMetricValue: "1.8% (target: 1.5%)",
      returnsClaimsRate: "0.9%",
      issueResolutionDays: 12,
      openIncidents: 3,
      incidentAging: "1 > 30 days",
      reportingQualityScore: "B (adequate)",
      dataTimeliness: "Monthly, 5-day lag",
      complianceSecurityScore: "Pass",
      openActionItems: 5,
      capaStatus: "At risk",
    },
    spendConcentration: {
      topSkus: [
        { skuOrService: "Enclosure Shell A", pctOfTotal: 32, volume: "420K units" },
        { skuOrService: "Connector Housing B", pctOfTotal: 25, volume: "310K units" },
        { skuOrService: "Battery Cover C", pctOfTotal: 18, volume: "225K units" },
        { skuOrService: "Sensor Bracket D", pctOfTotal: 15, volume: "180K units" },
        { skuOrService: "Custom Insert E", pctOfTotal: 10, volume: "120K units" },
      ],
      topBusSites: ["EV Division - Detroit", "Consumer - Austin", "Industrial - Charlotte"],
      categoryTags: ["Injection Molding", "Custom Inserts", "Assembly"],
    },
    internalRisk: {
      riskScore: 52,
      rag: "yellow",
      topRisks: [
        "Lead time volatility (18 days avg vs 14-day target)",
        "Single tooling source for Enclosure Shell A",
        "Reject rate trending above SLA threshold",
      ],
      mitigationStatus: "Dual-source qualification underway for Shell A; QIP submitted",
      nextMilestoneDate: "2026-Q2",
      opportunities: [
        "VA/VE on Connector Housing B: est. $45K annual savings",
        "Consolidate 3 POs into blanket order for admin cost reduction",
        "Negotiate index clause tied to PP resin to cap raw material risk",
      ],
    },
    externalFinancials: {
      annualRevenue: 48_200_000,
      operatingMargin: 14.0,
      creditRating: "BB+ (S&P equivalent)",
      ownershipType: "Private (family-owned)",
      hqLocation: "Grand Rapids, MI, USA",
      employees: "~280",
      diversityStatus: false,
      tier2Reporting: false,
      sbtiCertified: false,
      certifications: ["ISO 9001:2015", "IATF 16949 (pending)"],
    },
    externalFootprint: {
      regions: ["North America", "Latin America"],
      countries: 2,
      locations: 3,
      keyRegions: ["Midwest US (HQ + primary plant)", "Southeast US (acquired facility)", "Monterrey MX (JV)"],
      industries: ["Automotive", "Consumer Electronics", "Industrial"],
    },
    keyProducts: [
      "Custom injection-molded enclosures (PP, ABS, PC)",
      "Insert-molded assemblies for EV battery packs",
      "Precision connector housings (tight tolerance)",
      "Multi-cavity high-volume production (up to 64-cav)",
      "In-house tool design & secondary ops (pad printing, heat staking)",
    ],
    customers: ["Mid-tier automotive OEMs", "Consumer electronics brands", "Industrial equipment manufacturers"],
    businessGoals: [
      "Achieve IATF 16949 certification by Q4 2026",
      "Expand Southeast US capacity by 15% (SmallMold integration)",
      "Invest in automation to reduce labor cost by 10%",
      "Enter medical device molding market by 2027",
      "Obtain SBTi commitment by end of 2026",
    ],
    recentNews: [
      { date: "Jun 2025", headline: "Acquired SmallMold Inc. for $8M to expand Southeast US footprint" },
      { date: "Sep 2025", headline: "Broke ground on new production line at acquired facility" },
      { date: "Jan 2026", headline: "Named preferred supplier by a major EV startup (undisclosed)" },
    ],
    majorExternalRisks: [
      "Financial: Private company with limited financial transparency; BB+ credit risk",
      "Geopolitical: Monterrey JV exposed to US-Mexico trade policy changes",
      "Regulatory: IATF 16949 not yet achieved; limits automotive tier-1 qualification",
      "Labor: Tight labor market in Grand Rapids; 12% annual turnover",
      "ESG: No SBTi commitment; limited sustainability reporting; potential customer audit risk",
    ],
  },
  "ns-2": {
    supplierId: "ns-2",
    supplierName: "Beta MicroFab",
    supplierType: "Manufacturer (Fab)",
    tier: "Tier 1",
    category: "Semiconductor Components",
    regionsServed: ["APAC", "North America", "EMEA"],
    strategicFlags: ["Strategic", "Innovation", "Sole-source"],
    primaryContact: { name: "Wei-Lin Chou", title: "Global Account Director", email: "wl.chou@betamicrofab.com", phone: "+886 2-5550-0188" },
    accountOwner: { name: "James Liu", title: "Senior Category Manager", email: "j.liu@company.com" },
    commercial: {
      totalAnnualSpend: 4_800_000,
      spendTrendYoY: 10.5,
      spendTrendArrow: "up",
      contractType: "LTA (Long-Term Agreement)",
      commercialModel: "Tiered pricing + technology access fee",
      contractStart: "2024-Q1",
      renewalDate: "2027-Q1",
      terminationNoticeDays: 180,
      relationshipYears: 6,
      businessCriticality: "High",
      sourcingStatus: "Sole",
      rebateFeesSummary: "No rebates; annual technology access fee of $120K",
      priceIndexClause: true,
      priceIndexNote: "Tied to WSTS semiconductor price index, semi-annual review",
      paymentTerms: "Net 45",
      invoiceAccuracy: 98,
    },
    performance: {
      lastQbrDate: "2025-12-10",
      qbrRating: 4.5,
      slaComplianceLq: 97,
      slaComplianceT12: 96,
      otdPct: 97,
      leadTimeScore: "22 wk avg (target: 20 wk)",
      qualityMetricLabel: "PPM Defect",
      qualityMetricValue: "420 ppm (target: 500)",
      returnsClaimsRate: "0.03%",
      issueResolutionDays: 5,
      openIncidents: 1,
      incidentAging: "None > 14 days",
      reportingQualityScore: "A (excellent)",
      dataTimeliness: "Weekly, real-time portal",
      complianceSecurityScore: "Pass (ISO 27001)",
      openActionItems: 2,
      capaStatus: "On track",
    },
    spendConcentration: {
      topSkus: [
        { skuOrService: "MEMS Pressure Sensor X1", pctOfTotal: 42, volume: "850K units" },
        { skuOrService: "MEMS Accel. Sensor X2", pctOfTotal: 28, volume: "560K units" },
        { skuOrService: "ASIC Controller IC", pctOfTotal: 15, volume: "300K units" },
        { skuOrService: "RF Front-End Module", pctOfTotal: 10, volume: "200K units" },
        { skuOrService: "Custom Die (NRE)", pctOfTotal: 5 },
      ],
      topBusSites: ["Automotive Safety BU - Munich", "Consumer IoT BU - San Jose", "Industrial Sensing - Tokyo"],
      categoryTags: ["MEMS Sensors", "ASICs", "RF Modules", "Custom Silicon"],
    },
    internalRisk: {
      riskScore: 68,
      rag: "yellow",
      topRisks: [
        "Sole-source dependency on safety-critical MEMS sensor (no qualified alternate)",
        "Lead time at 22 weeks constrains NPI agility",
        "Geopolitical exposure: Taiwan Strait tensions could disrupt supply",
      ],
      mitigationStatus: "Dual-source qualification started with Zeta Electronics (18-month timeline)",
      nextMilestoneDate: "2027-Q2",
      opportunities: [
        "Joint next-gen sensor development for 2028 platform",
        "Volume commitment in exchange for Fab 4 capacity allocation",
        "Index-linked pricing to protect against DRAM/Logic cost swings",
      ],
    },
    externalFinancials: {
      annualRevenue: 4_490_000_000,
      operatingMargin: 25.0,
      creditRating: "A- (S&P)",
      ownershipType: "Public (TWSE-listed)",
      hqLocation: "Hsinchu, Taiwan",
      employees: "~12,500",
      diversityStatus: true,
      tier2Reporting: true,
      sbtiCertified: true,
      certifications: ["ISO 9001", "IATF 16949", "ISO 14001", "ISO 27001", "ISO 45001"],
    },
    externalFootprint: {
      regions: ["Asia-Pacific", "North America", "Europe"],
      countries: 8,
      locations: 12,
      keyRegions: ["Hsinchu, Taiwan (HQ + Fab 1-3)", "Tainan, Taiwan (Fab 4 under construction)", "Dresden, Germany (design center)", "Austin, TX (applications lab)"],
      industries: ["Automotive", "Consumer IoT", "Industrial", "Medical", "Aerospace"],
    },
    keyProducts: [
      "MEMS pressure and inertial sensors (automotive-grade)",
      "Custom ASIC controllers for sensor fusion",
      "RF front-end modules (sub-6GHz + mmWave)",
      "Photonics-integrated circuits (new, via acquisition)",
      "Full-turnkey sensor packaging and test",
      "NRE custom die design services",
    ],
    customers: ["Global automotive tier-1s", "Major consumer electronics OEMs", "Industrial automation leaders", "Aerospace & defense primes"],
    businessGoals: [
      "Commission Fab 4 by Q3 2026 (+30% capacity)",
      "Grow photonics revenue to 15% of total by 2028",
      "Achieve carbon neutrality in operations by 2030",
      "Expand medical-grade sensor portfolio",
      "Deepen strategic partnerships with top 10 accounts",
    ],
    recentNews: [
      { date: "Mar 2025", headline: "Acquired Advanced Photonics Division for $280M" },
      { date: "Aug 2025", headline: "Appointed former TSMC VP of Operations as new COO" },
      { date: "Dec 2025", headline: "Fab 4 construction on track; first silicon expected Q3 2026" },
      { date: "Jan 2026", headline: "Announced partnership with major EU automaker for next-gen ADAS sensors" },
    ],
    majorExternalRisks: [
      "Geopolitical: Taiwan Strait tensions; potential supply disruption in conflict scenario",
      "Regulatory: US EAR compliance under review due to export control policy changes",
      "Financial: Significant capex for Fab 4 ($1.2B); execution risk on ROI timeline",
      "Cyber: High-value IP target; prior industry attacks on semiconductor fabs",
      "Labor: Intense competition for semiconductor talent in Taiwan and Germany",
      "ESG: Water usage in fab operations under scrutiny from local environmental groups",
    ],
  },
}

// ─── Mock Supplier Revenue & Customer Share ─────────────────────────────────

export const supplierRevenueData: Record<string, SupplierRevenueData> = {
  "ns-1": {
    supplierId: "ns-1",
    revenueDataAvailable: true,
    lastUpdated: "2026-02-01",
    revenueSeries: [
      { year: 2022, revenue: 42_000_000, source: "D&B + Public Filings", confidence: 82 },
      { year: 2023, revenue: 45_000_000, source: "D&B + Public Filings", confidence: 85 },
      { year: 2024, revenue: 46_500_000, source: "D&B + Public Filings", confidence: 88 },
      { year: 2025, revenue: 48_200_000, source: "D&B + Public Filings", confidence: 85 },
      { year: 2026, revenue: 49_000_000, source: "D&B Estimate", confidence: 72 },
    ],
    customerShareSeries: [
      { year: 2022, spend: 980_000, supplierRevenue: 42_000_000, sharePct: 2.33, confidence: 82 },
      { year: 2023, spend: 1_050_000, supplierRevenue: 45_000_000, sharePct: 2.33, confidence: 85 },
      { year: 2024, spend: 1_120_000, supplierRevenue: 46_500_000, sharePct: 2.41, confidence: 88 },
      { year: 2025, spend: 1_180_000, supplierRevenue: 48_200_000, sharePct: 2.45, confidence: 85 },
      { year: 2026, spend: 1_200_000, supplierRevenue: 49_000_000, sharePct: 2.45, confidence: 72 },
    ],
  },
  "ns-2": {
    supplierId: "ns-2",
    revenueDataAvailable: true,
    dataProxy: "Estimated from industry reports + partial filings",
    lastUpdated: "2026-01-15",
    revenueSeries: [
      { year: 2022, revenue: 3_140_000_000, source: "WSTS + Annual Report", confidence: 78 },
      { year: 2023, revenue: 3_510_000_000, source: "WSTS + Annual Report", confidence: 80 },
      { year: 2024, revenue: 3_930_000_000, source: "WSTS + Annual Report", confidence: 82 },
      { year: 2025, revenue: 4_490_000_000, source: "WSTS + Estimate", confidence: 75 },
      { year: 2026, revenue: 4_800_000_000, source: "Estimate", confidence: 65 },
    ],
    customerShareSeries: [
      { year: 2022, spend: 3_600_000, supplierRevenue: 3_140_000_000, sharePct: 0.11, confidence: 78 },
      { year: 2023, spend: 3_900_000, supplierRevenue: 3_510_000_000, sharePct: 0.11, confidence: 80 },
      { year: 2024, spend: 4_300_000, supplierRevenue: 3_930_000_000, sharePct: 0.11, confidence: 82 },
      { year: 2025, spend: 4_600_000, supplierRevenue: 4_490_000_000, sharePct: 0.10, confidence: 75 },
      { year: 2026, spend: 4_800_000, supplierRevenue: 4_800_000_000, sharePct: 0.10, confidence: 65 },
    ],
  },
}

// ─── Mock Supplier Profiles ─────────────────────────────────────────────────

export const supplierProfiles: Record<string, SupplierProfile> = {
  "ns-1": {
    supplierId: "ns-1",
    financialHealth: {
      data: {
        revenue: 48_200_000,
        revenueYoY: 3.7,
        ebitda: 6_748_000,
        ebitdaMargin: 14.0,
        ebitdaMarginTrend: [
          { year: 2022, margin: 12.8 },
          { year: 2023, margin: 13.2 },
          { year: 2024, margin: 13.6 },
          { year: 2025, margin: 14.0 },
        ],
        liquidityRatio: 1.8,
        debtToEquity: 0.45,
        creditRiskScore: 22,
        redFlags: [],
        distressSignals: [],
      },
      sources: ["D&B", "Public Filings", "Credit Bureau"],
      lastUpdated: "2026-01-20",
      confidence: 82,
    },
    mnaActivity: {
      data: [
        {
          id: "mna-1",
          type: "acquisition",
          title: "Acquired SmallMold Inc.",
          date: "2025-06-15",
          description: "Acquired a small regional molder to expand footprint in Southeast US. Deal valued at $8M.",
          implications: "Expanded capacity by ~15%. May reduce lead times for Southeast customers.",
        },
      ],
      sources: ["Press Release", "Crunchbase"],
      lastUpdated: "2025-06-20",
      confidence: 90,
    },
    regulatory: {
      data: [
        { id: "reg-1", type: "iso", title: "ISO 9001:2015", status: "compliant", description: "Quality management system certified. Last audit: Oct 2025.", lastChecked: "2025-10-15" },
        { id: "reg-2", type: "environmental", title: "EPA Air Permit", status: "compliant", description: "Air emissions permit in compliance. Minor VOC exceedance noted in 2024 (resolved).", lastChecked: "2025-08-01" },
      ],
      sources: ["ISO Registry", "EPA ECHO Database"],
      lastUpdated: "2025-10-15",
      confidence: 88,
    },
    qualityReputation: {
      data: {
        metrics: [
          { period: "Q1 2025", otd: 90, ppmDefect: 1800, complaintRate: 1.8, otdTarget: 95, ppmTarget: 1500 },
          { period: "Q2 2025", otd: 91, ppmDefect: 1700, complaintRate: 1.6, otdTarget: 95, ppmTarget: 1500 },
          { period: "Q3 2025", otd: 92, ppmDefect: 1650, complaintRate: 1.5, otdTarget: 95, ppmTarget: 1500 },
          { period: "Q4 2025", otd: 91, ppmDefect: 1800, complaintRate: 1.8, otdTarget: 95, ppmTarget: 1500 },
        ],
        externalSignals: ["2 customer complaints reported on industry forums in H2 2025", "No product recalls in last 3 years"],
      },
      sources: ["Internal QMS", "Industry Forums"],
      lastUpdated: "2026-01-15",
      confidence: 90,
    },
    capacitySignals: {
      data: [
        { id: "cap-1", type: "expansion", title: "Southeast US Facility Expansion", description: "New production line at acquired SmallMold facility. Expected +15% capacity by Q4 2026.", date: "2025-09-01", implications: "Supplier will have excess capacity. May be willing to absorb additional volume for favorable terms." },
        { id: "cap-2", type: "utilization", title: "Current Utilization ~72%", description: "Operating below industry average of 85%. Significant spare capacity available.", date: "2026-01-01", implications: "Low utilization supports buyer leverage. Supplier needs volume fill." },
      ],
      sources: ["Supplier Visit Notes", "Industry Reports"],
      lastUpdated: "2026-01-01",
      confidence: 75,
    },
  },
  "ns-2": {
    supplierId: "ns-2",
    financialHealth: {
      data: {
        revenue: 4_490_000_000,
        revenueYoY: 14.2,
        ebitda: 1_122_500_000,
        ebitdaMargin: 25.0,
        ebitdaMarginTrend: [
          { year: 2022, margin: 22.0 },
          { year: 2023, margin: 23.5 },
          { year: 2024, margin: 24.2 },
          { year: 2025, margin: 25.0 },
        ],
        liquidityRatio: 2.4,
        debtToEquity: 0.3,
        creditRiskScore: 12,
        redFlags: [],
        distressSignals: [],
      },
      sources: ["Annual Report", "WSTS", "Credit Rating Agency"],
      lastUpdated: "2026-01-10",
      confidence: 78,
    },
    mnaActivity: {
      data: [
        {
          id: "mna-b1",
          type: "acquisition",
          title: "Acquired Advanced Photonics Division",
          date: "2025-03-01",
          description: "Strategic acquisition to expand into photonics-integrated circuits. Deal valued at $280M.",
          implications: "Signals move into high-growth photonics market. May deprioritize commodity MEMS lines.",
        },
        {
          id: "mna-b2",
          type: "leadership-change",
          title: "New COO Appointed",
          date: "2025-08-01",
          description: "Former TSMC VP of Operations appointed as COO. Focus on operational efficiency.",
          implications: "New leadership may push for higher margins and operational streamlining.",
        },
      ],
      sources: ["Press Release", "SEC Filings"],
      lastUpdated: "2025-08-15",
      confidence: 85,
    },
    regulatory: {
      data: [
        { id: "reg-b1", type: "iso", title: "ISO 9001:2015 + IATF 16949", status: "compliant", description: "Automotive quality certified. Clean audit history.", lastChecked: "2025-11-01" },
        { id: "reg-b2", type: "export-control", title: "US EAR Compliance", status: "under-review", description: "Export Administration Regulations review due to Taiwan Strait policy changes. No current restrictions.", lastChecked: "2026-01-05" },
        { id: "reg-b3", type: "environmental", title: "RoHS/REACH Compliance", status: "compliant", description: "Full compliance with EU RoHS and REACH directives.", lastChecked: "2025-09-01" },
      ],
      sources: ["ISO Registry", "BIS Export Control Database", "EU REACH Registry"],
      lastUpdated: "2026-01-05",
      confidence: 80,
    },
    qualityReputation: {
      data: {
        metrics: [
          { period: "Q1 2025", otd: 96, ppmDefect: 450, complaintRate: 0.5, otdTarget: 98, ppmTarget: 500 },
          { period: "Q2 2025", otd: 97, ppmDefect: 420, complaintRate: 0.4, otdTarget: 98, ppmTarget: 500 },
          { period: "Q3 2025", otd: 96, ppmDefect: 480, complaintRate: 0.5, otdTarget: 98, ppmTarget: 500 },
          { period: "Q4 2025", otd: 97, ppmDefect: 400, complaintRate: 0.3, otdTarget: 98, ppmTarget: 500 },
        ],
        externalSignals: ["Rated 'Excellent' by 3 major OEM customers", "Zero product recalls"],
      },
      sources: ["Internal QMS", "Customer Scorecards", "Industry Awards"],
      lastUpdated: "2026-01-15",
      confidence: 88,
    },
    capacitySignals: {
      data: [
        { id: "cap-b1", type: "expansion", title: "Fab 4 Under Construction", description: "New fabrication facility on track for Q3 2026. Adds ~30% capacity. <60% pre-committed.", date: "2025-12-01", implications: "Significant capacity coming online. Pre-commitment rate suggests room for volume negotiation." },
        { id: "cap-b2", type: "utilization", title: "Current Utilization ~88%", description: "Operating near capacity. Priority allocation going to high-margin products.", date: "2026-01-01", implications: "Tight capacity now, but Fab 4 will ease constraints. Use commitment lever tied to new capacity allocation." },
      ],
      sources: ["Public Filings", "Industry Intel", "Supplier Visit"],
      lastUpdated: "2026-01-01",
      confidence: 78,
    },
  },
}

// ─── Supplier Profile AI Insights ───────────────────────────────────────────

export function getSupplierProfileInsights(supplierId: string): AiInsightCard[] {
  const profile = supplierProfiles[supplierId]
  if (!profile) return []

  const insights: AiInsightCard[] = []
  const fh = profile.financialHealth.data

  // Financial Health insights
  if (fh) {
    const marginTrend = fh.ebitdaMarginTrend
    const isExpanding = marginTrend.length >= 2 && marginTrend[marginTrend.length - 1].margin > marginTrend[0].margin
    insights.push({
      id: `ai-fh-${supplierId}`,
      title: "Financial Health Assessment",
      summary: fh.creditRiskScore <= 25
        ? `${supplierId === "ns-1" ? "Alpha Plastics" : "Beta MicroFab"} shows strong financial health with a low credit risk score (${fh.creditRiskScore}/100). ${isExpanding ? "Margins are expanding, suggesting pricing power." : "Margins are stable."} No distress signals detected. ${fh.liquidityRatio && fh.liquidityRatio > 1.5 ? "Adequate liquidity reserves." : "Watch liquidity levels."}`
        : `Elevated credit risk (${fh.creditRiskScore}/100). Monitor closely for supply continuity risks.`,
      evidenceRefs: [
        { label: "Revenue", value: `$${((fh.revenue ?? 0) / 1_000_000).toFixed(0)}M` },
        { label: "EBITDA Margin", value: `${fh.ebitdaMargin}%` },
        { label: "Credit Risk", value: `${fh.creditRiskScore}/100` },
      ],
      confidence: profile.financialHealth.confidence >= 80 ? "High" : profile.financialHealth.confidence >= 60 ? "Medium" : "Low",
      recommendedFollowUp: [
        "Request latest audited financials from supplier",
        "Validate credit risk score with independent assessment",
      ],
      sectionKey: "financial-health",
    })
  }

  // M&A insights
  if (profile.mnaActivity.data && profile.mnaActivity.data.length > 0) {
    insights.push({
      id: `ai-mna-${supplierId}`,
      title: "M&A Risk/Opportunity Assessment",
      summary: profile.mnaActivity.data.map((m) => m.implications).join(" ") + " Consider how these changes may affect pricing stability and operational focus.",
      evidenceRefs: profile.mnaActivity.data.map((m) => ({ label: m.type, value: m.title })),
      confidence: profile.mnaActivity.confidence >= 80 ? "High" : "Medium",
      recommendedFollowUp: [
        "Discuss integration timeline with supplier during next business review",
        "Assess impact on your specific product lines",
      ],
      sectionKey: "mna-activity",
    })
  }

  // Regulatory insights
  const regData = profile.regulatory.data
  if (regData && regData.length > 0) {
    const hasWarning = regData.some((r) => r.status !== "compliant")
    insights.push({
      id: `ai-reg-${supplierId}`,
      title: "Regulatory & Compliance Summary",
      summary: hasWarning
        ? `Compliance flags detected: ${regData.filter((r) => r.status !== "compliant").map((r) => `${r.title} (${r.status})`).join(", ")}. Include audit rights and compliance warranty clauses in the next contract.`
        : "All regulatory checks are compliant. No immediate compliance risks to negotiation. Standard compliance clauses recommended.",
      evidenceRefs: regData.map((r) => ({ label: r.type.toUpperCase(), value: `${r.title}: ${r.status}` })),
      confidence: profile.regulatory.confidence >= 80 ? "High" : "Medium",
      recommendedFollowUp: hasWarning
        ? ["Request detailed compliance report from supplier", "Add audit rights clause to contract"]
        : ["Maintain standard compliance clauses"],
      sectionKey: "regulatory",
    })
  }

  // Quality insights
  const qd = profile.qualityReputation.data
  if (qd && qd.metrics.length > 0) {
    const latestMetric = qd.metrics[qd.metrics.length - 1]
    const otdGap = latestMetric.otdTarget - latestMetric.otd
    const ppmGap = latestMetric.ppmDefect - latestMetric.ppmTarget
    insights.push({
      id: `ai-qual-${supplierId}`,
      title: "Quality & Delivery Root Cause Analysis",
      summary: otdGap > 0 || ppmGap > 0
        ? `Performance gaps detected: ${otdGap > 0 ? `OTD ${latestMetric.otd}% vs ${latestMetric.otdTarget}% target (${otdGap}pt gap). ` : ""}${ppmGap > 0 ? `Defect rate ${latestMetric.ppmDefect} ppm vs ${latestMetric.ppmTarget} ppm target. ` : ""}Root causes to investigate: scheduling consistency, incoming material quality, and process capability. Use performance gaps as negotiation leverage for penalty/bonus structure.`
        : "Quality and delivery metrics are within target. Maintain current SLA structure and consider rewards for sustained performance.",
      evidenceRefs: [
        { label: "OTD", value: `${latestMetric.otd}% (target: ${latestMetric.otdTarget}%)` },
        { label: "Defects", value: `${latestMetric.ppmDefect} ppm (target: ${latestMetric.ppmTarget})` },
        { label: "Complaints", value: `${latestMetric.complaintRate}%` },
      ],
      confidence: "High",
      recommendedFollowUp: [
        "What is driving the OTD gap -- scheduling or material issues?",
        "Can you share your corrective action plan for defect reduction?",
        "What investments are you making in process capability?",
      ],
      sectionKey: "quality-reputation",
    })
  }

  // Capacity insights
  if (profile.capacitySignals.data && profile.capacitySignals.data.length > 0) {
    const expansions = profile.capacitySignals.data.filter((c) => c.type === "expansion")
    const utilization = profile.capacitySignals.data.find((c) => c.type === "utilization")
    insights.push({
      id: `ai-cap-${supplierId}`,
      title: "Capacity & Market Stance",
      summary: `${expansions.length > 0 ? `${expansions.length} capacity expansion(s) noted. ` : ""}${utilization ? `Current utilization at ${utilization.description.match(/\d+/)?.[0] ?? "N/A"}%. ` : ""}${utilization && parseInt(utilization.description.match(/\d+/)?.[0] ?? "85") < 80 ? "Low utilization indicates buyer leverage -- supplier needs volume fill." : "High utilization suggests tight market. Use commitment lever tied to future capacity."}`,
      evidenceRefs: profile.capacitySignals.data.map((c) => ({ label: c.type, value: c.title })),
      confidence: profile.capacitySignals.confidence >= 75 ? "Medium" : "Low",
      recommendedFollowUp: [
        "Validate utilization figures during supplier visit",
        "Discuss capacity reservation in exchange for volume commitment",
      ],
      sectionKey: "capacity-signals",
    })
  }

  return insights
}

// ─── Customer Share AI Insight Generator ────────────────────────────────────

export function getCustomerShareInsights(supplierId: string): AiInsightCard[] {
  const revData = supplierRevenueData[supplierId]
  if (!revData || revData.customerShareSeries.length === 0) return []

  const latest = revData.customerShareSeries[revData.customerShareSeries.length - 1]
  const influence = getInfluenceBand(latest.sharePct)

  const sup = negotiationSuppliers.find((s) => s.id === supplierId)
  const supplierName = sup?.name ?? supplierId

  const bullets: string[] = []
  if (influence.band === "low") {
    bullets.push(
      `We represent ~${latest.sharePct.toFixed(2)}% of ${supplierName}'s revenue, indicating limited leverage from wallet share alone.`,
      "Prioritize competition and transparency levers rather than volume commitment.",
      "Consider bundling volume across business units to increase share visibility.",
    )
  } else if (influence.band === "medium") {
    bullets.push(
      `We represent ~${latest.sharePct.toFixed(1)}% of ${supplierName}'s revenue, indicating moderate leverage.`,
      "Prioritize commitment lever -- volume growth commitment can meaningfully impact supplier's pipeline.",
      "Use share visibility as a negotiation anchor: 'We're a meaningful customer and expect pricing that reflects it.'",
    )
  } else {
    bullets.push(
      `We represent ~${latest.sharePct.toFixed(1)}% of ${supplierName}'s revenue, indicating significant leverage.`,
      "High customer share gives strong negotiation position. Supplier cannot easily replace this revenue.",
      "Use commitment continuity as a carrot; credible volume reallocation as a stick.",
    )
  }

  return [{
    id: `ai-share-${supplierId}`,
    title: "Customer Share Negotiation Implications",
    summary: bullets.join(" "),
    evidenceRefs: [
      { label: "Customer Share", value: `${latest.sharePct.toFixed(2)}%` },
      { label: "Our Spend", value: formatCurrencyCompact(latest.spend) },
      { label: "Supplier Revenue", value: formatCurrencyCompact(latest.supplierRevenue) },
      { label: "Influence Band", value: influence.label },
    ],
    confidence: latest.confidence >= 80 ? "High" : latest.confidence >= 60 ? "Medium" : "Low",
    recommendedFollowUp: [
      "Validate supplier revenue with latest available public data",
      "Consider cross-BU volume aggregation to increase share",
    ],
    sectionKey: "customer-share",
  }]
}

// ─── Runtime Fact Pack Registry ────────────────────────────────────────────
// Allows dynamically generated fact packs to be registered and queried

const _runtimeFactPacks = new Map<string, SupplierFactPack>()

export function registerFactPack(supplierId: string, pack: SupplierFactPack) {
  _runtimeFactPacks.set(supplierId, pack)
}

export function getFactPackForSupplierRuntime(supplierId: string): SupplierFactPack | undefined {
  // Check hardcoded first, then runtime
  if (supplierId === "ns-1") return alphaFactPack
  if (supplierId === "ns-2") return betaFactPack
  return _runtimeFactPacks.get(supplierId)
}

// ─── Negotiation Plan Data Model ────────────────────────────────────────────

export type RoundPurpose = "anchor" | "pressure-test" | "close" | "discovery" | "value-create"

export interface EvidenceRef {
  factItemId: string
  chartId?: string
  metricName: string
  value: string
  timeframe?: string
  confidence: number
}

export interface PlanArgument {
  id: string
  claim: string
  ask: string
  evidenceRefs: EvidenceRef[]
  anticipatedRebuttal: string
  suggestedResponse: string
  priority: "critical" | "supporting" | "fallback"
  useInScript: boolean
  linkedLeverIds: string[]
}

export interface StartingPosition {
  dimension: string     // "Price", "Volume", "Lead Time", "Payment Terms", etc.
  anchor: string        // our opening position
  target: string        // realistic target
  laa: string           // Least Acceptable Agreement
  notes: string
}

export interface SupplierMove {
  id: string
  likelyMove: string
  probability: "high" | "medium" | "low"
  ourResponse: string
}

export interface RoundPlan {
  id: string
  roundNumber: number
  name: string
  purpose: RoundPurpose
  startingPositions: StartingPosition[]
  leverIds: string[]       // levers to use in this round
  arguments: PlanArgument[]
  supplierMoves: SupplierMove[]
  closeCriteria: string
  confidence: number       // 0-100
  prerequisites: string[]
  internalNotes: string
  status: "planned" | "active" | "completed"
}

export interface GiveGetItem {
  id: string
  give: string          // what we concede
  get: string           // what we require in exchange
  condition: string     // trigger / condition
  roundId: string       // which round
  valueEstimate: string // e.g., "$50K" or "2% margin"
  notes: string
  createdBy: string
  createdAt: string
}

export interface PlanRisk {
  id: string
  description: string
  severity: "high" | "medium" | "low"
  mitigation: string
}

export interface NegotiationPlan {
  id: string
  version: number
  createdAt: string
  supplierId: string
  supplierName: string
  status: "draft" | "active" | "locked" | "outdated"
  assumptions: string[]
  rationale: string        // why this # of rounds and sequencing
  rounds: RoundPlan[]
  giveGets: GiveGetItem[]
  risks: PlanRisk[]
  openQuestions: string[]
  dataGaps: string[]
  lastUpstreamChange?: string // timestamp of last fact-base / lever / objective change
}

export interface NegotiationPlanSet {
  plans: NegotiationPlan[]    // one per supplier (or one combined)
  generatedAt: string
  inputHash: string           // to detect upstream changes
}

// ─── Round purpose labels ───────────────────────────────────────────────────

export const ROUND_PURPOSE_CONFIG: Record<RoundPurpose, { label: string; color: string; bg: string; description: string }> = {
  anchor: { label: "Anchor", color: "text-blue-700", bg: "bg-blue-50", description: "Set aggressive opening position" },
  "pressure-test": { label: "Pressure-test", color: "text-amber-700", bg: "bg-amber-50", description: "Challenge supplier with evidence" },
  close: { label: "Close", color: "text-emerald-700", bg: "bg-emerald-50", description: "Drive to final agreement" },
  discovery: { label: "Discovery", color: "text-violet-700", bg: "bg-violet-50", description: "Gather information and test positions" },
  "value-create": { label: "Value-create", color: "text-teal-700", bg: "bg-teal-50", description: "Joint value creation and trade-offs" },
}

// ─── Plan Generator ─────────────────────────────────────────────────────────

export function generateNegotiationPlan(workspace: NegotiationWorkspace): NegotiationPlanSet {
  const plans: NegotiationPlan[] = []

  for (const placement of workspace.spectrumPlacements) {
    const supplier = negotiationSuppliers.find((s) => s.id === placement.supplierId)
    if (!supplier) continue

    const supplierFacts = workspace.factSections.filter((f) => f.supplierId === placement.supplierId)
    const allFactItems = supplierFacts.flatMap((f) => f.items)
    const supplierLevers = workspace.levers.filter((l) =>
      placement.recommendedLevers.includes(l.category)
    )
    const supplierObjectives = workspace.objectives

    // Determine # of rounds based on quadrant + complexity
    const isStrategic = placement.quadrant === "strategic-critical"
    const isBottleneck = placement.quadrant === "bottleneck"
    const roundCount = isStrategic ? 3 : isBottleneck ? 3 : 2

    // Build starting positions from objectives
    const positions: StartingPosition[] = supplierObjectives.map((obj) => ({
      dimension: DOMAIN_LABELS[obj.domain],
      anchor: obj.mdo,
      target: obj.mdo,
      laa: obj.laa,
      notes: obj.rationale,
    }))

    // Build arguments from workspace.arguments linked to this supplier
    const supplierArgCards = workspace.arguments.filter((a) => {
      // If linked facts belong to this supplier, include
      const supplierFactIds = allFactItems.map((fi) => fi.id)
      return a.linkedFactIds.some((fid) => supplierFactIds.includes(fid)) ||
        a.linkedLeverIds.some((lid) => supplierLevers.map((l) => l.id).includes(lid)) ||
        workspace.supplierIds.length === 1 // single-supplier strategy = all args apply
    })

    const planArguments: PlanArgument[] = supplierArgCards.map((arg, idx) => ({
      id: `pa-${placement.supplierId}-${idx}`,
      claim: arg.claim,
      ask: arg.ask,
      evidenceRefs: arg.linkedFactIds.map((fid) => {
        const fi = allFactItems.find((f) => f.id === fid)
        return {
          factItemId: fid,
          metricName: fi?.title ?? "Unknown",
          value: fi?.dataPoints?.[0]?.value ?? "",
          confidence: fi?.confidence ?? 50,
        }
      }),
      anticipatedRebuttal: arg.rebuttal,
      suggestedResponse: `Counter with additional evidence from ${arg.linkedLeverIds.length > 0 ? "lever analysis" : "market data"}.`,
      priority: arg.strength === "strong" ? "critical" as const : arg.strength === "moderate" ? "supporting" as const : "fallback" as const,
      useInScript: arg.strength !== "weak",
      linkedLeverIds: arg.linkedLeverIds,
    }))

    // Build supplier moves
    const supplierMoves: SupplierMove[] = [
      {
        id: `sm-${placement.supplierId}-1`,
        likelyMove: isStrategic
          ? "Cite capacity constraints and IP investment to justify premium pricing"
          : "Offer minor concession (1-2%) to avoid competitive process",
        probability: "high",
        ourResponse: isStrategic
          ? "Acknowledge value but present should-cost evidence showing margin above norm"
          : "Reject token concession; present competitive quotes demonstrating market gap",
      },
      {
        id: `sm-${placement.supplierId}-2`,
        likelyMove: "Request longer contract term in exchange for price hold",
        probability: "medium",
        ourResponse: "Accept term extension only if paired with meaningful price reduction and index-linked adjustment mechanism",
      },
      {
        id: `sm-${placement.supplierId}-3`,
        likelyMove: isStrategic
          ? "Threaten to deprioritize allocation if pushed too hard on price"
          : "Claim quality or service differentiation justifies current pricing",
        probability: isStrategic ? "medium" : "low",
        ourResponse: isStrategic
          ? "Reaffirm partnership intent; pivot to joint value creation through VA/VE"
          : "Present objective quality data showing performance gaps vs. alternatives",
      },
    ]

    // Generate rounds
    const rounds: RoundPlan[] = []

    if (roundCount >= 2) {
      // Round 1: Anchor
      const r1Levers = isStrategic
        ? supplierLevers.filter((l) => l.category === "transparency" || l.category === "performance")
        : supplierLevers.filter((l) => l.category === "competition" || l.category === "commitment")
      rounds.push({
        id: `rp-${placement.supplierId}-1`,
        roundNumber: 1,
        name: isStrategic ? "R1: Present Evidence" : "R1: Competitive Anchor",
        purpose: isStrategic ? "discovery" : "anchor",
        startingPositions: positions,
        leverIds: r1Levers.map((l) => l.id),
        arguments: planArguments.filter((a) => a.priority === "critical"),
        supplierMoves: [supplierMoves[0]],
        closeCriteria: isStrategic
          ? "Supplier acknowledges cost data and agrees to joint review"
          : "Establish price gap and timeline pressure",
        confidence: 75 + Math.round(Math.random() * 15),
        prerequisites: r1Levers.flatMap((l) => l.recommendation?.prerequisites ?? []).slice(0, 3),
        internalNotes: "",
        status: "planned",
      })

      // Round 2: Pressure-test
      const r2Levers = isStrategic
        ? supplierLevers.filter((l) => l.category === "engineering" || l.category === "commitment")
        : supplierLevers.filter((l) => l.category === "transparency")
      rounds.push({
        id: `rp-${placement.supplierId}-2`,
        roundNumber: 2,
        name: isStrategic ? "R2: Joint Value Creation" : "R2: Evidence & Narrowing",
        purpose: isStrategic ? "value-create" : "pressure-test",
        startingPositions: positions.map((p) => ({
          ...p,
          notes: `Adjusted based on R1 response. ${p.notes}`,
        })),
        leverIds: r2Levers.map((l) => l.id),
        arguments: planArguments.filter((a) => a.priority !== "fallback"),
        supplierMoves: [supplierMoves[1], supplierMoves[2]],
        closeCriteria: isStrategic
          ? "Agreement on value-creation roadmap and price adjustment mechanism"
          : "Narrow gap to within LAA range; present final trade-off package",
        confidence: 65 + Math.round(Math.random() * 15),
        prerequisites: ["R1 completed", "Internal alignment on walk-away position"],
        internalNotes: "",
        status: "planned",
      })
    }

    if (roundCount >= 3) {
      // Round 3: Close
      rounds.push({
        id: `rp-${placement.supplierId}-3`,
        roundNumber: 3,
        name: "R3: Close & Formalize",
        purpose: "close",
        startingPositions: positions.map((p) => ({
          ...p,
          notes: `Final position. Walk-away: ${p.laa}`,
        })),
        leverIds: supplierLevers.map((l) => l.id),
        arguments: planArguments,
        supplierMoves,
        closeCriteria: "Sign term sheet or activate BATNA",
        confidence: 55 + Math.round(Math.random() * 20),
        prerequisites: ["R2 completed", "Finance approval for final offer", "Legal review of term sheet"],
        internalNotes: "",
        status: "planned",
      })
    }

    // Generate Give/Get items
    const giveGets: GiveGetItem[] = []
    const now = new Date().toISOString().slice(0, 10)

    if (!isStrategic) {
      giveGets.push(
        { id: `gg-${placement.supplierId}-1`, give: "2-year contract extension", get: "12-15% unit price reduction", condition: "Supplier matches market pricing", roundId: rounds[0]?.id ?? "", valueEstimate: "$150-180K/yr savings", notes: "Volume commitment paired with price step-down", createdBy: "System", createdAt: now },
        { id: `gg-${placement.supplierId}-2`, give: "+20% volume allocation", get: "Lead time reduction to 10 days", condition: "Quality targets met for 2 consecutive quarters", roundId: rounds[0]?.id ?? "", valueEstimate: "$240K additional revenue to supplier", notes: "Ties operational improvement to business reward", createdBy: "System", createdAt: now },
        { id: `gg-${placement.supplierId}-3`, give: "Payment term improvement (Net 30 to Net 15)", get: "Additional 2% price discount", condition: "Included in Round 2 package", roundId: rounds[1]?.id ?? rounds[0]?.id ?? "", valueEstimate: "~$24K/yr", notes: "Working capital trade-off", createdBy: "System", createdAt: now },
      )
    } else {
      giveGets.push(
        { id: `gg-${placement.supplierId}-1`, give: "3-year agreement with capacity reservation", get: "Price cap at CPI+1% (not CPI+5%)", condition: "Supplier agrees to index-linked formula", roundId: rounds[0]?.id ?? "", valueEstimate: "~$400K savings over 3 years", notes: "Core economic trade-off for strategic relationship", createdBy: "System", createdAt: now },
        { id: `gg-${placement.supplierId}-2`, give: "Joint NPI partnership for 2028 platform", get: "Should-cost transparency and open-book pricing", condition: "NDA and co-development terms agreed", roundId: rounds[1]?.id ?? "", valueEstimate: "8-12% next-gen savings", notes: "Long-term value creation lever", createdBy: "System", createdAt: now },
        { id: `gg-${placement.supplierId}-3`, give: "Exclusivity retention for current generation", get: "Dual-source qualification path for next-gen", condition: "Supplier supports qualification timeline", roundId: rounds[1]?.id ?? "", valueEstimate: "Risk mitigation + future leverage", notes: "De-risks supply chain without damaging relationship", createdBy: "System", createdAt: now },
        { id: `gg-${placement.supplierId}-4`, give: "Flexible payment terms (Net 60 for large orders)", get: "SLA penalty/bonus structure formalized", condition: "KPI targets agreed and measured quarterly", roundId: rounds[2]?.id ?? rounds[1]?.id ?? "", valueEstimate: "1-2% cost offset via penalties", notes: "Accountability mechanism", createdBy: "System", createdAt: now },
      )
    }

    // Risks
    const risks: PlanRisk[] = [
      {
        id: `risk-${placement.supplierId}-1`,
        description: isStrategic
          ? "Supplier may deprioritize our allocation if pricing pressure is perceived as too aggressive"
          : "Supplier may refuse to match market pricing and force a switch scenario",
        severity: "high",
        mitigation: isStrategic
          ? "Frame all asks as partnership-oriented; lead with value creation before cost asks"
          : "Ensure BATNA is fully qualified and transition-ready before Round 1",
      },
      {
        id: `risk-${placement.supplierId}-2`,
        description: "Timeline pressure if negotiation extends beyond contract expiry",
        severity: "medium",
        mitigation: "Begin negotiations 6+ months before expiry; have interim extension clause ready",
      },
    ]

    // Rationale
    const rationale = isStrategic
      ? `${roundCount} rounds recommended for strategic supplier. R1 establishes evidence base through should-cost transparency. R2 shifts to joint value creation, building on trust from R1. R3 formalizes the agreement with balanced give/get trade-offs. This sequencing avoids antagonizing a critical supplier while still achieving meaningful cost improvement.`
      : `${roundCount} rounds recommended for ${placement.quadrant === "transactional-competitive" ? "transactional" : "leverage"} supplier. R1 opens aggressively with competitive quotes to establish BATNA credibility and anchor the negotiation range. R2 narrows the gap with transparency evidence and presents the final trade-off package. Shorter cycle appropriate given supplier replaceability and market conditions.`

    plans.push({
      id: `np-${placement.supplierId}`,
      version: 1,
      createdAt: new Date().toISOString(),
      supplierId: placement.supplierId,
      supplierName: placement.supplierName,
      status: "draft",
      assumptions: [
        `${placement.supplierName} classified as ${QUADRANT_LABELS[placement.quadrant]} (confidence: ${placement.confidence}%)`,
        `${supplierLevers.length} levers selected for this supplier`,
        `${supplierObjectives.length} objectives defined across ${new Set(supplierObjectives.map((o) => o.domain)).size} dimensions`,
        `Contract expires ${supplier.contractEnd}`,
      ],
      rationale,
      rounds,
      giveGets,
      risks,
      openQuestions: [
        allFactItems.length < 4 ? "Incomplete fact base -- some evidence gaps may weaken arguments" : "",
        supplierLevers.some((l) => l.status === "not-started") ? "Some levers not yet executed -- plan confidence may improve after completion" : "",
      ].filter(Boolean),
      dataGaps: placement.missingData.length > 0 ? placement.missingData : [],
    })
  }

  return {
    plans,
    generatedAt: new Date().toISOString(),
    inputHash: `${workspace.lastModified}-${workspace.levers.length}-${workspace.objectives.length}`,
  }
}

// ─── Team & Scripts Data Model ──────────────────────────────────────────────

export type TeamRole =
  | "lead-negotiator"
  | "analyst"
  | "note-taker"
  | "technical-sme"
  | "finance"
  | "legal"
  | "executive-sponsor"
  | "other"

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  "lead-negotiator": "Lead Negotiator",
  analyst: "Analyst",
  "note-taker": "Note-taker",
  "technical-sme": "Technical / Engineering SME",
  finance: "Finance",
  legal: "Legal",
  "executive-sponsor": "Executive Sponsor",
  other: "Other",
}

export const TEAM_ROLE_COLORS: Record<TeamRole, { bg: string; text: string }> = {
  "lead-negotiator": { bg: "bg-primary/10", text: "text-primary" },
  analyst: { bg: "bg-blue-50", text: "text-blue-700" },
  "note-taker": { bg: "bg-muted", text: "text-muted-foreground" },
  "technical-sme": { bg: "bg-amber-50", text: "text-amber-700" },
  finance: { bg: "bg-emerald-50", text: "text-emerald-700" },
  legal: { bg: "bg-violet-50", text: "text-violet-700" },
  "executive-sponsor": { bg: "bg-red-50", text: "text-red-700" },
  other: { bg: "bg-muted", text: "text-muted-foreground" },
}

export interface NegotiationTeamMember {
  id: string
  name: string
  email?: string
  org?: string
  internal: boolean
  roles: TeamRole[]
  customRole?: string         // for "other" role
  participationRounds: number[] // e.g. [1,2,3] or [1] for "R1 only"
  notes?: string
}

export interface ScriptSection {
  id: string
  heading: string
  content: string
  evidenceRefs: { factId: string; label: string }[]
  leverRefs: string[]
  type: "opening" | "argument" | "question" | "rebuttal" | "transition" | "guardrail" | "capture-notes" | "closing"
}

export interface PersonRoundScript {
  id: string
  memberId: string
  memberName: string
  role: TeamRole
  roundNumber: number
  sections: ScriptSection[]
  watchOuts: string[]
  doNotConcede: string[]
}

export interface AgendaItem {
  id: string
  order: number
  title: string
  ownerMemberId: string
  ownerName: string
  ownerRole: TeamRole
  durationMinutes: number
  notes: string
}

export interface RoundGiveGetGuidance {
  canGive: string
  mustGet: string
  condition: string
}

export interface RoundScript {
  id: string
  roundNumber: number
  roundName: string
  purpose: RoundPurpose
  agenda: AgendaItem[]
  masterScript: string
  giveGetGuidance: RoundGiveGetGuidance[]
  guardrails: string[]
  personScripts: PersonRoundScript[]
}

export interface ScriptPack {
  id: string
  version: number
  status: "draft" | "locked"
  generatedAt: string
  source: "ai" | "user"
  roundScripts: RoundScript[]
}

export interface ScriptEditLogEntry {
  scriptId: string
  field: string
  before: string
  after: string
  userId: string
  timestamp: string
  reason?: string
}

// ─── Script Generation ──────────────────────────────────────────────────────

function generatePersonScript(
  member: NegotiationTeamMember,
  round: RoundPlan,
  plan: NegotiationPlan,
  workspace: NegotiationWorkspace,
  role: TeamRole,
): PersonRoundScript {
  const sections: ScriptSection[] = []
  const watchOuts: string[] = []
  const doNotConcede: string[] = []

  // Gather objectives for guardrails
  const mustHaveObjs = workspace.objectives.filter((o) => o.priority === "Must-have")
  mustHaveObjs.forEach((o) => {
    doNotConcede.push(`${DOMAIN_LABELS[o.domain]}: Do not go below LAA of ${o.laa}`)
  })

  // Role-specific script generation
  switch (role) {
    case "lead-negotiator": {
      sections.push({
        id: `s-${round.id}-${member.id}-opening`,
        heading: "Opening Statement",
        content: round.purpose === "anchor"
          ? `"Thank you for meeting today. We've done extensive analysis of our partnership and the broader market. We want to share our perspective on where we see opportunities for a stronger agreement. Let me start with our key priorities..."`
          : round.purpose === "pressure-test"
            ? `"We appreciate the dialogue from our last session. We've reviewed your counterpoints carefully and want to address them with additional data we've prepared. Let's dive into the specifics..."`
            : `"We're encouraged by the progress we've made. Today we'd like to finalize the key terms. Let me recap where we stand and what remains to close..."`,
        evidenceRefs: [],
        leverRefs: [],
        type: "opening",
      })

      // Arguments to deliver
      round.arguments.filter((a) => a.useInScript).forEach((arg, idx) => {
        sections.push({
          id: `s-${round.id}-${member.id}-arg-${idx}`,
          heading: `Argument: ${arg.claim.slice(0, 60)}...`,
          content: `Present: "${arg.claim}"\n\nAsk: "${arg.ask}"\n\nIf supplier rebuts with: "${arg.anticipatedRebuttal}"\nRespond: "${arg.suggestedResponse}"`,
          evidenceRefs: arg.evidenceRefs.map((e) => ({ factId: e.factItemId, label: e.metricName })),
          leverRefs: arg.linkedLeverIds,
          type: "argument",
        })
      })

      // Closing
      sections.push({
        id: `s-${round.id}-${member.id}-close`,
        heading: "Round Closing",
        content: `Close criteria: ${round.closeCriteria}\n\nSummarize agreements reached, confirm next steps, and set timeline for follow-up.`,
        evidenceRefs: [],
        leverRefs: [],
        type: "closing",
      })

      watchOuts.push(
        "Do not reveal BATNA specifics -- only reference existence of alternatives",
        "Watch supplier body language during pricing discussion for flexibility signals",
        "If supplier requests a break, use time to caucus with analyst on counter-offer math",
      )
      break
    }

    case "analyst": {
      sections.push({
        id: `s-${round.id}-${member.id}-data`,
        heading: "Data Points to Present",
        content: round.arguments.filter((a) => a.evidenceRefs.length > 0).map((a) =>
          `- ${a.claim.slice(0, 80)}: Supported by ${a.evidenceRefs.map((e) => `${e.metricName} (${e.value}, ${e.confidence}% conf.)`).join(", ")}`
        ).join("\n"),
        evidenceRefs: round.arguments.flatMap((a) => a.evidenceRefs.map((e) => ({ factId: e.factItemId, label: e.metricName }))),
        leverRefs: [],
        type: "argument",
      })

      // Questions to ask
      sections.push({
        id: `s-${round.id}-${member.id}-questions`,
        heading: "Probing Questions",
        content: [
          `"Can you walk us through your cost structure breakdown for this category?"`,
          `"How does your pricing compare to the indices we've been tracking?"`,
          `"What specific investments justify the proposed increase vs. market benchmarks?"`,
          round.purpose === "anchor"
            ? `"We've benchmarked ${round.startingPositions.length} dimensions -- can you help us understand where you see the gap?"`
            : `"Based on our last discussion, what constraints prevent you from reaching our target?"`,
        ].join("\n\n"),
        evidenceRefs: [],
        leverRefs: [],
        type: "question",
      })

      watchOuts.push(
        "Have backup data slides ready if supplier challenges specific benchmarks",
        "Take note of any new data points the supplier shares -- validate post-meeting",
      )
      break
    }

    case "note-taker": {
      sections.push({
        id: `s-${round.id}-${member.id}-capture`,
        heading: "Items to Capture",
        content: [
          "DECISIONS LOG:",
          "- Record every verbal agreement/concession with timestamp",
          "- Note who made each commitment (name + role)",
          "",
          "OFFER TRACKING:",
          ...round.startingPositions.map((p) => `- ${p.dimension}: Our position [ ], Their counter [ ], Gap [ ]`),
          "",
          "FOLLOW-UPS:",
          "- Action item | Owner | Due date",
          "",
          "OBSERVATIONS:",
          "- Supplier tone/body language shifts",
          "- Topics supplier avoids or redirects",
          "- New information revealed (validate later)",
        ].join("\n"),
        evidenceRefs: [],
        leverRefs: [],
        type: "capture-notes",
      })

      watchOuts.push(
        "Capture exact wording of any price/term commitments",
        "Flag if supplier makes claims contradicting our fact base",
      )
      break
    }

    case "technical-sme": {
      sections.push({
        id: `s-${round.id}-${member.id}-tech`,
        heading: "Technical Points",
        content: [
          "SPECIFICATION FEASIBILITY:",
          "- Be ready to confirm/deny any technical claims from supplier",
          "- Validate qualification timelines if dual-source discussed",
          "",
          "ENGINEERING VALUE:",
          "- Present VA/VE opportunities if applicable",
          "- Quantify specification relaxation trade-offs if price concession needed",
          "",
          "QUESTIONS TO ASK:",
          `"What is your current yield rate on our specifications?"`,
          `"Can you share your process capability indices (Cpk) for critical dimensions?"`,
          `"What engineering changes would reduce your cost without impacting our requirements?"`,
        ].join("\n"),
        evidenceRefs: [],
        leverRefs: [],
        type: "argument",
      })

      watchOuts.push(
        "Do not agree to specification changes without engineering review",
        "If supplier proposes material substitutions, note for post-meeting analysis",
      )
      break
    }

    case "finance": {
      const paymentObj = workspace.objectives.find((o) => o.domain === "contract-terms")
      sections.push({
        id: `s-${round.id}-${member.id}-fin`,
        heading: "Financial / Terms Analysis",
        content: [
          "WORKING CAPITAL IMPACT:",
          paymentObj
            ? `- Current terms: ${paymentObj.laa} | Target: ${paymentObj.mdo} | Anchor: ${paymentObj.anchor ?? "N/A"}`
            : "- Assess payment terms trade-off value",
          "",
          "TOTAL COST MODELING:",
          "- Be ready to present total cost of ownership if supplier focuses on unit price only",
          "- Quantify logistics, quality cost, and inventory carrying cost differences",
          "",
          "REBATE / INCENTIVE STRUCTURES:",
          "- Evaluate any volume rebate proposals against projected volumes",
          "- Model multi-year commitment value vs. flexibility cost",
        ].join("\n"),
        evidenceRefs: [],
        leverRefs: [],
        type: "argument",
      })

      watchOuts.push(
        "Do not commit to volume projections without checking demand plan",
        "Validate supplier's margin claims against should-cost model",
      )
      break
    }

    case "legal": {
      sections.push({
        id: `s-${round.id}-${member.id}-legal`,
        heading: "Legal / Clause Positions",
        content: [
          "CONTRACT CLAUSE PRIORITIES:",
          "- Liability cap: Maintain existing cap or negotiate higher",
          "- Termination for convenience: Ensure 60-day notice minimum",
          "- IP ownership: Confirm all tooling/molds remain our property",
          "- Force majeure: Tighten definition and notice requirements",
          "",
          "RISK FLAGS TO WATCH:",
          "- Any attempt to limit warranty scope",
          "- Changes to dispute resolution mechanism",
          "- Indemnification language changes",
          "",
          "AUDIT RIGHTS:",
          "- Maintain right to audit supplier costs and compliance",
          "- Include sustainability/ESG compliance clause",
        ].join("\n"),
        evidenceRefs: [],
        leverRefs: [],
        type: "argument",
      })

      watchOuts.push(
        "Do not verbally agree to any clause modifications -- all changes in writing",
        "Flag any new regulatory requirements that affect contract structure",
      )
      break
    }

    case "executive-sponsor": {
      sections.push({
        id: `s-${round.id}-${member.id}-exec`,
        heading: "Executive Talking Points",
        content: [
          "STRATEGIC FRAMING:",
          `"We value this partnership and see opportunities for mutual growth. Our team has done thorough analysis and I fully support the positions they've presented."`,
          "",
          "ESCALATION LEVER:",
          "- Your presence signals importance of this negotiation",
          "- Can authorize final concessions within pre-agreed MDO range",
          "- Reference broader business relationship and portfolio opportunities",
          "",
          "WHEN TO INTERVENE:",
          "- If conversation stalls at a critical impasse",
          "- To reinforce strategic importance of key terms",
          "- To make final commitment/decision on package deal",
        ].join("\n"),
        evidenceRefs: [],
        leverRefs: [],
        type: "argument",
      })

      watchOuts.push(
        "Do not override team positions without sidebar discussion",
        "Avoid making commitments the team hasn't agreed to pre-meeting",
      )
      break
    }

    default: {
      sections.push({
        id: `s-${round.id}-${member.id}-general`,
        heading: "General Responsibilities",
        content: `Support the team as needed. ${member.customRole ? `Focus area: ${member.customRole}` : ""}. Observe and contribute where your expertise adds value.`,
        evidenceRefs: [],
        leverRefs: [],
        type: "argument",
      })
      break
    }
  }

  return {
    id: `prs-${round.id}-${member.id}-${role}`,
    memberId: member.id,
    memberName: member.name,
    role,
    roundNumber: round.roundNumber,
    sections,
    watchOuts,
    doNotConcede,
  }
}

export function generateScriptPack(
  workspace: NegotiationWorkspace,
  team: NegotiationTeamMember[],
  planSet: NegotiationPlanSet,
): ScriptPack {
  const roundScripts: RoundScript[] = []

  for (const plan of planSet.plans) {
    for (const round of plan.rounds) {
      // Build agenda
      const agenda: AgendaItem[] = []
      const lead = team.find((m) => m.roles.includes("lead-negotiator"))
      let order = 1

      agenda.push({
        id: `ag-${round.id}-open`,
        order: order++,
        title: "Opening & Agenda Review",
        ownerMemberId: lead?.id ?? team[0]?.id ?? "unknown",
        ownerName: lead?.name ?? team[0]?.name ?? "TBD",
        ownerRole: "lead-negotiator",
        durationMinutes: 5,
        notes: "Set tone, confirm agenda, establish ground rules",
      })

      // Add argument items
      const scriptArgs = round.arguments.filter((a) => a.useInScript)
      const analyst = team.find((m) => m.roles.includes("analyst"))

      scriptArgs.forEach((arg) => {
        const isDataHeavy = arg.evidenceRefs.length >= 2
        const owner = isDataHeavy && analyst ? analyst : lead ?? team[0]
        agenda.push({
          id: `ag-${round.id}-arg-${arg.id}`,
          order: order++,
          title: arg.claim.slice(0, 60) + "...",
          ownerMemberId: owner?.id ?? "unknown",
          ownerName: owner?.name ?? "TBD",
          ownerRole: isDataHeavy ? "analyst" : "lead-negotiator",
          durationMinutes: 10,
          notes: `Ask: ${arg.ask}`,
        })
      })

      // Technical review if SME present
      const sme = team.find((m) => m.roles.includes("technical-sme"))
      if (sme) {
        agenda.push({
          id: `ag-${round.id}-tech`,
          order: order++,
          title: "Technical / Spec Discussion",
          ownerMemberId: sme.id,
          ownerName: sme.name,
          ownerRole: "technical-sme",
          durationMinutes: 10,
          notes: "Address any specification or engineering questions",
        })
      }

      // Terms discussion if finance/legal present
      const fin = team.find((m) => m.roles.includes("finance"))
      if (fin) {
        agenda.push({
          id: `ag-${round.id}-fin`,
          order: order++,
          title: "Commercial Terms Review",
          ownerMemberId: fin.id,
          ownerName: fin.name,
          ownerRole: "finance",
          durationMinutes: 10,
          notes: "Payment terms, rebates, total cost discussion",
        })
      }

      agenda.push({
        id: `ag-${round.id}-close`,
        order: order++,
        title: "Wrap-up & Next Steps",
        ownerMemberId: lead?.id ?? team[0]?.id ?? "unknown",
        ownerName: lead?.name ?? team[0]?.name ?? "TBD",
        ownerRole: "lead-negotiator",
        durationMinutes: 5,
        notes: "Summarize agreements, confirm action items, set next meeting",
      })

      // Master script
      const masterScript = [
        `ROUND ${round.roundNumber}: ${round.name} (${ROUND_PURPOSE_CONFIG[round.purpose].label})`,
        `Supplier: ${plan.supplierName}`,
        "",
        "AGENDA:",
        ...agenda.map((a) => `${a.order}. ${a.title} (${a.durationMinutes} min) -- ${a.ownerName} [${TEAM_ROLE_LABELS[a.ownerRole]}]`),
        "",
        `CLOSE CRITERIA: ${round.closeCriteria}`,
        "",
        "KEY POSITIONS:",
        ...round.startingPositions.map((p) => `- ${p.dimension}: Anchor ${p.anchor} | Target ${p.target} | Walk-away ${p.laa}`),
        "",
        `TOTAL ESTIMATED DURATION: ${agenda.reduce((acc, a) => acc + a.durationMinutes, 0)} minutes`,
      ].join("\n")

      // Generate per-person scripts
      const personScripts: PersonRoundScript[] = []
      for (const member of team) {
        if (member.participationRounds.length > 0 && !member.participationRounds.includes(round.roundNumber)) {
          continue
        }
        for (const role of member.roles) {
          personScripts.push(generatePersonScript(member, round, plan, workspace, role))
        }
      }

      // Give/Get guidance
      const roundGiveGets = plan.giveGets.filter((gg) => gg.roundId === round.id)
      const giveGetGuidance: RoundGiveGetGuidance[] = roundGiveGets.map((gg) => ({
        canGive: gg.give,
        mustGet: gg.get,
        condition: gg.condition,
      }))

      // Guardrails
      const guardrails = workspace.objectives
        .filter((o) => o.priority === "Must-have")
        .map((o) => `${DOMAIN_LABELS[o.domain]}: Floor is ${o.laa}. Do not concede below this under any circumstances.`)

      roundScripts.push({
        id: `rs-${plan.supplierId}-r${round.roundNumber}`,
        roundNumber: round.roundNumber,
        roundName: round.name,
        purpose: round.purpose,
        agenda,
        masterScript,
        giveGetGuidance,
        guardrails,
        personScripts,
      })
    }
  }

  return {
    id: `sp-${Date.now()}`,
    version: 1,
    status: "draft",
    generatedAt: new Date().toISOString(),
    source: "ai",
    roundScripts,
  }
}

// ─── Default Team (mock) ────────────────────────────────────────────────────

export const DEFAULT_TEAM: NegotiationTeamMember[] = [
  { id: "tm-1", name: "Sarah Chen", email: "s.chen@company.com", org: "Strategic Sourcing", internal: true, roles: ["lead-negotiator"], participationRounds: [], notes: "Category lead for injection molding" },
  { id: "tm-2", name: "James Liu", email: "j.liu@company.com", org: "Strategic Sourcing", internal: true, roles: ["analyst"], participationRounds: [], notes: "Senior analyst, runs should-cost models" },
  { id: "tm-3", name: "Maria Torres", email: "m.torres@company.com", org: "Strategic Sourcing", internal: true, roles: ["note-taker"], participationRounds: [], notes: "" },
  { id: "tm-4", name: "David Kim", email: "d.kim@company.com", org: "Engineering", internal: true, roles: ["technical-sme"], participationRounds: [1, 2], notes: "Packaging engineering lead" },
  { id: "tm-5", name: "Lisa Park", email: "l.park@company.com", org: "Finance", internal: true, roles: ["finance"], participationRounds: [2, 3], notes: "FP&A manager" },
]
