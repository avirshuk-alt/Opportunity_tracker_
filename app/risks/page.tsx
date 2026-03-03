"use client"

import { useCategory } from "@/lib/category-context"
import { RiskFilterProvider, useRiskFilters } from "@/lib/risk-filter-context"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

import { OverviewTab } from "@/components/risks/overview-tab"
import { RegisterTab } from "@/components/risks/register-tab"
import { SupplyRiskTab } from "@/components/risks/supply-risk-tab"
import { MitigationTab } from "@/components/risks/mitigation-tab"

function RisksContent() {
  const { selectedCategory } = useCategory()
  const { activeTab, setActiveTab } = useRiskFilters()

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "Risk Management" },
        ]}
        title="Risk Register & Heatmap"
        description="Identify, assess, and mitigate risks across the category"
        actions={
          <Button size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Risk
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="register">Risk Registration</TabsTrigger>
          <TabsTrigger value="supply-risk">Supply Risk</TabsTrigger>
          <TabsTrigger value="mitigation">{"Mitigation & Actions"}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="register">
          <RegisterTab />
        </TabsContent>

        <TabsContent value="supply-risk">
          <SupplyRiskTab />
        </TabsContent>

        <TabsContent value="mitigation">
          <MitigationTab />
        </TabsContent>
      </Tabs>
    </>
  )
}

export default function RisksPage() {
  return (
    <RiskFilterProvider>
      <RisksContent />
    </RiskFilterProvider>
  )
}
