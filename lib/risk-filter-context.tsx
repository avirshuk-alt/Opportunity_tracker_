"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export interface RiskFilters {
  riskType: string
  category: string
  supplier: string
  aboveAppetite: string
  owner: string
  irrLevel: string
  overdueOnly: string
  segment: string
  procurementCategory: string
  selectedSupplierId: string
}

const defaultFilters: RiskFilters = {
  riskType: "all",
  category: "all",
  supplier: "all",
  aboveAppetite: "false",
  owner: "all",
  irrLevel: "all",
  overdueOnly: "false",
  segment: "all",
  procurementCategory: "all",
  selectedSupplierId: "all",
}

interface RiskFilterContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
  filters: RiskFilters
  setFilter: (key: keyof RiskFilters, value: string) => void
  setFilters: (filters: Partial<RiskFilters>) => void
  resetFilters: () => void
  navigateWithFilter: (tab: string, filter: Record<string, string>) => void
}

const RiskFilterContext = createContext<RiskFilterContextType | undefined>(undefined)

export function RiskFilterProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [filters, setFiltersState] = useState<RiskFilters>(defaultFilters)

  const setFilter = useCallback((key: keyof RiskFilters, value: string) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setFilters = useCallback((partial: Partial<RiskFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters)
  }, [])

  const navigateWithFilter = useCallback(
    (tab: string, filter: Record<string, string>) => {
      setFiltersState((prev) => ({ ...prev, ...filter }))
      setActiveTab(tab)
    },
    []
  )

  return (
    <RiskFilterContext.Provider
      value={{
        activeTab,
        setActiveTab,
        filters,
        setFilter,
        setFilters,
        resetFilters,
        navigateWithFilter,
      }}
    >
      {children}
    </RiskFilterContext.Provider>
  )
}

export function useRiskFilters() {
  const ctx = useContext(RiskFilterContext)
  if (!ctx) throw new Error("useRiskFilters must be used within RiskFilterProvider")
  return ctx
}
