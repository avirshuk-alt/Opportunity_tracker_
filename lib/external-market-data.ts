// ─── External Market Data (Mock) ────────────────────────────────────────────
// Realistic placeholder data for Pharma Fleet (Sales & Market Access Vehicles)
// All interfaces are stable for future wiring to real APIs.

// ─── Market Overview ────────────────────────────────────────────────────────

export interface MarketKPIs {
  globalMarketSize: number       // in billions USD
  cagr3Year: number              // percentage
  growth3YearAbsolute: number    // in billions USD
  majorSupplierCount: number
  fragmentationLevel: "Low" | "Moderate" | "High"
  supplyDemandTightness: "Loose" | "Balanced" | "Tight" | "Critical"
}

export const marketKPIs: MarketKPIs = {
  globalMarketSize: 68,
  cagr3Year: 5.2,
  growth3YearAbsolute: 10,
  majorSupplierCount: 34,
  fragmentationLevel: "Moderate",
  supplyDemandTightness: "Tight",
}

// ─── Market Growth Series ───────────────────────────────────────────────────

export interface MarketGrowthPoint {
  year: string
  total: number
  leaseDepreciation: number
  fuel: number
  insurance: number
  maintenanceRepair: number
  telematics: number
  tiresRentals: number
}

export const marketGrowthSeries: MarketGrowthPoint[] = [
  { year: "2021", total: 55.0, leaseDepreciation: 22.0, fuel: 11.0, insurance: 7.2, maintenanceRepair: 7.7, telematics: 3.3, tiresRentals: 3.8 },
  { year: "2022", total: 58.5, leaseDepreciation: 23.4, fuel: 12.3, insurance: 7.6, maintenanceRepair: 7.9, telematics: 3.5, tiresRentals: 3.8 },
  { year: "2023", total: 63.0, leaseDepreciation: 25.2, fuel: 12.9, insurance: 8.2, maintenanceRepair: 8.3, telematics: 4.1, tiresRentals: 4.3 },
  { year: "2024", total: 68.0, leaseDepreciation: 27.2, fuel: 13.6, insurance: 8.8, maintenanceRepair: 8.8, telematics: 5.1, tiresRentals: 4.5 },
]

// ─── Leverage / Buyer vs Seller Meter ───────────────────────────────────────

export interface LeverageFactor {
  id: string
  name: string
  score: number  // 0–100
  weight: number // for weighted avg
  explanation: string
  direction: "buyer" | "seller" | "neutral"
}

export const leverageFactors: LeverageFactor[] = [
  {
    id: "concentration",
    name: "OEM Market Concentration",
    score: 72,
    weight: 0.25,
    explanation: "Top 5 OEMs hold ~70% of fleet market share. Limited number of models meeting pharma fleet specs reduces buyer negotiation leverage.",
    direction: "seller",
  },
  {
    id: "pricing",
    name: "Fleet Pricing Competitiveness",
    score: 42,
    weight: 0.20,
    explanation: "Fleet discounts of 15-25% off MSRP are standard, but EV premiums and delivery surcharges moderate buyer leverage.",
    direction: "neutral",
  },
  {
    id: "switching",
    name: "Switching Costs (OEM/FMC)",
    score: 65,
    weight: 0.20,
    explanation: "Driver familiarity, telematics integration, and lease contract terms create moderate switching costs between OEMs and fleet management companies.",
    direction: "seller",
  },
  {
    id: "capacity",
    name: "Vehicle Delivery Lead Times",
    score: 70,
    weight: 0.20,
    explanation: "New vehicle delivery lead times average 8-14 weeks for fleet orders, with EV models experiencing 16-24 week delays due to battery supply constraints.",
    direction: "seller",
  },
  {
    id: "substitutes",
    name: "Alternative Mobility Options",
    score: 35,
    weight: 0.15,
    explanation: "Car-sharing, subscription models, and rental pools offer alternatives for short-term needs, increasing buyer leverage for non-core fleet segments.",
    direction: "buyer",
  },
]

export function getCompositeScore(): number {
  const totalWeight = leverageFactors.reduce((a, f) => a + f.weight, 0)
  return Math.round(leverageFactors.reduce((a, f) => a + f.score * f.weight, 0) / totalWeight)
}

export function getLeverageLabel(score: number): { label: string; color: string; bgColor: string } {
  if (score <= 40) return { label: "Buyer's Market", color: "text-emerald-700", bgColor: "bg-emerald-500" }
  if (score <= 60) return { label: "Balanced", color: "text-amber-700", bgColor: "bg-amber-500" }
  return { label: "Seller's Market", color: "text-red-700", bgColor: "bg-red-500" }
}

// ─── Value Chain Growth by Stage ─────────────────────────────────────────────

export interface ValueChainGrowthPoint {
  year: string
  oems: number
  dealer: number
  fmcs: number
  telematics: number
  maintenance: number
  repairs: number
}

/** Absolute market size ($B) by value chain stage, 2021-2024 */
export const valueChainGrowthAbsolute: ValueChainGrowthPoint[] = [
  { year: "2021", oems: 18.4, dealer: 6.2, fmcs: 12.8, telematics: 3.3, maintenance: 8.5, repairs: 5.8 },
  { year: "2022", oems: 19.1, dealer: 6.4, fmcs: 13.6, telematics: 3.7, maintenance: 9.1, repairs: 6.1 },
  { year: "2023", oems: 19.9, dealer: 6.6, fmcs: 14.3, telematics: 4.1, maintenance: 9.7, repairs: 6.4 },
  { year: "2024", oems: 20.4, dealer: 6.8, fmcs: 15.1, telematics: 4.6, maintenance: 10.2, repairs: 6.7 },
]

/** Index (2021 = 100) by value chain stage, 2021-2024 */
export const valueChainGrowthIndex: ValueChainGrowthPoint[] = [
  { year: "2021", oems: 100, dealer: 100, fmcs: 100, telematics: 100, maintenance: 100, repairs: 100 },
  { year: "2022", oems: 104, dealer: 103, fmcs: 106, telematics: 112, maintenance: 107, repairs: 105 },
  { year: "2023", oems: 108, dealer: 106, fmcs: 112, telematics: 125, maintenance: 114, repairs: 110 },
  { year: "2024", oems: 111, dealer: 109, fmcs: 118, telematics: 140, maintenance: 120, repairs: 116 },
]

export const VALUE_CHAIN_STAGE_LABELS: Record<string, string> = {
  oems: "OEMs",
  dealer: "Dealer Network",
  fmcs: "Fleet Mgmt Co. (FMCs)",
  telematics: "Telematics Providers",
  maintenance: "Maintenance Network",
  repairs: "Repair & Collision",
}

export const VALUE_CHAIN_STAGE_COLORS: Record<string, string> = {
  oems: "#2563eb",
  dealer: "#7c3aed",
  fmcs: "#0891b2",
  telematics: "#059669",
  maintenance: "#d97706",
  repairs: "#dc2626",
}

/** Mock major-supplier count per type */
export const TYPE_SUPPLIER_COUNTS: Record<string, number> = {
  oems: 15,
  dealer: 40,
  fmcs: 12,
  telematics: 55,
  maintenance: 65,
  repairs: 80,
}

/** Mock supply/demand label per type */
export const TYPE_SUPPLY_DEMAND: Record<string, "Loose" | "Balanced" | "Tight" | "Critical"> = {
  oems: "Tight",
  dealer: "Tight",
  fmcs: "Balanced",
  telematics: "Balanced",
  maintenance: "Loose",
  repairs: "Loose",
}

// ─── Value Chain ────────────────────────────────────────────────────────────

export interface ValueChainStage {
  id: string
  name: string
  shortName: string
  description: string
  position: number  // 0-based for ordering
  isOurs: boolean
  hotspot?: {
    label: string
    severity: "high" | "medium" | "low"
  }
}

export const valueChainStages: ValueChainStage[] = [
  {
    id: "oem",
    name: "OEM / Vehicle Manufacturer",
    shortName: "OEM",
    description: "Automotive manufacturers producing fleet-spec vehicles (sedan, SUV, EV, hybrid)",
    position: 0,
    isOurs: false,
    hotspot: { label: "High OEM concentration", severity: "high" },
  },
  {
    id: "dealer",
    name: "Dealer / Dealer Group",
    shortName: "Dealer Network",
    description: "Authorized dealers handling fleet orders, delivery, and trade-ins",
    position: 1,
    isOurs: false,
    hotspot: { label: "Delivery lead-time risk", severity: "medium" },
  },
  {
    id: "fmc",
    name: "Fleet Management Company (FMC)",
    shortName: "FMC",
    description: "Companies managing leases, maintenance scheduling, insurance, and driver services",
    position: 2,
    isOurs: false,
  },
  {
    id: "client",
    name: "Meridian Pharmaceuticals",
    shortName: "Meridian",
    description: "Your company - fleet procurement and mobility operations hub",
    position: 3,
    isOurs: true,
  },
  {
    id: "field-ops",
    name: "Field Sales & Market Access",
    shortName: "Field Ops",
    description: "Sales reps and market access managers using vehicles daily",
    position: 4,
    isOurs: false,
  },
  {
    id: "services",
    name: "Service Providers",
    shortName: "Services",
    description: "Fuel, telematics, insurance, maintenance, tire, and rental providers",
    position: 5,
    isOurs: false,
    hotspot: { label: "Fragmented service spend", severity: "medium" },
  },
]

// ─── Supplier Footprint ─────────────────────────────────────────────────────

export interface ValueChainSupplier {
  id: string
  name: string
  stageId: string
  provides: string
  contractType: "Contract" | "PO" | "Subscription"
  annualSpend: number   // in millions USD
  renewalDate: string
  risks: string[]
  researchTopics: string[]
}

export const valueChainSuppliers: ValueChainSupplier[] = [
  {
    id: "autonation",
    name: "AutoNation Fleet Solutions",
    stageId: "oem",
    provides: "Midsize sedans, compact SUVs, EV sedans for Sales and Market Access",
    contractType: "Contract",
    annualSpend: 10.2,
    renewalDate: "2027-02",
    risks: ["EV delivery delays (16-24 weeks)", "Model year changeover gaps", "Limited AWD sedan availability"],
    researchTopics: ["AutoNation fleet program performance", "OEM fleet pricing trends 2026"],
  },
  {
    id: "holman",
    name: "Holman Enterprises",
    stageId: "fmc",
    provides: "Full fleet management, maintenance scheduling, driver services, insurance program",
    contractType: "Contract",
    annualSpend: 6.8,
    renewalDate: "2027-09",
    risks: ["FMC margin transparency limited", "Service network coverage gaps in rural territories", "Data integration complexity"],
    researchTopics: ["Holman fleet management capabilities", "FMC market competitive landscape"],
  },
  {
    id: "leaseplan",
    name: "Leaseplan GmbH",
    stageId: "fmc",
    provides: "EMEA lease management, driver services, and vehicle remarketing",
    contractType: "Contract",
    annualSpend: 4.9,
    renewalDate: "2025-11",
    risks: ["EUR/USD exposure on lease payments", "EMEA regulatory complexity", "Early termination fees"],
    researchTopics: ["European fleet leasing market trends", "Leaseplan competitive positioning"],
  },
  {
    id: "donlen",
    name: "Donlen Fleet Management",
    stageId: "fmc",
    provides: "Telematics platform, driver safety scoring, accident management",
    contractType: "Subscription",
    annualSpend: 3.2,
    renewalDate: "2027-12",
    risks: ["Telematics data privacy concerns", "Driver adoption resistance", "Platform lock-in"],
    researchTopics: ["Fleet telematics market trends", "Donlen driver safety platform reviews"],
  },
  {
    id: "fleetcor",
    name: "FleetCor Technologies",
    stageId: "services",
    provides: "Fuel cards, toll management, and fleet expense reporting",
    contractType: "Contract",
    annualSpend: 2.1,
    renewalDate: "2025-12",
    risks: ["Rebate tier complexity", "Fuel price volatility pass-through", "Personal use leakage"],
    researchTopics: ["Fleet fuel card market pricing", "FleetCor rebate program benchmarks"],
  },
  {
    id: "orix",
    name: "Orix Auto Japan",
    stageId: "dealer",
    provides: "Japan fleet lease, vehicle procurement, and driver support",
    contractType: "Contract",
    annualSpend: 3.1,
    renewalDate: "2026-02",
    risks: ["Limited EV model availability in Japan market", "Currency exposure (JPY)", "Local regulatory changes"],
    researchTopics: ["Japan fleet leasing market outlook", "Orix Auto fleet capabilities"],
  },
  {
    id: "alphabet",
    name: "Alphabet Fleet GmbH",
    stageId: "dealer",
    provides: "EMEA vehicle procurement, remarketing, and driver services",
    contractType: "Contract",
    annualSpend: 2.5,
    renewalDate: "2026-06",
    risks: ["Residual value exposure on returned vehicles", "Lead time for specialty configurations", "Service quality variability"],
    researchTopics: ["EMEA fleet remarketing trends", "Alphabet Fleet service quality"],
  },
  {
    id: "tire-network",
    name: "National Tire Network",
    stageId: "services",
    provides: "Tire replacement, seasonal tire swaps, and roadside assistance",
    contractType: "PO",
    annualSpend: 0.6,
    renewalDate: "Rolling PO",
    risks: ["Rubber commodity price volatility", "Service network coverage in rural areas", "EV-specific tire requirements"],
    researchTopics: ["Fleet tire management best practices", "EV tire replacement costs vs ICE"],
  },
]

// ─── Research Tab Suggested Topics (upgraded) ───────────────────────────────

export const UPGRADED_SUGGESTED_TOPICS = [
  "OEM fleet pricing & incentive trends",
  "EV transition cost and infrastructure readiness",
  "Fleet insurance premium benchmarks",
  "Lease vs buy analysis for pharma fleets",
  "Telematics privacy regulations (GDPR/CCPA)",
  "Fuel price outlook & hedging strategies",
  "Driver safety and accident cost management",
]
