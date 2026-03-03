// ─── Fleet Supplier Strategy Mock Data ────────────────────────────────────────

export type SupplierType = "OEM" | "Dealer" | "FMC" | "Maintenance" | "Telematics" | "Remarketing" | "Insurance"

export type RiskLevel = "Low" | "Medium" | "High"

// ─── Financial + Regulatory Signals ─────────────────────────────────────────

export interface FinancialSignal {
  revenueRange: string
  marginTrend: "Up" | "Flat" | "Down"
  creditRisk: RiskLevel
  notes?: string
}

export interface RegulatoryDing {
  title: string
  severity: RiskLevel
  date?: string
  notes?: string
}

export interface ESGSignal {
  level: "None" | "Watch" | "Elevated"
  notes?: string
}

export interface SupplierSignals {
  financial: FinancialSignal
  regulatory: RegulatoryDing[]
  esg: ESGSignal
}

// ─── Main Supplier Interface ────────────────────────────────────────────────

export interface FleetSupplier {
  id: string
  name: string
  type: SupplierType
  segment: "Strategic" | "Preferred" | "Approved" | "Transactional"
  annualSpend: number
  contractCoverage: boolean
  country: string
  regions: string[]
  tier: 1 | 2 | 3
  riskScore: number
  performanceScore: number
  evReady: boolean
  capabilities: string[]
  contractType: string
  contractRenewal: string
  rebateFees: string
  keyRisks: string[]
  keyOpportunities: string[]
  roleInEcosystem: string
  industyCoverage: string[]
  commercialModel: string
  // ── Kraljic matrix scores ──
  ourDependencyScore: number       // how important this supplier is to Meridian (0-100)
  accountAttractivenessScore: number // how important Meridian is to this supplier (0-100)
  // ── Signals ──
  signals: SupplierSignals
}

export const fleetSuppliers: FleetSupplier[] = [
  {
    id: "fs-1", name: "Ford Motor Company", type: "OEM", segment: "Strategic",
    annualSpend: 8_400_000, contractCoverage: true, country: "US", regions: ["North America", "EMEA"],
    tier: 1, riskScore: 22, performanceScore: 91, evReady: true,
    capabilities: ["Vehicle manufacturing", "EV platform (Mach-E, Lightning)", "Fleet incentives", "Connected vehicle data"],
    contractType: "Master Supply Agreement", contractRenewal: "2027-Q2", rebateFees: "Volume rebate 3.5-5.2%",
    keyRisks: ["Delivery lead times (8-12 wks)", "Model year transitions", "Parts availability for EV"],
    keyOpportunities: ["EV fleet pilot expansion", "Connected vehicle data integration", "Standardized model list"],
    roleInEcosystem: "Primary OEM for North American fleet. Supplies Transit vans and Escape/Maverick for field reps. EV transition partner for Lightning and Mach-E pilot.",
    industyCoverage: ["Pharma", "Healthcare", "CPG"], commercialModel: "Volume-based fleet incentive + residual value guarantee",
    ourDependencyScore: 88, accountAttractivenessScore: 22,
    signals: {
      financial: { revenueRange: "$150-180B", marginTrend: "Up", creditRisk: "Low", notes: "Strong recovery post-EV investment cycle. Record fleet revenue in 2025." },
      regulatory: [
        { title: "Emissions compliance review (EPA)", severity: "Low", date: "2025-Q3" },
        { title: "Safety recall (airbag sensor)", severity: "Medium", date: "2025-Q1", notes: "Affects ~2% of fleet-eligible models" },
      ],
      esg: { level: "None", notes: "Strong ESG commitments through EV transition and carbon neutrality targets." },
    },
  },
  {
    id: "fs-2", name: "Stellantis Fleet", type: "OEM", segment: "Preferred",
    annualSpend: 5_200_000, contractCoverage: true, country: "France", regions: ["EMEA", "LATAM"],
    tier: 1, riskScore: 30, performanceScore: 85, evReady: true,
    capabilities: ["Vehicle manufacturing", "Peugeot/Citro\u00ebn EV range", "EMEA fleet programs", "Leasing partnerships"],
    contractType: "Framework Agreement", contractRenewal: "2026-Q4", rebateFees: "Tiered rebate 2.8-4.1%",
    keyRisks: ["EUR/USD exposure", "Limited NA presence", "EV charging network gaps in Southern Europe"],
    keyOpportunities: ["EMEA fleet standardization", "Small EV for urban territories", "Multi-brand flexibility"],
    roleInEcosystem: "Secondary OEM for EMEA fleet. Provides Peugeot e-208 and Citro\u00ebn \u00eb-C4 for city-based reps. Strong in France, Italy, Spain.",
    industyCoverage: ["Pharma", "Insurance", "Utilities"], commercialModel: "Framework pricing with quarterly volume true-ups",
    ourDependencyScore: 65, accountAttractivenessScore: 15,
    signals: {
      financial: { revenueRange: "$170-190B", marginTrend: "Flat", creditRisk: "Low", notes: "Merger integration ongoing. EMEA fleet division stable." },
      regulatory: [
        { title: "EU emissions penalty exposure", severity: "Medium", date: "2025-Q4", notes: "Non-compliance risk in 2026 CO2 targets" },
      ],
      esg: { level: "Watch", notes: "Under scrutiny for battery supply chain labor practices in DRC." },
    },
  },
  {
    id: "fs-3", name: "Holman Enterprises", type: "FMC", segment: "Strategic",
    annualSpend: 9_600_000, contractCoverage: true, country: "US", regions: ["North America"],
    tier: 1, riskScore: 18, performanceScore: 94, evReady: true,
    capabilities: ["Full fleet management", "Lease administration", "Maintenance management", "Driver services", "EV transition consulting", "Telematics integration"],
    contractType: "Managed Services Agreement", contractRenewal: "2027-Q4", rebateFees: "Management fee $42/vehicle/month + pass-through maintenance",
    keyRisks: ["Concentration risk (single FMC for NA)", "Fee escalation clauses", "Data portability"],
    keyOpportunities: ["Consolidate maintenance under single FMC", "EV charging infrastructure planning", "Integrated reporting dashboard"],
    roleInEcosystem: "Primary fleet management company for North America. Manages full lifecycle: ordering, titling, maintenance, fuel, telematics, and remarketing for ~1,200 vehicles.",
    industyCoverage: ["Pharma", "Biotech", "Medical Device"], commercialModel: "Per-vehicle monthly management fee + transparent pass-through costs",
    ourDependencyScore: 95, accountAttractivenessScore: 68,
    signals: {
      financial: { revenueRange: "$3-5B", marginTrend: "Up", creditRisk: "Low", notes: "Private company. Strong pharma fleet vertical." },
      regulatory: [],
      esg: { level: "None" },
    },
  },
  {
    id: "fs-4", name: "LeasePlan International", type: "FMC", segment: "Preferred",
    annualSpend: 6_200_000, contractCoverage: true, country: "Netherlands", regions: ["EMEA", "APAC"],
    tier: 1, riskScore: 28, performanceScore: 88, evReady: true,
    capabilities: ["International fleet management", "Operating lease", "Driver app", "Sustainability reporting", "Multi-country compliance"],
    contractType: "Master Lease Agreement", contractRenewal: "2026-Q3", rebateFees: "Management fee \u20ac38/vehicle/month",
    keyRisks: ["Currency exposure across 12 markets", "Regulatory fragmentation", "Renewal pricing pressure"],
    keyOpportunities: ["Global reporting consolidation", "EV-first policy in EMEA", "Driver satisfaction program"],
    roleInEcosystem: "Primary FMC for EMEA and APAC. Manages operating leases across 12 countries. Key partner for EMEA sustainability targets and compliance.",
    industyCoverage: ["Pharma", "Financial Services", "Tech"], commercialModel: "Operating lease with bundled services per country",
    ourDependencyScore: 78, accountAttractivenessScore: 35,
    signals: {
      financial: { revenueRange: "$8-10B", marginTrend: "Flat", creditRisk: "Medium", notes: "Post-merger with ALD Automotive. Integration risk remains." },
      regulatory: [
        { title: "GDPR cross-border data processing review", severity: "Medium", date: "2025-Q2", notes: "Driver data shared across 12 EU entities" },
      ],
      esg: { level: "None", notes: "Industry leader in sustainability reporting." },
    },
  },
  {
    id: "fs-5", name: "AutoNation Dealer Group", type: "Dealer", segment: "Strategic",
    annualSpend: 4_800_000, contractCoverage: true, country: "US", regions: ["North America"],
    tier: 1, riskScore: 25, performanceScore: 87, evReady: true,
    capabilities: ["Vehicle delivery & prep", "Warranty service", "Collision repair", "EV service certification", "Upfitting coordination"],
    contractType: "Preferred Dealer Agreement", contractRenewal: "2027-Q1", rebateFees: "Fleet discount 8-12% off MSRP",
    keyRisks: ["Regional pricing inconsistency", "Service capacity in peak quarters", "Technician shortages"],
    keyOpportunities: ["Standardize delivery SLAs", "EV service hub network", "Consolidated billing"],
    roleInEcosystem: "Primary dealer network for North America vehicle sourcing and warranty service. 45 locations covering top-30 metro territories.",
    industyCoverage: ["Pharma", "Healthcare", "Government"], commercialModel: "Fleet discount off MSRP + service rate card",
    ourDependencyScore: 60, accountAttractivenessScore: 42,
    signals: {
      financial: { revenueRange: "$25-27B", marginTrend: "Down", creditRisk: "Low", notes: "Public company. Margin pressure from EV shift." },
      regulatory: [
        { title: "FTC pricing transparency investigation", severity: "Low", date: "2025-Q1" },
      ],
      esg: { level: "None" },
    },
  },
  {
    id: "fs-6", name: "Pendragon Fleet (UK)", type: "Dealer", segment: "Approved",
    annualSpend: 1_900_000, contractCoverage: false, country: "UK", regions: ["EMEA"],
    tier: 2, riskScore: 45, performanceScore: 76, evReady: false,
    capabilities: ["Vehicle delivery", "Basic service", "Used vehicle disposal"],
    contractType: "Purchase Order (no MSA)", contractRenewal: "N/A", rebateFees: "Spot pricing per order",
    keyRisks: ["No contractual SLAs", "Inconsistent pricing", "Limited EV capability"],
    keyOpportunities: ["Migrate to LeasePlan dealer network", "Negotiate MSA with service SLAs"],
    roleInEcosystem: "Ad-hoc dealer for UK fleet needs. Used primarily for vehicle sourcing when LeasePlan dealer network has gaps.",
    industyCoverage: ["Pharma", "Automotive"], commercialModel: "Transactional spot pricing",
    ourDependencyScore: 25, accountAttractivenessScore: 55,
    signals: {
      financial: { revenueRange: "$2-3B", marginTrend: "Down", creditRisk: "High", notes: "Restructuring. Sold multiple dealership groups in 2024-25." },
      regulatory: [
        { title: "Contract dispute history (fleet overcharges)", severity: "Medium", date: "2024-Q3" },
      ],
      esg: { level: "Watch", notes: "Limited sustainability reporting. No published EV strategy." },
    },
  },
  {
    id: "fs-7", name: "Penske Truck Leasing", type: "Maintenance", segment: "Preferred",
    annualSpend: 3_200_000, contractCoverage: true, country: "US", regions: ["North America"],
    tier: 1, riskScore: 20, performanceScore: 90, evReady: true,
    capabilities: ["Preventive maintenance", "Roadside assistance", "Fleet repair", "Tire management", "EV battery diagnostics"],
    contractType: "National Maintenance Agreement", contractRenewal: "2027-Q2", rebateFees: "Fixed rate card + volume discount 6%",
    keyRisks: ["Technician capacity in rural territories", "Parts lead times", "Rate escalation tied to CPI"],
    keyOpportunities: ["EV maintenance specialization", "Predictive maintenance pilot", "Extended service hours for field reps"],
    roleInEcosystem: "Primary maintenance provider for North America. Covers preventive maintenance, repairs, and roadside assistance through 800+ locations.",
    industyCoverage: ["Pharma", "Logistics", "CPG"], commercialModel: "National rate card with volume-based discounts",
    ourDependencyScore: 72, accountAttractivenessScore: 18,
    signals: {
      financial: { revenueRange: "$10-12B", marginTrend: "Up", creditRisk: "Low" },
      regulatory: [],
      esg: { level: "None" },
    },
  },
  {
    id: "fs-8", name: "Kwik Fit (Bridgestone)", type: "Maintenance", segment: "Approved",
    annualSpend: 1_400_000, contractCoverage: true, country: "UK", regions: ["EMEA"],
    tier: 2, riskScore: 35, performanceScore: 80, evReady: false,
    capabilities: ["Tire replacement", "Brake service", "Basic maintenance", "MOT testing"],
    contractType: "Service Agreement", contractRenewal: "2026-Q2", rebateFees: "Fixed labor rate + parts markup 15%",
    keyRisks: ["Limited diagnostic capability", "No EV specialization", "Geographic gaps outside UK"],
    keyOpportunities: ["Tire management program consolidation", "Expand to Bridgestone EMEA network"],
    roleInEcosystem: "Secondary maintenance for UK and select EMEA markets. Primarily tire and brake services for the EMEA fleet.",
    industyCoverage: ["Pharma", "Retail", "Logistics"], commercialModel: "Fixed labor rate + marked-up parts",
    ourDependencyScore: 35, accountAttractivenessScore: 28,
    signals: {
      financial: { revenueRange: "$1-2B (Bridgestone parent: $30B+)", marginTrend: "Flat", creditRisk: "Low", notes: "Bridgestone backing provides stability." },
      regulatory: [
        { title: "UK Health & Safety Executive audit finding", severity: "Low", date: "2025-Q1", notes: "Minor workplace safety observation. Resolved." },
      ],
      esg: { level: "None" },
    },
  },
  {
    id: "fs-9", name: "Geotab Inc.", type: "Telematics", segment: "Strategic",
    annualSpend: 2_800_000, contractCoverage: true, country: "Canada", regions: ["North America", "EMEA", "APAC"],
    tier: 1, riskScore: 15, performanceScore: 95, evReady: true,
    capabilities: ["GPS tracking", "Driver behavior scoring", "EV range analytics", "Fuel management", "Compliance reporting", "API integration", "OBD-II diagnostics"],
    contractType: "SaaS Subscription + Hardware", contractRenewal: "2028-Q1", rebateFees: "$22/vehicle/month SaaS + $180 hardware (amortized)",
    keyRisks: ["Data privacy (GDPR/CCPA)", "Connectivity gaps in rural areas", "Hardware refresh cycle"],
    keyOpportunities: ["EV range optimization", "Predictive maintenance integration", "Driver safety gamification", "Data rights monetization"],
    roleInEcosystem: "Primary telematics provider across all regions. Provides real-time vehicle tracking, driver behavior analytics, and EV battery monitoring for the full fleet.",
    industyCoverage: ["Pharma", "Logistics", "Energy", "Government"], commercialModel: "Per-vehicle monthly SaaS subscription + one-time hardware cost",
    ourDependencyScore: 82, accountAttractivenessScore: 45,
    signals: {
      financial: { revenueRange: "$500M-1B", marginTrend: "Up", creditRisk: "Low", notes: "Private. Rapid growth. 4M+ connected vehicles globally." },
      regulatory: [
        { title: "Privacy complaint (CCPA driver tracking)", severity: "Medium", date: "2025-Q2", notes: "Class action risk from driver privacy advocacy groups" },
        { title: "Data handling audit gap (SOC 2)", severity: "Medium", date: "2025-Q1", notes: "SOC 2 Type II audit finding on data retention policies" },
      ],
      esg: { level: "None" },
    },
  },
  {
    id: "fs-10", name: "ADESA (Openlane)", type: "Remarketing", segment: "Preferred",
    annualSpend: 1_600_000, contractCoverage: true, country: "US", regions: ["North America"],
    tier: 1, riskScore: 30, performanceScore: 83, evReady: true,
    capabilities: ["Wholesale auction", "Digital remarketing", "Condition reporting", "Transport coordination", "EV battery valuation"],
    contractType: "Remarketing Services Agreement", contractRenewal: "2026-Q4", rebateFees: "Commission 2.5% of sale price",
    keyRisks: ["Residual value volatility", "EV depreciation uncertainty", "Auction volume dependency"],
    keyOpportunities: ["Direct-to-dealer channel", "EV residual value guarantees", "Upstream remarketing to reduce cycle time"],
    roleInEcosystem: "Primary remarketing partner for end-of-lifecycle fleet vehicles in North America. Handles disposition, auction, and transport for ~400 units/year.",
    industyCoverage: ["Pharma", "Corporate Fleet", "Rental"], commercialModel: "Commission-based on sale proceeds",
    ourDependencyScore: 45, accountAttractivenessScore: 30,
    signals: {
      financial: { revenueRange: "$2-3B", marginTrend: "Flat", creditRisk: "Medium", notes: "Volatile used vehicle market. Margins compressed in 2025." },
      regulatory: [],
      esg: { level: "None" },
    },
  },
  {
    id: "fs-11", name: "Zurich Fleet Insurance", type: "Insurance", segment: "Strategic",
    annualSpend: 3_800_000, contractCoverage: true, country: "Switzerland", regions: ["North America", "EMEA"],
    tier: 1, riskScore: 20, performanceScore: 89, evReady: true,
    capabilities: ["Motor fleet insurance", "Liability coverage", "Accident management", "Risk engineering", "Claims analytics", "EV-specific coverage"],
    contractType: "Global Fleet Insurance Program", contractRenewal: "2027-Q1", rebateFees: "Premium based on fleet size + claims experience",
    keyRisks: ["Premium escalation from claims frequency", "EV repair cost uncertainty", "Coverage gaps in emerging markets"],
    keyOpportunities: ["Telematics-linked premium discounts", "Claims reduction through driver training", "Global program consolidation"],
    roleInEcosystem: "Global fleet insurance provider covering motor, liability, and accident management across North America and EMEA. Integrates with Geotab for risk data.",
    industyCoverage: ["Pharma", "Healthcare", "Financial Services"], commercialModel: "Annual premium based on fleet size, vehicle types, and claims history",
    ourDependencyScore: 70, accountAttractivenessScore: 52,
    signals: {
      financial: { revenueRange: "$70-80B (group)", marginTrend: "Up", creditRisk: "Low" },
      regulatory: [
        { title: "Solvency II capital adequacy review", severity: "Low", date: "2025-Q4", notes: "Routine regulatory review. No concerns flagged." },
      ],
      esg: { level: "None", notes: "Industry leader in climate risk assessment." },
    },
  },
  {
    id: "fs-12", name: "Manheim (Cox Automotive)", type: "Remarketing", segment: "Approved",
    annualSpend: 800_000, contractCoverage: false, country: "US", regions: ["North America"],
    tier: 2, riskScore: 38, performanceScore: 77, evReady: false,
    capabilities: ["Physical auction", "Wholesale marketplace", "Vehicle inspection"],
    contractType: "Spot auction (no MSA)", contractRenewal: "N/A", rebateFees: "Buyer/seller fees per transaction",
    keyRisks: ["No guaranteed throughput", "Variable pricing", "Limited digital capability"],
    keyOpportunities: ["Consolidate to ADESA for better rates", "Negotiate MSA with volume commitment"],
    roleInEcosystem: "Secondary remarketing channel used for overflow volume when ADESA capacity is constrained.",
    industyCoverage: ["Pharma", "Rental", "Government"], commercialModel: "Per-transaction auction fees",
    ourDependencyScore: 18, accountAttractivenessScore: 8,
    signals: {
      financial: { revenueRange: "$20-22B (Cox parent)", marginTrend: "Down", creditRisk: "Low", notes: "Cox Automotive parent is stable but auction volumes declining." },
      regulatory: [],
      esg: { level: "None" },
    },
  },
]

// ─── Upstream Dependencies (restructured) ───────────────────────────────────

export type DependencyType =
  | "Critical component"
  | "Logistics/capacity"
  | "Technology platform"
  | "Subcontractor"
  | "Connectivity provider"
  | "Reinsurance"
  | "Parts distributor"

export interface UpstreamDependency {
  id: string
  parentId: string
  name: string
  dependencyType: DependencyType
  concentration: RiskLevel
  geoExposure: string
  leadTimeSensitivity: RiskLevel
  impact: RiskLevel
  mitigations: string[]
  notes: string
}

export const upstreamDependencies: UpstreamDependency[] = [
  { id: "ud-1", parentId: "fs-1", name: "LG Energy Solution", dependencyType: "Critical component", concentration: "High", geoExposure: "South Korea / China", leadTimeSensitivity: "High", impact: "High", mitigations: ["Dual-source with SK Innovation", "Monitor Korean supply disruptions", "6-month battery inventory buffer"], notes: "EV battery cell supplier for Ford Lightning & Mach-E. Single source creates significant risk." },
  { id: "ud-2", parentId: "fs-1", name: "Bosch Automotive NA", dependencyType: "Critical component", concentration: "Medium", geoExposure: "Germany / US", leadTimeSensitivity: "Medium", impact: "Medium", mitigations: ["Qualify Denso as alternative", "Safety stock program"], notes: "EV charging components and sensors." },
  { id: "ud-3", parentId: "fs-1", name: "Dana Incorporated", dependencyType: "Critical component", concentration: "Low", geoExposure: "US (multi-plant)", leadTimeSensitivity: "Low", impact: "Low", mitigations: ["Standard monitoring"], notes: "Drive axles and thermal management. Multi-source arrangement in place." },
  { id: "ud-4", parentId: "fs-2", name: "CATL (China)", dependencyType: "Critical component", concentration: "High", geoExposure: "China", leadTimeSensitivity: "High", impact: "High", mitigations: ["Monitor US/EU tariff exposure", "Stellantis European cell production by 2027", "Diversify to Samsung SDI"], notes: "Battery packs for Stellantis EV platform. Geopolitical risk from China sourcing." },
  { id: "ud-5", parentId: "fs-2", name: "Valeo SE", dependencyType: "Critical component", concentration: "Low", geoExposure: "France / Global", leadTimeSensitivity: "Low", impact: "Low", mitigations: ["Diversified supplier base"], notes: "ADAS and lighting systems." },
  { id: "ud-6", parentId: "fs-3", name: "Merchants Fleet (sub)", dependencyType: "Subcontractor", concentration: "Medium", geoExposure: "US (regional)", leadTimeSensitivity: "Medium", impact: "Medium", mitigations: ["Enterprise Fleet as overflow", "Build 30-day rental buffer"], notes: "Short-term rental pool for replacement vehicles during maintenance." },
  { id: "ud-7", parentId: "fs-3", name: "Bridgestone Americas", dependencyType: "Parts distributor", concentration: "Low", geoExposure: "US / Global", leadTimeSensitivity: "Low", impact: "Low", mitigations: ["Multi-year contract with price protection"], notes: "National tire program administered through Holman." },
  { id: "ud-8", parentId: "fs-7", name: "NAPA Auto Parts", dependencyType: "Parts distributor", concentration: "High", geoExposure: "US", leadTimeSensitivity: "Medium", impact: "Medium", mitigations: ["Qualify AutoZone as secondary source", "Critical SKU safety stock"], notes: "Primary parts distributor for Penske maintenance network. Single-source risk on key SKUs." },
  { id: "ud-9", parentId: "fs-7", name: "Cummins Filtration", dependencyType: "Critical component", concentration: "Low", geoExposure: "US / Global", leadTimeSensitivity: "Low", impact: "Low", mitigations: ["Commodity parts with multiple alternatives"], notes: "Specialized filters and emissions components." },
  { id: "ud-10", parentId: "fs-9", name: "AT&T IoT (FirstNet)", dependencyType: "Connectivity provider", concentration: "High", geoExposure: "US", leadTimeSensitivity: "High", impact: "High", mitigations: ["Geotab multi-carrier failover", "Negotiate T-Mobile backup", "Require SLA with 99.5% uptime"], notes: "Cellular connectivity for all Geotab OBD-II devices in North America." },
  { id: "ud-11", parentId: "fs-9", name: "Quectel Wireless", dependencyType: "Technology platform", concentration: "High", geoExposure: "China", leadTimeSensitivity: "High", impact: "Medium", mitigations: ["Geotab 12-month chip inventory buffer", "Qualify Nordic Semiconductor as alt"], notes: "IoT modem chipsets in Geotab hardware. China geo-concentration risk." },
  { id: "ud-12", parentId: "fs-11", name: "Swiss Re (reinsurer)", dependencyType: "Reinsurance", concentration: "Low", geoExposure: "Switzerland / Global", leadTimeSensitivity: "Low", impact: "Low", mitigations: ["Diversified reinsurance panel"], notes: "Reinsurance backing for Zurich fleet program." },
  { id: "ud-13", parentId: "fs-10", name: "Copart Transport", dependencyType: "Logistics/capacity", concentration: "Medium", geoExposure: "US", leadTimeSensitivity: "Medium", impact: "Medium", mitigations: ["United Road for peak periods", "Pre-book transport 2 weeks ahead"], notes: "Vehicle transport logistics from fleet to auction." },
]

// ─── Performance Scorecards ──────────────────────────────────────────────────

export type ScorecarDimension = "tco" | "delivery" | "coverage" | "compliance" | "claimsRepair" | "reporting" | "innovation"

// Canonical ordered list of all 7 dimensions -- single source of truth
export const DIMENSIONS: readonly { id: ScorecarDimension; label: string }[] = [
  { id: "tco",          label: "Cost (TCO)" },
  { id: "delivery",     label: "Delivery Lead Time" },
  { id: "coverage",     label: "Service Coverage" },
  { id: "compliance",   label: "Compliance / Privacy" },
  { id: "claimsRepair", label: "Claims / Repair Cycle" },
  { id: "reporting",    label: "Reporting Quality" },
  { id: "innovation",   label: "Innovation / EV Readiness" },
] as const

export const DIMENSION_IDS: readonly ScorecarDimension[] = DIMENSIONS.map((d) => d.id)

export const SCORECARD_LABELS: Record<ScorecarDimension, string> = {
  tco: "Cost (TCO)",
  delivery: "Delivery Lead Time",
  coverage: "Service Coverage",
  compliance: "Compliance / Privacy",
  claimsRepair: "Claims / Repair Cycle",
  reporting: "Reporting Quality",
  innovation: "Innovation / EV Readiness",
}

export interface SupplierScorecard {
  supplierId: string
  scores: Record<ScorecarDimension, number>
}

export const supplierScorecards: SupplierScorecard[] = [
  { supplierId: "fs-1", scores: { tco: 82, delivery: 70, coverage: 88, compliance: 90, claimsRepair: 75, reporting: 80, innovation: 94 } },
  { supplierId: "fs-2", scores: { tco: 78, delivery: 72, coverage: 80, compliance: 88, claimsRepair: 70, reporting: 76, innovation: 86 } },
  { supplierId: "fs-3", scores: { tco: 88, delivery: 92, coverage: 95, compliance: 94, claimsRepair: 85, reporting: 96, innovation: 90 } },
  { supplierId: "fs-4", scores: { tco: 80, delivery: 85, coverage: 88, compliance: 92, claimsRepair: 82, reporting: 90, innovation: 88 } },
  { supplierId: "fs-5", scores: { tco: 85, delivery: 80, coverage: 82, compliance: 86, claimsRepair: 78, reporting: 74, innovation: 80 } },
  { supplierId: "fs-6", scores: { tco: 72, delivery: 68, coverage: 60, compliance: 70, claimsRepair: 65, reporting: 55, innovation: 40 } },
  { supplierId: "fs-7", scores: { tco: 90, delivery: 88, coverage: 92, compliance: 90, claimsRepair: 92, reporting: 85, innovation: 86 } },
  { supplierId: "fs-8", scores: { tco: 78, delivery: 82, coverage: 70, compliance: 80, claimsRepair: 76, reporting: 65, innovation: 45 } },
  { supplierId: "fs-9", scores: { tco: 86, delivery: 95, coverage: 94, compliance: 96, claimsRepair: 88, reporting: 98, innovation: 96 } },
  { supplierId: "fs-10", scores: { tco: 82, delivery: 78, coverage: 80, compliance: 82, claimsRepair: 80, reporting: 75, innovation: 78 } },
  { supplierId: "fs-11", scores: { tco: 76, delivery: 90, coverage: 88, compliance: 94, claimsRepair: 86, reporting: 88, innovation: 82 } },
  { supplierId: "fs-12", scores: { tco: 70, delivery: 72, coverage: 65, compliance: 74, claimsRepair: 68, reporting: 58, innovation: 38 } },
]

// ─── Segmentation Table ──────────────────────────────────────────────────────

export interface SegmentRow {
  segment: "Strategic" | "Preferred" | "Approved" | "Transactional"
  rationale: string
  recommendedAction: string
}

export const segmentDefinitions: SegmentRow[] = [
  { segment: "Strategic", rationale: "Critical to fleet operations. High spend, deep integration, limited alternatives.", recommendedAction: "Joint business planning, innovation partnerships, multi-year agreements" },
  { segment: "Preferred", rationale: "Important suppliers with strong capability. Competitive alternatives exist.", recommendedAction: "Performance-based contracts, annual reviews, expand scope where justified" },
  { segment: "Approved", rationale: "Adequate performance. Used for specific needs or regions.", recommendedAction: "Monitor performance, consider consolidation to Preferred tier" },
  { segment: "Transactional", rationale: "Low spend, commoditized. Used ad-hoc or for overflow.", recommendedAction: "Standardize, automate ordering, evaluate elimination or upgrade" },
]

// ─── Playbooks ───────────────────────────────────────────────────────────────

export interface Playbook {
  type: SupplierType
  levers: string[]
  negotiationChecklist: string[]
  risksToManage: string[]
  qbrKPIs: string[]
}

export const playbooks: Playbook[] = [
  {
    type: "OEM",
    levers: ["Volume rebates (3-5%)", "Standard model list to limit SKU proliferation", "Delivery lead-time SLAs with penalties", "EV incentive pass-through", "Residual value guarantees"],
    negotiationChecklist: ["Confirm volume commitments by model year", "Lock pricing for 12-month periods", "Negotiate EV charging incentive inclusion", "Define delivery windows with escalation path", "Secure data rights for connected vehicle telemetry"],
    risksToManage: ["Model year transition supply gaps", "EV range anxiety impacting rep productivity", "Parts availability for new platforms"],
    qbrKPIs: ["Delivery on-time %", "Fleet discount vs MSRP %", "EV adoption rate", "Warranty claim resolution time", "Customer satisfaction score"],
  },
  {
    type: "Dealer",
    levers: ["Fleet discount standardization across network", "Delivery prep SLA with time-to-road targets", "Consolidated billing across locations", "Service rate cap tied to CPI", "EV service certification requirements"],
    negotiationChecklist: ["Audit pricing consistency across top-20 locations", "Establish delivery SLA (target: 5 business days)", "Negotiate fixed service labor rates", "Require EV service training certification", "Define upfitting standards and approved vendors"],
    risksToManage: ["Regional pricing arbitrage", "Technician shortages in key markets", "Service capacity during Q4 fleet turnover"],
    qbrKPIs: ["Time-to-road (order to delivery)", "Pricing variance across locations", "Service turnaround time", "Customer complaint rate", "EV-certified locations %"],
  },
  {
    type: "FMC",
    levers: ["Management fee benchmarking", "Data rights and portability clauses", "Maintenance cost pass-through transparency", "Driver app satisfaction targets", "Sustainability reporting integration"],
    negotiationChecklist: ["Benchmark management fee vs market ($35-45/vehicle/month)", "Negotiate full data portability on contract exit", "Require open-book maintenance cost reporting", "Define driver app uptime SLA (99.5%)", "Include EV transition consulting at no additional cost"],
    risksToManage: ["FMC lock-in and switching costs", "Hidden fees in pass-through costs", "Data ownership disputes on termination"],
    qbrKPIs: ["Total cost per vehicle per month", "Driver satisfaction score", "Maintenance cost per mile", "Policy compliance rate", "Reporting accuracy and timeliness"],
  },
  {
    type: "Maintenance",
    levers: ["National rate card with CPI-linked escalation cap", "Volume discount tiers", "Predictive maintenance pilot programs", "Extended service hours for field reps", "Tire program consolidation"],
    negotiationChecklist: ["Lock labor rates for 24 months with CPI cap", "Negotiate volume discount at 5K+ work orders/year", "Define turnaround time SLA (same-day for critical)", "Require OEM-certified technicians for warranty work", "Include EV battery diagnostic capability"],
    risksToManage: ["Rate escalation above budget", "Parts lead times impacting vehicle downtime", "Technician quality variance across locations"],
    qbrKPIs: ["Average repair turnaround time", "First-time fix rate", "Cost per maintenance event", "Vehicle downtime hours", "Customer satisfaction score"],
  },
  {
    type: "Telematics",
    levers: ["Per-vehicle SaaS rate negotiation", "Hardware refresh cycle alignment", "Data API access and integration rights", "Privacy compliance commitments", "EV-specific analytics modules"],
    negotiationChecklist: ["Benchmark SaaS rate ($18-25/vehicle/month)", "Negotiate hardware ownership vs lease", "Secure full API access for BI integration", "Define GDPR/CCPA compliance obligations", "Include EV range and charging analytics at no premium"],
    risksToManage: ["Data privacy regulatory changes", "Connectivity gaps in rural territories", "Hardware obsolescence"],
    qbrKPIs: ["Device uptime %", "Data accuracy and latency", "Driver behavior score improvement", "EV range utilization", "Privacy incident count"],
  },
  {
    type: "Remarketing",
    levers: ["Commission rate caps", "Upstream remarketing to reduce cycle time", "EV residual value research", "Digital-first auction preference", "Transport cost pass-through controls"],
    negotiationChecklist: ["Cap commission at 2.5% of sale price", "Negotiate 48-hour listing-to-sale target", "Require EV battery health reporting in condition reports", "Define transport cost pass-through limits", "Establish minimum sale price thresholds"],
    risksToManage: ["Residual value volatility (especially EV)", "Auction market timing", "Vehicle condition disputes"],
    qbrKPIs: ["Average sale price vs book value", "Days to sale (listing to sold)", "Commission rate effective %", "Transport cost per unit", "EV vs ICE residual value spread"],
  },
  {
    type: "Insurance",
    levers: ["Telematics-linked premium discounts", "Claims frequency reduction programs", "Global program consolidation", "EV-specific coverage terms", "Deductible optimization"],
    negotiationChecklist: ["Negotiate telematics discount (target: 8-12% premium reduction)", "Define claims management SLA (48hr first contact)", "Secure global program pricing consistency", "Include EV battery and charging liability coverage", "Benchmark premium per vehicle vs market"],
    risksToManage: ["Premium escalation from claims frequency", "EV repair cost unpredictability", "Coverage gaps in new markets"],
    qbrKPIs: ["Premium per vehicle", "Claims frequency rate", "Average claim resolution time", "Loss ratio", "Driver safety score correlation"],
  },
]

// ─── Actions ─────────────────────────────────────────────────────────────────

export type ActionStatus = "Not Started" | "In Progress" | "Complete" | "Blocked"

export interface SupplierAction {
  id: string
  initiative: string
  owner: string
  dueDate: string
  linkedSupplierIds: string[]
  linkedObjective: string
  status: ActionStatus
}

export const supplierActions: SupplierAction[] = [
  { id: "sa-1", initiative: "Negotiate FMC consolidation (Holman as sole NA partner)", owner: "Sarah Chen", dueDate: "2026-Q2", linkedSupplierIds: ["fs-3", "fs-4"], linkedObjective: "Reduce fleet cost per driver by 15%", status: "In Progress" },
  { id: "sa-2", initiative: "OEM EV pilot expansion (Ford Lightning for top-10 metros)", owner: "Marcus Rodriguez", dueDate: "2026-Q3", linkedSupplierIds: ["fs-1"], linkedObjective: "30% EV/hybrid adoption by 2028", status: "In Progress" },
  { id: "sa-3", initiative: "Dealer network SLA standardization", owner: "Emily Watson", dueDate: "2026-Q2", linkedSupplierIds: ["fs-5", "fs-6"], linkedObjective: "Improve policy compliance to 95%", status: "Not Started" },
  { id: "sa-4", initiative: "Telematics-insurance integration for premium discount", owner: "David Park", dueDate: "2026-Q3", linkedSupplierIds: ["fs-9", "fs-11"], linkedObjective: "Reduce fleet cost per driver by 15%", status: "Not Started" },
  { id: "sa-5", initiative: "Remarketing channel consolidation to ADESA", owner: "Lisa Thompson", dueDate: "2026-Q4", linkedSupplierIds: ["fs-10", "fs-12"], linkedObjective: "Supplier base from 34 to 18 partners", status: "Not Started" },
  { id: "sa-6", initiative: "EMEA maintenance network expansion (Bridgestone)", owner: "James Mitchell", dueDate: "2026-Q3", linkedSupplierIds: ["fs-8"], linkedObjective: "Improve policy compliance to 95%", status: "In Progress" },
  { id: "sa-7", initiative: "Geotab EV range optimization rollout", owner: "David Park", dueDate: "2026-Q2", linkedSupplierIds: ["fs-9"], linkedObjective: "30% EV/hybrid adoption by 2028", status: "Complete" },
]

// ─── AI Insights (deterministic stubs) ───────────────────────────────────────

export const supplierAIInsights = [
  { id: "sai-1", text: "Dealer network fragmentation in Northeast drives inconsistent pricing -- AutoNation locations in NY/NJ show 4.2% higher fleet discounts than Boston/CT locations. Standardizing the rate card could save ~$180K/year.", severity: "high" as const },
  { id: "sai-2", text: "Holman (FMC) has the strongest reporting quality score (96) but charges 11% more per vehicle than LeasePlan. Consider leveraging reporting capability as a benchmark to negotiate LeasePlan improvements.", severity: "medium" as const },
  { id: "sai-3", text: "Geotab telematics data shows 23% of fleet vehicles idle >4 hours/day. Integrating this with Zurich insurance could unlock 8-12% premium discount through usage-based pricing.", severity: "high" as const },
  { id: "sai-4", text: "Single-source risk on LG Energy Solution for Ford EV batteries. SK Innovation qualification as backup supplier should be escalated in next OEM QBR.", severity: "high" as const },
  { id: "sai-5", text: "Pendragon (UK dealer) operates without an MSA. Migrating their volume to LeasePlan's dealer network would improve service SLAs and reduce per-unit cost by ~8%.", severity: "medium" as const },
  { id: "sai-6", text: "Remarketing split between ADESA and Manheim creates unnecessary complexity. Consolidating to ADESA with volume commitment could reduce commission from 2.5% to 2.1% and improve days-to-sale.", severity: "low" as const },
]

// ─── Kraljic Quadrant Helpers ────────────────────────────────────────────────

export type KraljicQuadrant = "Strategic Partnership" | "Supplier Leverage Risk" | "Customer Leverage" | "Easy Manage"

export function getKraljicQuadrant(ourDep: number, theirDep: number): KraljicQuadrant {
  if (ourDep >= 50 && theirDep >= 50) return "Strategic Partnership"
  if (ourDep >= 50 && theirDep < 50) return "Supplier Leverage Risk"
  if (ourDep < 50 && theirDep >= 50) return "Customer Leverage"
  return "Easy Manage"
}

export const KRALJIC_GUIDANCE: Record<KraljicQuadrant, { stance: string; actions: string[] }> = {
  "Strategic Partnership": {
    stance: "Joint roadmap & QBR",
    actions: ["Co-invest in innovation", "Multi-year agreements", "Joint business reviews quarterly", "Shared KPIs and targets"],
  },
  "Supplier Leverage Risk": {
    stance: "De-risk & dual-source",
    actions: ["Qualify alternative suppliers", "Tighten SLAs with penalties", "Build safety stock", "Reduce dependency through standardization"],
  },
  "Customer Leverage": {
    stance: "Rebid & demand concessions",
    actions: ["Competitive rebid every 2 years", "Demand volume discounts", "Standardize requirements", "Consider insourcing"],
  },
  "Easy Manage": {
    stance: "Automate & keep transactional",
    actions: ["Automate ordering/POs", "Catalog-based purchasing", "Minimal management overhead", "Consider consolidation or elimination"],
  },
}

// ─── Tier Dependencies ──────────────────────────────────────────────────────

export interface TierDependency {
  id: string
  parentId: string
  name: string
  role: string
  tier: 2 | 3
  riskFlags: string[]
  mitigation: string
}

export const tierDependencies: TierDependency[] = [
  { id: "td-1",  parentId: "fs-1", name: "Dana Incorporated",        role: "Drivetrain & axle assemblies",          tier: 2, riskFlags: [],                                mitigation: "Maintain dual-source with alternative axle supplier." },
  { id: "td-2",  parentId: "fs-1", name: "Martinrea International",  role: "Metal stampings & fluid systems",       tier: 2, riskFlags: ["geo-concentration"],              mitigation: "Qualify secondary stamping source outside Ontario corridor." },
  { id: "td-3",  parentId: "fs-1", name: "SK Innovation",            role: "EV battery cell supply",                tier: 2, riskFlags: ["single-source", "regulatory"],     mitigation: "Negotiate capacity reservation and monitor IRA compliance." },
  { id: "td-4",  parentId: "fs-2", name: "Valeo SE",                 role: "Electrification & ADAS components",     tier: 2, riskFlags: [],                                mitigation: "Standard review during annual QBR cycle." },
  { id: "td-5",  parentId: "fs-2", name: "Faurecia / FORVIA",        role: "Interior systems & hydrogen storage",   tier: 2, riskFlags: ["capacity-constraint"],             mitigation: "Secure allocation commitment 12 months ahead." },
  { id: "td-6",  parentId: "fs-2", name: "Saft Groupe (Total)",      role: "Battery modules (EU production)",       tier: 3, riskFlags: ["geo-concentration"],              mitigation: "Explore CATL or BYD as alternative EU cell source." },
  { id: "td-7",  parentId: "fs-3", name: "Cox Automotive",           role: "Remarketing & auction services",        tier: 2, riskFlags: [],                                mitigation: "Maintain KAR Global as secondary auction partner." },
  { id: "td-8",  parentId: "fs-3", name: "Donlen (a Hertz company)", role: "Overflow lease administration",         tier: 2, riskFlags: ["capacity-constraint"],             mitigation: "Cap overflow volume at 15% of total portfolio." },
  { id: "td-9",  parentId: "fs-3", name: "ChargePoint",              role: "EV charging network & depot hardware",  tier: 3, riskFlags: ["single-source"],                  mitigation: "Pilot Blink or ABB chargers at two depot sites." },
  { id: "td-10", parentId: "fs-4", name: "ALD Automotive / Ayvens",  role: "Co-sourcing partner in EMEA markets",   tier: 2, riskFlags: [],                                mitigation: "Review co-sourcing SLA annually." },
  { id: "td-11", parentId: "fs-4", name: "Allstar Business Solutions",role: "Fuel card & expense management",       tier: 2, riskFlags: ["geo-concentration"],              mitigation: "Evaluate WEX or FleetCor for multi-market fuel coverage." },
  { id: "td-12", parentId: "fs-5", name: "PHH Fleet Management",     role: "Outsourced driver services (US)",       tier: 2, riskFlags: [],                                mitigation: "Benchmark service levels against Wheels annually." },
  { id: "td-13", parentId: "fs-5", name: "Wheels Inc.",              role: "Specialty vehicle program management",  tier: 2, riskFlags: ["capacity-constraint"],             mitigation: "Define maximum vehicle count per specialty programme." },
  { id: "td-14", parentId: "fs-6", name: "Quectel Wireless",        role: "IoT cellular modules",                  tier: 2, riskFlags: ["geo-concentration", "single-source"], mitigation: "Qualify Sierra Wireless modules as fallback." },
  { id: "td-15", parentId: "fs-6", name: "STMicroelectronics",      role: "Accelerometer & sensor chipsets",        tier: 3, riskFlags: [],                                mitigation: "Hold 90-day safety stock of sensor ICs." },
  { id: "td-16", parentId: "fs-7", name: "Ryder System",            role: "Overflow truck leasing",                tier: 2, riskFlags: [],                                mitigation: "Annual rate benchmarking against market indices." },
  { id: "td-17", parentId: "fs-7", name: "Cummins Inc.",            role: "Diesel & natural gas powertrains",      tier: 2, riskFlags: ["regulatory"],                     mitigation: "Track EPA/EU Stage VI timelines; plan transition path." },
  { id: "td-18", parentId: "fs-8", name: "ARI Fleet Management",    role: "Subcontracted fleet admin in EMEA",     tier: 2, riskFlags: [],                                mitigation: "Include performance penalties in subcontract." },
  { id: "td-19", parentId: "fs-8", name: "National Car Rental",     role: "Short-term rental pool (sister co.)",   tier: 2, riskFlags: [],                                mitigation: "Monitor intercompany pricing vs. market rates." },
  { id: "td-20", parentId: "fs-9", name: "Bandag (Bridgestone sub.)",role: "Retread tire manufacturing",           tier: 2, riskFlags: [],                                mitigation: "Verify retread quality KPIs quarterly." },
  { id: "td-21", parentId: "fs-9", name: "TireConnect",             role: "Digital ordering & dealer network",     tier: 3, riskFlags: ["capacity-constraint"],             mitigation: "Onboard second digital ordering platform as backup." },
  { id: "td-22", parentId: "fs-10",name: "Knapheide Mfg.",          role: "Truck body & upfit manufacturing",      tier: 2, riskFlags: ["single-source"],                  mitigation: "Qualify Reading Truck Body for parallel upfit work." },
  { id: "td-23", parentId: "fs-10",name: "Adrian Steel",            role: "Van interior upfit packages",           tier: 2, riskFlags: [],                                mitigation: "Standard review cycle; low-risk dependency." },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getFleetSupplierById(id: string): FleetSupplier | undefined {
  return fleetSuppliers.find((s) => s.id === id)
}

export function getFleetSuppliersByType(type: SupplierType): FleetSupplier[] {
  return fleetSuppliers.filter((s) => s.type === type)
}

export const SUPPLIER_TYPE_COLORS: Record<SupplierType, string> = {
  OEM: "#2563eb",
  Dealer: "#7c3aed",
  FMC: "#0891b2",
  Maintenance: "#d97706",
  Telematics: "#059669",
  Remarketing: "#dc2626",
  Insurance: "#0d9488",
}

export const ALL_SUPPLIER_TYPES: SupplierType[] = ["OEM", "Dealer", "FMC", "Maintenance", "Telematics", "Remarketing", "Insurance"]

export function formatCurrencyShort(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

// ─── Full Supplier Profile (Internal + External) ──────────────────────────────

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
  riskScore: number
  rag: "green" | "yellow" | "red"
  topRisks: string[]
  mitigationStatus: string
  nextMilestoneDate: string
  opportunities?: string[]
}

export interface PerformanceGovernance {
  lastQbrDate: string
  qbrRating: number
  slaComplianceLq: number
  slaComplianceT12: number
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

export interface FleetSupplierProfileFull {
  supplierId: string
  supplierName: string
  supplierType: string
  tier: string
  category: string
  regionsServed: string[]
  strategicFlags: string[]
  primaryContact: SupplierContact
  accountOwner: SupplierContact
  commercial: CommercialRelationship
  performance: PerformanceGovernance
  spendConcentration: {
    topSkus: SpendConcentrationRow[]
    topBusSites: string[]
    categoryTags: string[]
  }
  internalRisk: InternalRiskSnapshot
  externalFinancials: ExternalFinancials
  externalFootprint: ExternalFootprint
  keyProducts: string[]
  customers: string[]
  businessGoals: string[]
  recentNews: ExternalNews[]
  majorExternalRisks: string[]
}

// ─── Mock Full Fleet Supplier Profiles ──────────────────────────────────────

export const fleetSupplierProfilesFull: Record<string, FleetSupplierProfileFull> = {
  "fs-1": {
    supplierId: "fs-1",
    supplierName: "Ford Motor Company",
    supplierType: "OEM",
    tier: "Tier 1",
    category: "Vehicle Manufacturing",
    regionsServed: ["North America", "EMEA"],
    strategicFlags: ["Strategic", "EV-ready"],
    primaryContact: { name: "Rachel Torres", title: "National Fleet Director", email: "r.torres@ford.com", phone: "+1 313-555-0199" },
    accountOwner: { name: "Marcus Rodriguez", title: "Category Manager -- OEM", email: "m.rodriguez@meridian.com" },
    commercial: {
      totalAnnualSpend: 8_400_000,
      spendTrendYoY: 3.8,
      spendTrendArrow: "up",
      contractType: "Master Supply Agreement",
      commercialModel: "Volume-based fleet incentive + residual value guarantee",
      contractStart: "2023-Q2",
      renewalDate: "2027-Q2",
      terminationNoticeDays: 120,
      relationshipYears: 8,
      businessCriticality: "High",
      sourcingStatus: "Multi",
      rebateFeesSummary: "Volume rebate 3.5-5.2% tiered by annual units (>200 = 5.2%)",
      priceIndexClause: true,
      priceIndexNote: "Steel & aluminum index pass-through, reviewed quarterly",
      paymentTerms: "Net 30",
      invoiceAccuracy: 97,
    },
    performance: {
      lastQbrDate: "2026-01-20",
      qbrRating: 4.2,
      slaComplianceLq: 94,
      slaComplianceT12: 91,
      otdPct: 88,
      leadTimeScore: "8-12 wk avg (target: 8 wk)",
      qualityMetricLabel: "Warranty Claims/100",
      qualityMetricValue: "3.2 (target: 2.5)",
      returnsClaimsRate: "0.4%",
      issueResolutionDays: 8,
      openIncidents: 2,
      incidentAging: "None > 14 days",
      reportingQualityScore: "A- (strong)",
      dataTimeliness: "Monthly, 3-day lag",
      complianceSecurityScore: "Pass",
      openActionItems: 4,
      capaStatus: "On track",
    },
    spendConcentration: {
      topSkus: [
        { skuOrService: "Ford Transit 250 (Cargo Van)", pctOfTotal: 35, volume: "280 units" },
        { skuOrService: "Ford Escape SE (Field Rep)", pctOfTotal: 25, volume: "200 units" },
        { skuOrService: "F-150 Lightning (EV Pilot)", pctOfTotal: 18, volume: "140 units" },
        { skuOrService: "Maverick Hybrid (Urban)", pctOfTotal: 14, volume: "110 units" },
        { skuOrService: "Mustang Mach-E (Exec Pilot)", pctOfTotal: 8, volume: "65 units" },
      ],
      topBusSites: ["Field Sales -- East Region", "Medical Device Logistics", "Exec Fleet Program"],
      categoryTags: ["Cargo Vans", "SUVs", "Pickup Trucks", "EVs"],
    },
    internalRisk: {
      riskScore: 22,
      rag: "green",
      topRisks: [
        "Delivery lead times stretching to 12 weeks on Transit 250 (target: 8 wk)",
        "Model year transition gaps causing 3-4 week ordering blackouts",
        "EV parts availability (Lightning) limited to select dealers",
      ],
      mitigationStatus: "Pre-ordering pipeline established; backup Stellantis allocation for Transit gaps",
      nextMilestoneDate: "2026-Q3",
      opportunities: [
        "Expand Lightning pilot from 10 to 30 metros -- est. fuel savings $420K/yr",
        "Negotiate connected vehicle data API access for predictive maintenance",
        "Standardize model list from 8 to 5 configs to reduce lead time variability",
      ],
    },
    externalFinancials: {
      annualRevenue: 176_000_000_000,
      operatingMargin: 5.8,
      creditRating: "BBB+ (S&P)",
      ownershipType: "Public (NYSE: F)",
      hqLocation: "Dearborn, MI, USA",
      employees: "~177,000",
      diversityStatus: true,
      tier2Reporting: true,
      sbtiCertified: true,
      certifications: ["ISO 9001", "ISO 14001", "IATF 16949"],
    },
    externalFootprint: {
      regions: ["North America", "Europe", "Asia-Pacific", "South America"],
      countries: 35,
      locations: 60,
      keyRegions: ["Dearborn, MI (HQ + R&D)", "Louisville, KY (Assembly)", "Cologne, Germany (EU HQ)", "Chennai, India (APAC)"],
      industries: ["Automotive", "Commercial Fleet", "Government", "Rental"],
    },
    keyProducts: [
      "Transit and E-Transit commercial vans",
      "F-150 and F-150 Lightning pickup trucks",
      "Escape, Bronco Sport, and Mustang Mach-E crossovers",
      "Maverick compact hybrid pickup",
      "Ford Pro commercial vehicle services and telematics",
      "FordPass Connect / Ford Pro Intelligence platform",
    ],
    customers: ["Enterprise fleet operators", "Government agencies", "Pharma and medical device companies", "Rental car companies", "Utility and telecom fleets"],
    businessGoals: [
      "Reach 2M annual EV production capacity by 2027",
      "Ford Pro (commercial) to become $70B business by 2028",
      "Achieve carbon neutrality in manufacturing by 2035",
      "Expand connected vehicle services to 30M+ vehicles",
      "Reduce average delivery lead time for fleet orders by 20%",
    ],
    recentNews: [
      { date: "Nov 2025", headline: "Ford Pro Intelligence platform surpasses 500K connected fleet vehicles" },
      { date: "Jan 2026", headline: "Announced next-gen E-Transit with 40% more range (280 mi)" },
      { date: "Feb 2026", headline: "Q4 2025 earnings beat expectations; fleet revenue up 12% YoY" },
    ],
    majorExternalRisks: [
      "Supply chain: Semiconductor and battery cell supply constraints persist for EV models",
      "Financial: Heavy EV capex ($50B through 2028) pressuring margins; ICE subsidizing EV losses",
      "Regulatory: Tightening EPA emissions standards may force accelerated ICE phase-out",
      "Labor: UAW contract renewal in 2027; potential strike risk",
      "Competitive: Tesla and Chinese OEMs (BYD) gaining commercial fleet share",
    ],
  },
  "fs-3": {
    supplierId: "fs-3",
    supplierName: "Holman Enterprises",
    supplierType: "FMC",
    tier: "Tier 1",
    category: "Fleet Management",
    regionsServed: ["North America"],
    strategicFlags: ["Strategic", "Preferred"],
    primaryContact: { name: "David Chen", title: "VP Client Services", email: "d.chen@holman.com", phone: "+1 856-555-0177" },
    accountOwner: { name: "Sarah Chen", title: "Senior Category Manager -- FMC", email: "s.chen@meridian.com" },
    commercial: {
      totalAnnualSpend: 9_600_000,
      spendTrendYoY: 6.2,
      spendTrendArrow: "up",
      contractType: "Managed Services Agreement",
      commercialModel: "Per-vehicle monthly management fee + transparent pass-through costs",
      contractStart: "2023-Q4",
      renewalDate: "2027-Q4",
      terminationNoticeDays: 180,
      relationshipYears: 12,
      businessCriticality: "High",
      sourcingStatus: "Single",
      rebateFeesSummary: "Management fee $42/vehicle/month; maintenance pass-through at cost + 0%",
      priceIndexClause: true,
      priceIndexNote: "CPI-linked escalation cap of 3.5% annually on management fee",
      paymentTerms: "Net 30",
      invoiceAccuracy: 98,
    },
    performance: {
      lastQbrDate: "2025-12-18",
      qbrRating: 4.5,
      slaComplianceLq: 96,
      slaComplianceT12: 94,
      otdPct: 95,
      leadTimeScore: "Vehicle ordering: 2 days (target: 3 days)",
      qualityMetricLabel: "Driver Satisfaction",
      qualityMetricValue: "4.3/5 (target: 4.0)",
      returnsClaimsRate: "0.2%",
      issueResolutionDays: 4,
      openIncidents: 1,
      incidentAging: "None > 7 days",
      reportingQualityScore: "A+ (excellent)",
      dataTimeliness: "Real-time portal; monthly executive summary",
      complianceSecurityScore: "Pass (SOC 2 Type II)",
      openActionItems: 2,
      capaStatus: "On track",
    },
    spendConcentration: {
      topSkus: [
        { skuOrService: "Full lifecycle management", pctOfTotal: 38, volume: "~1,200 vehicles" },
        { skuOrService: "Maintenance management", pctOfTotal: 28, volume: "$2.7M pass-through" },
        { skuOrService: "Lease administration", pctOfTotal: 18, volume: "850 leases" },
        { skuOrService: "Driver services & app", pctOfTotal: 10, volume: "1,200 drivers" },
        { skuOrService: "EV transition consulting", pctOfTotal: 6, volume: "4 active projects" },
      ],
      topBusSites: ["Field Sales NA -- All Divisions", "Medical Device Logistics", "Executive Fleet"],
      categoryTags: ["Fleet Management", "Lease Admin", "Maintenance", "Driver Services", "EV Consulting"],
    },
    internalRisk: {
      riskScore: 18,
      rag: "green",
      topRisks: [
        "Concentration risk: Single FMC for entire NA fleet (~1,200 vehicles)",
        "Fee escalation clause approaching CPI cap (3.2% vs 3.5% cap)",
        "Data portability untested -- switching cost could be significant",
      ],
      mitigationStatus: "LeasePlan qualified as backup FMC for NA; data export tested in sandbox",
      nextMilestoneDate: "2026-Q2",
      opportunities: [
        "Consolidate remaining 120 off-contract vehicles into Holman MSA: est. $85K savings",
        "EV charging infrastructure planning for top-20 driver home locations",
        "Integrate Holman reporting with Geotab for unified fleet intelligence dashboard",
      ],
    },
    externalFinancials: {
      annualRevenue: 4_200_000_000,
      operatingMargin: 12.5,
      creditRating: "BBB (S&P equivalent -- private)",
      ownershipType: "Private (family-owned, 4th generation)",
      hqLocation: "Mount Laurel, NJ, USA",
      employees: "~2,700",
      diversityStatus: false,
      tier2Reporting: true,
      sbtiCertified: false,
      certifications: ["SOC 2 Type II", "ISO 27001"],
    },
    externalFootprint: {
      regions: ["North America"],
      countries: 2,
      locations: 18,
      keyRegions: ["Mount Laurel, NJ (HQ)", "Dallas, TX (Western ops)", "Toronto, ON (Canada)", "Chicago, IL (Midwest hub)"],
      industries: ["Pharma", "Biotech", "Medical Device", "Healthcare", "Financial Services"],
    },
    keyProducts: [
      "Full fleet lifecycle management (order-to-disposal)",
      "Lease administration and financing",
      "Managed maintenance program with 50K+ service locations",
      "Driver services (mobile app, roadside, fuel card)",
      "EV transition consulting and TCO modeling",
      "Fleet analytics and reporting platform (HolmanConnect)",
    ],
    customers: ["Mid-to-large pharma/biotech companies", "Medical device manufacturers", "Financial services firms", "Healthcare organizations"],
    businessGoals: [
      "Grow pharma vertical to 40% of total fleet under management",
      "Launch EV-first fleet management product by Q3 2026",
      "Achieve SOC 2 Type II + ISO 27001 dual certification (completed)",
      "Expand Canadian operations to support cross-border fleets",
      "Invest in AI-powered fleet optimization recommendations",
    ],
    recentNews: [
      { date: "Sep 2025", headline: "Launched HolmanConnect 2.0 analytics platform with predictive maintenance" },
      { date: "Dec 2025", headline: "Won 'Best Pharma Fleet Partner' at Fleet Management Weekly awards" },
      { date: "Feb 2026", headline: "Expanded Canadian presence with new Toronto operations center" },
    ],
    majorExternalRisks: [
      "Financial: Private company with limited financial transparency; valuation tied to family succession",
      "Concentration: Heavy pharma vertical focus (35% of revenue) creates sector-specific risk",
      "Competitive: Element Fleet and ARI gaining share in pharma vertical",
      "Technology: Platform modernization lagging vs. digital-native competitors",
      "Labor: Fleet coordinator turnover at 18% (industry avg: 15%)",
    ],
  },
  "fs-9": {
    supplierId: "fs-9",
    supplierName: "Geotab Inc.",
    supplierType: "Telematics",
    tier: "Tier 1",
    category: "Telematics & Connected Vehicle",
    regionsServed: ["North America", "EMEA", "APAC"],
    strategicFlags: ["Strategic", "Innovation"],
    primaryContact: { name: "Anita Sharma", title: "Enterprise Account Executive", email: "a.sharma@geotab.com", phone: "+1 905-555-0134" },
    accountOwner: { name: "David Park", title: "Category Manager -- Technology", email: "d.park@meridian.com" },
    commercial: {
      totalAnnualSpend: 2_800_000,
      spendTrendYoY: 8.4,
      spendTrendArrow: "up",
      contractType: "SaaS Subscription + Hardware",
      commercialModel: "Per-vehicle monthly SaaS subscription + one-time hardware cost",
      contractStart: "2024-Q1",
      renewalDate: "2028-Q1",
      terminationNoticeDays: 90,
      relationshipYears: 5,
      businessCriticality: "High",
      sourcingStatus: "Sole",
      rebateFeesSummary: "$22/vehicle/month SaaS + $180 hardware per unit (amortized over 36 months)",
      priceIndexClause: false,
      paymentTerms: "Net 30",
      invoiceAccuracy: 99,
    },
    performance: {
      lastQbrDate: "2025-12-05",
      qbrRating: 4.8,
      slaComplianceLq: 99,
      slaComplianceT12: 98,
      otdPct: 97,
      leadTimeScore: "Hardware: 2-3 wk (target: 3 wk)",
      qualityMetricLabel: "Device Uptime",
      qualityMetricValue: "99.7% (target: 99.5%)",
      returnsClaimsRate: "0.8% (hardware defect)",
      issueResolutionDays: 3,
      openIncidents: 0,
      incidentAging: "N/A",
      reportingQualityScore: "A+ (excellent)",
      dataTimeliness: "Real-time (<5 sec latency); API access 24/7",
      complianceSecurityScore: "Pass (SOC 2 Type II, ISO 27001)",
      openActionItems: 1,
      capaStatus: "On track",
    },
    spendConcentration: {
      topSkus: [
        { skuOrService: "GO9+ OBD-II Device (hardware)", pctOfTotal: 22, volume: "1,200 units deployed" },
        { skuOrService: "MyGeotab SaaS Platform", pctOfTotal: 45, volume: "1,200 subscriptions" },
        { skuOrService: "EV Battery Analytics Add-on", pctOfTotal: 15, volume: "320 EV units" },
        { skuOrService: "Driver Behavior Module", pctOfTotal: 12, volume: "1,200 drivers" },
        { skuOrService: "Custom API Integration", pctOfTotal: 6, volume: "3 active integrations" },
      ],
      topBusSites: ["Global Fleet Analytics", "Field Sales -- All Regions", "EV Transition Program"],
      categoryTags: ["Telematics", "IoT", "Driver Safety", "EV Analytics", "API Integration"],
    },
    internalRisk: {
      riskScore: 15,
      rag: "green",
      topRisks: [
        "Sole-source dependency: No qualified alternative telematics provider",
        "Data privacy risk: CCPA/GDPR exposure from driver location tracking",
        "Hardware refresh cycle: GO9 devices approaching end-of-life (2027)",
      ],
      mitigationStatus: "Samsara evaluated as backup; CCPA policy review with Legal completed Q4 2025",
      nextMilestoneDate: "2026-Q3",
      opportunities: [
        "Integrate Geotab data with Zurich Insurance for 8-12% premium discount",
        "EV range optimization: reduce range anxiety incidents by 40%",
        "Driver safety gamification program to reduce accident frequency 15%",
      ],
    },
    externalFinancials: {
      annualRevenue: 800_000_000,
      operatingMargin: 22.0,
      creditRating: "BB+ (S&P equivalent -- private)",
      ownershipType: "Private (founder-led)",
      hqLocation: "Oakville, ON, Canada",
      employees: "~3,200",
      diversityStatus: true,
      tier2Reporting: false,
      sbtiCertified: false,
      certifications: ["SOC 2 Type II", "ISO 27001", "FedRAMP (pending)"],
    },
    externalFootprint: {
      regions: ["North America", "Europe", "Asia-Pacific", "Latin America"],
      countries: 18,
      locations: 22,
      keyRegions: ["Oakville, ON (HQ + R&D)", "Las Vegas, NV (US ops)", "London, UK (EMEA HQ)", "Sydney, Australia (APAC)"],
      industries: ["Pharma", "Logistics", "Government", "Energy/Utilities", "Construction", "Rental"],
    },
    keyProducts: [
      "GO9+ and GO Device OBD-II telematics hardware",
      "MyGeotab cloud-based fleet management platform",
      "Geotab Data Intelligence (AI-powered fleet analytics)",
      "EV Suitability Assessment and battery health monitoring",
      "Driver behavior scoring and coaching tools",
      "Open API platform with 4,000+ marketplace integrations",
      "Geotab Keyless (connected vehicle access)",
    ],
    customers: ["Enterprise fleet operators (4M+ connected vehicles)", "Government agencies", "Pharma and healthcare fleets", "Logistics and delivery companies"],
    businessGoals: [
      "Reach 5M connected vehicles globally by 2027",
      "Launch Geotab Keyless for fleet vehicle sharing in Q2 2026",
      "Expand FedRAMP authorization for US government contracts",
      "Grow EV analytics module to 30% of revenue by 2028",
      "Achieve SBTi commitment by end of 2026",
    ],
    recentNews: [
      { date: "Oct 2025", headline: "Surpassed 4 million connected vehicles globally" },
      { date: "Dec 2025", headline: "Launched AI-powered predictive maintenance feature in MyGeotab" },
      { date: "Feb 2026", headline: "Announced strategic partnership with ChargePoint for EV charging optimization" },
    ],
    majorExternalRisks: [
      "Privacy: CCPA and GDPR class action risk from driver location data collection",
      "Cyber: High-value target for vehicle data; SOC 2 audit finding on data retention in 2025",
      "Geopolitical: Quectel (Chinese IoT chipset supplier) exposed to US-China export controls",
      "Competitive: Samsara IPO and rapid growth pressuring Geotab market share in mid-market",
      "Technology: Hardware refresh cycle creates one-time cost spike every 4-5 years",
    ],
  },
  "fs-11": {
    supplierId: "fs-11",
    supplierName: "Zurich Fleet Insurance",
    supplierType: "Insurance",
    tier: "Tier 1",
    category: "Motor Fleet Insurance",
    regionsServed: ["North America", "EMEA"],
    strategicFlags: ["Strategic"],
    primaryContact: { name: "Sophie Mueller", title: "Head of Fleet Programs", email: "s.mueller@zurich.com", phone: "+41 44-555-0188" },
    accountOwner: { name: "Emily Watson", title: "Category Manager -- Insurance & Risk", email: "e.watson@meridian.com" },
    commercial: {
      totalAnnualSpend: 3_800_000,
      spendTrendYoY: 4.1,
      spendTrendArrow: "up",
      contractType: "Global Fleet Insurance Program",
      commercialModel: "Annual premium based on fleet size, vehicle types, and claims history",
      contractStart: "2024-Q1",
      renewalDate: "2027-Q1",
      terminationNoticeDays: 120,
      relationshipYears: 6,
      businessCriticality: "High",
      sourcingStatus: "Single",
      rebateFeesSummary: "No rebates; premium discounted 8% for telematics-equipped vehicles",
      priceIndexClause: true,
      priceIndexNote: "Premium tied to loss ratio + market insurance index, reviewed annually",
      paymentTerms: "Quarterly premium installments",
      invoiceAccuracy: 96,
    },
    performance: {
      lastQbrDate: "2025-11-15",
      qbrRating: 4.0,
      slaComplianceLq: 93,
      slaComplianceT12: 92,
      otdPct: 94,
      leadTimeScore: "Claims first contact: <48 hr (target: 48 hr)",
      qualityMetricLabel: "Claims Resolution",
      qualityMetricValue: "18 days avg (target: 21 days)",
      returnsClaimsRate: "N/A (insurance)",
      issueResolutionDays: 6,
      openIncidents: 2,
      incidentAging: "1 at 21 days",
      reportingQualityScore: "A- (strong)",
      dataTimeliness: "Monthly loss runs; quarterly risk engineering reports",
      complianceSecurityScore: "Pass (Solvency II compliant)",
      openActionItems: 3,
      capaStatus: "On track",
    },
    spendConcentration: {
      topSkus: [
        { skuOrService: "Motor fleet policy (NA)", pctOfTotal: 48 },
        { skuOrService: "Motor fleet policy (EMEA)", pctOfTotal: 28 },
        { skuOrService: "Liability & umbrella", pctOfTotal: 12 },
        { skuOrService: "Accident management services", pctOfTotal: 8 },
        { skuOrService: "Risk engineering & driver training", pctOfTotal: 4 },
      ],
      topBusSites: ["Field Sales NA", "Field Sales EMEA", "Medical Device Logistics"],
      categoryTags: ["Motor Insurance", "Liability", "Accident Management", "Risk Engineering"],
    },
    internalRisk: {
      riskScore: 20,
      rag: "green",
      topRisks: [
        "Premium escalation risk: 3 large claims in Q3 2025 may impact renewal pricing",
        "EV repair cost uncertainty: Average EV claim 38% higher than ICE equivalent",
        "Coverage gaps in emerging APAC markets not yet addressed",
      ],
      mitigationStatus: "Driver safety program launched; Geotab integration for usage-based pricing in progress",
      nextMilestoneDate: "2026-Q2",
      opportunities: [
        "Telematics-linked premium discount: est. 8-12% savings ($300-450K/yr)",
        "Driver training program to reduce claims frequency by 15%",
        "Consolidate APAC coverage into global program (currently spot-insured)",
      ],
    },
    externalFinancials: {
      annualRevenue: 75_000_000_000,
      operatingMargin: 14.0,
      creditRating: "AA- (S&P)",
      ownershipType: "Public (SIX: ZURN)",
      hqLocation: "Zurich, Switzerland",
      employees: "~56,000",
      diversityStatus: true,
      tier2Reporting: true,
      sbtiCertified: true,
      certifications: ["Solvency II", "ISO 9001", "ISO 14001", "ISO 27001"],
    },
    externalFootprint: {
      regions: ["North America", "Europe", "Asia-Pacific", "Latin America"],
      countries: 200,
      locations: 350,
      keyRegions: ["Zurich, Switzerland (Global HQ)", "Schaumburg, IL (North America HQ)", "London, UK (EMEA Commercial)", "Singapore (APAC)"],
      industries: ["Insurance", "Risk Management", "Fleet Services", "Commercial Lines"],
    },
    keyProducts: [
      "Global motor fleet insurance programs",
      "Comprehensive liability and umbrella coverage",
      "Accident management and claims services",
      "Risk engineering and loss prevention consulting",
      "Driver safety training programs",
      "EV-specific coverage products (battery, charging liability)",
      "Telematics-integrated usage-based insurance",
    ],
    customers: ["Global corporations with 500+ vehicle fleets", "Pharma and healthcare companies", "Financial services firms", "Technology companies", "Manufacturing enterprises"],
    businessGoals: [
      "Grow fleet insurance premium by 8% annually through 2028",
      "Launch telematics-integrated pricing in 15 markets by 2027",
      "Reduce average claims resolution to 14 days",
      "Achieve carbon-neutral operations by 2030",
      "Expand EV coverage products as fleet electrification accelerates",
    ],
    recentNews: [
      { date: "Aug 2025", headline: "Launched global EV fleet insurance product with battery degradation coverage" },
      { date: "Nov 2025", headline: "Partnered with Geotab for telematics-linked fleet risk scoring" },
      { date: "Jan 2026", headline: "Named #1 fleet insurer by Insurance Business Magazine for 3rd consecutive year" },
    ],
    majorExternalRisks: [
      "Financial: Rising reinsurance costs may be passed through to fleet premiums",
      "Regulatory: Solvency II capital adequacy review (routine, no concerns flagged)",
      "Claims: EV repair costs 38% higher than ICE -- uncertain trajectory as fleet electrifies",
      "Competitive: AXA and Allianz aggressively pricing to win large fleet accounts",
      "Cyber: Insurance industry increasingly targeted; Zurich has strong controls but sector risk elevated",
    ],
  },
}

export function getFleetSupplierProfileFull(id: string): FleetSupplierProfileFull | undefined {
  return fleetSupplierProfilesFull[id]
}

// ─── Score Reasoning Data Model ─────────────────────────────────────────────

export interface CalcRow {
  metric: string
  value: string
  target: string
  weight: number
  contribution: number
  source: string
}

export interface DimensionReasoning {
  dimension: ScorecarDimension
  score: number
  priorScore: number
  change: number
  confidence: "High" | "Medium" | "Low"
  lastUpdated: string
  drivers: string[]
  calcs: CalcRow[]
}

export interface ScoreMover {
  dimension: ScorecarDimension
  direction: "up" | "down"
  delta: number
  reason: string
}

export interface ReasoningAction {
  id: string
  title: string
  playbookLink: string
  owner: string
  dueDate: string
  status: ActionStatus
}

export interface SupplierScoreReasoning {
  supplierId: string
  overallScore: number
  priorOverallScore: number
  timePeriod: string
  dimensions: DimensionReasoning[]
  scoreMovers: ScoreMover[]
  actions: ReasoningAction[]
}

// Generate reasoning data for all 12 suppliers based on their scorecards
function generateReasoning(supplierId: string): SupplierScoreReasoning | undefined {
  const sc = supplierScorecards.find((x) => x.supplierId === supplierId)
  const supplier = fleetSuppliers.find((s) => s.id === supplierId)
  if (!sc || !supplier) return undefined

  const scores = sc.scores
  const avg = Math.round(DIMENSION_IDS.reduce((a, d) => a + scores[d], 0) / DIMENSION_IDS.length)

  // Detailed reasoning for key suppliers
  const detailedData: Record<string, { dims: DimensionReasoning[]; movers: ScoreMover[]; acts: ReasoningAction[] }> = {
    "fs-1": {
      dims: [
        { dimension: "tco", score: 82, priorScore: 79, change: 3, confidence: "High", lastUpdated: "2026-02-15",
          drivers: ["Volume rebate utilization improved from 3.5% to 4.8% tier", "Residual value guarantee saved $320K vs open-market disposal", "Model standardization reduced per-unit options cost by $1,200"],
          calcs: [
            { metric: "Avg unit cost vs benchmark", value: "$38,400", target: "$37,000", weight: 30, contribution: 24, source: "Ford Fleet Pricing Portal" },
            { metric: "Volume rebate realization", value: "4.8%", target: "5.2%", weight: 25, contribution: 22, source: "Holman Invoice Data" },
            { metric: "Residual value realization", value: "94%", target: "92%", weight: 20, contribution: 19, source: "ADESA Auction Results" },
            { metric: "Total lifecycle cost/mile", value: "$0.48", target: "$0.45", weight: 25, contribution: 17, source: "Holman TCO Model" },
          ],
        },
        { dimension: "delivery", score: 70, priorScore: 74, change: -4, confidence: "Medium", lastUpdated: "2026-02-10",
          drivers: ["Transit 250 lead time stretched to 12 weeks (target: 8 wk)", "Model year transition created 3-week ordering blackout in Q4", "Lightning allocation limited -- only 60% of orders fulfilled on time"],
          calcs: [
            { metric: "Avg order-to-delivery (weeks)", value: "10.2", target: "8.0", weight: 40, contribution: 26, source: "Ford Fleet Ordering System" },
            { metric: "On-time delivery rate", value: "82%", target: "92%", weight: 30, contribution: 22, source: "Holman Delivery Tracker" },
            { metric: "Ordering blackout days/year", value: "21", target: "7", weight: 15, contribution: 10, source: "Ford Model Year Calendar" },
            { metric: "EV allocation fulfillment", value: "60%", target: "90%", weight: 15, contribution: 12, source: "Ford Pro Portal" },
          ],
        },
        { dimension: "coverage", score: 88, priorScore: 86, change: 2, confidence: "High", lastUpdated: "2026-02-12",
          drivers: ["Expanded dealer service coverage to 98% of field rep territories", "Ford Pro mobile service launched in 8 new metros", "Gap remains in rural Western territories (MT, WY, ID)"],
          calcs: [
            { metric: "Territory coverage %", value: "98%", target: "99%", weight: 35, contribution: 31, source: "Ford Pro Dealer Locator" },
            { metric: "Avg distance to nearest service", value: "12 mi", target: "10 mi", weight: 25, contribution: 21, source: "Geotab Location Data" },
            { metric: "Mobile service availability", value: "62%", target: "75%", weight: 20, contribution: 17, source: "Ford Pro Mobile Service" },
            { metric: "EV-certified dealer %", value: "45%", target: "60%", weight: 20, contribution: 19, source: "Ford Dealer Certification DB" },
          ],
        },
        { dimension: "compliance", score: 90, priorScore: 89, change: 1, confidence: "High", lastUpdated: "2026-02-08",
          drivers: ["IATF 16949 certification maintained with zero major findings", "EPA emissions compliance confirmed for all fleet-eligible models", "One medium-severity recall (airbag sensor) affecting ~2% of fleet models"],
          calcs: [
            { metric: "Certification compliance %", value: "100%", target: "100%", weight: 30, contribution: 30, source: "Ford Quality Portal" },
            { metric: "Open recall count (fleet models)", value: "1", target: "0", weight: 25, contribution: 18, source: "NHTSA Recall Database" },
            { metric: "Regulatory audit findings", value: "0 major", target: "0 major", weight: 25, contribution: 25, source: "Ford Supplier Quality" },
            { metric: "Privacy/data compliance", value: "Pass", target: "Pass", weight: 20, contribution: 17, source: "Legal Review Q4 2025" },
          ],
        },
        { dimension: "claimsRepair", score: 75, priorScore: 72, change: 3, confidence: "Medium", lastUpdated: "2026-02-14",
          drivers: ["Warranty claims rate improved from 3.8 to 3.2 per 100 vehicles", "EV-specific repair turnaround remains slow (avg 8 days vs 4 days ICE)", "Collision repair network expanded but cycle time still above target"],
          calcs: [
            { metric: "Warranty claims/100 vehicles", value: "3.2", target: "2.5", weight: 30, contribution: 22, source: "Ford Warranty System" },
            { metric: "Avg repair turnaround (days)", value: "4.8", target: "3.0", weight: 30, contribution: 20, source: "Holman Service Tracker" },
            { metric: "First-time fix rate", value: "88%", target: "95%", weight: 20, contribution: 16, source: "Ford Pro Service Metrics" },
            { metric: "EV repair turnaround (days)", value: "8.2", target: "5.0", weight: 20, contribution: 17, source: "Ford EV Service Data" },
          ],
        },
        { dimension: "reporting", score: 80, priorScore: 78, change: 2, confidence: "High", lastUpdated: "2026-02-15",
          drivers: ["Ford Pro Intelligence portal provides real-time vehicle health data", "Monthly fleet reporting delivered consistently with 3-day lag", "API integration quality improved -- data completeness now at 94%"],
          calcs: [
            { metric: "Report delivery timeliness", value: "3 day lag", target: "2 day lag", weight: 25, contribution: 18, source: "Ford Pro Intelligence" },
            { metric: "Data completeness %", value: "94%", target: "98%", weight: 25, contribution: 20, source: "BI Data Quality Checks" },
            { metric: "API uptime", value: "99.2%", target: "99.5%", weight: 25, contribution: 22, source: "Ford Pro API Monitoring" },
            { metric: "Executive summary quality", value: "4.2/5", target: "4.5/5", weight: 25, contribution: 20, source: "Category Manager Review" },
          ],
        },
        { dimension: "innovation", score: 94, priorScore: 90, change: 4, confidence: "High", lastUpdated: "2026-02-15",
          drivers: ["F-150 Lightning pilot expanded to 15 metros with positive driver feedback (4.4/5)", "Ford Pro Intelligence platform integration with Geotab operational", "Next-gen E-Transit with 280-mile range announced for 2027 MY", "Connected vehicle data API enabling predictive maintenance alerts"],
          calcs: [
            { metric: "EV model availability (fleet)", value: "4 models", target: "3 models", weight: 25, contribution: 25, source: "Ford Fleet Catalog" },
            { metric: "Connected vehicle features", value: "12/15", target: "10/15", weight: 25, contribution: 23, source: "Ford Pro Product Roadmap" },
            { metric: "Innovation co-development", value: "3 active", target: "2 active", weight: 25, contribution: 24, source: "Joint Innovation Board" },
            { metric: "EV pilot satisfaction score", value: "4.4/5", target: "4.0/5", weight: 25, contribution: 22, source: "Driver Survey Q1 2026" },
          ],
        },
      ],
      movers: [
        { dimension: "innovation", direction: "up", delta: 4, reason: "Lightning pilot expansion + E-Transit announcement + Ford Pro Intelligence integration" },
        { dimension: "tco", direction: "up", delta: 3, reason: "Volume rebate tier advancement (3.5% to 4.8%) and model standardization savings" },
        { dimension: "delivery", direction: "down", delta: 4, reason: "Transit 250 lead time stretch to 12 weeks and Q4 model year ordering blackout" },
        { dimension: "claimsRepair", direction: "up", delta: 3, reason: "Warranty claims rate improvement from 3.8 to 3.2/100 vehicles" },
      ],
      acts: [
        { id: "ra-1", title: "Negotiate capacity reservation for Transit 250 to reduce lead time", playbookLink: "OEM", owner: "Marcus Rodriguez", dueDate: "2026-Q2", status: "In Progress" },
        { id: "ra-2", title: "Expand Lightning pilot from 15 to 30 metros", playbookLink: "OEM", owner: "Marcus Rodriguez", dueDate: "2026-Q3", status: "Not Started" },
        { id: "ra-3", title: "Standardize model list from 8 to 5 configurations", playbookLink: "OEM", owner: "Sarah Chen", dueDate: "2026-Q2", status: "In Progress" },
        { id: "ra-4", title: "Escalate EV repair turnaround time in next QBR", playbookLink: "OEM", owner: "Emily Watson", dueDate: "2026-Q2", status: "Not Started" },
      ],
    },
    "fs-3": {
      dims: [
        { dimension: "tco", score: 88, priorScore: 85, change: 3, confidence: "High", lastUpdated: "2026-02-14",
          drivers: ["Management fee ($42/veh/mo) at market midpoint but includes premium services", "Maintenance pass-through at cost +0% verified via open-book audit", "Consolidation of off-contract vehicles reduced admin overhead by $65K"],
          calcs: [
            { metric: "Management fee vs benchmark", value: "$42/mo", target: "$40/mo", weight: 25, contribution: 21, source: "FMC Market Benchmark 2026" },
            { metric: "Maint. cost per mile", value: "$0.082", target: "$0.085", weight: 25, contribution: 23, source: "Holman Open-Book Report" },
            { metric: "Total cost per vehicle/month", value: "$648", target: "$660", weight: 25, contribution: 23, source: "Holman Monthly Invoice" },
            { metric: "Admin overhead savings", value: "$65K", target: "$50K", weight: 25, contribution: 21, source: "Internal Finance Analysis" },
          ],
        },
        { dimension: "delivery", score: 92, priorScore: 90, change: 2, confidence: "High", lastUpdated: "2026-02-12",
          drivers: ["Vehicle ordering turnaround at 2 days (target: 3 days)", "New driver onboarding process reduced from 5 to 3 business days", "Fleet card activation same-day in 96% of cases"],
          calcs: [
            { metric: "Order processing time (days)", value: "2.0", target: "3.0", weight: 30, contribution: 28, source: "Holman Order System" },
            { metric: "Driver onboarding time (days)", value: "3.0", target: "5.0", weight: 25, contribution: 24, source: "HolmanConnect Portal" },
            { metric: "Fleet card activation SLA", value: "96%", target: "95%", weight: 25, contribution: 23, source: "Holman Driver Services" },
            { metric: "Exception handling time (hrs)", value: "6", target: "8", weight: 20, contribution: 17, source: "Holman Service Desk" },
          ],
        },
        { dimension: "coverage", score: 95, priorScore: 94, change: 1, confidence: "High", lastUpdated: "2026-02-10",
          drivers: ["50,000+ maintenance service locations across NA", "Driver mobile app coverage at 99.4% satisfaction for service location finding", "New Toronto operations center expanded Canadian coverage"],
          calcs: [
            { metric: "Service network locations", value: "50,000+", target: "45,000", weight: 30, contribution: 29, source: "Holman Network DB" },
            { metric: "Territory coverage %", value: "99.2%", target: "99%", weight: 30, contribution: 29, source: "Holman Coverage Analysis" },
            { metric: "Mobile app availability", value: "99.4%", target: "99%", weight: 20, contribution: 19, source: "HolmanConnect Uptime" },
            { metric: "Canadian coverage %", value: "94%", target: "95%", weight: 20, contribution: 18, source: "Holman Canada Ops" },
          ],
        },
        { dimension: "compliance", score: 94, priorScore: 93, change: 1, confidence: "High", lastUpdated: "2026-02-08",
          drivers: ["SOC 2 Type II + ISO 27001 dual certification achieved", "Policy compliance rate at 97.2% across all managed vehicles", "Zero data breach incidents in trailing 24 months"],
          calcs: [
            { metric: "Security certifications", value: "2/2", target: "2/2", weight: 25, contribution: 25, source: "Holman Compliance Team" },
            { metric: "Policy compliance rate", value: "97.2%", target: "95%", weight: 25, contribution: 24, source: "HolmanConnect Reporting" },
            { metric: "Data breach incidents", value: "0", target: "0", weight: 25, contribution: 25, source: "Holman Security Office" },
            { metric: "Regulatory audit score", value: "A+", target: "A", weight: 25, contribution: 20, source: "External Auditor Report" },
          ],
        },
        { dimension: "claimsRepair", score: 85, priorScore: 82, change: 3, confidence: "High", lastUpdated: "2026-02-14",
          drivers: ["Maintenance turnaround time reduced from 1.8 to 1.5 days", "Predictive maintenance via HolmanConnect 2.0 prevented 42 breakdowns in Q4", "First-time fix rate improved to 91%"],
          calcs: [
            { metric: "Avg maintenance turnaround", value: "1.5 days", target: "1.0 day", weight: 30, contribution: 24, source: "Holman Service Tracker" },
            { metric: "Predictive alerts actioned", value: "42", target: "30", weight: 25, contribution: 22, source: "HolmanConnect 2.0" },
            { metric: "First-time fix rate", value: "91%", target: "95%", weight: 25, contribution: 20, source: "Holman Quality Dashboard" },
            { metric: "Vehicle downtime hours/mo", value: "4.2", target: "3.0", weight: 20, contribution: 19, source: "Holman Downtime Report" },
          ],
        },
        { dimension: "reporting", score: 96, priorScore: 94, change: 2, confidence: "High", lastUpdated: "2026-02-15",
          drivers: ["HolmanConnect 2.0 provides real-time dashboards with customizable KPIs", "Executive monthly summary delivered within 24 hours of period close", "Data accuracy verified at 99.1% via automated reconciliation"],
          calcs: [
            { metric: "Real-time dashboard uptime", value: "99.6%", target: "99.5%", weight: 25, contribution: 24, source: "HolmanConnect SLA" },
            { metric: "Report delivery time", value: "24 hrs", target: "48 hrs", weight: 25, contribution: 25, source: "Holman Reporting Team" },
            { metric: "Data accuracy rate", value: "99.1%", target: "98%", weight: 25, contribution: 24, source: "BI Reconciliation Engine" },
            { metric: "Custom KPI availability", value: "18/20", target: "15/20", weight: 25, contribution: 23, source: "HolmanConnect Config" },
          ],
        },
        { dimension: "innovation", score: 90, priorScore: 86, change: 4, confidence: "Medium", lastUpdated: "2026-02-15",
          drivers: ["HolmanConnect 2.0 launched with predictive maintenance and AI recommendations", "EV transition consulting program with TCO modeling operational", "Geotab integration pilot delivering unified fleet intelligence", "AI-powered fleet optimization recommendations in beta"],
          calcs: [
            { metric: "Platform features vs roadmap", value: "88%", target: "80%", weight: 25, contribution: 24, source: "HolmanConnect Roadmap" },
            { metric: "EV consulting projects active", value: "4", target: "3", weight: 25, contribution: 23, source: "Holman EV Team" },
            { metric: "Integration maturity score", value: "3.8/5", target: "3.5/5", weight: 25, contribution: 22, source: "IT Integration Review" },
            { metric: "New feature adoption rate", value: "72%", target: "65%", weight: 25, contribution: 21, source: "HolmanConnect Analytics" },
          ],
        },
      ],
      movers: [
        { dimension: "innovation", direction: "up", delta: 4, reason: "HolmanConnect 2.0 launch with predictive maintenance + Geotab integration pilot" },
        { dimension: "tco", direction: "up", delta: 3, reason: "Off-contract vehicle consolidation + verified open-book maintenance savings" },
        { dimension: "claimsRepair", direction: "up", delta: 3, reason: "HolmanConnect predictive alerts prevented 42 breakdowns; turnaround improved to 1.5 days" },
        { dimension: "reporting", direction: "up", delta: 2, reason: "HolmanConnect 2.0 real-time dashboards with 24-hr executive summary delivery" },
      ],
      acts: [
        { id: "ra-5", title: "Consolidate remaining 120 off-contract vehicles into Holman MSA", playbookLink: "FMC", owner: "Sarah Chen", dueDate: "2026-Q2", status: "In Progress" },
        { id: "ra-6", title: "Complete Geotab-Holman unified dashboard integration", playbookLink: "FMC", owner: "David Park", dueDate: "2026-Q3", status: "In Progress" },
        { id: "ra-7", title: "Negotiate CPI escalation cap reduction from 3.5% to 3.0%", playbookLink: "FMC", owner: "Sarah Chen", dueDate: "2026-Q2", status: "Not Started" },
        { id: "ra-8", title: "Launch EV charging infrastructure plan for top-20 driver homes", playbookLink: "FMC", owner: "David Park", dueDate: "2026-Q3", status: "Not Started" },
      ],
    },
    "fs-9": {
      dims: [
        { dimension: "tco", score: 86, priorScore: 84, change: 2, confidence: "High", lastUpdated: "2026-02-15",
          drivers: ["SaaS rate of $22/veh/mo competitive vs market ($18-28 range)", "Hardware amortization model reduces upfront cost burden", "EV analytics add-on provides high ROI through range optimization savings"],
          calcs: [
            { metric: "SaaS rate vs benchmark", value: "$22/mo", target: "$20/mo", weight: 30, contribution: 25, source: "Telematics Market Survey" },
            { metric: "Hardware cost per unit", value: "$180", target: "$200", weight: 25, contribution: 22, source: "Geotab Price Sheet" },
            { metric: "ROI from EV analytics", value: "320%", target: "200%", weight: 25, contribution: 22, source: "Internal TCO Analysis" },
            { metric: "Integration cost savings", value: "$45K/yr", target: "$30K/yr", weight: 20, contribution: 17, source: "IT Budget Analysis" },
          ],
        },
        { dimension: "delivery", score: 95, priorScore: 93, change: 2, confidence: "High", lastUpdated: "2026-02-12",
          drivers: ["Hardware delivery at 2-3 weeks consistently meeting target", "SaaS provisioning same-day for new vehicles", "Device replacement turnaround under 48 hours"],
          calcs: [
            { metric: "Hardware delivery (weeks)", value: "2.4", target: "3.0", weight: 30, contribution: 29, source: "Geotab Order System" },
            { metric: "SaaS activation time", value: "Same day", target: "1 day", weight: 30, contribution: 29, source: "MyGeotab Provisioning" },
            { metric: "Device replacement time", value: "44 hrs", target: "48 hrs", weight: 20, contribution: 19, source: "Geotab RMA Tracker" },
            { metric: "Bulk deployment speed", value: "50/week", target: "40/week", weight: 20, contribution: 18, source: "Geotab Field Services" },
          ],
        },
        { dimension: "coverage", score: 94, priorScore: 92, change: 2, confidence: "High", lastUpdated: "2026-02-10",
          drivers: ["Cellular coverage at 99.7% across all fleet territories", "4,000+ marketplace integrations available", "ChargePoint partnership expanded EV charging visibility"],
          calcs: [
            { metric: "Cellular coverage %", value: "99.7%", target: "99.5%", weight: 30, contribution: 29, source: "Geotab Coverage Map" },
            { metric: "Marketplace integrations", value: "4,000+", target: "3,000", weight: 25, contribution: 24, source: "Geotab Marketplace" },
            { metric: "EV charging visibility", value: "92%", target: "85%", weight: 25, contribution: 23, source: "ChargePoint Partnership" },
            { metric: "International device support", value: "18 countries", target: "15", weight: 20, contribution: 18, source: "Geotab Global Ops" },
          ],
        },
        { dimension: "compliance", score: 96, priorScore: 95, change: 1, confidence: "High", lastUpdated: "2026-02-08",
          drivers: ["SOC 2 Type II and ISO 27001 certifications current", "CCPA/GDPR compliance verified in Q4 2025 legal review", "FedRAMP authorization pending -- on track for Q3 2026"],
          calcs: [
            { metric: "Security certifications", value: "2/2", target: "2/2", weight: 25, contribution: 25, source: "Geotab Security Team" },
            { metric: "Privacy audit score", value: "A", target: "A", weight: 25, contribution: 24, source: "Legal Privacy Review" },
            { metric: "Data retention compliance", value: "98%", target: "95%", weight: 25, contribution: 24, source: "SOC 2 Audit Report" },
            { metric: "Incident response time (hrs)", value: "2", target: "4", weight: 25, contribution: 23, source: "Geotab IR Team" },
          ],
        },
        { dimension: "claimsRepair", score: 88, priorScore: 86, change: 2, confidence: "High", lastUpdated: "2026-02-14",
          drivers: ["Device failure rate dropped to 0.8% (from 1.2%)", "RMA processing in under 48 hours consistently", "Predictive maintenance AI reducing false alert rate"],
          calcs: [
            { metric: "Device failure rate", value: "0.8%", target: "1.0%", weight: 30, contribution: 27, source: "Geotab RMA Database" },
            { metric: "RMA processing time (hrs)", value: "44", target: "48", weight: 25, contribution: 23, source: "Geotab Support Portal" },
            { metric: "False alert rate", value: "2.1%", target: "3.0%", weight: 25, contribution: 22, source: "MyGeotab Analytics" },
            { metric: "Support ticket resolution", value: "3 hrs", target: "4 hrs", weight: 20, contribution: 16, source: "Geotab Support SLA" },
          ],
        },
        { dimension: "reporting", score: 98, priorScore: 96, change: 2, confidence: "High", lastUpdated: "2026-02-15",
          drivers: ["Real-time data with <5 sec latency -- industry leading", "API access 24/7 with 99.9% uptime", "Custom dashboard builder with drag-and-drop KPIs", "AI-powered insights launched in Q4 2025"],
          calcs: [
            { metric: "Data latency (seconds)", value: "4.2", target: "5.0", weight: 25, contribution: 25, source: "MyGeotab Performance" },
            { metric: "API uptime", value: "99.9%", target: "99.5%", weight: 25, contribution: 25, source: "Geotab Status Page" },
            { metric: "Custom report capability", value: "Full", target: "Full", weight: 25, contribution: 24, source: "MyGeotab Features" },
            { metric: "AI insight accuracy", value: "91%", target: "85%", weight: 25, contribution: 24, source: "Geotab AI Validation" },
          ],
        },
        { dimension: "innovation", score: 96, priorScore: 92, change: 4, confidence: "High", lastUpdated: "2026-02-15",
          drivers: ["AI-powered predictive maintenance launched and reducing breakdowns 23%", "EV battery health monitoring with degradation forecasting", "ChargePoint partnership for charging optimization", "Geotab Keyless development on track for Q2 2026"],
          calcs: [
            { metric: "AI features deployed", value: "5/6", target: "4/6", weight: 25, contribution: 24, source: "Geotab Product Roadmap" },
            { metric: "EV analytics maturity", value: "4.5/5", target: "4.0/5", weight: 25, contribution: 24, source: "Geotab EV Team" },
            { metric: "Partner ecosystem growth", value: "+18%", target: "+10%", weight: 25, contribution: 24, source: "Geotab Marketplace Data" },
            { metric: "R&D investment (% revenue)", value: "18%", target: "15%", weight: 25, contribution: 24, source: "Geotab Annual Report" },
          ],
        },
      ],
      movers: [
        { dimension: "innovation", direction: "up", delta: 4, reason: "AI predictive maintenance launch + EV battery analytics + ChargePoint partnership" },
        { dimension: "reporting", direction: "up", delta: 2, reason: "AI-powered insights and sub-5-second data latency" },
        { dimension: "delivery", direction: "up", delta: 2, reason: "Hardware delivery improved to 2.4 weeks; same-day SaaS provisioning" },
        { dimension: "coverage", direction: "up", delta: 2, reason: "ChargePoint partnership + expanded marketplace integrations" },
      ],
      acts: [
        { id: "ra-9", title: "Integrate Geotab data with Zurich for 8-12% premium discount", playbookLink: "Telematics", owner: "David Park", dueDate: "2026-Q3", status: "Not Started" },
        { id: "ra-10", title: "Launch driver safety gamification pilot (target: 15% accident reduction)", playbookLink: "Telematics", owner: "David Park", dueDate: "2026-Q2", status: "In Progress" },
        { id: "ra-11", title: "Evaluate Samsara as backup telematics provider", playbookLink: "Telematics", owner: "David Park", dueDate: "2026-Q3", status: "Not Started" },
        { id: "ra-12", title: "Plan GO9 hardware refresh cycle for 2027", playbookLink: "Telematics", owner: "David Park", dueDate: "2026-Q4", status: "Not Started" },
      ],
    },
  }

  // For suppliers with detailed data, return it; otherwise, generate from scorecards
  const detail = detailedData[supplierId]
  if (detail) {
    return {
      supplierId,
      overallScore: avg,
      priorOverallScore: avg - 2,
      timePeriod: "Q1 2026",
      dimensions: detail.dims,
      scoreMovers: detail.movers,
      actions: detail.acts,
    }
  }

  // Fallback: auto-generate basic reasoning from scorecard data
  const dims: DimensionReasoning[] = DIMENSION_IDS.map((dim) => {
    const score = scores[dim]
    const prior = Math.max(40, score - Math.floor(Math.random() * 6) + 2)
    return {
      dimension: dim,
      score,
      priorScore: prior,
      change: score - prior,
      confidence: score >= 85 ? "High" as const : score >= 70 ? "Medium" as const : "Low" as const,
      lastUpdated: "2026-02-15",
      drivers: [
        `${SCORECARD_LABELS[dim]} score of ${score}/100 based on composite metric assessment`,
        score >= 85 ? "Above benchmark in most tracked metrics" : score >= 70 ? "Mixed performance -- some metrics above, some below target" : "Below target in key metrics -- improvement plan required",
      ],
      calcs: [
        { metric: "Composite score", value: `${score}`, target: "85", weight: 100, contribution: score, source: "Scorecard Assessment" },
      ],
    }
  })

  return {
    supplierId,
    overallScore: avg,
    priorOverallScore: Math.max(40, avg - 2),
    timePeriod: "Q1 2026",
    dimensions: dims,
    scoreMovers: dims
      .filter((d) => Math.abs(d.change) >= 2)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 3)
      .map((d) => ({ dimension: d.dimension, direction: (d.change >= 0 ? "up" : "down") as "up" | "down", delta: Math.abs(d.change), reason: d.drivers[0] })),
    actions: supplierActions
      .filter((a) => a.linkedSupplierIds.includes(supplierId))
      .slice(0, 3)
      .map((a, i) => ({ id: `ra-auto-${i}`, title: a.initiative, playbookLink: supplier.type, owner: a.owner, dueDate: a.dueDate, status: a.status })),
  }
}

export function getScoreReasoning(supplierId: string): SupplierScoreReasoning | undefined {
  return generateReasoning(supplierId)
}

/** Normalize raw reasoning data so the UI always has 7 dimensions in canonical order, with safe defaults. */
export function normalizeScoreReasoning(
  raw: SupplierScoreReasoning | undefined | null,
  supplier?: { id: string; name: string; type: string; segment: string }
): {
  supplierId: string
  supplierName: string
  supplierType: string
  supplierSegment: string
  overallScore: number | null
  priorOverallScore: number | null
  timePeriod: string
  updatedAt: string
  dimensions: (DimensionReasoning & { label: string })[]
  scoreMovers: ScoreMover[]
  actions: ReasoningAction[]
} {
  const dimMap = new Map<ScorecarDimension, DimensionReasoning>()
  if (raw?.dimensions) {
    for (const d of raw.dimensions) dimMap.set(d.dimension, d)
  }

  const normalizedDims = DIMENSIONS.map(({ id, label }) => {
    const existing = dimMap.get(id)
    if (existing) return { ...existing, label }
    // Placeholder when data is missing
    return {
      dimension: id,
      label,
      score: null as unknown as number,
      priorScore: null as unknown as number,
      change: null as unknown as number,
      confidence: "TBD" as DimensionReasoning["confidence"],
      lastUpdated: "N/A",
      drivers: ["TBD (insufficient data)"],
      calcs: [] as CalcRow[],
    }
  })

  return {
    supplierId: raw?.supplierId ?? supplier?.id ?? "unknown",
    supplierName: supplier?.name ?? raw?.supplierId ?? "Unknown Supplier",
    supplierType: supplier?.type ?? "Unknown",
    supplierSegment: supplier?.segment ?? "Unknown",
    overallScore: raw?.overallScore ?? null,
    priorOverallScore: raw?.priorOverallScore ?? null,
    timePeriod: raw?.timePeriod ?? "N/A",
    updatedAt: normalizedDims.reduce((latest, d) => d.lastUpdated > latest ? d.lastUpdated : latest, ""),
    dimensions: normalizedDims as (DimensionReasoning & { label: string })[],
    scoreMovers: raw?.scoreMovers ?? [],
    actions: raw?.actions ?? [],
  }
}

// ─── Insights-to-Actions Data Model ────────────────────────────────────────────

export type InsightType = "Observation" | "Risk" | "Opportunity"
export type InsightSource = "Matrix" | "Profile" | "Network" | "Performance"
export type InsightStatus = "New" | "Triaged" | "Promoted" | "Dismissed"
export type SeverityLevel = "Low" | "Medium" | "High" | "Critical"
export type EffortLevel = "S" | "M" | "L"
export type ConfidenceLevel = "High" | "Medium" | "Low"
export type OpportunityStage = "Proposed" | "Validating" | "Approved"

export interface InsightEvidence {
  trigger: string
  metrics: { label: string; value: string; target?: string }[]
  jumpToSource: { tab: string; supplierId?: string; section?: string }
}

export interface Insight {
  id: string
  type: InsightType
  title: string
  severity?: SeverityLevel      // for Risk
  valueRange?: string           // for Opportunity (e.g., "$150-250K")
  linkedSupplierIds: string[]
  sources: InsightSource[]
  timestamp: string
  status: InsightStatus
  dismissReason?: string
  evidence: InsightEvidence
  suggestedLevers?: string[]
}

export interface StagedOpportunity {
  id: string
  insightId: string
  statement: string
  supplierIds: string[]
  valueRange: string
  effort: EffortLevel
  confidence: ConfidenceLevel
  owner: string
  targetQuarter: string
  stage: OpportunityStage
  attachedLevers: string[]
  linkedActionIds: string[]
}

// Generate insights from upstream data signals
function generateInsightsFromUpstream(): Insight[] {
  const insights: Insight[] = []
  const now = new Date()
  const fmt = (daysAgo: number) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  }

  // 1) Performance triggers: dimension score < 75 → Risk
  const scorecardThreshold = 75
  for (const sc of supplierScorecards) {
    const supplier = fleetSuppliers.find((s) => s.id === sc.supplierId)
    if (!supplier) continue
    for (const dim of DIMENSION_IDS) {
      const score = sc.scores[dim]
      if (score < scorecardThreshold) {
        insights.push({
          id: `ins-perf-${sc.supplierId}-${dim}`,
          type: "Risk",
          title: `${supplier.name}: ${SCORECARD_LABELS[dim]} score below threshold (${score}/100)`,
          severity: score < 60 ? "High" : "Medium",
          linkedSupplierIds: [sc.supplierId],
          sources: ["Performance"],
          timestamp: fmt(Math.floor(Math.random() * 7)),
          status: "New",
          evidence: {
            trigger: `Performance dimension "${SCORECARD_LABELS[dim]}" scored ${score}, below the ${scorecardThreshold} threshold.`,
            metrics: [
              { label: SCORECARD_LABELS[dim], value: `${score}/100`, target: `≥${scorecardThreshold}` },
              { label: "Overall Score", value: `${Math.round(Object.values(sc.scores).reduce((a, b) => a + b, 0) / 7)}` },
            ],
            jumpToSource: { tab: "performance", supplierId: sc.supplierId, section: dim },
          },
          suggestedLevers: playbooks.find((p) => p.type === supplier.type)?.levers.slice(0, 3),
        })
      }
    }
  }

  // 2) Profile triggers: renewal within 180 days + high spend → Opportunity
  for (const supplier of fleetSuppliers) {
    const renewalDate = new Date(supplier.contractRenewal.replace("Q1", "03").replace("Q2", "06").replace("Q3", "09").replace("Q4", "12").replace("-", "-01-"))
    const daysUntilRenewal = Math.floor((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilRenewal > 0 && daysUntilRenewal <= 180 && supplier.annualSpend >= 4_000_000) {
      insights.push({
        id: `ins-renewal-${supplier.id}`,
        type: "Opportunity",
        title: `${supplier.name}: Contract renewal in ${Math.ceil(daysUntilRenewal / 30)} months -- high spend renegotiation opportunity`,
        valueRange: `$${Math.round(supplier.annualSpend * 0.03 / 1000)}K-$${Math.round(supplier.annualSpend * 0.08 / 1000)}K`,
        linkedSupplierIds: [supplier.id],
        sources: ["Profile"],
        timestamp: fmt(2),
        status: "New",
        evidence: {
          trigger: `Contract renewal date ${supplier.contractRenewal} is within 180 days, and annual spend of $${(supplier.annualSpend / 1_000_000).toFixed(1)}M qualifies for strategic renegotiation.`,
          metrics: [
            { label: "Renewal Date", value: supplier.contractRenewal },
            { label: "Annual Spend", value: `$${(supplier.annualSpend / 1_000_000).toFixed(1)}M` },
            { label: "Days to Renewal", value: `${daysUntilRenewal}` },
          ],
          jumpToSource: { tab: "profiles", supplierId: supplier.id, section: "commercial" },
        },
        suggestedLevers: playbooks.find((p) => p.type === supplier.type)?.negotiationChecklist.slice(0, 4),
      })
    }
  }

  // 3) Network triggers: Tier 2/3 single-source dependencies → Risk
  for (const dep of tierDependencies) {
    if (dep.riskFlags.includes("single-source")) {
      const parent = fleetSuppliers.find((s) => s.id === dep.parentId)
      insights.push({
        id: `ins-network-${dep.id}`,
        type: "Risk",
        title: `Single-source dependency: ${dep.name} (Tier ${dep.tier}) for ${parent?.name || "Unknown"}`,
        severity: dep.tier === 2 ? "High" : "Medium",
        linkedSupplierIds: [dep.parentId],
        sources: ["Network"],
        timestamp: fmt(5),
        status: "New",
        evidence: {
          trigger: `${dep.name} is a single-source Tier ${dep.tier} supplier for "${dep.role}". No qualified alternative currently exists.`,
          metrics: [
            { label: "Dependency", value: dep.name },
            { label: "Role", value: dep.role },
            { label: "Tier", value: `${dep.tier}` },
            { label: "Risk Flags", value: dep.riskFlags.join(", ") },
          ],
          jumpToSource: { tab: "network", supplierId: dep.parentId },
        },
        suggestedLevers: ["Qualify alternative supplier", "Negotiate capacity reservation", "Build safety stock"],
      })
    }
  }

  // 4) Network triggers: Geo-concentration → Risk
  for (const dep of tierDependencies) {
    if (dep.riskFlags.includes("geo-concentration") && !dep.riskFlags.includes("single-source")) {
      const parent = fleetSuppliers.find((s) => s.id === dep.parentId)
      insights.push({
        id: `ins-geo-${dep.id}`,
        type: "Observation",
        title: `Geographic concentration: ${dep.name} operates from single region`,
        linkedSupplierIds: [dep.parentId],
        sources: ["Network"],
        timestamp: fmt(10),
        status: "New",
        evidence: {
          trigger: `${dep.name} (Tier ${dep.tier}) has geo-concentration risk. ${dep.mitigation}`,
          metrics: [
            { label: "Supplier", value: dep.name },
            { label: "Parent", value: parent?.name || "Unknown" },
            { label: "Mitigation", value: dep.mitigation },
          ],
          jumpToSource: { tab: "network", supplierId: dep.parentId },
        },
      })
    }
  }

  // 5) Matrix triggers: Strategic suppliers with declining performance → Risk
  for (const supplier of fleetSuppliers) {
    if (supplier.segment === "Strategic" && supplier.performanceScore < 88) {
      insights.push({
        id: `ins-matrix-decline-${supplier.id}`,
        type: "Risk",
        title: `Strategic supplier ${supplier.name} showing performance concerns (${supplier.performanceScore}/100)`,
        severity: supplier.performanceScore < 80 ? "High" : "Medium",
        linkedSupplierIds: [supplier.id],
        sources: ["Matrix", "Performance"],
        timestamp: fmt(3),
        status: "New",
        evidence: {
          trigger: `${supplier.name} is classified as Strategic (high dependency) but performance score of ${supplier.performanceScore} is below expected threshold for this segment.`,
          metrics: [
            { label: "Segment", value: supplier.segment },
            { label: "Performance Score", value: `${supplier.performanceScore}/100` },
            { label: "Our Dependency", value: `${supplier.ourDependencyScore}/100` },
            { label: "Key Risks", value: supplier.keyRisks.slice(0, 2).join("; ") },
          ],
          jumpToSource: { tab: "matrix", supplierId: supplier.id },
        },
        suggestedLevers: ["Escalate in QBR", "Define improvement plan with milestones", "Qualify backup supplier"],
      })
    }
  }

  // 6) Matrix triggers: Preferred suppliers with strong performance + growth → Opportunity
  for (const supplier of fleetSuppliers) {
    if (supplier.segment === "Preferred" && supplier.performanceScore >= 88 && supplier.keyOpportunities.length >= 2) {
      insights.push({
        id: `ins-matrix-expand-${supplier.id}`,
        type: "Opportunity",
        title: `Expand scope with high-performing Preferred supplier: ${supplier.name}`,
        valueRange: `$${Math.round(supplier.annualSpend * 0.1 / 1000)}K-$${Math.round(supplier.annualSpend * 0.25 / 1000)}K`,
        linkedSupplierIds: [supplier.id],
        sources: ["Matrix", "Profile"],
        timestamp: fmt(4),
        status: "New",
        evidence: {
          trigger: `${supplier.name} has strong performance (${supplier.performanceScore}) and ${supplier.keyOpportunities.length} identified growth opportunities. Consider upgrading to Strategic or expanding scope.`,
          metrics: [
            { label: "Current Segment", value: supplier.segment },
            { label: "Performance Score", value: `${supplier.performanceScore}/100` },
            { label: "Opportunities", value: `${supplier.keyOpportunities.length} identified` },
          ],
          jumpToSource: { tab: "matrix", supplierId: supplier.id },
        },
        suggestedLevers: supplier.keyOpportunities.slice(0, 3),
      })
    }
  }

  // 7) AI-generated insights (from existing supplierAIInsights)
  for (const ai of supplierAIInsights) {
    const isRisk = ai.severity === "high" && ai.text.toLowerCase().includes("risk")
    const isOpp = ai.text.toLowerCase().includes("could save") || ai.text.toLowerCase().includes("unlock") || ai.text.toLowerCase().includes("consolidat")
    insights.push({
      id: `ins-ai-${ai.id}`,
      type: isRisk ? "Risk" : isOpp ? "Opportunity" : "Observation",
      title: ai.text.split(".")[0] + ".",
      severity: isRisk ? (ai.severity === "high" ? "High" : "Medium") : undefined,
      valueRange: isOpp ? extractValueFromText(ai.text) : undefined,
      linkedSupplierIds: extractSupplierIdsFromText(ai.text),
      sources: ["Profile", "Performance"],
      timestamp: fmt(1),
      status: "New",
      evidence: {
        trigger: ai.text,
        metrics: [],
        jumpToSource: { tab: "profiles" },
      },
    })
  }

  return insights.sort((a, b) => {
    // Sort: Risks by severity desc, Opps by value, Observations by recency
    if (a.type === "Risk" && b.type !== "Risk") return -1
    if (a.type !== "Risk" && b.type === "Risk") return 1
    if (a.type === "Risk" && b.type === "Risk") {
      const sevOrder: Record<SeverityLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
      return (sevOrder[a.severity ?? "Low"] - sevOrder[b.severity ?? "Low"])
    }
    if (a.type === "Opportunity" && b.type !== "Opportunity") return -1
    if (a.type !== "Opportunity" && b.type === "Opportunity") return 1
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })
}

function extractValueFromText(text: string): string {
  const match = text.match(/\$[\d,]+[KkMm]?/g)
  if (match && match.length >= 1) return match.join("-")
  if (text.includes("%")) {
    const pctMatch = text.match(/(\d+)-?(\d+)?%/)
    if (pctMatch) return `${pctMatch[0]} savings`
  }
  return "TBD"
}

function extractSupplierIdsFromText(text: string): string[] {
  const ids: string[] = []
  for (const s of fleetSuppliers) {
    if (text.toLowerCase().includes(s.name.toLowerCase().split(" ")[0].toLowerCase())) {
      ids.push(s.id)
    }
  }
  return ids.length > 0 ? ids : []
}

export const generatedInsights: Insight[] = generateInsightsFromUpstream()

// Initial staged opportunities (empty, populated via UI)
export const stagedOpportunities: StagedOpportunity[] = []

export function getPlaybookLeversForType(type: SupplierType): string[] {
  return playbooks.find((p) => p.type === type)?.levers ?? []
}

export function getPlaybookChecklistForType(type: SupplierType): string[] {
  return playbooks.find((p) => p.type === type)?.negotiationChecklist ?? []
}
