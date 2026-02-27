"use client"

import { useState } from "react"
import { useCategory } from "@/lib/category-context"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, LayoutDashboard, Users, Network, BarChart3, BookOpen } from "lucide-react"
import { SupplierOverviewTab } from "@/components/supplier-strategy/overview-tab"
import { SupplierProfilesTab } from "@/components/supplier-strategy/profiles-tab"
import { SupplierNetworkTab } from "@/components/supplier-strategy/network-tab"
import { SupplierPerformanceTab } from "@/components/supplier-strategy/performance-tab"
import { SupplierPlaybooksTab } from "@/components/supplier-strategy/playbooks-tab"

export default function SuppliersPage() {
  const { selectedCategory } = useCategory()
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "Supplier Strategy" },
        ]}
        title="Supplier Ecosystem Strategy"
        description="Segment, evaluate, and orchestrate the fleet supplier network"
        actions={
          <Button size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Supplier
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="text-xs gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="profiles" className="text-xs gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Supplier Profiles
          </TabsTrigger>
          <TabsTrigger value="network" className="text-xs gap-1.5">
            <Network className="h-3.5 w-3.5" />
            {"Network (Tier 1\u20133)"}
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            {"Performance & Health"}
          </TabsTrigger>
          <TabsTrigger value="playbooks" className="text-xs gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {"Playbooks & Actions"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SupplierOverviewTab />
        </TabsContent>
        <TabsContent value="profiles">
          <SupplierProfilesTab />
        </TabsContent>
        <TabsContent value="network">
          <SupplierNetworkTab />
        </TabsContent>
        <TabsContent value="performance">
          <SupplierPerformanceTab />
        </TabsContent>
        <TabsContent value="playbooks">
          <SupplierPlaybooksTab />
        </TabsContent>
      </Tabs>
    </>
  )
}
