"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"
import {
  generateExecutiveSummary,
  generateCategoryDiagnosis,
  generateStrategicThemes,
  generateInitiativePortfolio,
  generateRiskSummary,
  generateRoadmapPhasing,
  type ExecutiveSummaryData,
  type CategoryDiagnosisData,
  type StrategicThemeData,
  type PortfolioInitiativeSummary,
  type RiskSummaryItem,
  type RoadmapPhaseData,
} from "@/lib/insights-adapter"
import {
  SEED_OBJECTIVES,
  type StrategicObjective,
} from "@/lib/strategic-objectives-data"

// ─── Source Module Metadata ─────────────────────────────────────────────────

export interface SourceModule {
  module: string
  timestamp: string
}

// ─── Unified Insights State ─────────────────────────────────────────────────

export interface UnifiedInsightsState {
  generatedAt: string | null
  sources: SourceModule[]
  executiveSummary: ExecutiveSummaryData | null
  diagnosis: CategoryDiagnosisData | null
  themes: StrategicThemeData[]
  portfolio: PortfolioInitiativeSummary[]
  riskSummary: RiskSummaryItem[]
  roadmap: {
    phases: RoadmapPhaseData[]
    valueRamp: { month: string; value: number }[]
    generatedAt: string
  } | null
  objectives: StrategicObjective[]
}

const emptyState: UnifiedInsightsState = {
  generatedAt: null,
  sources: [],
  executiveSummary: null,
  diagnosis: null,
  themes: [],
  portfolio: [],
  riskSummary: [],
  roadmap: null,
  objectives: [],
}

// ─── Context Shape ──────────────────────────────────────────────────────────

interface InsightsContextValue {
  state: UnifiedInsightsState
  isGenerating: boolean
  /** 0..100 progress during generation */
  progress: number
  /** Kick off a full generation pass */
  generate: (categoryId: string) => void
  /** Whether insights have been generated at least once */
  hasGenerated: boolean
  /** Update a single section (for Refine) without re-running full generation */
  updateSection: <K extends keyof UnifiedInsightsState>(
    key: K,
    value: UnifiedInsightsState[K],
  ) => void
}

const InsightsContext = createContext<InsightsContextValue | undefined>(undefined)

// ─── Provider ───────────────────────────────────────────────────────────────

export function InsightsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UnifiedInsightsState>(emptyState)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  const generate = useCallback((categoryId: string) => {
    setIsGenerating(true)
    setProgress(0)

    // Simulate phased generation with real data generators
    const steps = [
      { pct: 15, label: "Strategic Objectives", delay: 300 },
      { pct: 30, label: "Fact Base", delay: 500 },
      { pct: 50, label: "Risk Management", delay: 400 },
      { pct: 70, label: "Opportunity Tracker", delay: 400 },
      { pct: 85, label: "Supply Risk", delay: 300 },
      { pct: 100, label: "Market Insights", delay: 400 },
    ]

    let accumulated = 0

    const runStep = (idx: number) => {
      if (!mountedRef.current) return
      if (idx >= steps.length) {
        // All steps done — commit the full insight object
        const now = new Date().toISOString().slice(0, 16).replace("T", " ")
        const ts = new Date().toISOString()

        const sources: SourceModule[] = [
          { module: "Strategic Objectives", timestamp: ts },
          { module: "Fact Base", timestamp: ts },
          { module: "Risk Management", timestamp: ts },
          { module: "Opportunity Tracker", timestamp: ts },
          { module: "Supply Risk", timestamp: ts },
          { module: "Market Insights", timestamp: ts },
        ]

        const execSummary = generateExecutiveSummary(categoryId)
        const diagnosis = generateCategoryDiagnosis(categoryId)
        const themes = generateStrategicThemes(categoryId)
        const portfolio = generateInitiativePortfolio(categoryId)
        const riskSummary = generateRiskSummary(categoryId)
        const roadmapResult = generateRoadmapPhasing(categoryId)
        const objectives = SEED_OBJECTIVES

        setState({
          generatedAt: now,
          sources,
          executiveSummary: execSummary,
          diagnosis,
          themes,
          portfolio,
          riskSummary,
          roadmap: {
            phases: roadmapResult.phases,
            valueRamp: roadmapResult.valueRamp,
            generatedAt: roadmapResult.generatedAt,
          },
          objectives,
        })
        setIsGenerating(false)
        setProgress(100)
        return
      }

      accumulated += steps[idx].delay
      setTimeout(() => {
        if (!mountedRef.current) return
        setProgress(steps[idx].pct)
        runStep(idx + 1)
      }, steps[idx].delay)
    }

    runStep(0)
  }, [])

  const updateSection = useCallback(
    <K extends keyof UnifiedInsightsState>(key: K, value: UnifiedInsightsState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const hasGenerated = state.generatedAt !== null

  return (
    <InsightsContext.Provider value={{ state, isGenerating, progress, generate, hasGenerated, updateSection }}>
      {children}
    </InsightsContext.Provider>
  )
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useInsights() {
  const ctx = useContext(InsightsContext)
  if (!ctx) throw new Error("useInsights must be used within InsightsProvider")
  return ctx
}
