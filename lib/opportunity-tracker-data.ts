// ─── Opportunity Tracker Data Layer ──────────────────────────────────────────
// Types, lever definitions, analysis templates, recommendation engine,
// and the Trim Proliferation mock dataset / savings model.

import { getAllInsightsForCategory, type UnifiedInsight } from "@/lib/insights-adapter"

// ─── Types ──────────────────────────────────────────────────────────────────

export type LeverBucket = "Cost" | "Demand" | "Value"
export type LeverStatus = "Not started" | "In analysis" | "Sized" | "In execution"
export type AnalysisStatus = "Available" | "Needs data" | "Not available"
export type ConfidenceLevel = "High" | "Medium" | "Low"

export interface AnalysisTemplate {
  id: string
  name: string
  purpose: string
  requiredDatasets: string[]
  outputMetrics: string[]
  status: AnalysisStatus
  /** If true, a dedicated analysis view is implemented */
  hasDetailView?: boolean
}

export interface Lever {
  id: string
  name: string
  bucket: LeverBucket
  description: string
  prerequisites: string[]
  kpis: string[]
  keywords: string[]
  status: LeverStatus
  analyses: AnalysisTemplate[]
  /** Whether the lever requires data that is not yet ingested */
  dataReadiness: "Available" | "Needs data"
}

export interface LeverRecommendation {
  lever: Lever
  confidence: ConfidenceLevel
  reason: string
  evidenceInsights: UnifiedInsight[]
}

export interface TrackerInitiative {
  id: string
  name: string
  leverId: string
  owner: string
  targetValue: string
  status: "Planning" | "In progress" | "Complete"
  dueDate: string
}

// ─── Trim Proliferation Dataset Types ───────────────────────────────────────

export interface TrimDataRow {
  roleTier: number
  roleName: string
  vehicleModel: string
  trimType: "Base" | "Premium"
  monthlyCost: number
  vehicleCount: number
  spend: number
  region: string
}

export interface TierSummary {
  tier: number
  name: string
  totalVehicles: number
  baseVehicles: number
  premiumVehicles: number
  basePct: number
  premiumPct: number
  avgBaseCost: number
  avgPremiumCost: number
  premiumPctCost: number
  totalSpend: number
  premiumSpend: number
}

export interface TrimByModel {
  model: string
  trimType: "Base" | "Premium"
  avgCost: number
  totalSpend: number
  vehicleCount: number
  tierMix: string
}

// ─── Fleet-Specific Levers ──────────────────────────────────────────────────

export const fleetLevers: Lever[] = [
  // ─── COST levers ─────────────────────────────────────────────────────────
  {
    id: "lev-1",
    name: "OEM/Dealer Rate Harmonization",
    bucket: "Cost",
    description: "Benchmark and harmonize OEM lease rates and dealer markups across regions to ensure price parity and maximize fleet discount tiers.",
    prerequisites: ["Spend cube by OEM/dealer", "Current lease rate cards", "Regional pricing data"],
    kpis: ["Lease rate variance %", "Cost per vehicle/month", "Discount tier utilization"],
    keywords: ["lease", "OEM", "dealer", "rate", "price", "discount", "harmonization"],
    status: "In analysis",
    dataReadiness: "Available",
    analyses: [
      { id: "a-1-1", name: "Price Parity / Lease Rate Dispersion Analysis", purpose: "Identify rate disparities across OEMs, regions, and vehicle classes", requiredDatasets: ["Spend cube", "Lease contracts", "Rate cards"], outputMetrics: ["Rate variance by OEM/region", "Savings from harmonization"], status: "Available" },
      { id: "a-1-2", name: "Benchmark vs Market Pricing (External)", purpose: "Compare current fleet rates against industry benchmarks", requiredDatasets: ["External benchmark data", "Current rate cards"], outputMetrics: ["Rate position vs benchmark", "Gap to best-quartile"], status: "Available" },
      { id: "a-1-3", name: "Regional Price Variance by Model/Trim", purpose: "Map price differences by geography and vehicle specification", requiredDatasets: ["Spend cube", "Vehicle spec data", "Regional contracts"], outputMetrics: ["Price range by model", "Regional premium/discount"], status: "Available" },
      { id: "a-1-4", name: "Savings Model: Move to Best-Quartile Rate", purpose: "Model potential savings from shifting all regions to best available rates", requiredDatasets: ["Current rates", "Volume data", "Benchmark rates"], outputMetrics: ["Estimated annual savings ($)", "Implementation timeline"], status: "Available" },
      { id: "a-1-5", name: "Dealer Markup Analysis by Region", purpose: "Compare dealer markups and incentive pass-through rates", requiredDatasets: ["Dealer invoices", "OEM incentive data"], outputMetrics: ["Markup range by region", "Incentive capture rate"], status: "Needs data" },
    ],
  },
  {
    id: "lev-2",
    name: "FMC Fee Audit & Renegotiation",
    bucket: "Cost",
    description: "Audit all fleet management company fees for hidden charges, scope creep, and renegotiate based on competitive benchmarks.",
    prerequisites: ["FMC invoices (12 months)", "Contract fee schedules", "Benchmark data"],
    kpis: ["Management fee per vehicle", "Total FMC cost ratio", "Fee transparency score"],
    keywords: ["FMC", "fee", "audit", "management", "renegotiation", "invoice"],
    status: "Not started",
    dataReadiness: "Available",
    analyses: [
      { id: "a-2-1", name: "FMC Fee Component Breakdown", purpose: "Decompose FMC fees into base management, transaction, and pass-through components", requiredDatasets: ["FMC invoices", "Fee schedules"], outputMetrics: ["Fee breakdown by component", "Hidden fee identification"], status: "Available" },
      { id: "a-2-2", name: "FMC Benchmark Comparison", purpose: "Compare FMC fee rates against market benchmarks", requiredDatasets: ["Current FMC contracts", "Industry benchmarks"], outputMetrics: ["Position vs market median", "Savings opportunity range"], status: "Available" },
      { id: "a-2-3", name: "FMC Scope vs Utilization Analysis", purpose: "Assess which FMC services are being paid for but underutilized", requiredDatasets: ["Service utilization data", "Contract scope"], outputMetrics: ["Utilization rate by service", "Waste reduction opportunity"], status: "Needs data" },
      { id: "a-2-4", name: "Renegotiation Savings Model", purpose: "Model savings from moving to market-median fees or competitive rebid", requiredDatasets: ["Current fees", "Benchmark fees", "Volume data"], outputMetrics: ["Savings by scenario", "Effort vs impact"], status: "Available" },
    ],
  },
  {
    id: "lev-3",
    name: "Standard Model/Trim List",
    bucket: "Cost",
    description: "Reduce fleet complexity by standardizing approved vehicle models and trims, driving volume concentration and better OEM discounts.",
    prerequisites: ["Current fleet inventory", "Vehicle spec requirements by role", "OEM incentive tiers"],
    kpis: ["Number of unique models/trims", "Volume per model", "Exception rate %"],
    keywords: ["model", "trim", "standard", "complexity", "policy", "specification"],
    status: "Not started",
    dataReadiness: "Available",
    analyses: [
      { id: "a-3-1", name: "Fleet Complexity Analysis", purpose: "Count unique model/trim combinations and map to roles", requiredDatasets: ["Fleet inventory", "Driver assignments"], outputMetrics: ["Unique configurations", "Volume concentration ratio"], status: "Available" },
      { id: "a-3-2", name: "Standardization Savings Model", purpose: "Estimate savings from reducing to approved list of models", requiredDatasets: ["Current pricing", "OEM volume tiers", "Fleet inventory"], outputMetrics: ["Annual savings from volume tier jumps", "Reduced admin cost"], status: "Available" },
      { id: "a-3-3", name: "Model/Trim Exception Report", purpose: "Identify off-list vehicles and quantify the cost premium", requiredDatasets: ["Fleet inventory", "Approved model list"], outputMetrics: ["Exception count", "Premium paid for exceptions"], status: "Available" },
    ],
  },
  {
    id: "lev-4",
    name: "Maintenance Network Rate Caps & Parts Markup Control",
    bucket: "Cost",
    description: "Negotiate rate caps for labor and control parts markup across the maintenance network to reduce repair cost variability.",
    prerequisites: ["Maintenance invoices", "Labor rate data by region", "Parts pricing data"],
    kpis: ["Cost per mile", "Average repair cost", "Parts markup %", "Labor rate variance"],
    keywords: ["maintenance", "repair", "labor", "parts", "markup", "rate cap", "cost per mile"],
    status: "Not started",
    dataReadiness: "Available",
    analyses: [
      { id: "a-4-1", name: "Cost per Mile Trends", purpose: "Track maintenance cost per mile over time by vehicle type and region", requiredDatasets: ["Maintenance records", "Mileage data"], outputMetrics: ["CPM trend by vehicle type", "Regional variance"], status: "Available" },
      { id: "a-4-2", name: "Outlier Repair Analysis", purpose: "Identify repair invoices that are statistical outliers", requiredDatasets: ["Repair invoices (12 months)"], outputMetrics: ["Outlier count and value", "Root cause categories"], status: "Available" },
      { id: "a-4-3", name: "Labor Rate & Parts Markup Comparison", purpose: "Compare labor rates and parts markups across the repair network", requiredDatasets: ["Repair invoices", "Network rate cards"], outputMetrics: ["Rate distribution", "Markup range by part type"], status: "Available" },
      { id: "a-4-4", name: "Network Coverage vs Cost", purpose: "Map repair network coverage against cost to find optimal balance", requiredDatasets: ["Network locations", "Cost data", "Driver territories"], outputMetrics: ["Coverage score", "Cost-per-coverage efficiency"], status: "Not available" },
    ],
  },
  {
    id: "lev-5",
    name: "Insurance Program Optimization",
    bucket: "Cost",
    description: "Optimize fleet insurance through deductible adjustments, captive insurance evaluation, and loss control programs.",
    prerequisites: ["Claims history (3 years)", "Current policy terms", "Driver safety records"],
    kpis: ["Premium per vehicle", "Claims frequency", "Loss ratio", "Deductible savings"],
    keywords: ["insurance", "claims", "deductible", "premium", "loss", "safety"],
    status: "Not started",
    dataReadiness: "Available",
    analyses: [
      { id: "a-5-1", name: "Claims Frequency & Severity Analysis", purpose: "Analyze claims patterns to identify improvement opportunities", requiredDatasets: ["Claims history", "Driver data"], outputMetrics: ["Frequency trend", "Average claim cost", "Top causes"], status: "Available" },
      { id: "a-5-2", name: "Deductible Optimization Model", purpose: "Model premium savings from higher deductibles vs self-insurance risk", requiredDatasets: ["Current premiums", "Claims data", "Risk tolerance"], outputMetrics: ["Optimal deductible level", "Net savings"], status: "Available" },
      { id: "a-5-3", name: "Loss Control Program ROI", purpose: "Estimate ROI from driver coaching and loss prevention programs", requiredDatasets: ["Historical claims", "Program costs", "Driver safety data"], outputMetrics: ["Estimated claims reduction", "Net ROI"], status: "Needs data" },
    ],
  },
  {
    id: "lev-6",
    name: "Telematics Vendor Consolidation & Pricing",
    bucket: "Cost",
    description: "Consolidate telematics providers and negotiate volume-based pricing to reduce per-device costs.",
    prerequisites: ["Current telematics contracts", "Device inventory", "Feature utilization data"],
    kpis: ["Cost per device/month", "Number of providers", "Feature utilization %"],
    keywords: ["telematics", "vendor", "consolidation", "device", "pricing", "data"],
    status: "Not started",
    dataReadiness: "Available",
    analyses: [
      { id: "a-6-1", name: "Telematics Vendor Landscape", purpose: "Map current telematics providers, costs, and feature sets", requiredDatasets: ["Telematics contracts", "Device inventory"], outputMetrics: ["Provider count", "Cost per device", "Feature overlap"], status: "Available" },
      { id: "a-6-2", name: "Feature Utilization Audit", purpose: "Assess which telematics features are actually being used", requiredDatasets: ["Usage logs", "Feature catalog"], outputMetrics: ["Utilization by feature", "Unused feature cost"], status: "Needs data" },
      { id: "a-6-3", name: "Consolidation Savings Model", purpose: "Model savings from moving to a single platform", requiredDatasets: ["Vendor pricing", "Volume projections"], outputMetrics: ["Annual savings", "Migration cost", "Net benefit"], status: "Available" },
    ],
  },
  {
    id: "lev-7",
    name: "Remarketing Residual Value Optimization",
    bucket: "Cost",
    description: "Improve vehicle residual values through better remarketing timing, channel selection, and cosmetic reconditioning.",
    prerequisites: ["Remarketing history", "Residual value forecasts", "Vehicle condition data"],
    kpis: ["Average residual value %", "Remarketing gain/loss", "Time to sell"],
    keywords: ["residual", "remarketing", "resale", "value", "depreciation"],
    status: "Not started",
    dataReadiness: "Needs data",
    analyses: [
      { id: "a-7-1", name: "Residual Value Performance Analysis", purpose: "Compare actual vs projected residual values by model and age", requiredDatasets: ["Lease-end data", "Remarketing records"], outputMetrics: ["Residual value variance", "Loss by model type"], status: "Needs data" },
      { id: "a-7-2", name: "Channel Optimization Analysis", purpose: "Compare remarketing outcomes by channel (auction, dealer, direct)", requiredDatasets: ["Remarketing records by channel"], outputMetrics: ["Price by channel", "Time to sell by channel"], status: "Needs data" },
    ],
  },
  {
    id: "lev-8",
    name: "Rental / Replacement Vehicle Policy Tightening",
    bucket: "Cost",
    description: "Reduce rental and replacement vehicle costs by tightening policies on when rentals are approved and capping daily rates.",
    prerequisites: ["Rental usage data", "Replacement vehicle policies", "Current rental contracts"],
    kpis: ["Rental spend per month", "Average rental duration", "Rental as % of fleet cost"],
    keywords: ["rental", "replacement", "policy", "tightening", "daily rate"],
    status: "Not started",
    dataReadiness: "Available",
    analyses: [
      { id: "a-8-1", name: "Rental Utilization Analysis", purpose: "Analyze rental frequency, duration, and cost patterns", requiredDatasets: ["Rental invoices", "Vehicle downtime records"], outputMetrics: ["Avg rental days", "Cost per rental event", "Avoidable rentals %"], status: "Available" },
      { id: "a-8-2", name: "Daily Rate Benchmarking", purpose: "Compare rental rates across providers and regions", requiredDatasets: ["Rental invoices", "Market rate data"], outputMetrics: ["Rate variance", "Savings from caps"], status: "Available" },
    ],
  },

  // ─── DEMAND levers ───────────────────────────────────────────────────────
  {
    id: "lev-9",
    name: "Fleet Policy Compliance + Exception Governance",
    bucket: "Demand",
    description: "Enforce fleet policy compliance and establish governance for exceptions to reduce off-policy spend and complexity.",
    prerequisites: ["Fleet policy document", "Exception log", "Compliance reports"],
    kpis: ["Policy compliance %", "Exception rate %", "Off-policy spend"],
    keywords: ["policy", "compliance", "exception", "governance", "off-policy"],
    status: "In analysis",
    dataReadiness: "Available",
    analyses: [
      { id: "a-9-1", name: "Exception Rate Analysis by BU/Region", purpose: "Map policy exceptions by business unit and region to find hotspots", requiredDatasets: ["Exception log", "Fleet policy", "BU/region mapping"], outputMetrics: ["Exception rate by BU", "Exception rate by region", "Top exception types"], status: "Available" },
      { id: "a-9-2", name: "Off-Policy Model/Trim Spend", purpose: "Quantify spend on vehicles outside approved model/trim list", requiredDatasets: ["Fleet inventory", "Approved model list", "Spend data"], outputMetrics: ["Off-policy spend ($)", "Off-policy vehicle count", "Premium paid"], status: "Available" },
      { id: "a-9-3", name: "Reallocation Scenario Sizing", purpose: "Model savings from moving off-policy vehicles to approved specs at next refresh", requiredDatasets: ["Current fleet", "Approved list pricing", "Refresh schedule"], outputMetrics: ["Annual savings from reallocation", "Timeline to full compliance"], status: "Available" },
      { id: "a-9-4", name: "Compliance Trend Dashboard", purpose: "Track compliance rate over time with drill-down by BU", requiredDatasets: ["Monthly compliance reports"], outputMetrics: ["Compliance trend", "BU comparison", "Improvement velocity"], status: "Available" },
    ],
  },
  {
    id: "lev-10",
    name: "Right-Sizing Fleet (Utilization-Based)",
    bucket: "Demand",
    description: "Optimize fleet size based on actual utilization data to eliminate underused vehicles and reduce total fleet cost.",
    prerequisites: ["Telematics/utilization data", "Driver assignment records", "Territory mapping"],
    kpis: ["Utilization rate %", "Vehicles per driver", "Idle vehicle count"],
    keywords: ["utilization", "right-sizing", "fleet size", "idle", "underutilized"],
    status: "Not started",
    dataReadiness: "Needs data",
    analyses: [
      { id: "a-10-1", name: "Fleet Utilization Heat Map", purpose: "Identify underutilized vehicles based on mileage and usage patterns", requiredDatasets: ["Telematics data", "Mileage records"], outputMetrics: ["Utilization distribution", "Underutilized vehicle count", "Savings from reduction"], status: "Needs data" },
      { id: "a-10-2", name: "Pool Vehicle Opportunity", purpose: "Identify territories where shared pool vehicles could replace assigned ones", requiredDatasets: ["Assignment data", "Usage patterns"], outputMetrics: ["Pool candidate count", "Cost avoidance"], status: "Needs data" },
    ],
  },
  {
    id: "lev-11",
    name: "Mileage Reduction (Territory Design, Routing)",
    bucket: "Demand",
    description: "Reduce total fleet mileage through optimized territory design and route planning to cut fuel and maintenance costs.",
    prerequisites: ["Territory mapping", "Driver route data", "CRM visit data"],
    kpis: ["Average miles per driver/month", "Fuel cost per driver", "Territory overlap %"],
    keywords: ["mileage", "territory", "routing", "fuel", "distance"],
    status: "Not started",
    dataReadiness: "Needs data",
    analyses: [
      { id: "a-11-1", name: "Territory Overlap & Mileage Analysis", purpose: "Identify territory overlap and excess mileage from suboptimal routing", requiredDatasets: ["Territory maps", "GPS/telematics data"], outputMetrics: ["Overlap percentage", "Excess mileage estimate", "Fuel savings potential"], status: "Not available" },
    ],
  },
  {
    id: "lev-12",
    name: "Driver Behavior / Safety Program",
    bucket: "Demand",
    description: "Implement driver coaching and safety programs to reduce accidents, claims, and associated costs.",
    prerequisites: ["Telematics data", "Claims history", "Driver scorecards"],
    kpis: ["Accident rate per 1M miles", "Claims cost per driver", "Safety score average"],
    keywords: ["driver", "safety", "behavior", "accident", "claims", "coaching"],
    status: "Not started",
    dataReadiness: "Needs data",
    analyses: [
      { id: "a-12-1", name: "Driver Risk Scoring Analysis", purpose: "Score drivers by risk based on telematics and claims data", requiredDatasets: ["Telematics data", "Claims history"], outputMetrics: ["Risk score distribution", "High-risk driver count", "Potential savings"], status: "Needs data" },
      { id: "a-12-2", name: "Coaching Program ROI Model", purpose: "Estimate cost reduction from targeted driver coaching", requiredDatasets: ["Claims data", "Coaching program costs"], outputMetrics: ["Expected claims reduction", "Program ROI", "Payback period"], status: "Needs data" },
    ],
  },
  {
    id: "lev-13",
    name: "EV Adoption Where Economics Work",
    bucket: "Demand",
    description: "Deploy EVs in territories where total cost of ownership is favorable considering incentives, fuel savings, and infrastructure.",
    prerequisites: ["TCO models by state/region", "Charging infrastructure data", "Incentive data"],
    kpis: ["EV adoption %", "TCO per EV vs ICE", "Charging availability %"],
    keywords: ["EV", "electric", "hybrid", "TCO", "incentive", "charging", "transition"],
    status: "In analysis",
    dataReadiness: "Available",
    analyses: [
      { id: "a-13-1", name: "TCO Model by State (Incentives + Fuel + Maintenance)", purpose: "Compare EV vs ICE total cost of ownership including all variables", requiredDatasets: ["Vehicle pricing", "Fuel costs", "Incentive data", "Maintenance costs"], outputMetrics: ["TCO comparison by state", "Breakeven mileage", "Net savings per vehicle"], status: "Available" },
      { id: "a-13-2", name: "Charging Availability Proxy (External Insight)", purpose: "Assess charging infrastructure readiness in driver territories", requiredDatasets: ["External charging network data", "Driver territory maps"], outputMetrics: ["Coverage score by territory", "Infrastructure gaps"], status: "Available" },
      { id: "a-13-3", name: "Risk / Operational Constraints Checklist", purpose: "Document operational risks and constraints for EV deployment", requiredDatasets: ["Driver surveys", "Operational requirements"], outputMetrics: ["Constraint severity matrix", "Mitigation requirements"], status: "Needs data" },
      { id: "a-13-4", name: "EV Transition Phasing Model", purpose: "Build a multi-year phasing plan for EV adoption by territory", requiredDatasets: ["Fleet refresh schedule", "TCO data", "Infrastructure plans"], outputMetrics: ["Year-by-year adoption targets", "Cumulative savings"], status: "Available" },
    ],
  },
  {
    id: "lev-14",
    name: "Refresh Cycle Optimization",
    bucket: "Demand",
    description: "Optimize vehicle refresh cycles based on TCO curves to determine the ideal hold period for each vehicle class.",
    prerequisites: ["Vehicle lifecycle cost data", "Residual value curves", "Maintenance cost trends"],
    kpis: ["Average hold period (months)", "TCO per month by age", "Residual value at return"],
    keywords: ["refresh", "cycle", "lifecycle", "hold period", "TCO curve", "residual"],
    status: "Not started",
    dataReadiness: "Needs data",
    analyses: [
      { id: "a-14-1", name: "Vehicle Lifecycle TCO Curve", purpose: "Map total cost of ownership over time to find optimal refresh point", requiredDatasets: ["Lease costs", "Maintenance costs", "Residual values"], outputMetrics: ["Optimal hold period by class", "TCO delta from current policy"], status: "Needs data" },
      { id: "a-14-2", name: "Early Return vs Extension Analysis", purpose: "Compare cost of early returns vs lease extensions for aging vehicles", requiredDatasets: ["Lease terms", "Maintenance data"], outputMetrics: ["Break-even analysis", "Recommended action by vehicle"], status: "Needs data" },
    ],
  },

  // ─── Reduce Trim Proliferation (flagship) ────────────────────────────────
  {
    id: "lev-20",
    name: "Reduce Trim Proliferation",
    bucket: "Demand",
    description: "Quantify the premium paid for higher-trim vehicles by role tier and model savings from shifting to base trims where business needs allow.",
    prerequisites: ["Fleet inventory with trim detail", "Role tier assignments", "Vehicle pricing data"],
    kpis: ["Premium trim share %", "Premium paid per tier", "Savings from trim standardization"],
    keywords: ["trim", "premium", "proliferation", "model", "standard", "tier", "role", "base", "specification", "complexity"],
    status: "In analysis",
    dataReadiness: "Available",
    analyses: [
      { id: "a-20-1", name: "Spend by Role Tier: Premium vs Base", purpose: "Stacked bar view of spend broken out by base and premium trims for each role tier", requiredDatasets: ["Fleet inventory", "Role assignments", "Vehicle pricing"], outputMetrics: ["Total premium spend", "Premium share %"], status: "Available", hasDetailView: true },
      { id: "a-20-2", name: "Model Mix by Tier", purpose: "Tabular view of vehicle counts, base/premium split, and cost metrics per tier", requiredDatasets: ["Fleet inventory", "Role assignments"], outputMetrics: ["Vehicle count by tier", "Base/premium split", "Avg costs"], status: "Available", hasDetailView: true },
      { id: "a-20-3", name: "Top Premium Trims Driving Spend", purpose: "Identify the specific trims contributing most to premium spend", requiredDatasets: ["Fleet inventory", "Trim pricing data"], outputMetrics: ["Top trims by spend", "Tier mix per trim"], status: "Available", hasDetailView: true },
      { id: "a-20-4", name: "Trim Reduction Savings Model", purpose: "Interactive model to estimate savings from reducing premium share per tier", requiredDatasets: ["Fleet inventory", "Vehicle pricing"], outputMetrics: ["Savings by tier", "Total annual savings", "Sensitivity analysis"], status: "Available", hasDetailView: true },
    ],
  },

  // ─── VALUE levers ────────────────────────────────────────────────────────
  {
    id: "lev-15",
    name: "Supply Assurance Strategy",
    bucket: "Value",
    description: "Secure vehicle supply through allocation agreements, dual-sourcing, and delivery SLAs to mitigate lead-time risk.",
    prerequisites: ["OEM allocation data", "Lead-time history", "Order pipeline"],
    kpis: ["Delivery lead time (days)", "Order fill rate %", "Allocation compliance %"],
    keywords: ["supply", "allocation", "lead time", "delivery", "SLA", "assurance", "dual-source"],
    status: "Not started",
    dataReadiness: "Available",
    analyses: [
      { id: "a-15-1", name: "Lead Time Variability Analysis", purpose: "Analyze delivery lead time patterns and identify improvement opportunities", requiredDatasets: ["Order history", "Delivery records"], outputMetrics: ["Lead time distribution", "Variance by OEM/model", "Impact on operations"], status: "Available" },
      { id: "a-15-2", name: "Allocation Compliance Tracker", purpose: "Monitor OEM allocation vs actual deliveries", requiredDatasets: ["Allocation agreements", "Delivery records"], outputMetrics: ["Fill rate by OEM", "Shortfall impact"], status: "Available" },
      { id: "a-15-3", name: "Dual-Source Readiness Assessment", purpose: "Evaluate readiness to activate secondary supply sources", requiredDatasets: ["Supplier profiles", "Qualification status"], outputMetrics: ["Readiness score", "Gap analysis"], status: "Needs data" },
    ],
  },
  {
    id: "lev-16",
    name: "Data Rights + Analytics Value Capture",
    bucket: "Value",
    description: "Ensure contractual ownership of telematics and fleet data, and leverage analytics for operational improvements.",
    prerequisites: ["Current data rights clauses", "Telematics contracts", "Analytics capability assessment"],
    kpis: ["Data ownership status", "Analytics use cases delivered", "Value from insights ($)"],
    keywords: ["data", "rights", "analytics", "telematics", "insights", "reporting"],
    status: "Not started",
    dataReadiness: "Available",
    analyses: [
      { id: "a-16-1", name: "Data Rights Audit", purpose: "Review data ownership and usage rights across all fleet contracts", requiredDatasets: ["Fleet contracts", "Data clauses"], outputMetrics: ["Data ownership status by vendor", "Gap identification"], status: "Available" },
      { id: "a-16-2", name: "Analytics Use Case Inventory", purpose: "Catalog analytics use cases and their value realization status", requiredDatasets: ["Use case catalog", "Value tracking"], outputMetrics: ["Use cases by status", "Total realized value"], status: "Available" },
    ],
  },
  {
    id: "lev-17",
    name: "Dealer Network Performance Program",
    bucket: "Value",
    description: "Establish service level requirements and performance tracking for the dealer network to improve turnaround and service quality.",
    prerequisites: ["Dealer performance data", "Service level baselines", "Customer satisfaction surveys"],
    kpis: ["Dealer turnaround time", "Service quality score", "First-time fix rate %"],
    keywords: ["dealer", "performance", "service", "turnaround", "network", "quality"],
    status: "Not started",
    dataReadiness: "Needs data",
    analyses: [
      { id: "a-17-1", name: "Dealer Performance Scorecard", purpose: "Score dealers on delivery, service quality, and responsiveness", requiredDatasets: ["Delivery records", "Service records", "Feedback surveys"], outputMetrics: ["Performance scores by dealer", "Improvement opportunity areas"], status: "Needs data" },
      { id: "a-17-2", name: "SLA Gap Analysis", purpose: "Identify gaps between SLA targets and actual performance", requiredDatasets: ["SLA definitions", "Performance data"], outputMetrics: ["Gap by SLA metric", "Worst performers"], status: "Needs data" },
    ],
  },
  {
    id: "lev-18",
    name: "ESG & Compliance Value",
    bucket: "Value",
    description: "Capture value from EV transition, emissions reporting readiness, and compliance with evolving sustainability regulations.",
    prerequisites: ["ESG reporting requirements", "Current emissions data", "EV transition roadmap"],
    kpis: ["Fleet CO2 emissions", "EV/hybrid %", "ESG reporting readiness score"],
    keywords: ["ESG", "sustainability", "compliance", "emissions", "EV", "reporting", "diversity"],
    status: "Not started",
    dataReadiness: "Available",
    analyses: [
      { id: "a-18-1", name: "Fleet Emissions Baseline & Trajectory", purpose: "Establish current emissions and project trajectory under different EV adoption scenarios", requiredDatasets: ["Fleet inventory", "Mileage data", "Vehicle emission factors"], outputMetrics: ["Current CO2 per vehicle", "Trajectory by scenario", "Reporting gap analysis"], status: "Available" },
      { id: "a-18-2", name: "Regulatory Readiness Assessment", purpose: "Assess compliance posture against upcoming regulations", requiredDatasets: ["Regulation tracker", "Current compliance status"], outputMetrics: ["Readiness score", "Gap remediation cost"], status: "Available" },
      { id: "a-18-3", name: "Diversity & Inclusion Reporting", purpose: "Track supplier diversity metrics for ESG reporting", requiredDatasets: ["Supplier diversity data"], outputMetrics: ["Diversity spend %", "Certification status"], status: "Available" },
    ],
  },
  {
    id: "lev-19",
    name: "Business Continuity / Resilience Improvements",
    bucket: "Value",
    description: "Improve fleet resilience through regional coverage redundancy, backup pools, and disaster recovery planning.",
    prerequisites: ["Regional coverage maps", "Backup pool data", "Risk scenarios"],
    kpis: ["Regional coverage %", "Backup pool utilization", "Recovery time (hours)"],
    keywords: ["continuity", "resilience", "backup", "coverage", "disaster", "regional"],
    status: "Not started",
    dataReadiness: "Needs data",
    analyses: [
      { id: "a-19-1", name: "Regional Coverage Gap Analysis", purpose: "Identify geographic gaps in fleet coverage and backup availability", requiredDatasets: ["Vehicle locations", "Driver territories", "Backup pool inventory"], outputMetrics: ["Coverage map", "Gap severity", "Backup adequacy"], status: "Not available" },
    ],
  },
]

// ─── Trim Proliferation Mock Dataset ────────────────────────────────────────

export const trimDataset: TrimDataRow[] = [
  // Tier 1: Sales
  { roleTier: 1, roleName: "Sales", vehicleModel: "Toyota Camry", trimType: "Base", monthlyCost: 485, vehicleCount: 320, spend: 1_862_400, region: "US" },
  { roleTier: 1, roleName: "Sales", vehicleModel: "Toyota Camry", trimType: "Premium", monthlyCost: 625, vehicleCount: 180, spend: 1_350_000, region: "US" },
  { roleTier: 1, roleName: "Sales", vehicleModel: "Honda Accord", trimType: "Base", monthlyCost: 475, vehicleCount: 210, spend: 1_197_000, region: "US" },
  { roleTier: 1, roleName: "Sales", vehicleModel: "Honda Accord", trimType: "Premium", monthlyCost: 610, vehicleCount: 140, spend: 1_024_800, region: "US" },
  { roleTier: 1, roleName: "Sales", vehicleModel: "Nissan Altima", trimType: "Base", monthlyCost: 460, vehicleCount: 150, spend: 828_000, region: "US" },
  { roleTier: 1, roleName: "Sales", vehicleModel: "Nissan Altima", trimType: "Premium", monthlyCost: 590, vehicleCount: 60, spend: 424_800, region: "US" },
  { roleTier: 1, roleName: "Sales", vehicleModel: "VW Passat", trimType: "Base", monthlyCost: 510, vehicleCount: 80, spend: 489_600, region: "EU" },
  { roleTier: 1, roleName: "Sales", vehicleModel: "VW Passat", trimType: "Premium", monthlyCost: 680, vehicleCount: 40, spend: 326_400, region: "EU" },

  // Tier 2: Market Access
  { roleTier: 2, roleName: "Market Access", vehicleModel: "Toyota Camry", trimType: "Base", monthlyCost: 485, vehicleCount: 90, spend: 523_800, region: "US" },
  { roleTier: 2, roleName: "Market Access", vehicleModel: "Toyota Camry", trimType: "Premium", monthlyCost: 625, vehicleCount: 60, spend: 450_000, region: "US" },
  { roleTier: 2, roleName: "Market Access", vehicleModel: "Honda Accord", trimType: "Base", monthlyCost: 475, vehicleCount: 70, spend: 399_000, region: "US" },
  { roleTier: 2, roleName: "Market Access", vehicleModel: "Honda Accord", trimType: "Premium", monthlyCost: 610, vehicleCount: 45, spend: 329_400, region: "US" },
  { roleTier: 2, roleName: "Market Access", vehicleModel: "BMW 3-Series", trimType: "Premium", monthlyCost: 780, vehicleCount: 25, spend: 234_000, region: "EU" },

  // Tier 3: Medical / Field Leadership
  { roleTier: 3, roleName: "Medical / Field Leadership", vehicleModel: "BMW 3-Series", trimType: "Base", monthlyCost: 650, vehicleCount: 40, spend: 312_000, region: "US" },
  { roleTier: 3, roleName: "Medical / Field Leadership", vehicleModel: "BMW 3-Series", trimType: "Premium", monthlyCost: 820, vehicleCount: 35, spend: 344_400, region: "US" },
  { roleTier: 3, roleName: "Medical / Field Leadership", vehicleModel: "Audi A4", trimType: "Base", monthlyCost: 670, vehicleCount: 25, spend: 201_000, region: "EU" },
  { roleTier: 3, roleName: "Medical / Field Leadership", vehicleModel: "Audi A4", trimType: "Premium", monthlyCost: 850, vehicleCount: 20, spend: 204_000, region: "EU" },
  { roleTier: 3, roleName: "Medical / Field Leadership", vehicleModel: "Toyota Camry", trimType: "Premium", monthlyCost: 625, vehicleCount: 15, spend: 112_500, region: "US" },

  // Tier 4: Executive
  { roleTier: 4, roleName: "Executive", vehicleModel: "BMW 5-Series", trimType: "Base", monthlyCost: 820, vehicleCount: 8, spend: 78_720, region: "US" },
  { roleTier: 4, roleName: "Executive", vehicleModel: "BMW 5-Series", trimType: "Premium", monthlyCost: 1_050, vehicleCount: 18, spend: 226_800, region: "US" },
  { roleTier: 4, roleName: "Executive", vehicleModel: "Mercedes E-Class", trimType: "Premium", monthlyCost: 1_120, vehicleCount: 12, spend: 161_280, region: "US" },
  { roleTier: 4, roleName: "Executive", vehicleModel: "Audi A6", trimType: "Premium", monthlyCost: 1_080, vehicleCount: 10, spend: 129_600, region: "EU" },
  { roleTier: 4, roleName: "Executive", vehicleModel: "Audi A6", trimType: "Base", monthlyCost: 870, vehicleCount: 5, spend: 52_200, region: "EU" },
]

// ─── Trim Dataset Helpers ───────────────────────────────────────────────────

export function getTierSummaries(): TierSummary[] {
  const tiers = [1, 2, 3, 4]
  const tierNames: Record<number, string> = { 1: "Sales", 2: "Market Access", 3: "Medical / Field Leadership", 4: "Executive" }

  return tiers.map((tier) => {
    const rows = trimDataset.filter((r) => r.roleTier === tier)
    const baseRows = rows.filter((r) => r.trimType === "Base")
    const premiumRows = rows.filter((r) => r.trimType === "Premium")

    const totalVehicles = rows.reduce((s, r) => s + r.vehicleCount, 0)
    const baseVehicles = baseRows.reduce((s, r) => s + r.vehicleCount, 0)
    const premiumVehicles = premiumRows.reduce((s, r) => s + r.vehicleCount, 0)

    const totalBaseSpend = baseRows.reduce((s, r) => s + r.spend, 0)
    const totalPremSpend = premiumRows.reduce((s, r) => s + r.spend, 0)

    const avgBaseCost = baseVehicles > 0
      ? Math.round(baseRows.reduce((s, r) => s + r.monthlyCost * r.vehicleCount, 0) / baseVehicles)
      : 0
    const avgPremiumCost = premiumVehicles > 0
      ? Math.round(premiumRows.reduce((s, r) => s + r.monthlyCost * r.vehicleCount, 0) / premiumVehicles)
      : 0

    const premiumPctCost = avgBaseCost > 0 ? Math.round(((avgPremiumCost - avgBaseCost) / avgBaseCost) * 100) : 0

    return {
      tier,
      name: tierNames[tier],
      totalVehicles,
      baseVehicles,
      premiumVehicles,
      basePct: totalVehicles > 0 ? Math.round((baseVehicles / totalVehicles) * 100) : 0,
      premiumPct: totalVehicles > 0 ? Math.round((premiumVehicles / totalVehicles) * 100) : 0,
      avgBaseCost,
      avgPremiumCost,
      premiumPctCost,
      totalSpend: totalBaseSpend + totalPremSpend,
      premiumSpend: totalPremSpend,
    }
  })
}

export function getTopPremiumTrims(): TrimByModel[] {
  const premiumRows = trimDataset.filter((r) => r.trimType === "Premium")
  const modelMap = new Map<string, { spend: number; count: number; costSum: number; tiers: Set<number> }>()

  for (const row of premiumRows) {
    const key = row.vehicleModel
    const existing = modelMap.get(key) || { spend: 0, count: 0, costSum: 0, tiers: new Set() }
    existing.spend += row.spend
    existing.count += row.vehicleCount
    existing.costSum += row.monthlyCost * row.vehicleCount
    existing.tiers.add(row.roleTier)
    modelMap.set(key, existing)
  }

  const tierNames: Record<number, string> = { 1: "Sales", 2: "Mkt Access", 3: "Medical", 4: "Exec" }

  return Array.from(modelMap.entries())
    .map(([model, data]) => ({
      model,
      trimType: "Premium" as const,
      avgCost: Math.round(data.costSum / data.count),
      totalSpend: data.spend,
      vehicleCount: data.count,
      tierMix: Array.from(data.tiers).sort().map((t) => tierNames[t] || `T${t}`).join(", "),
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend)
}

export function calculateTrimSavings(
  tierInputs: { tier: number; targetPremiumPct: number; addressablePct: number }[],
  timelineMonths: number = 12,
): { tier: number; name: string; savings: number; unitsShifted: number }[] {
  const summaries = getTierSummaries()
  const tierNames: Record<number, string> = { 1: "Sales", 2: "Market Access", 3: "Medical / Field Leadership", 4: "Executive" }

  return tierInputs.map((input) => {
    const summary = summaries.find((s) => s.tier === input.tier)
    if (!summary) return { tier: input.tier, name: tierNames[input.tier] || `Tier ${input.tier}`, savings: 0, unitsShifted: 0 }

    const currentPremPct = summary.premiumPct
    const reductionPct = Math.max(0, currentPremPct - input.targetPremiumPct) / 100
    const addressable = input.addressablePct / 100
    const unitsShifted = Math.round(summary.totalVehicles * reductionPct * addressable)
    const costDelta = summary.avgPremiumCost - summary.avgBaseCost
    const annualSavings = unitsShifted * costDelta * 12 * (timelineMonths / 12)

    return {
      tier: input.tier,
      name: summary.name,
      savings: Math.round(annualSavings),
      unitsShifted,
    }
  })
}

export function generateTrimInsights(): { title: string; text: string; tags: string[] }[] {
  const summaries = getTierSummaries()
  const totalPremSpend = summaries.reduce((s, t) => s + t.premiumSpend, 0)
  const totalSpend = summaries.reduce((s, t) => s + t.totalSpend, 0)
  const overallPremPct = Math.round((totalPremSpend / totalSpend) * 100)

  const highestPrem = [...summaries].sort((a, b) => b.premiumPct - a.premiumPct)[0]
  const topTrims = getTopPremiumTrims()
  const topTrim = topTrims[0]

  const t1 = summaries.find((s) => s.tier === 1)!

  return [
    {
      title: `Tier ${highestPrem.tier} (${highestPrem.name}) has highest premium share at ${highestPrem.premiumPct}%`,
      text: `${highestPrem.name} has ${highestPrem.premiumVehicles} premium vehicles out of ${highestPrem.totalVehicles} total, with an average premium of $${highestPrem.avgPremiumCost}/mo vs $${highestPrem.avgBaseCost}/mo base (+${highestPrem.premiumPctCost}%). Reducing premium share to 20% could save ~$${Math.round(highestPrem.premiumVehicles * 0.5 * (highestPrem.avgPremiumCost - highestPrem.avgBaseCost) * 12 / 1000)}K annually.`,
      tags: ["Trim", "Premium", highestPrem.name],
    },
    {
      title: `Overall premium share is ${overallPremPct}%, totaling $${(totalPremSpend / 1_000_000).toFixed(1)}M annually`,
      text: `Premium trims account for ${overallPremPct}% of total fleet spend ($${(totalSpend / 1_000_000).toFixed(1)}M). The weighted premium paid across all tiers averages ${Math.round(summaries.reduce((s, t) => s + t.premiumPctCost * t.premiumVehicles, 0) / summaries.reduce((s, t) => s + t.premiumVehicles, 0))}% above base costs.`,
      tags: ["Trim", "Cost", "Premium"],
    },
    {
      title: `${topTrim.model} is the top premium trim by spend at $${(topTrim.totalSpend / 1000).toFixed(0)}K`,
      text: `${topTrim.model} premium trims span ${topTrim.tierMix} tiers with ${topTrim.vehicleCount} vehicles at an average $${topTrim.avgCost}/mo. Standardizing to base where possible could reduce this line item significantly.`,
      tags: ["Trim", topTrim.model, "Premium"],
    },
    {
      title: `Aligning Tier 1 (Sales) to 20% premium share yields ~$${Math.round((t1.premiumVehicles - Math.round(t1.totalVehicles * 0.2)) * (t1.avgPremiumCost - t1.avgBaseCost) * 12 / 1000)}K savings`,
      text: `Tier 1 currently has ${t1.premiumPct}% premium share (${t1.premiumVehicles} vehicles). Moving to 20% premium share shifts ~${t1.premiumVehicles - Math.round(t1.totalVehicles * 0.2)} vehicles from premium to base, saving ~$${(t1.avgPremiumCost - t1.avgBaseCost)}/mo per vehicle.`,
      tags: ["Trim", "Sales", "Savings Model"],
    },
  ]
}

// ─── Keyword-to-Lever Mapping (deterministic rules) ─────────────────────────

const KEYWORD_LEVER_MAP: Record<string, string[]> = {
  lease: ["lev-1", "lev-7"],
  rate: ["lev-1", "lev-4"],
  price: ["lev-1"],
  OEM: ["lev-1", "lev-15"],
  dealer: ["lev-1", "lev-17"],
  discount: ["lev-1"],
  fee: ["lev-2"],
  FMC: ["lev-2"],
  audit: ["lev-2"],
  model: ["lev-3", "lev-20"],
  trim: ["lev-3", "lev-20"],
  standard: ["lev-3", "lev-20"],
  complexity: ["lev-3", "lev-20"],
  proliferation: ["lev-20"],
  maintenance: ["lev-4", "lev-12"],
  repair: ["lev-4"],
  labor: ["lev-4"],
  parts: ["lev-4"],
  insurance: ["lev-5"],
  claims: ["lev-5", "lev-12"],
  deductible: ["lev-5"],
  premium: ["lev-5", "lev-20"],
  telematics: ["lev-6", "lev-16"],
  device: ["lev-6"],
  residual: ["lev-7", "lev-14"],
  remarketing: ["lev-7"],
  depreciation: ["lev-7"],
  rental: ["lev-8"],
  replacement: ["lev-8"],
  policy: ["lev-9"],
  compliance: ["lev-9", "lev-18"],
  exception: ["lev-9"],
  governance: ["lev-9"],
  utilization: ["lev-10"],
  "right-sizing": ["lev-10"],
  idle: ["lev-10"],
  mileage: ["lev-11"],
  territory: ["lev-11"],
  routing: ["lev-11"],
  fuel: ["lev-11"],
  driver: ["lev-12"],
  safety: ["lev-12"],
  behavior: ["lev-12"],
  accident: ["lev-12"],
  coaching: ["lev-12"],
  EV: ["lev-13", "lev-18"],
  electric: ["lev-13"],
  hybrid: ["lev-13"],
  TCO: ["lev-13", "lev-14"],
  incentive: ["lev-13"],
  charging: ["lev-13"],
  refresh: ["lev-14"],
  lifecycle: ["lev-14"],
  "hold period": ["lev-14"],
  supply: ["lev-15"],
  allocation: ["lev-15"],
  "lead time": ["lev-15"],
  delivery: ["lev-15"],
  SLA: ["lev-15"],
  data: ["lev-16"],
  rights: ["lev-16"],
  analytics: ["lev-16"],
  reporting: ["lev-16", "lev-18"],
  performance: ["lev-17"],
  turnaround: ["lev-17"],
  quality: ["lev-17"],
  ESG: ["lev-18"],
  sustainability: ["lev-18"],
  emissions: ["lev-18"],
  diversity: ["lev-18"],
  continuity: ["lev-19"],
  resilience: ["lev-19"],
  backup: ["lev-19"],
  coverage: ["lev-19"],
  consolidation: ["lev-1", "lev-6"],
  consolidate: ["lev-1", "lev-6"],
  cost: ["lev-1", "lev-4"],
  "cost-reduction": ["lev-1", "lev-2", "lev-4"],
  risk: ["lev-5", "lev-15", "lev-19"],
  specification: ["lev-3", "lev-20"],
  "role tier": ["lev-20"],
  tier: ["lev-20"],
}

// ─── Recommendation Engine ──────────────────────────────────────────────────

function scoreLeverFromInsights(
  lever: Lever,
  insights: UnifiedInsight[],
): { score: number; matchedInsights: UnifiedInsight[]; reasons: string[] } {
  const matchedInsights: UnifiedInsight[] = []
  const reasons: string[] = []
  let score = 0

  for (const insight of insights) {
    const textLower = `${insight.title} ${insight.text} ${insight.tags.join(" ")}`.toLowerCase()
    let matched = false

    for (const keyword of lever.keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        matched = true
        break
      }
    }

    if (!matched) {
      for (const [keyword, leverIds] of Object.entries(KEYWORD_LEVER_MAP)) {
        if (leverIds.includes(lever.id) && textLower.includes(keyword.toLowerCase())) {
          matched = true
          break
        }
      }
    }

    if (matched) {
      matchedInsights.push(insight)
      score += insight.weight
      if (reasons.length < 2) {
        reasons.push(`${insight.sourceLabel}: "${insight.title}"`)
      }
    }
  }

  return { score, matchedInsights, reasons }
}

export function getRecommendedLevers(
  categoryId: string,
  maxResults: number = 8,
): LeverRecommendation[] {
  const insights = getAllInsightsForCategory(categoryId)
  const scored: { lever: Lever; score: number; matchedInsights: UnifiedInsight[]; reasons: string[] }[] = []

  for (const lever of fleetLevers) {
    const result = scoreLeverFromInsights(lever, insights)
    if (result.score > 0) {
      scored.push({ lever, ...result })
    }
  }

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, maxResults).map((item) => ({
    lever: item.lever,
    confidence: item.score >= 6 ? "High" : item.score >= 3 ? "Medium" : "Low",
    reason: item.reasons.length > 0
      ? `Linked to ${item.matchedInsights.length} insight(s) including ${item.reasons[0]}`
      : "General alignment with category profile",
    evidenceInsights: item.matchedInsights.slice(0, 5),
  }))
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getLeverById(id: string): Lever | undefined {
  return fleetLevers.find((l) => l.id === id)
}

export function getLeversByBucket(bucket: LeverBucket): Lever[] {
  return fleetLevers.filter((l) => l.bucket === bucket)
}

export function isLeverRecommended(leverId: string, recommendations: LeverRecommendation[]): LeverRecommendation | undefined {
  return recommendations.find((r) => r.lever.id === leverId)
}

export function getAnalysisStatusColor(status: AnalysisStatus): string {
  switch (status) {
    case "Available":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "Needs data":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "Not available":
      return "bg-red-50 text-red-700 border-red-200"
  }
}

export function getLeverStatusColor(status: LeverStatus): string {
  switch (status) {
    case "Not started":
      return "bg-muted text-muted-foreground border-border"
    case "In analysis":
      return "bg-sky-50 text-sky-700 border-sky-200"
    case "Sized":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "In execution":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
  }
}

export function getConfidenceColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case "High":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "Medium":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "Low":
      return "bg-red-50 text-red-700 border-red-200"
  }
}

export function getBucketColor(bucket: LeverBucket): string {
  switch (bucket) {
    case "Cost":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "Demand":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "Value":
      return "bg-teal-50 text-teal-700 border-teal-200"
  }
}
