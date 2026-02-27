import { NextResponse } from "next/server"

export interface SearchResult {
  id: string
  title: string
  sourceName: string
  sourceType: string
  publishedAt: string
  url: string
  snippet: string
  fullText: string
  tags: string[]
  relevanceScore: number
}

interface SearchRequest {
  query: string
  sources: string[]
  dateFrom?: string
  dateTo?: string
  categoryId?: string
}

// Deterministic mock results keyed by query keywords
const RESULT_POOL: Omit<SearchResult, "id" | "relevanceScore">[] = [
  {
    title: "US Fleet Lease Costs Rise 6% as OEM Incentives Tighten",
    sourceName: "Automotive Fleet",
    sourceType: "News",
    publishedAt: "2026-02-10",
    url: "https://example.com/fleet-lease-costs",
    snippet: "Average closed-end lease costs for midsize sedans rose 6% year-over-year as automakers pull back fleet incentive programs and prioritize retail-channel profitability.",
    fullText: "Average closed-end lease costs for midsize sedans rose 6% year-over-year as automakers pull back fleet incentive programs and prioritize retail-channel profitability. The trend is most pronounced among domestic OEMs, where fleet allocation has dropped to 18% of production from 22% in 2024. Import brands are holding incentives steadier but tightening delivery timelines. For fleet procurement teams in pharma and medical-device verticals, the cost pressure underscores the value of multi-OEM sourcing, longer-term volume commitments, and early-order pipelines. Organizations with 500+ vehicles should evaluate whether operating leases or closed-end finance leases offer more favorable total-cost-of-ownership under current residual-value forecasts.",
    tags: ["fleet", "lease", "OEM", "cost drivers"],
  },
  {
    title: "EV Charging Infrastructure Bill Signed: $4.5B for Workplace & Depot Chargers",
    sourceName: "Regulatory Watch",
    sourceType: "News",
    publishedAt: "2026-02-08",
    url: "https://example.com/ev-charging-bill",
    snippet: "The US Infrastructure Expansion Act allocates $4.5B in tax credits and grants for workplace and fleet-depot EV charging installations through 2029, accelerating corporate EV fleet adoption.",
    fullText: "The US Infrastructure Expansion Act allocates $4.5B in tax credits and grants for workplace and fleet-depot EV charging installations through 2029. Eligible organizations can claim up to 30% of installation costs as tax credits, with additional grants for rural and underserved areas. The legislation also standardizes NACS connector requirements for all federally-funded stations. For pharma fleet managers evaluating EV transition, the incentives materially change the total-cost-of-ownership equation: Level-2 home charger installations for field reps now qualify for employer tax credits of up to $1,500 per unit. Organizations planning EV pilots should map charger eligibility across their territory footprint and factor incentives into lease-versus-buy models.",
    tags: ["EV", "charging", "regulation", "incentives"],
  },
  {
    title: "Pharma Fleet Benchmark 2026: Average Cost Per Driver Hits $18,400",
    sourceName: "Fleet Management Weekly",
    sourceType: "Research",
    publishedAt: "2026-01-28",
    url: "https://example.com/pharma-fleet-benchmark",
    snippet: "The annual pharma fleet benchmark shows average total cost per driver reached $18,400, up 4.2% year-over-year, with fuel and insurance driving the largest increases.",
    fullText: "The annual pharma fleet benchmark shows average total cost per driver reached $18,400, up 4.2% year-over-year. Fuel costs rose 8% and insurance premiums increased 11%, while lease depreciation remained flat. Maintenance costs declined 2% as average fleet age dropped to 2.6 years. Best-in-class organizations achieve $15,800 per driver through OEM consolidation, telematics-driven behavior coaching, and competitive FMC sourcing. The benchmark covers 42 pharma and biotech companies representing 185,000 vehicles across North America and Europe. Key differentiators include policy compliance rates above 90%, EV adoption above 20%, and centralized fleet procurement governance. Organizations above the median should prioritize fuel management, insurance negotiation, and driver safety programs.",
    tags: ["benchmark", "pharma", "fleet", "cost per driver"],
  },
  {
    title: "Gasoline Prices Rise 12% on Refinery Capacity Constraints",
    sourceName: "Bloomberg",
    sourceType: "Market Data",
    publishedAt: "2026-02-05",
    url: "https://example.com/gas-prices-rise",
    snippet: "US retail gasoline averaged $4.18/gallon in January 2026, up 12% year-over-year as refinery maintenance schedules and geopolitical supply disruptions tighten fuel markets.",
    fullText: "US retail gasoline averaged $4.18/gallon in January 2026, up 12% year-over-year as refinery maintenance schedules and geopolitical supply disruptions tighten fuel markets. Diesel prices have risen even faster at 15%, impacting heavy-vehicle fleets. The cost increase has direct fleet P&L implications: for a 1,000-vehicle fleet averaging 20,000 miles per year, each $0.50/gallon increase translates to approximately $1.25M in annual fuel cost. Fleet managers should evaluate fuel card optimization, driver coaching for eco-driving, right-sizing vehicle engine displacement, and accelerating EV conversion where territory profiles support it. Hedging strategies through fuel card pre-purchase programs can lock in rates 3-6 months forward.",
    tags: ["fuel", "gasoline", "cost drivers", "commodity"],
  },
  {
    title: "Auto Insurance Premiums Surge 11% for Commercial Fleets",
    sourceName: "Insurance Journal",
    sourceType: "News",
    publishedAt: "2026-02-03",
    url: "https://example.com/fleet-insurance",
    snippet: "Commercial auto insurance premiums rose 11% in Q4 2025, driven by nuclear verdicts, rising repair costs, and increased distracted driving incidents across pharma and sales fleets.",
    fullText: "Commercial auto insurance premiums rose 11% in Q4 2025, driven by nuclear verdicts exceeding $10M, rising vehicle repair costs due to ADAS sensor complexity, and a 15% increase in distracted driving incidents. Pharma and medical-device fleets saw above-average increases due to high annual mileage and urban driving profiles. Insurers are now requiring telematics data for favorable pricing, with fleets demonstrating low distraction scores and proactive driver coaching receiving 8-12% premium discounts. For fleet procurement teams, insurance cost management requires cross-functional collaboration with risk, HR, and operations. Best practices include quarterly loss-run reviews, mandatory defensive driving training, and structured telematics-based incentive programs.",
    tags: ["insurance", "fleet", "risk", "premiums"],
  },
  {
    title: "Japanese OEMs Expand Fleet-Specific EV Lineup for 2027 Model Year",
    sourceName: "Automotive News",
    sourceType: "News",
    publishedAt: "2026-01-22",
    url: "https://example.com/japan-oem-ev",
    snippet: "Toyota, Honda, and Nissan have announced fleet-optimized EV sedans and crossovers for the 2027 model year, targeting pharma and field-service fleets with extended range and fleet management integration.",
    fullText: "Toyota, Honda, and Nissan have announced fleet-optimized EV sedans and crossovers for the 2027 model year, specifically targeting pharma and field-service fleets. Key features include 350+ mile EPA range, factory-integrated telematics, fleet management API access, and dedicated fleet service networks. Toyota's bZ5 Fleet Edition offers a 370-mile range with a $38,500 MSRP before fleet discounts. For procurement teams managing APAC and global fleet portfolios, the expanded lineup addresses the key adoption barriers of range anxiety and service network coverage. Early order commitments for 2027 model year are being accepted now with 8-12 week lead times, compared to 16-20 weeks for retail channels.",
    tags: ["EV", "OEM", "Japan", "fleet vehicles"],
  },
  {
    title: "Telematics Data Privacy: GDPR Enforcement Actions Target Fleet Operators",
    sourceName: "Fleet Europe",
    sourceType: "Research",
    publishedAt: "2026-01-30",
    url: "https://example.com/telematics-privacy",
    snippet: "EU data protection authorities issued EUR 8.2M in fines to fleet operators in 2025 for non-compliant telematics data processing, with driver consent and data minimization as key violation areas.",
    fullText: "EU data protection authorities issued EUR 8.2M in fines to fleet operators in 2025 for non-compliant telematics data processing. The French CNIL and German BfDI led enforcement, focusing on driver consent mechanisms, data retention periods, and the distinction between company-vehicle tracking and personal driving. For pharma fleets operating in Europe, the regulatory landscape requires explicit driver consent, data minimization (collecting only what is necessary), and clear policies on after-hours tracking. Procurement teams should include GDPR/CCPA compliance requirements in telematics vendor RFPs, require data processing agreements, and ensure contractual data ownership clauses. Best practice organizations conduct annual privacy impact assessments for all telematics programs.",
    tags: ["telematics", "privacy", "GDPR", "compliance"],
  },
  {
    title: "Used Vehicle Residual Values Stabilize After 18-Month Decline",
    sourceName: "Manheim",
    sourceType: "Market Data",
    publishedAt: "2026-02-01",
    url: "https://example.com/residual-values",
    snippet: "Manheim Used Vehicle Value Index stabilized at 208.3 in January 2026, ending an 18-month decline. Fleet-grade sedans and SUVs saw the strongest recovery at 4.2% month-over-month.",
    fullText: "Manheim Used Vehicle Value Index stabilized at 208.3 in January 2026, ending an 18-month decline that saw values drop 22% from pandemic peaks. Fleet-grade midsize sedans and compact SUVs saw the strongest recovery at 4.2% month-over-month, driven by rental fleet restocking and export demand. EV residual values remain volatile, with 2-3 year old EVs trading at 52-58% of MSRP versus 62-68% for comparable ICE vehicles. For fleet procurement teams, the stabilization is positive for lease-end economics but EV residual uncertainty remains a key risk factor. Organizations should negotiate guaranteed residual values or open-ended leases for EV vehicles, and monitor the Manheim index monthly to time de-fleet decisions optimally.",
    tags: ["residual value", "used vehicles", "market data", "lease"],
  },
  {
    title: "EU Fleet Emissions Regulations: 2027 Targets Require 25% Zero-Emission Vehicles",
    sourceName: "European Commission",
    sourceType: "News",
    publishedAt: "2026-01-25",
    url: "https://example.com/eu-fleet-emissions",
    snippet: "New EU corporate fleet regulations effective January 2027 will require companies with 50+ vehicles to achieve 25% zero-emission fleet composition or face per-vehicle penalty charges.",
    fullText: "New EU corporate fleet regulations effective January 2027 will require companies with 50+ vehicles to achieve 25% zero-emission fleet composition or face per-vehicle penalty charges of EUR 500 per non-compliant vehicle annually. The regulation covers all EU member states and applies to both owned and leased vehicles. For pharma companies with significant European field forces, the regulation creates a hard deadline for EV transition planning. Organizations should map their EU fleet composition against the 25% target, identify territories where EV adoption is most feasible (urban, high-charging-density), and accelerate order placement for EV models with 6-12 month lead times. Transitional provisions allow plug-in hybrids to count at 50% toward the zero-emission target through 2028.",
    tags: ["regulation", "emissions", "EU", "EV mandate"],
  },
  {
    title: "Sustainable Fleet Procurement: ESG Scoring Enters OEM Selection Criteria",
    sourceName: "Procurement Insights",
    sourceType: "Research",
    publishedAt: "2026-02-06",
    url: "https://example.com/fleet-esg",
    snippet: "68% of Fortune 500 companies now include ESG criteria in fleet OEM and FMC vendor evaluations, with Scope 1 fleet emissions becoming a board-level reporting metric.",
    fullText: "68% of Fortune 500 companies now include ESG criteria in fleet OEM and FMC vendor evaluations, with Scope 1 fleet emissions becoming a board-level reporting metric. The shift is driven by SEC climate disclosure rules, CSRD requirements for EU operations, and stakeholder pressure for science-based emission targets. Leading pharma companies are integrating fleet emissions into their CDP and SBTi reporting, requiring OEMs to disclose lifecycle carbon data and FMCs to provide monthly emissions dashboards. For procurement teams, ESG integration affects vehicle selection (favoring hybrid/EV), supplier evaluation (weighting OEM sustainability programs), and contract terms (including carbon reduction clauses). Best practices include weighting ESG at 15-20% in fleet vendor evaluations and requiring quarterly emissions reporting.",
    tags: ["ESG", "sustainability", "fleet", "emissions"],
  },
]

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

export async function POST(request: Request) {
  const body = (await request.json()) as SearchRequest
  const { query, sources, dateFrom, dateTo } = body

  // Simulate latency
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 400))

  const q = query.toLowerCase()

  // Score each result by keyword overlap
  let scored = RESULT_POOL.map((r, idx) => {
    const text = `${r.title} ${r.snippet} ${r.tags.join(" ")}`.toLowerCase()
    const queryWords = q.split(/\s+/).filter(Boolean)
    let score = 0
    queryWords.forEach((w) => {
      if (text.includes(w)) score += 20
    })
    // Boost by source match
    if (sources.length > 0) {
      const src = r.sourceName.toLowerCase()
      if (sources.some((s) => src.includes(s.toLowerCase()))) score += 15
    }
    // Base relevance so we always return something
    score += 10 - idx * 0.5
    return { ...r, id: `res-${hashCode(r.title)}-${idx}`, relevanceScore: Math.min(99, Math.max(10, Math.round(score + hashCode(q + r.title) % 20))) }
  })

  // Filter by date range
  if (dateFrom) {
    scored = scored.filter((r) => r.publishedAt >= dateFrom)
  }
  if (dateTo) {
    scored = scored.filter((r) => r.publishedAt <= dateTo)
  }

  // Sort by score desc
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore)

  return NextResponse.json({ results: scored })
}
