import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  const { stakeholder, function: fn, requirementText, contextNotes } = body as {
    stakeholder?: string
    function?: string
    requirementText?: string
    contextNotes?: string
  }

  // Deterministic stub responses based on driver/function
  const stakeholderLabel = stakeholder ?? "the stakeholder"
  const fnLabel = fn ?? "their function"
  const reqLabel = requirementText ?? "the requirement"

  const questions = [
    `What specific outcomes would ${stakeholderLabel} consider a success for this requirement?`,
    `How does this requirement align with ${fnLabel}'s strategic priorities for FY26-27?`,
    `What budget constraints or approval thresholds should we be aware of?`,
    `Are there existing initiatives in ${fnLabel} that this overlaps with or depends on?`,
    `What is the minimum viable scope that would still deliver value?`,
  ]

  const agenda = [
    `Opening: Recap of previous discussions and current strategy status (5 min)`,
    `Context: Present relevant market benchmarks and internal data for "${reqLabel.substring(0, 60)}..." (10 min)`,
    `Discussion: Explore success criteria, constraints, and interdependencies (15 min)`,
    `Alignment: Confirm priority level and timeline expectations (10 min)`,
    `Next steps: Agree on deliverables, owners, and follow-up date (5 min)`,
  ]

  const objections = [
    {
      objection: "This timeline is too aggressive given our current commitments.",
      response: "We can propose a phased approach starting with quick wins in Q1, building to full implementation by target date. This reduces risk while showing early progress.",
    },
    {
      objection: "The budget impact hasn't been fully quantified.",
      response: `We have preliminary estimates from the fact base. We recommend a focused 2-week deep-dive to build a robust business case with ${fnLabel}-validated assumptions.`,
    },
    {
      objection: "We tried something similar before and it didn't work.",
      response: `We've reviewed the previous initiative and identified key differences in approach. ${contextNotes ? "Specifically, " + contextNotes.substring(0, 100) + "..." : "We'll present a lessons-learned analysis showing how this approach mitigates previous failure modes."}`,
    },
  ]

  const artifacts = [
    { name: "Executive One-Pager", description: `Summary brief for ${stakeholderLabel} highlighting ROI, timeline, and risk mitigation` },
    { name: "ROI Model", description: "Financial model with sensitivity analysis showing conservative, base, and optimistic scenarios" },
    { name: "Risk Register Extract", description: "Relevant risks from the category risk register with current mitigation status" },
    { name: "Benchmark Comparison", description: `Industry benchmark data relevant to ${fnLabel} showing competitive positioning` },
    { name: "Implementation Timeline", description: "Visual roadmap showing milestones, dependencies, and resource requirements" },
  ]

  return NextResponse.json({ questions, agenda, objections, artifacts })
}
