"use client"

import { useState, useCallback } from "react"
import { useCategory } from "@/lib/category-context"
import { PageHeader } from "@/components/page-header"
import { WorkspaceLanding } from "@/components/negotiations/workspace-landing"
import { WorkspaceDetail } from "@/components/negotiations/workspace-detail"
import {
  type NegotiationWorkspace,
  getAllWorkspaces,
  generateAutoPopulation,
  registerFactPack,
} from "@/lib/negotiations-data"

type View = { mode: "landing" } | { mode: "detail"; workspaceId: string }

export default function NegotiationsPage() {
  const { selectedCategory } = useCategory()
  const [workspaces, setWorkspaces] = useState<NegotiationWorkspace[]>(getAllWorkspaces())
  const [view, setView] = useState<View>({ mode: "landing" })

  const activeWorkspace = view.mode === "detail"
    ? workspaces.find((ws) => ws.id === view.workspaceId) ?? null
    : null

  const handleOpen = useCallback((id: string) => {
    setView({ mode: "detail", workspaceId: id })
  }, [])

  const handleBack = useCallback(() => {
    setView({ mode: "landing" })
  }, [])

  const handleCreate = useCallback((data: {
    name: string
    category: string
    supplierIds: string[]
    regions: string[]
    businessUnits: string[]
    skuGroups: string[]
  }) => {
    // Auto-populate downstream sections from scope
    const autoPop = generateAutoPopulation(
      data.supplierIds,
      data.category,
      data.skuGroups,
      data.regions,
    )

    // Register generated fact packs into the runtime registry
    autoPop.generatedFactPacks.forEach((pack, supplierId) => {
      registerFactPack(supplierId, pack)
    })

    const newWs: NegotiationWorkspace = {
      id: `nw-${Date.now()}`,
      name: data.name,
      category: data.category,
      status: "in-progress",
      scope: {
        regions: data.regions,
        businessUnits: data.businessUnits,
        skuGroups: data.skuGroups,
      },
      supplierIds: data.supplierIds,
      createdBy: "Current User",
      createdAt: new Date().toISOString().slice(0, 10),
      lastModified: new Date().toISOString().slice(0, 10),
      spectrumPlacements: autoPop.spectrumPlacements,
      factSections: autoPop.factSections,
      levers: autoPop.levers,
      objectives: [],
      arguments: [],
      rounds: [],
    }
    setWorkspaces((prev) => [newWs, ...prev])
    setView({ mode: "detail", workspaceId: newWs.id })
  }, [])

  const handleUpdateWorkspace = useCallback((updated: NegotiationWorkspace) => {
    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === updated.id ? updated : ws))
    )
  }, [])

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "Negotiations" },
          ...(activeWorkspace ? [{ label: activeWorkspace.name }] : []),
        ]}
        title={activeWorkspace ? activeWorkspace.name : "Negotiations"}
        description={
          activeWorkspace
            ? `${activeWorkspace.category} — ${activeWorkspace.scope.regions.join(", ")}`
            : "Workspace-driven negotiation strategies: classify, plan, execute, and close deals"
        }
      />

      {view.mode === "landing" ? (
        <WorkspaceLanding
          workspaces={workspaces}
          onOpen={handleOpen}
          onCreate={handleCreate}
        />
      ) : activeWorkspace ? (
        <WorkspaceDetail
          workspace={activeWorkspace}
          onBack={handleBack}
          onUpdate={handleUpdateWorkspace}
        />
      ) : null}
    </>
  )
}
