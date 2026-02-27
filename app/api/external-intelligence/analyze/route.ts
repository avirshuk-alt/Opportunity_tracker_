import { NextResponse } from "next/server"

export interface AnalysisResult {
  excerpt: string
  summary: string
  implications: string[]
  suggestedTags: string[]
  riskLevel: "Low" | "Medium" | "High"
  opportunityLevel: "Low" | "Medium" | "High"
}

interface AnalyzeRequest {
  resultId: string
  title: string
  snippet: string
  fullText?: string
  categoryContext?: string
  userQuestion?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as AnalyzeRequest
  const { title, snippet, fullText } = body
  const text = (fullText ?? snippet).toLowerCase()

  await new Promise((r) => setTimeout(r, 500 + Math.random() * 500))

  // Deterministic analysis based on content keywords
  const implications: string[] = []
  let riskLevel: "Low" | "Medium" | "High" = "Low"
  let opportunityLevel: "Low" | "Medium" | "High" = "Medium"

  if (text.includes("price") || text.includes("cost") || text.includes("surge")) {
    implications.push("Cost pressure on affected categories may require budget re-forecasting and supplier negotiations.")
    implications.push("Consider index-based pricing mechanisms to share commodity risk with suppliers.")
    riskLevel = "Medium"
  }
  if (text.includes("regulation") || text.includes("compliance") || text.includes("act")) {
    implications.push("Regulatory changes require contract clause reviews and vendor compliance verification.")
    implications.push("Legal and procurement teams should collaborate on updated vendor assessment criteria.")
    riskLevel = "Medium"
  }
  if (text.includes("growth") || text.includes("spending") || text.includes("grow")) {
    implications.push("Market growth signals may tighten supplier capacity; secure commitments early.")
    implications.push("Rising demand across the industry could limit negotiation leverage on pricing.")
    opportunityLevel = "High"
  }
  if (text.includes("decline") || text.includes("fall") || text.includes("reduction") || text.includes("easing")) {
    implications.push("Favorable market conditions create a window for renegotiation and cost reduction.")
    implications.push("Consider timing major purchases to capitalize on the current price environment.")
    opportunityLevel = "High"
  }
  if (text.includes("risk") || text.includes("tension") || text.includes("threat")) {
    implications.push("Supply chain risk requires contingency planning and alternative sourcing strategies.")
    implications.push("Increase safety stock levels and map Tier 2/3 supplier exposure to affected regions.")
    riskLevel = "High"
  }
  if (text.includes("ev") || text.includes("electric") || text.includes("hybrid") || text.includes("charging")) {
    implications.push("EV market developments may accelerate fleet electrification timeline and change lease economics.")
    opportunityLevel = "High"
  }
  if (text.includes("fleet") || text.includes("vehicle") || text.includes("lease")) {
    implications.push("Fleet market dynamics support competitive sourcing and multi-OEM strategies.")
    opportunityLevel = "High"
  }

  // Ensure at least 3 implications
  if (implications.length < 3) {
    implications.push("Monitor developments and integrate findings into next category strategy refresh.")
    implications.push("Share intelligence with relevant stakeholders and update risk register as needed.")
    implications.push("Consider scheduling a cross-functional review to assess strategic impact.")
  }

  // Extract a "key excerpt" (first 2 sentences of fullText or snippet)
  const sentences = (fullText ?? snippet).split(/(?<=[.!?])\s+/)
  const excerpt = sentences.slice(0, 2).join(" ")

  // Build summary
  const summary = `This article from "${title.split(":")[0]}" highlights key developments relevant to the current procurement strategy. The findings suggest ${riskLevel === "High" ? "significant risk exposure" : opportunityLevel === "High" ? "actionable opportunities" : "market dynamics"} that should be factored into upcoming sourcing decisions and supplier negotiations.`

  // Suggested tags based on content
  const suggestedTags: string[] = []
  if (text.includes("ev") || text.includes("electric") || text.includes("hybrid")) suggestedTags.push("EV Transition")
  if (text.includes("lease") || text.includes("residual")) suggestedTags.push("Lease Economics")
  if (text.includes("fuel") || text.includes("gasoline") || text.includes("diesel")) suggestedTags.push("Fuel Costs")
  if (text.includes("insurance") || text.includes("premium")) suggestedTags.push("Insurance")
  if (text.includes("telematics") || text.includes("privacy") || text.includes("gdpr")) suggestedTags.push("Telematics / Privacy")
  if (text.includes("esg") || text.includes("sustainab") || text.includes("emission")) suggestedTags.push("ESG")
  if (text.includes("regulation") || text.includes("compliance") || text.includes("mandate")) suggestedTags.push("Regulatory")
  if (text.includes("risk") || text.includes("safety") || text.includes("accident")) suggestedTags.push("Risk")
  if (text.includes("oem") || text.includes("vehicle") || text.includes("fleet")) suggestedTags.push("Fleet / OEM")
  if (suggestedTags.length === 0) suggestedTags.push("Market Intelligence")

  return NextResponse.json({
    excerpt,
    summary,
    implications: implications.slice(0, 6),
    suggestedTags,
    riskLevel,
    opportunityLevel,
  } satisfies AnalysisResult)
}
