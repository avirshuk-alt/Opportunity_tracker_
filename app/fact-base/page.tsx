"use client"

import { useState, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useCategory } from "@/lib/category-context"
import {
  getSuppliersByCategory,
  getContractsByCategory,
  getSkusByCategory,
  spendData,
  formatCurrency,
  formatNumber,
  type SKURecord,
  type Contract,
  type Supplier,
} from "@/lib/data"
import {
  createInternalInsight,
  isDuplicate,
  listInternalInsights,
  getInsightCount,
  INSIGHT_TAG_OPTIONS,
  type InternalFactInsight,
} from "@/lib/internal-insights"
import { toast } from "sonner"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts"
import {
  Search,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  BarChart3,
  ScrollText,
  Minus,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Users,
  Layers,
} from "lucide-react"
import { AIInsightsCard } from "@/components/ai-insights-card"
import { StakeholderRequirementsTab } from "@/components/stakeholder-requirements-tab"
import { SKUAnalysisTab } from "@/components/sku-analysis-tab"
import type { ChartContext } from "@/app/api/internal-fact-insights/route"

// ─── Constants ─────────────────────────────────────────────────────

const COLORS = [
  "hsl(215, 80%, 48%)",
  "hsl(165, 60%, 40%)",
  "hsl(35, 90%, 52%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 72%, 51%)",
  "hsl(200, 70%, 50%)",
  "hsl(45, 85%, 50%)",
  "hsl(320, 60%, 50%)",
]

const FUNCTIONS_LIST = ["Finance", "IT", "Operations", "Procurement", "Other"]
const BU_LIST = ["North America", "Europe", "Asia Pacific"]
const REGIONS_LIST = ["North America", "EMEA", "APAC"]
const TIME_PERIODS = ["Last 12m", "Last 24m", "Last 5y"]

// ─── Filter Chip Component ─────────────────────────────────────────

function FilterChip({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  if (value === "all") return null
  return (
    <Badge variant="secondary" className="gap-1 text-xs pl-2 pr-1 py-0.5">
      {label}: {value}
      <button onClick={onClear} className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5" aria-label={`Clear ${label} filter`}>
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}

// ─── Stat Card Component ───────────────────────────────────────────

function StatCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: "up" | "down" | "flat" }) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight text-foreground">{value}</span>
          {trend && (
            <span className={cn("flex items-center text-xs font-medium",
              trend === "up" && "text-emerald-600",
              trend === "down" && "text-red-600",
              trend === "flat" && "text-muted-foreground"
            )}>
              {trend === "up" && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
              {trend === "down" && <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {trend === "flat" && <Minus className="h-3 w-3 mr-0.5" />}
              {sub}
            </span>
          )}
          {!trend && sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Save Insight Button ──────────────────────────────────────────

function SaveInsightButton({
  title,
  text,
  sourceContext,
  suggestedTags,
  relatedEntities,
  onSaved,
  variant = "icon",
}: {
  title: string
  text: string
  sourceContext: string
  suggestedTags?: string[]
  relatedEntities?: InternalFactInsight["relatedEntities"]
  onSaved?: () => void
  variant?: "icon" | "button"
}) {
  const alreadySaved = isDuplicate(title, text, sourceContext)

  const handleClick = () => {
    if (alreadySaved) {
      toast.info("Already saved to Internal Fact Base")
      return
    }
    onSaved?.()
  }

  if (variant === "button") {
    return (
      <Button
        variant={alreadySaved ? "secondary" : "outline"}
        size="sm"
        className={cn("h-7 text-[11px] gap-1.5", alreadySaved && "text-emerald-700")}
        onClick={handleClick}
      >
        {alreadySaved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
        {alreadySaved ? "Saved" : "Save Insight"}
      </Button>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <UITooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center justify-center rounded p-1 transition-colors",
              alreadySaved
                ? "text-emerald-600 bg-emerald-50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            onClick={handleClick}
            aria-label={alreadySaved ? "Already saved" : "Save to Internal Fact Base"}
          >
            {alreadySaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{alreadySaved ? "Already saved" : "Save to Internal Fact Base"}</p>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  )
}

// ─── Save Insight Drawer ──────────────────────────────────────────

function SaveInsightDrawer({
  open,
  onOpenChange,
  prefill,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefill: {
    title: string
    text: string
    sourceContext: string
    suggestedTags?: string[]
    relatedEntities?: InternalFactInsight["relatedEntities"]
  }
  onSave: () => void
}) {
  const [title, setTitle] = useState(prefill.title)
  const [text, setText] = useState(prefill.text)
  const [confidence, setConfidence] = useState<"High" | "Medium" | "Low">("Medium")
  const [tags, setTags] = useState<string[]>(prefill.suggestedTags ?? [])
  const [supplierId, setSupplierId] = useState(prefill.relatedEntities?.supplierId ?? "")
  const [skuId, setSkuId] = useState(prefill.relatedEntities?.skuId ?? "")
  const [country, setCountry] = useState(prefill.relatedEntities?.country ?? "")
  const [subcategory, setSubcategory] = useState(prefill.relatedEntities?.subcategory ?? "")
  const [bu, setBu] = useState(prefill.relatedEntities?.bu ?? "")

  // Reset when prefill changes
  const prefillKey = `${prefill.title}|${prefill.sourceContext}`
  useState(() => {
    setTitle(prefill.title)
    setText(prefill.text)
    setConfidence("Medium")
    setTags(prefill.suggestedTags ?? [])
    setSupplierId(prefill.relatedEntities?.supplierId ?? "")
    setSkuId(prefill.relatedEntities?.skuId ?? "")
    setCountry(prefill.relatedEntities?.country ?? "")
    setSubcategory(prefill.relatedEntities?.subcategory ?? "")
    setBu(prefill.relatedEntities?.bu ?? "")
  })

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const handleSave = () => {
    if (!title.trim() || !text.trim()) {
      toast.error("Title and text are required")
      return
    }
    if (isDuplicate(title, text, prefill.sourceContext)) {
      toast.info("This insight has already been saved")
      onOpenChange(false)
      return
    }
    createInternalInsight({
      title: title.trim(),
      text: text.trim(),
      sourceContext: prefill.sourceContext,
      confidence,
      tags,
      relatedEntities: {
        ...(supplierId ? { supplierId } : {}),
        ...(skuId ? { skuId } : {}),
        ...(country ? { country } : {}),
        ...(subcategory ? { subcategory } : {}),
        ...(bu ? { bu } : {}),
      },
    })
    toast.success("Saved to Internal Fact Base")
    onSave()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Save Insight to Internal Fact Base</SheetTitle>
          <SheetDescription className="text-xs">
            Source: {prefill.sourceContext}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Insight Title <span className="text-red-500">*</span>
            </p>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short descriptive title..."
              className="h-9 text-sm"
            />
          </div>

          {/* Text */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Insight Text <span className="text-red-500">*</span>
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              placeholder="The insight content..."
            />
          </div>

          <Separator />

          {/* Confidence */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Confidence</p>
            <div className="flex gap-2">
              {(["High", "Medium", "Low"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setConfidence(c)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    confidence === c
                      ? c === "High" ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : c === "Medium" ? "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-red-300 bg-red-50 text-red-700"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {INSIGHT_TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    tags.includes(tag)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Related Entities */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Related Entities (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Supplier</p>
                <Input value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="h-8 text-xs" placeholder="e.g. TechPro Solutions" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">SKU</p>
                <Input value={skuId} onChange={(e) => setSkuId(e.target.value)} className="h-8 text-xs" placeholder="e.g. SRV-DL380-G10" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Country</p>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} className="h-8 text-xs" placeholder="e.g. US" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Subcategory</p>
                <Input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="h-8 text-xs" placeholder="e.g. Servers" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Business Unit</p>
                <Input value={bu} onChange={(e) => setBu(e.target.value)} className="h-8 text-xs" placeholder="e.g. North America" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!title.trim() || !text.trim()}>
              <Bookmark className="h-3.5 w-3.5 mr-1.5" />
              Save Insight
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Saved Insights Viewer (mini drawer) ─────────────────────���────

function SavedInsightsViewer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const insights = listInternalInsights()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Saved Internal Insights</SheetTitle>
          <SheetDescription className="text-xs">
            {insights.length} insight{insights.length !== 1 ? "s" : ""} saved this session
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {insights.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No insights saved yet</p>
              <p className="text-xs mt-1">Use the bookmark buttons throughout Internal Analysis to save insights.</p>
            </div>
          ) : (
            insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{insight.text}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] shrink-0",
                        insight.confidence === "High" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                        insight.confidence === "Medium" && "bg-amber-50 text-amber-700 border-amber-200",
                        insight.confidence === "Low" && "bg-red-50 text-red-700 border-red-200",
                      )}
                    >
                      {insight.confidence}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {insight.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">{insight.sourceContext}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Component ───────────────────────────────────────────────

export default function FactBasePage() {
  const { selectedCategory } = useCategory()
  const searchParams = useSearchParams()
  const router = useRouter()
  const validTabs = ["spend", "contracts", "stakeholders", "sku-analysis"]
  const tabParam = searchParams.get("tab")
  const activeTab = validTabs.includes(tabParam ?? "") ? tabParam! : "spend"
  const setActiveTab = useCallback((tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "spend") { params.delete("tab") } else { params.set("tab", tab) }
    router.replace(`/fact-base${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false })
  }, [searchParams, router])
  const suppliers = getSuppliersByCategory(selectedCategory.id)
  const contracts = getContractsByCategory(selectedCategory.id)
  const skus = getSkusByCategory(selectedCategory.id)

  // ─── Global Filters ─────────────────────────────────────────────
  const [filterSupplier, setFilterSupplier] = useState("all")
  const [filterSku, setFilterSku] = useState("all")
  const [filterCountry, setFilterCountry] = useState("all")
  const [filterRegion, setFilterRegion] = useState("all")
  const [filterBU, setFilterBU] = useState("all")
  const [filterSubcategory, setFilterSubcategory] = useState("all")
  const [filterTimePeriod, setFilterTimePeriod] = useState("Last 12m")

  const uniqueSupplierNames = useMemo(() => Array.from(new Set(suppliers.map((s) => s.name))), [suppliers])
  const uniqueSkus = useMemo(() => Array.from(new Set(skus.map((s) => s.sku))), [skus])
  const uniqueCountries = useMemo(() => Array.from(new Set(skus.map((s) => s.country))), [skus])
  const uniqueSubcategories = useMemo(() => Array.from(new Set(skus.map((s) => s.subcategory))), [skus])

  const hasActiveFilters = filterSupplier !== "all" || filterSku !== "all" || filterCountry !== "all" || filterRegion !== "all" || filterBU !== "all" || filterSubcategory !== "all"

  const clearAllFilters = useCallback(() => {
    setFilterSupplier("all")
    setFilterSku("all")
    setFilterCountry("all")
    setFilterRegion("all")
    setFilterBU("all")
    setFilterSubcategory("all")
  }, [])

  // ─── Filtered Data ──────────────────────────────────────────────
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (filterSupplier !== "all" && s.name !== filterSupplier) return false
      if (filterCountry !== "all" && s.country !== filterCountry) return false
      return true
    })
  }, [suppliers, filterSupplier, filterCountry])

  const filteredSkus = useMemo(() => {
    return skus.filter((s) => {
      if (filterSupplier !== "all" && !s.supplierIds.some((sid) => suppliers.find((sup) => sup.id === sid && sup.name === filterSupplier))) return false
      if (filterSku !== "all" && s.sku !== filterSku) return false
      if (filterCountry !== "all" && s.country !== filterCountry) return false
      if (filterRegion !== "all" && s.region !== filterRegion) return false
      if (filterBU !== "all" && s.bu !== filterBU) return false
      if (filterSubcategory !== "all" && s.subcategory !== filterSubcategory) return false
      return true
    })
  }, [skus, suppliers, filterSupplier, filterSku, filterCountry, filterRegion, filterBU, filterSubcategory])

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (filterSupplier !== "all") {
        const sup = suppliers.find((s) => s.name === filterSupplier)
        if (!sup || c.supplierId !== sup.id) return false
      }
      return true
    })
  }, [contracts, suppliers, filterSupplier])

  // ─── Spend Overview Calculations ────────────────────────────────
  const totalSpend = filteredSuppliers.reduce((a, s) => a + s.annualSpend, 0)
  const contractedSpend = filteredContracts.reduce((a, c) => a + c.annualValue, 0)
  const coverage = totalSpend > 0 ? (contractedSpend / totalSpend) * 100 : 0
  const totalSkuCount = new Set(filteredSkus.map((s) => s.sku)).size

  const spendBySupplier = useMemo(() => {
    const sorted = [...filteredSuppliers].sort((a, b) => b.annualSpend - a.annualSpend)
    const top10 = sorted.slice(0, 10)
    const otherSpend = sorted.slice(10).reduce((a, s) => a + s.annualSpend, 0)
    const data = top10.map((s) => ({
      name: s.name.length > 18 ? `${s.name.substring(0, 16)}...` : s.name,
      spend: s.annualSpend,
    }))
    if (otherSpend > 0) data.push({ name: "Other", spend: otherSpend })
    return data
  }, [filteredSuppliers])

  const spendBySubcategory = useMemo(() => {
    const map: Record<string, number> = {}
    filteredSkus.forEach((s) => { map[s.subcategory] = (map[s.subcategory] || 0) + s.totalSpend })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [filteredSkus])

  const spendByRegion = useMemo(() => {
    const map: Record<string, number> = {}
    filteredSkus.forEach((s) => { map[s.region] = (map[s.region] || 0) + s.totalSpend })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filteredSkus])

  const spendByBU = useMemo(() => {
    const map: Record<string, number> = {}
    filteredSkus.forEach((s) => { map[s.bu] = (map[s.bu] || 0) + s.totalSpend })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filteredSkus])

  const spendByTier = useMemo(() => {
    return ["Strategic", "Preferred", "Approved", "Transactional", "Phase Out"].map((seg) => ({
      name: seg,
      value: filteredSuppliers.filter((s) => s.segment === seg).reduce((a, s) => a + s.annualSpend, 0),
    })).filter((s) => s.value > 0)
  }, [filteredSuppliers])

  const spendByPaymentType = useMemo(() => {
    const map: Record<string, number> = {}
    filteredSkus.forEach((s) => { map[s.paymentType] = (map[s.paymentType] || 0) + s.totalSpend })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filteredSkus])

  // Drilldown state
  const [drilldownDimension, setDrilldownDimension] = useState<"supplier" | "subcategory" | "region" | "bu">("supplier")

  const drilldownData = useMemo(() => {
    switch (drilldownDimension) {
      case "supplier":
        return filteredSuppliers.map((s) => ({ name: s.name, spend: s.annualSpend, segment: s.segment, country: s.country })).sort((a, b) => b.spend - a.spend)
      case "subcategory":
        return spendBySubcategory.map((s) => ({ name: s.name, spend: s.value, segment: "-", country: "-" }))
      case "region":
        return spendByRegion.map((s) => ({ name: s.name, spend: s.value, segment: "-", country: "-" }))
      case "bu":
        return spendByBU.map((s) => ({ name: s.name, spend: s.value, segment: "-", country: "-" }))
    }
  }, [drilldownDimension, filteredSuppliers, spendBySubcategory, spendByRegion, spendByBU])

  // ─── Contracts Tab Calculations ─────────────────────────────────
  const activeContracts = filteredContracts.filter((c) => c.status === "Active")
  const spendUnderContract = contractedSpend
  const spendUnderPO = filteredSkus.filter((s) => s.paymentType === "PO").reduce((a, s) => a + s.totalSpend, 0)
  const otherPaymentSpend = totalSpend - Math.max(spendUnderContract, spendUnderPO)

  const contractCoverage = useMemo(() => [
    { name: "Under Contract", value: spendUnderContract },
    { name: "PO Only", value: Math.max(0, spendUnderPO - spendUnderContract) },
    { name: "Other", value: Math.max(0, otherPaymentSpend) },
  ].filter((s) => s.value > 0), [spendUnderContract, spendUnderPO, otherPaymentSpend])

  const contractTermDist = useMemo(() => {
    const now = new Date()
    const buckets = { "0-3m": 0, "3-12m": 0, "12-24m": 0, "24m+": 0 }
    filteredContracts.forEach((c) => {
      const end = new Date(c.endDate)
      const months = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
      if (months <= 3) buckets["0-3m"]++
      else if (months <= 12) buckets["3-12m"]++
      else if (months <= 24) buckets["12-24m"]++
      else buckets["24m+"]++
    })
    return Object.entries(buckets).map(([name, value]) => ({ name, value }))
  }, [filteredContracts])

  const avgTermRemaining = useMemo(() => {
    if (filteredContracts.length === 0) return 0
    const now = new Date()
    const totalMonths = filteredContracts.reduce((a, c) => {
      const end = new Date(c.endDate)
      return a + Math.max(0, (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))
    }, 0)
    return Math.round(totalMonths / filteredContracts.length)
  }, [filteredContracts])

  // Contract detail drawer
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)



  // ─── Save Insight State ────────────────────────────────────────
  const [insightDrawerOpen, setInsightDrawerOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [insightPrefill, setInsightPrefill] = useState({
    title: "",
    text: "",
    sourceContext: "",
    suggestedTags: [] as string[],
    relatedEntities: {} as InternalFactInsight["relatedEntities"],
  })
  const [savedCount, setSavedCount] = useState(0)

  const openSaveDrawer = useCallback((prefill: typeof insightPrefill) => {
    setInsightPrefill(prefill)
    setInsightDrawerOpen(true)
  }, [])

  const handleInsightSaved = useCallback(() => {
    setSavedCount(getInsightCount())
  }, [])



  // ─── Render ─────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "Internal Fact Base" },
        ]}
        title="Internal Fact Base & Spend Analytics"
        description="Comprehensive spend analysis, supplier distribution, contract coverage, SKU trends, and price parity"
      />

      {/* ─── Saved Insights Bar ─────────────────────────────────── */}
      {savedCount > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-emerald-50/50 border-emerald-200 px-4 py-2">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="h-4 w-4 text-emerald-700" />
            <span className="text-sm font-medium text-emerald-800">
              {savedCount} insight{savedCount !== 1 ? "s" : ""} saved
            </span>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-100" onClick={() => setViewerOpen(true)}>
            <ExternalLink className="h-3 w-3" />
            View Saved Insights
          </Button>
        </div>
      )}

      {/* ─── Global Filters ──────────────────────────────────────── */}
      <Card className="mb-6">
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">Filters:</span>
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Supplier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Suppliers</SelectItem>
                {uniqueSupplierNames.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSku} onValueChange={setFilterSku}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="SKU" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All SKUs</SelectItem>
                {uniqueSkus.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCountry} onValueChange={setFilterCountry}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Countries</SelectItem>
                {uniqueCountries.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Region" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Regions</SelectItem>
                {REGIONS_LIST.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterBU} onValueChange={setFilterBU}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Business Unit" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All BUs</SelectItem>
                {BU_LIST.map((b) => <SelectItem key={b} value={b} className="text-xs">{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSubcategory} onValueChange={setFilterSubcategory}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Subcategory" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Subcategories</SelectItem>
                {uniqueSubcategories.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterTimePeriod} onValueChange={setFilterTimePeriod}>
              <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t">
              <span className="text-[10px] text-muted-foreground mr-1">Applied:</span>
              <FilterChip label="Supplier" value={filterSupplier} onClear={() => setFilterSupplier("all")} />
              <FilterChip label="SKU" value={filterSku} onClear={() => setFilterSku("all")} />
              <FilterChip label="Country" value={filterCountry} onClear={() => setFilterCountry("all")} />
              <FilterChip label="Region" value={filterRegion} onClear={() => setFilterRegion("all")} />
              <FilterChip label="BU" value={filterBU} onClear={() => setFilterBU("all")} />
              <FilterChip label="Subcategory" value={filterSubcategory} onClear={() => setFilterSubcategory("all")} />
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={clearAllFilters}>
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Main Tabs ───────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-9">
          <TabsTrigger value="spend" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Spend Overview</TabsTrigger>
          <TabsTrigger value="contracts" className="text-xs gap-1.5"><ScrollText className="h-3.5 w-3.5" />Contracts</TabsTrigger>
          <TabsTrigger value="stakeholders" className="text-xs gap-1.5"><Users className="h-3.5 w-3.5" />{"Stakeholders & Requirements"}</TabsTrigger>
          <TabsTrigger value="sku-analysis" className="text-xs gap-1.5"><Layers className="h-3.5 w-3.5" />SKU Analysis</TabsTrigger>
        </TabsList>

        {/* ═══════════ TAB 1: SPEND OVERVIEW ═══════════════════════ */}
        <TabsContent value="spend" className="space-y-6">
          {/* KPI Row */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Key Metrics</span>
            <SaveInsightButton
              title={`Spend Overview: ${selectedCategory.name}`}
              text={`Total Spend: ${formatCurrency(totalSpend)} | Suppliers: ${filteredSuppliers.length} | SKUs: ${totalSkuCount} | Contract Coverage: ${coverage.toFixed(0)}% | YoY: +4.2%`}
              sourceContext="Spend Overview tab - KPI summary"
              suggestedTags={["Cost"]}
              variant="button"
              onSaved={() => openSaveDrawer({
                title: `Spend Overview: ${selectedCategory.name}`,
                text: `Total Spend: ${formatCurrency(totalSpend)} | Suppliers: ${filteredSuppliers.length} | SKUs: ${totalSkuCount} | Contract Coverage: ${coverage.toFixed(0)}% | YoY: +4.2%`,
                sourceContext: "Spend Overview tab - KPI summary",
                suggestedTags: ["Cost"],
                relatedEntities: {},
              })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Total Spend" value={formatCurrency(totalSpend)} />
            <StatCard label="# Suppliers" value={String(filteredSuppliers.length)} />
            <StatCard label="# SKUs" value={String(totalSkuCount)} />
            <StatCard label="Spend Under Contract" value={`${coverage.toFixed(0)}%`} />
            <StatCard label="YoY Change" value="+4.2%" sub="vs prior year" trend="up" />
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Spend by Supplier (Top 10 + Other) */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Spend by Supplier (Top 10 + Other)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={spendBySupplier} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="spend" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Spend by Subcategory */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Spend by Subcategory</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={spendBySubcategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {spendBySubcategory.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Spend by Region</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={spendByRegion}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Spend by Business Unit</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={spendByBU}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Spend by Supplier Tier</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={spendByTier} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                      {spendByTier.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 3 */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Spend by Payment Type</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={spendByPaymentType} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                      {spendByPaymentType.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Spend Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={spendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="amount" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI Generated Insights - Spend Overview */}
          <AIInsightsCard
            chartContext={{
              chartId: "spend_overview",
              chartTitle: "Spend Overview",
              breakdownType: "supplier",
              filters: {
                supplier: filterSupplier !== "all" ? filterSupplier : undefined,
                sku: filterSku !== "all" ? filterSku : undefined,
                country: filterCountry !== "all" ? filterCountry : undefined,
                region: filterRegion !== "all" ? filterRegion : undefined,
                bu: filterBU !== "all" ? filterBU : undefined,
                subcategory: filterSubcategory !== "all" ? filterSubcategory : undefined,
              },
              currency: "USD",
              dataSummary: {
                topItems: spendBySupplier.map((s) => ({ name: s.name, value: s.spend })),
                totals: { totalSpend },
                trends: { series: spendData.map((d) => ({ date: d.month, value: d.amount })) },
              },
            } satisfies ChartContext}
            onEditBeforeSave={openSaveDrawer}
            onSaved={handleInsightSaved}
          />

          {/* Drilldown Table */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Spend Drilldown</CardTitle>
                <Select value={drilldownDimension} onValueChange={(v) => setDrilldownDimension(v as typeof drilldownDimension)}>
                  <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier" className="text-xs">By Supplier</SelectItem>
                    <SelectItem value="subcategory" className="text-xs">By Subcategory</SelectItem>
                    <SelectItem value="region" className="text-xs">By Region</SelectItem>
                    <SelectItem value="bu" className="text-xs">By Business Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    {drilldownDimension === "supplier" && <TableHead className="text-xs">Segment</TableHead>}
                    {drilldownDimension === "supplier" && <TableHead className="text-xs">Country</TableHead>}
                    <TableHead className="text-xs text-right">Spend</TableHead>
                    <TableHead className="text-xs text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drilldownData.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="text-sm font-medium">{row.name}</TableCell>
                      {drilldownDimension === "supplier" && <TableCell className="text-xs text-muted-foreground">{row.segment}</TableCell>}
                      {drilldownDimension === "supplier" && <TableCell className="text-xs text-muted-foreground">{row.country}</TableCell>}
                      <TableCell className="text-sm text-right font-medium">{formatCurrency(row.spend)}</TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">{totalSpend > 0 ? ((row.spend / totalSpend) * 100).toFixed(1) : 0}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ TAB 2: CONTRACTS ════════════════════════════ */}
        <TabsContent value="contracts" className="space-y-6">
          {/* KPI Row */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Contract Metrics</span>
            <SaveInsightButton
              title={`Contract Analysis: ${selectedCategory.name}`}
              text={`Contract Coverage: ${coverage.toFixed(0)}% | PO Coverage: ${totalSpend > 0 ? ((spendUnderPO / totalSpend) * 100).toFixed(0) : 0}% | Active Contracts: ${activeContracts.length} | Avg Term Remaining: ${avgTermRemaining}m`}
              sourceContext="Contracts tab - KPI summary"
              suggestedTags={["Contracting", "Cost"]}
              variant="button"
              onSaved={() => openSaveDrawer({
                title: `Contract Analysis: ${selectedCategory.name}`,
                text: `Contract Coverage: ${coverage.toFixed(0)}% | PO Coverage: ${totalSpend > 0 ? ((spendUnderPO / totalSpend) * 100).toFixed(0) : 0}% | Active Contracts: ${activeContracts.length} | Avg Term Remaining: ${avgTermRemaining}m`,
                sourceContext: "Contracts tab - KPI summary",
                suggestedTags: ["Contracting", "Cost"],
                relatedEntities: {},
              })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Spend Under Contract" value={`${coverage.toFixed(0)}%`} />
            <StatCard label="Spend Under PO" value={`${totalSpend > 0 ? ((spendUnderPO / totalSpend) * 100).toFixed(0) : 0}%`} />
            <StatCard label="Active Contracts" value={String(activeContracts.length)} />
            <StatCard label="Avg Term Remaining" value={`${avgTermRemaining}m`} />
          </div>

          {/* Visuals */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Contract vs PO vs Other</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={contractCoverage} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                      {contractCoverage.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Contract Term Remaining</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={contractTermDist}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Spend by Supplier Tier</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={spendByTier} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                      {spendByTier.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI Generated Insights - Contracts */}
          <AIInsightsCard
            chartContext={{
              chartId: "contracts_overview",
              chartTitle: "Contracts Overview",
              breakdownType: "contract",
              filters: {
                supplier: filterSupplier !== "all" ? filterSupplier : undefined,
              },
              currency: "USD",
              dataSummary: {
                topItems: filteredContracts.map((c) => {
                  const sup = suppliers.find((s) => s.id === c.supplierId)
                  return { name: `${sup?.name ?? c.supplierId} - ${c.title}`, value: c.annualValue }
                }).sort((a, b) => b.value - a.value),
                totals: { totalSpend: contractedSpend, count: filteredContracts.length },
                contractStats: {
                  coverage,
                  expiring: filteredContracts.filter((c) => c.status === "Expiring").length,
                  avgTermMonths: avgTermRemaining,
                  total: filteredContracts.length,
                },
              },
            } satisfies ChartContext}
            onEditBeforeSave={openSaveDrawer}
            onSaved={handleInsightSaved}
          />

          {/* Contract Terms Table */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Contract Terms Analysis</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Supplier</TableHead>
                    <TableHead className="text-xs">Contract</TableHead>
                    <TableHead className="text-xs">Start / End</TableHead>
                    <TableHead className="text-xs">Renewal</TableHead>
                    <TableHead className="text-xs">SLA</TableHead>
                    <TableHead className="text-xs">Payment</TableHead>
                    <TableHead className="text-xs text-right">Annual Value</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((c) => {
                    const sup = suppliers.find((s) => s.id === c.supplierId)
                    return (
                      <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedContract(c)}>
                        <TableCell className="text-sm">{sup?.name ?? c.supplierId}</TableCell>
                        <TableCell className="text-sm font-medium">{c.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.startDate} - {c.endDate}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.renewalDate}</TableCell>
                        <TableCell className="text-xs">{c.keyTerms["SLA"] ?? "N/A"}</TableCell>
                        <TableCell className="text-xs">{c.keyTerms["Payment Terms"] ?? "N/A"}</TableCell>
                        <TableCell className="text-sm text-right font-medium">{formatCurrency(c.annualValue)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs",
                            c.status === "Active" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                            c.status === "Expiring" && "bg-amber-50 text-amber-700 border-amber-200",
                            c.status === "Expired" && "bg-red-50 text-red-700 border-red-200",
                            c.status === "Under Review" && "bg-sky-50 text-sky-700 border-sky-200",
                          )}>{c.status}</Badge>
                        </TableCell>
                        <TableCell><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>


        {/* ═══════════ TAB 3: STAKEHOLDERS & REQUIREMENTS ═══════════ */}
        <TabsContent value="stakeholders" className="space-y-6">
          <StakeholderRequirementsTab categoryId={selectedCategory.id} />
        </TabsContent>

        {/* ═══════════ TAB 4: SKU ANALYSIS ═════════════════════════ */}
        <TabsContent value="sku-analysis" className="space-y-6">
          <SKUAnalysisTab
            filteredSkus={filteredSkus}
            allSkus={skus}
            suppliers={suppliers}
            filterSku={filterSku}
            setFilterSku={setFilterSku}
            openSaveDrawer={openSaveDrawer}
            onInsightSaved={handleInsightSaved}
          />
        </TabsContent>
      </Tabs>

      {/* ─── Contract Detail Drawer ──────────────────────────────── */}
      <Sheet open={!!selectedContract} onOpenChange={(open) => { if (!open) setSelectedContract(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {selectedContract && (() => {
            const sup = suppliers.find((s) => s.id === selectedContract.supplierId)
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-base">{selectedContract.title}</SheetTitle>
                  <SheetDescription>{sup?.name ?? selectedContract.supplierId}</SheetDescription>
                </SheetHeader>
                <div className="mt-4 flex justify-end">
                  <SaveInsightButton
                    title={`Contract: ${selectedContract.title} (${sup?.name ?? selectedContract.supplierId})`}
                    text={`${selectedContract.title} with ${sup?.name ?? selectedContract.supplierId}. Annual value: ${formatCurrency(selectedContract.annualValue)}. Status: ${selectedContract.status}. Period: ${selectedContract.startDate} to ${selectedContract.endDate}. Payment: ${selectedContract.keyTerms["Payment Terms"] ?? "N/A"}. SLA: ${selectedContract.keyTerms["SLA"] ?? "N/A"}.`}
                    sourceContext={`Contracts tab - Contract detail drawer (${selectedContract.title})`}
                    suggestedTags={["Contracting", "Supplier"]}
                    variant="button"
                    onSaved={() => openSaveDrawer({
                      title: `Contract: ${selectedContract.title} (${sup?.name ?? selectedContract.supplierId})`,
                      text: `${selectedContract.title} with ${sup?.name ?? selectedContract.supplierId}. Annual value: ${formatCurrency(selectedContract.annualValue)}. Status: ${selectedContract.status}. Period: ${selectedContract.startDate} to ${selectedContract.endDate}. Payment: ${selectedContract.keyTerms["Payment Terms"] ?? "N/A"}. SLA: ${selectedContract.keyTerms["SLA"] ?? "N/A"}.`,
                      sourceContext: `Contracts tab - Contract detail drawer (${selectedContract.title})`,
                      suggestedTags: ["Contracting", "Supplier"],
                      relatedEntities: { supplierId: sup?.name ?? selectedContract.supplierId },
                    })}
                  />
                </div>
                <div className="mt-2 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Annual Value</p>
                      <p className="text-lg font-bold">{formatCurrency(selectedContract.annualValue)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                      <Badge variant="outline" className={cn("text-xs",
                        selectedContract.status === "Active" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                        selectedContract.status === "Expiring" && "bg-amber-50 text-amber-700 border-amber-200",
                        selectedContract.status === "Expired" && "bg-red-50 text-red-700 border-red-200",
                        selectedContract.status === "Under Review" && "bg-sky-50 text-sky-700 border-sky-200",
                      )}>{selectedContract.status}</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Contract Period</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Start:</span> {selectedContract.startDate}</p>
                      <p><span className="text-muted-foreground">End:</span> {selectedContract.endDate}</p>
                      <p><span className="text-muted-foreground">Renewal:</span> {selectedContract.renewalDate}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Key Terms</p>
                    <div className="space-y-2">
                      {Object.entries(selectedContract.keyTerms).map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between text-sm">
                          <span className="text-muted-foreground">{key}</span>
                          <span className="font-medium text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Clause Scores</p>
                    <div className="space-y-2">
                      {Object.entries(selectedContract.clauseScores).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground capitalize">{key}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                            </div>
                            <span className="text-xs font-mono w-8 text-right">{value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Additional Terms</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Rebate/Profit Share: <span className="text-foreground">Not available</span></p>
                      <p>Indexation Clause: <span className="text-foreground">Not available</span></p>
                      <p>Renewal Type: <span className="text-foreground">Auto-renewal</span></p>
                    </div>
                  </div>
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>

      {/* ─── Save Insight Drawer ────────────────────────────────── */}
      <SaveInsightDrawer
        open={insightDrawerOpen}
        onOpenChange={setInsightDrawerOpen}
        prefill={insightPrefill}
        onSave={handleInsightSaved}
      />

      {/* ─── Saved Insights Viewer ──────────────────────────────── */}
      <SavedInsightsViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </>
  )
}
