import { NextResponse, type NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { moduleName, userMessage, currentNarrative, relevantContext } = body as {
    moduleName: string
    userMessage: string
    currentNarrative: string | null
    relevantContext: string | null
  }

  // Stub: deterministic placeholder response
  const lowerMsg = userMessage.toLowerCase()

  let assistantMessage = ""
  let draft: string | undefined

  if (!relevantContext && !currentNarrative) {
    // No context - ask clarifying questions
    assistantMessage = `I'd like to help with the "${moduleName}" narrative. Before I draft something, could you help me understand:\n\n1. What are the top 2-3 priorities for this section?\n2. Are there specific data points or outcomes you want to highlight?\n\nOnce I have a bit more context, I can produce a stronger draft.`
  } else if (lowerMsg.includes("outline") || lowerMsg.includes("generate")) {
    assistantMessage = `Here's a suggested outline for the "${moduleName}" section based on the available context.`
    draft = `**${moduleName} - Draft Outline**\n\n1. **Current State Overview**\n   - Summary of existing landscape and key metrics\n   - Baseline performance indicators\n\n2. **Key Findings & Analysis**\n   - Critical insights from data analysis\n   - Benchmarking against industry standards\n\n3. **Strategic Implications**\n   - Impact on category objectives\n   - Dependencies and cross-functional considerations\n\n4. **Recommended Actions**\n   - Prioritized initiatives with expected outcomes\n   - Resource requirements and timeline\n\n5. **Success Metrics**\n   - KPIs and measurement approach\n   - Review cadence and governance`
  } else if (lowerMsg.includes("rewrite") || lowerMsg.includes("executive")) {
    assistantMessage = `I've rewritten the narrative in a more executive-friendly style, focusing on strategic impact and concise language.`
    draft = currentNarrative
      ? `${currentNarrative.split(".").slice(0, 2).join(".")}. This positions the organization to capture significant value through disciplined execution and strategic supplier engagement, driving measurable improvements across cost, quality, and risk dimensions.`
      : `This section establishes the strategic rationale and execution framework for ${moduleName}. Our analysis indicates significant opportunity for value creation through targeted interventions, disciplined governance, and cross-functional alignment.`
  } else if (lowerMsg.includes("shorten")) {
    assistantMessage = "Here's a more concise version of the narrative."
    draft = currentNarrative
      ? currentNarrative.split(".").slice(0, 3).join(".") + "."
      : `${moduleName}: Focused strategy targeting measurable value creation through data-driven decision making and strategic alignment.`
  } else if (lowerMsg.includes("quantif") || lowerMsg.includes("impact")) {
    assistantMessage = `I've added quantified impact statements. Note: the figures below are illustrative -- please validate with your data.`
    draft = `[Assumption: figures are illustrative]\n\n${currentNarrative ?? `The ${moduleName} strategy targets`} Expected annualized fleet savings of $3.2M-$4.1M (8-12% of addressable spend). Risk exposure reduction estimated at 30% through OEM diversification and telematics-driven safety programs. Projected supplier consolidation from 34 to 18 strategic partners, improving leverage and reducing administrative overhead by approximately $220K annually.`
  } else if (lowerMsg.includes("next paragraph") || lowerMsg.includes("draft next")) {
    assistantMessage = "Here's a suggested next paragraph to continue the narrative."
    draft = `Building on the analysis above, the recommended approach emphasizes phased implementation to balance quick wins with structural improvements. Phase 1 focuses on immediate cost optimization through demand management and specification rationalization. Phase 2 introduces strategic sourcing events targeting the top-5 spend categories. Phase 3 establishes ongoing governance mechanisms to sustain captured value and drive continuous improvement.`
  } else {
    // Generic response
    assistantMessage = `Regarding "${moduleName}": ${userMessage}\n\nBased on the current narrative and context, I'd suggest focusing on concrete outcomes and measurable targets. Would you like me to generate a specific draft, rewrite in executive style, or add quantified impact statements?`
  }

  return NextResponse.json({ assistantMessage, draft })
}
