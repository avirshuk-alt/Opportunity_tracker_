import { NextResponse } from "next/server"

interface AssistantRequest {
  tab: string
  sku?: string
  skuId?: string
  skuName?: string
  subcategory?: string
  supplier?: string
  country?: string
  userMessage: string
  contextSummary?: string
  modelInputs?: { indexId: string; weight: number }[]
  currentSelection?: { indices: { id: string; name: string; weight: number }[] }
}

export interface SuggestedIndex {
  id: string
  name: string
  rationale: string
  defaultWeight: number
}

interface AssistantResponse {
  assistantMessage: string
  suggestedIndices?: SuggestedIndex[]
  suggestedWeights?: { indexId: string; weight: number }[]
  warnings?: string[]
}

// Full index catalogue
const INDEX_CATALOGUE: Record<string, { id: string; name: string; relevantTo: string[]; rationale: (sub: string) => string }> = {
  "idx-1": { id: "idx-1", name: "Vehicle Residual Value Index", relevantTo: ["lease/depreciation", "rentals"], rationale: (sub) => `"${sub}" costs are directly tied to vehicle residual value trends` },
  "idx-2": { id: "idx-2", name: "US Retail Gasoline Price", relevantTo: ["fuel"], rationale: (sub) => `"${sub}" costs track directly with retail gasoline/diesel pricing` },
  "idx-3": { id: "idx-3", name: "Auto Insurance Premium Index", relevantTo: ["insurance"], rationale: (sub) => `"${sub}" costs correlate with commercial auto insurance market trends` },
  "idx-4": { id: "idx-4", name: "Labor Rate Index (Auto Repair)", relevantTo: ["maintenance/repair", "tires"], rationale: (sub) => `Labor rates are a significant component of "${sub}" costs` },
  "idx-5": { id: "idx-5", name: "USD Trade-Weighted FX", relevantTo: ["lease/depreciation", "fuel", "insurance", "maintenance/repair", "tires", "tolls/parking", "rentals", "telematics"], rationale: () => `Currency exposure proxy — applies to all multi-region fleet costs` },
  "idx-6": { id: "idx-6", name: "Rubber / Tire Material Index", relevantTo: ["tires", "maintenance/repair"], rationale: (sub) => `Raw material costs for "${sub}" track rubber and synthetic material pricing` },
}

function getIndexSuggestions(subcategory: string): { indices: SuggestedIndex[]; warnings: string[] } {
  const sub = subcategory.toLowerCase()
  const matched: SuggestedIndex[] = []
  const warnings: string[] = []

  for (const [, entry] of Object.entries(INDEX_CATALOGUE)) {
    if (entry.relevantTo.some((r) => sub.includes(r) || r.includes(sub))) {
      matched.push({
        id: entry.id,
        name: entry.name,
        rationale: entry.rationale(subcategory),
        defaultWeight: 0, // will be set below
      })
    }
  }

  // If nothing matched, fallback to FX only
  if (matched.length === 0) {
    matched.push({
      id: "idx-5",
      name: "USD Trade-Weighted FX",
      rationale: "No category-specific index available; using global FX proxy",
      defaultWeight: 100,
    })
    warnings.push(`No category-level index available for "${subcategory}"; using global FX proxy.`)
    return { indices: matched, warnings }
  }

  // Distribute weights: primary indices get more, FX gets less
  const fxIdx = matched.findIndex((m) => m.id === "idx-5")
  const nonFxCount = fxIdx >= 0 ? matched.length - 1 : matched.length
  const fxWeight = fxIdx >= 0 ? (nonFxCount > 0 ? 20 : 100) : 0
  const remainingWeight = 100 - fxWeight
  const perIndex = nonFxCount > 0 ? Math.floor(remainingWeight / nonFxCount) : 0
  let leftover = remainingWeight - perIndex * nonFxCount

  matched.forEach((m, i) => {
    if (i === fxIdx) {
      m.defaultWeight = fxWeight
    } else {
      m.defaultWeight = perIndex + (leftover > 0 ? 1 : 0)
      if (leftover > 0) leftover--
    }
  })

  // Add warnings for missing country-level data
  warnings.push("No country-level index available; using global proxies.")

  return { indices: matched, warnings }
}

function getSuggestions(req: AssistantRequest): AssistantResponse {
  const msg = req.userMessage.toLowerCase()
  const sub = (req.subcategory ?? "").toLowerCase()

  // ──── SKU Index Analysis tab ──────────────────────────────────────
  if (req.tab === "sku-index-analysis") {
    // Auto-suggest on SKU change or explicit request
    if (msg.includes("suggest") || msg.includes("index") || msg.includes("indices") || msg.includes("recommend") || msg === "auto-suggest") {
      const { indices, warnings } = getIndexSuggestions(req.subcategory ?? "")
      const weightSummary = indices.map((idx) => `- **${idx.name}** (${idx.defaultWeight}%): ${idx.rationale}`).join("\n")

      return {
        assistantMessage: `Based on the **${req.subcategory}** subcategory for SKU **${req.sku ?? req.skuName ?? "selected"}**, I recommend these indices:\n\n${weightSummary}\n\nClick **"Apply Suggestions"** to set these indices and weights, or select specific ones and click **"Apply Selected Only"**.`,
        suggestedIndices: indices,
        suggestedWeights: indices.map((idx) => ({ indexId: idx.id, weight: idx.defaultWeight })),
        warnings,
      }
    }

    // Refresh suggestions
    if (msg.includes("refresh") || msg.includes("regenerate") || msg.includes("recalculate")) {
      const { indices, warnings } = getIndexSuggestions(req.subcategory ?? "")
      return {
        assistantMessage: `Refreshed suggestions for **${req.subcategory}**. ${indices.length} indices identified. Click **"Apply Suggestions"** to use them.`,
        suggestedIndices: indices,
        suggestedWeights: indices.map((idx) => ({ indexId: idx.id, weight: idx.defaultWeight })),
        warnings,
      }
    }

    // Explain variance
    if (msg.includes("variance") || msg.includes("gap") || msg.includes("delta") || msg.includes("differ")) {
      return {
        assistantMessage: `The variance between actual and expected price reflects factors not captured by the selected indices, including:\n\n1. **Negotiation effectiveness** — your team's ability to secure discounts\n2. **Volume commitments** — contracted volume tiers vs. spot buying\n3. **Specification changes** — product mix shifts over time\n4. **Supplier margin changes** — competitive dynamics in the supply market\n\nA positive variance (actual > expected) suggests room for negotiation. A negative variance means you're outperforming the market indices.`,
      }
    }

    // Explain model
    if (msg.includes("explain") || msg.includes("what") || msg.includes("how") || msg.includes("model")) {
      return {
        assistantMessage: `The **Expected Price Development** model works by:\n\n1. **Normalizing** each selected index to base = 100 at the start date\n2. **Weighting** indices proportionally (weights must sum to 100%)\n3. **Computing** a blended index factor at each time point: expectedIndex(t) = sum(weight_i * normalizedIndex_i(t))\n4. **Converting** to expected price: expectedPrice(t) = baseActualPrice * (expectedIndex(t) / expectedIndex(baseDate))\n\nThe base date defaults to the first data point. You can change it using the base date selector above the chart.`,
      }
    }

    // Default for this tab
    return {
      assistantMessage: `I can help with the index analysis for **${req.sku ?? "this SKU"}**:\n\n- **"Suggest indices"** — I'll recommend relevant market indices and weights\n- **"Explain the model"** — I'll describe how expected price is calculated\n- **"Explain the variance"** — I'll interpret the gap between actual and expected\n- **"Refresh suggestions"** — I'll regenerate index recommendations\n\nWhat would you like to explore?`,
    }
  }

  // ──── General SKU analysis tab (legacy) ────────────────────────────
  if (msg.includes("suggest") || msg.includes("index") || msg.includes("indices") || msg.includes("help")) {
    const { indices, warnings } = getIndexSuggestions(req.subcategory ?? "")
    return {
      assistantMessage: `Based on the "${req.subcategory}" subcategory, I recommend tracking these indices for your cost model. The weights reflect typical cost structure drivers for this product type. You can adjust the weights using the sliders in the Model Inputs panel.`,
      suggestedIndices: indices,
      suggestedWeights: indices.map((idx) => ({ indexId: idx.id, weight: idx.defaultWeight })),
      warnings,
    }
  }

  if (msg.includes("explain") || msg.includes("what") || msg.includes("how")) {
    return {
      assistantMessage: `The cost make-up model helps you decompose the unit price of "${req.sku ?? "this SKU"}" into its underlying cost drivers. Select relevant commodity/market indices and assign weights that reflect the cost structure. The model then calculates an expected price based on index movements, helping you identify whether actual prices are tracking market fundamentals or if there's room for negotiation.`,
    }
  }

  if (msg.includes("saving") || msg.includes("parity") || msg.includes("price")) {
    return {
      assistantMessage: `For "${req.sku ?? "this SKU"}", price disparity across suppliers/regions suggests potential savings from harmonization. The best-price benchmark approach identifies the lowest available unit price and models what spend would look like if all volume were procured at that price, adjusted for an addressable percentage to account for contractual or logistical constraints.`,
      warnings: req.country ? [] : ["Consider filtering by country to see region-specific pricing."],
    }
  }

  return {
    assistantMessage: `I can help you analyze "${req.sku ?? "this SKU"}" in several ways:\n\n1. **Suggest indices** - I'll recommend relevant market indices based on the product category\n2. **Explain analysis** - I'll walk through what the cost model shows\n3. **Price parity** - I'll help interpret savings opportunities\n\nWhat would you like to explore?`,
  }
}

export async function POST(request: Request) {
  try {
    const body: AssistantRequest = await request.json()
    const response = getSuggestions(body)
    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      { assistantMessage: "I encountered an error processing your request. Please try again.", warnings: ["Request parsing failed."] },
      { status: 400 }
    )
  }
}
