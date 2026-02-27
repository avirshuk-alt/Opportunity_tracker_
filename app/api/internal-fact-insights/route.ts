// POST /api/internal-fact-insights
// Deterministic rule-based insight generator.
// Accepts a chart context object and returns 2-5 bullet insights.

export interface ChartContext {
  chartId: string
  chartTitle: string
  breakdownType: string
  timeWindow?: { from: string; to: string }
  currency?: string
  filters?: Record<string, string | undefined>
  dataSummary: {
    topItems?: { name: string; value: number; share?: number }[]
    totals?: { totalSpend?: number; units?: number; count?: number }
    trends?: { series?: { date: string; value: number }[] }
    stats?: { min?: number; max?: number; avg?: number; stdDev?: number; outliers?: string[] }
    contractStats?: { coverage?: number; expiring?: number; avgTermMonths?: number; total?: number }
  }
}

export interface GeneratedInsight {
  title: string
  text: string
  tags: string[]
  confidence: "High" | "Medium" | "Low"
  relatedEntities?: {
    supplier?: string
    sku?: string
    country?: string
    region?: string
    bu?: string
    subcategory?: string
  }
}

function fmt(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

function generateInsights(ctx: ChartContext): GeneratedInsight[] {
  const insights: GeneratedInsight[] = []
  const { topItems, totals, stats, contractStats, trends } = ctx.dataSummary

  // ── Concentration insights ────────────────────────────────────────
  if (topItems && topItems.length > 0 && totals?.totalSpend) {
    const top1 = topItems[0]
    const top1Share = (top1.value / totals.totalSpend) * 100

    if (top1Share > 30) {
      insights.push({
        title: `High concentration: ${top1.name} at ${top1Share.toFixed(0)}%`,
        text: `${top1.name} accounts for ${top1Share.toFixed(1)}% of ${ctx.chartTitle} spend (${fmt(top1.value)} of ${fmt(totals.totalSpend)}). This level of concentration creates single-supplier dependency risk.`,
        tags: ["Supplier", "Risk"],
        confidence: "High",
        relatedEntities: { supplier: top1.name },
      })
    }

    // Top-3 combined share
    if (topItems.length >= 3) {
      const top3Spend = topItems.slice(0, 3).reduce((a, i) => a + i.value, 0)
      const top3Share = (top3Spend / totals.totalSpend) * 100
      if (top3Share > 60) {
        insights.push({
          title: `Top 3 represent ${top3Share.toFixed(0)}% of spend`,
          text: `The top 3 items (${topItems.slice(0, 3).map(i => i.name).join(", ")}) account for ${top3Share.toFixed(1)}% of total spend (${fmt(top3Spend)}). Consider whether this concentration is by design or an optimization opportunity.`,
          tags: ["Cost", "Supplier"],
          confidence: "High",
        })
      }
    }

    // Tail spend
    if (topItems.length >= 5) {
      const tailItems = topItems.slice(5)
      if (tailItems.length > 0) {
        const tailSpend = tailItems.reduce((a, i) => a + i.value, 0)
        const tailShare = (tailSpend / totals.totalSpend) * 100
        if (tailShare > 5 && tailItems.length >= 2) {
          insights.push({
            title: `Tail spend opportunity: ${tailItems.length} items at ${tailShare.toFixed(0)}%`,
            text: `${tailItems.length} smaller items represent ${tailShare.toFixed(1)}% of total spend (${fmt(tailSpend)}). Consolidating tail spend into preferred suppliers could reduce transaction costs and improve compliance.`,
            tags: ["Cost", "Supplier"],
            confidence: "Medium",
          })
        }
      }
    }
  }

  // ── Variance / dispersion insights ─────────────────────────────────
  if (stats?.stdDev && stats.avg && stats.avg > 0) {
    const cv = stats.stdDev / stats.avg
    if (cv > 0.15) {
      insights.push({
        title: `High price dispersion detected (CV: ${(cv * 100).toFixed(0)}%)`,
        text: `Price coefficient of variation is ${(cv * 100).toFixed(1)}% (avg: ${fmt(stats.avg)}, std dev: ${fmt(stats.stdDev)}). Range: ${fmt(stats.min ?? 0)} to ${fmt(stats.max ?? 0)}. This suggests opportunities for price harmonization or renegotiation.`,
        tags: ["Cost", "Price Parity"],
        confidence: cv > 0.25 ? "High" : "Medium",
      })
    }
  }

  // ── Outlier insights ───────────────────────────────────────────────
  if (stats?.outliers && stats.outliers.length > 0) {
    insights.push({
      title: `${stats.outliers.length} pricing outlier(s) identified`,
      text: `Outlier pricing detected for: ${stats.outliers.join(", ")}. These items deviate significantly from the mean and warrant investigation for potential renegotiation or error correction.`,
      tags: ["Cost", "Risk"],
      confidence: "Medium",
    })
  }

  // ── Contract-specific insights ─────────────────────────────────────
  if (contractStats) {
    if (contractStats.coverage !== undefined && contractStats.coverage < 70) {
      insights.push({
        title: `Low contract coverage: ${contractStats.coverage.toFixed(0)}%`,
        text: `Only ${contractStats.coverage.toFixed(1)}% of spend is under contract. Improving coverage could reduce maverick spend, secure better pricing, and improve compliance.`,
        tags: ["Contracting", "Risk"],
        confidence: "High",
      })
    }
    if (contractStats.expiring !== undefined && contractStats.expiring > 0) {
      insights.push({
        title: `${contractStats.expiring} contract(s) expiring soon`,
        text: `${contractStats.expiring} contract(s) are expiring within the next 3 months. Prioritize renewal negotiations to avoid service disruption and potential price increases.`,
        tags: ["Contracting", "Risk"],
        confidence: "High",
      })
    }
    if (contractStats.avgTermMonths !== undefined && contractStats.avgTermMonths < 12) {
      insights.push({
        title: `Short average contract term: ${contractStats.avgTermMonths}m`,
        text: `Average remaining contract term is only ${contractStats.avgTermMonths} months. Short terms increase administrative burden and may limit volume discount opportunities.`,
        tags: ["Contracting"],
        confidence: "Medium",
      })
    }
  }

  // ── Trend-based insights ───────────────────────────────────────────
  if (trends?.series && trends.series.length >= 4) {
    const series = trends.series
    const recent = series.slice(-3)
    const earlier = series.slice(-6, -3)
    if (recent.length >= 2 && earlier.length >= 2) {
      const recentAvg = recent.reduce((a, p) => a + p.value, 0) / recent.length
      const earlierAvg = earlier.reduce((a, p) => a + p.value, 0) / earlier.length
      const changePct = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0
      if (Math.abs(changePct) > 5) {
        insights.push({
          title: `Spend ${changePct > 0 ? "increasing" : "decreasing"} ${Math.abs(changePct).toFixed(0)}% recently`,
          text: `Recent spend trend shows a ${Math.abs(changePct).toFixed(1)}% ${changePct > 0 ? "increase" : "decrease"} compared to the prior period (${fmt(recentAvg)} avg vs ${fmt(earlierAvg)} avg). ${changePct > 0 ? "Investigate drivers and validate against budget." : "Validate this reflects planned savings realization."}`,
          tags: ["Cost"],
          confidence: "Medium",
        })
      }
    }
  }

  // ── Region/BU distribution insights ────────────────────────────────
  if (topItems && topItems.length >= 2 && ctx.breakdownType === "region" && totals?.totalSpend) {
    const maxItem = topItems[0]
    const maxShare = (maxItem.value / totals.totalSpend) * 100
    if (maxShare > 50) {
      insights.push({
        title: `${ctx.breakdownType === "region" ? "Regional" : "BU"} imbalance: ${maxItem.name} at ${maxShare.toFixed(0)}%`,
        text: `${maxItem.name} represents ${maxShare.toFixed(1)}% of spend. This geographic concentration may create logistics risk or limit access to regional pricing advantages.`,
        tags: ["Region", "Risk"],
        confidence: "Medium",
        relatedEntities: ctx.breakdownType === "region" ? { region: maxItem.name } : { bu: maxItem.name },
      })
    }
  }

  // Ensure 2-5 insights
  return insights.slice(0, 5)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const chartContext = body.chartContext as ChartContext
    if (!chartContext?.chartId) {
      return Response.json({ error: "Missing chartContext" }, { status: 400 })
    }
    const insights = generateInsights(chartContext)
    return Response.json({ insights })
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 })
  }
}
