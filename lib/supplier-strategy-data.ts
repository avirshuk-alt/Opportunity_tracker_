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
