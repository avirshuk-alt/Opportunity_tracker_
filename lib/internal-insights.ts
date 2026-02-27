// ─── Internal Fact Insight Types & Storage ──────────────────────────────────
// Isolated helper so the storage layer can be replaced without UI changes.

export interface InternalFactInsight {
  id: string
  title: string
  text: string
  sourceType: "internal-analysis"
  sourceContext: string // e.g. "Spend Overview → KPI row"
  createdAt: string
  confidence: "High" | "Medium" | "Low"
  tags: string[]
  relatedEntities?: {
    supplierId?: string
    skuId?: string
    country?: string
    subcategory?: string
    bu?: string
  }
}

// ─── Tag presets (suggested when saving) ─────────────────────────────────────
export const INSIGHT_TAG_OPTIONS = [
  "Supplier",
  "Risk",
  "Cost",
  "ESG",
  "Contracting",
  "SKU",
  "Region",
  "BU",
  "Price Parity",
  "Index",
] as const

// ─── In-memory store (session-level; swap for DB later) ──────────────────────

let insightsStore: InternalFactInsight[] = []
let counter = 0

function hashInsight(title: string, text: string, sourceContext: string) {
  // Simple deterministic hash for de-duplication
  const raw = `${title.trim().toLowerCase()}|${text.trim().toLowerCase()}|${sourceContext.trim().toLowerCase()}`
  let h = 0
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) - h + raw.charCodeAt(i)) | 0
  }
  return `hash-${Math.abs(h)}`
}

export function isDuplicate(title: string, text: string, sourceContext: string): boolean {
  const h = hashInsight(title, text, sourceContext)
  return insightsStore.some(
    (i) => hashInsight(i.title, i.text, i.sourceContext) === h
  )
}

export function createInternalInsight(
  fields: Omit<InternalFactInsight, "id" | "createdAt" | "sourceType">
): InternalFactInsight {
  counter++
  const insight: InternalFactInsight = {
    ...fields,
    id: `insight-${counter}-${Date.now()}`,
    sourceType: "internal-analysis",
    createdAt: new Date().toISOString(),
  }
  insightsStore.push(insight)
  return insight
}

export function listInternalInsights(filters?: {
  tag?: string
  sourceContext?: string
}): InternalFactInsight[] {
  let results = [...insightsStore]
  if (filters?.tag) {
    results = results.filter((i) => i.tags.includes(filters.tag!))
  }
  if (filters?.sourceContext) {
    results = results.filter((i) =>
      i.sourceContext.toLowerCase().includes(filters.sourceContext!.toLowerCase())
    )
  }
  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getInsightCount(): number {
  return insightsStore.length
}
