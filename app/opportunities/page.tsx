"use client"

import { useState, useMemo, useCallback } from "react"
import { useCategory } from "@/lib/category-context"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { LeverDetailDrawer } from "@/components/lever-detail-drawer"
import { TrimProliferationAnalysis } from "@/components/trim-proliferation-analysis"
import { LeverSavingsAnalysis } from "@/components/lever-savings-analysis"
import { getAllInsightsForCategory, type UnifiedInsight } from "@/lib/insights-adapter"
import {
  getRecommendedLevers,
  getLeversByBucket,
  fleetLevers,
  getBucketColor,
  getLeverStatusColor,
  isLeverRecommended,
  getLeverAnalysisReadiness,
  getAnalysisReadinessColor,
  leverModelConfigs,
  type Lever,
  type LeverBucket,
  type LeverRecommendation,
  type TrackerInitiative,
} from "@/lib/opportunity-tracker-data"
import {
  Beaker,
  Calculator,
  DollarSign,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react"

export default function OpportunityTrackerPage() {
  const { selectedCategory } = useCategory()
  const [selectedLever, setSelectedLever] = useState<Lever | null>(null)
  const [drawerEvidence, setDrawerEvidence] = useState<UnifiedInsight[]>([])
  const [drawerRecommendation, setDrawerRecommendation] = useState<LeverRecommendation | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [initiatives, setInitiatives] = useState<TrackerInitiative[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [showTrimAnalysis, setShowTrimAnalysis] = useState(false)
  const [showUniversalAnalysis, setShowUniversalAnalysis] = useState(false)
  const [analysisLever, setAnalysisLever] = useState<Lever | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false)
  const [dataReadinessFilter, setDataReadinessFilter] = useState<"all" | "Available" | "Needs data">("all")

  const recommendations = useMemo(
    () => getRecommendedLevers(selectedCategory.id, 12),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCategory.id, refreshKey],
  )

  const allInsights = useMemo(
    () => getAllInsightsForCategory(selectedCategory.id),
    [selectedCategory.id],
  )

  const costLevers = useMemo(() => getLeversByBucket("Cost"), [])
  const demandLevers = useMemo(() => getLeversByBucket("Demand"), [])
  const valueLevers = useMemo(() => getLeversByBucket("Value"), [])

  // Filter levers
  const filterLevers = useCallback(
    (levers: Lever[]) => {
      let filtered = levers
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            l.description.toLowerCase().includes(q),
        )
      }
      if (showRecommendedOnly) {
        filtered = filtered.filter((l) => isLeverRecommended(l.id, recommendations))
      }
      if (dataReadinessFilter !== "all") {
        filtered = filtered.filter((l) => l.dataReadiness === dataReadinessFilter)
      }
      return filtered
    },
    [searchQuery, showRecommendedOnly, dataReadinessFilter, recommendations],
  )

  const filteredCost = useMemo(() => filterLevers(costLevers), [filterLevers, costLevers])
  const filteredDemand = useMemo(() => filterLevers(demandLevers), [filterLevers, demandLevers])
  const filteredValue = useMemo(() => filterLevers(valueLevers), [filterLevers, valueLevers])

  const openLeverDrawer = useCallback(
    (lever: Lever) => {
      setSelectedLever(lever)
      const rec = isLeverRecommended(lever.id, recommendations) || null
      setDrawerRecommendation(rec)

      if (rec) {
        setDrawerEvidence(rec.evidenceInsights)
      } else {
        const related = allInsights.filter((insight) => {
          const textLower = `${insight.title} ${insight.text} ${insight.tags.join(" ")}`.toLowerCase()
          return lever.keywords.some((kw) => textLower.includes(kw.toLowerCase()))
        })
        setDrawerEvidence(related.slice(0, 8))
      }
      setDrawerOpen(true)
    },
    [allInsights, recommendations],
  )

  const handleCreateInitiative = useCallback((initiative: TrackerInitiative) => {
    setInitiatives((prev) => [...prev, initiative])
  }, [])

  const handleOpenAnalysis = useCallback(
    (analysisId: string, lever?: Lever) => {
      // Handle trim proliferation specially
      if (analysisId.startsWith("a-20-")) {
        setDrawerOpen(false)
        setShowTrimAnalysis(true)
        return
      }
      
      // For other levers, use the universal analysis component
      if (lever) {
        setDrawerOpen(false)
        setAnalysisLever(lever)
        setShowUniversalAnalysis(true)
      }
    },
    [],
  )

  // Handle direct "Analyze Savings" click from lever card
  const handleAnalyzeSavings = useCallback(
    (lever: Lever) => {
      // For lev-20 (Trim Proliferation), use dedicated component
      if (lever.id === "lev-20") {
        setShowTrimAnalysis(true)
        return
      }
      
      // For all other levers, use universal analysis
      setAnalysisLever(lever)
      setShowUniversalAnalysis(true)
    },
    [],
  )

  // If flagship analysis is open, show that instead
  if (showTrimAnalysis) {
    return (
      <>
        <PageHeader
          crumbs={[
            { label: "Home", href: "/" },
            { label: selectedCategory.name, href: "/" },
            { label: "Opportunity Tracker", href: "/opportunities" },
            { label: "Reduce Trim Proliferation" },
          ]}
          title="Analysis: Reduce Trim Proliferation"
          description="Premium vs base trim analysis by role tier with interactive savings model"
        />
        <TrimProliferationAnalysis onBack={() => setShowTrimAnalysis(false)} />
      </>
    )
  }

  // If universal analysis is open for any other lever
  if (showUniversalAnalysis && analysisLever) {
    return (
      <>
        <PageHeader
          crumbs={[
            { label: "Home", href: "/" },
            { label: selectedCategory.name, href: "/" },
            { label: "Opportunity Tracker", href: "/opportunities" },
            { label: analysisLever.name },
          ]}
          title={`Analysis: ${analysisLever.name}`}
          description={analysisLever.description}
        />
        <LeverSavingsAnalysis 
          lever={analysisLever} 
          onBack={() => {
            setShowUniversalAnalysis(false)
            setAnalysisLever(null)
          }} 
        />
      </>
    )
  }

  const bucketConfigs: {
    bucket: LeverBucket
    label: string
    icon: typeof DollarSign
    levers: Lever[]
    colorClass: string
    headerBg: string
  }[] = [
    {
      bucket: "Cost",
      label: "Cost",
      icon: DollarSign,
      levers: filteredCost,
      colorClass: "text-blue-700",
      headerBg: "bg-blue-50/60",
    },
    {
      bucket: "Demand",
      label: "Demand",
      icon: TrendingUp,
      levers: filteredDemand,
      colorClass: "text-amber-700",
      headerBg: "bg-amber-50/60",
    },
    {
      bucket: "Value",
      label: "Value",
      icon: Zap,
      levers: filteredValue,
      colorClass: "text-teal-700",
      headerBg: "bg-teal-50/60",
    },
  ]

  return (
    <TooltipProvider delayDuration={300}>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "Opportunity Tracker" },
        ]}
        title="Opportunity Tracker"
        description="Turn insights into value -- choose levers, validate with analytics, size impact."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-muted">
              {recommendations.length} recommended
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-transparent"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Refresh AI
            </Button>
          </div>
        }
      />

      {/* Filter row */}
      <Card className="mb-6 shadow-none">
        <CardContent className="p-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-[320px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search levers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="rec-only"
                checked={showRecommendedOnly}
                onCheckedChange={setShowRecommendedOnly}
              />
              <Label htmlFor="rec-only" className="text-xs text-muted-foreground cursor-pointer">
                Recommended only
              </Label>
            </div>
            <Select value={dataReadinessFilter} onValueChange={(v) => setDataReadinessFilter(v as typeof dataReadinessFilter)}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All readiness</SelectItem>
                <SelectItem value="Available" className="text-xs">Data available</SelectItem>
                <SelectItem value="Needs data" className="text-xs">Needs data</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto text-xs text-muted-foreground">
              {filteredCost.length + filteredDemand.length + filteredValue.length} of {fleetLevers.length} levers
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placemat: 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {bucketConfigs.map(({ bucket, label, icon: Icon, levers, colorClass, headerBg }) => (
          <div key={bucket} className="flex flex-col">
            {/* Column header */}
            <div className={cn("rounded-t-lg border border-b-0 px-4 py-3 flex items-center gap-2", headerBg)}>
              <Icon className={cn("h-4 w-4", colorClass)} />
              <span className={cn("text-sm font-semibold", colorClass)}>{label}</span>
              <Badge variant="outline" className={cn("text-[10px] ml-auto", getBucketColor(bucket))}>
                {levers.length}
              </Badge>
            </div>
            {/* Lever cards */}
            <div className="flex-1 rounded-b-lg border border-t-0 bg-muted/10 p-2 space-y-2 min-h-[200px]">
              {levers.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-muted-foreground italic">No levers match filters</p>
                </div>
              )}
              {levers.map((lever) => {
                const rec = isLeverRecommended(lever.id, recommendations)
                const availableCount = lever.analyses.filter((a) => a.status === "Available").length
                return (
                  <PlacematLeverCard
                    key={lever.id}
                    lever={lever}
                    recommendation={rec}
                    availableAnalyses={availableCount}
                    onClick={() => openLeverDrawer(lever)}
                    onAnalyzeSavings={() => handleAnalyzeSavings(lever)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Initiatives table */}
      {initiatives.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">Initiatives</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{initiatives.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Initiative</TableHead>
                  <TableHead>Lever</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Target Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initiatives.map((init) => {
                  const lever = fleetLevers.find((l) => l.id === init.leverId)
                  return (
                    <TableRow key={init.id}>
                      <TableCell className="font-medium">{init.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px]", lever ? getBucketColor(lever.bucket) : "")}>
                          {lever?.name || init.leverId}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{init.owner}</TableCell>
                      <TableCell>{init.targetValue}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            init.status === "Complete" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                            init.status === "In progress" && "bg-sky-50 text-sky-700 border-sky-200",
                            init.status === "Planning" && "bg-muted text-muted-foreground",
                          )}
                        >
                          {init.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{init.dueDate}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Lever Detail Drawer */}
      <LeverDetailDrawer
        lever={selectedLever}
        evidenceInsights={drawerEvidence}
        recommendation={drawerRecommendation}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedLever(null)
          setDrawerRecommendation(null)
        }}
        onCreateInitiative={handleCreateInitiative}
        onOpenAnalysis={(analysisId) => handleOpenAnalysis(analysisId, selectedLever ?? undefined)}
        onRefreshRecommendation={() => setRefreshKey((k) => k + 1)}
        onAnalyzeSavings={selectedLever ? () => handleAnalyzeSavings(selectedLever) : undefined}
      />
    </TooltipProvider>
  )
}

// ─── Placemat Lever Card ────────────────────────────────────────────────────

function PlacematLeverCard({
  lever,
  recommendation,
  availableAnalyses,
  onClick,
  onAnalyzeSavings,
}: {
  lever: Lever
  recommendation: LeverRecommendation | undefined
  availableAnalyses: number
  onClick: () => void
  onAnalyzeSavings: () => void
}) {
  const isRecommended = !!recommendation
  const readiness = getLeverAnalysisReadiness(lever)
  const hasModelConfig = !!leverModelConfigs[lever.id]

  const card = (
    <Card
      className={cn(
        "transition-all hover:shadow-md shadow-none",
        isRecommended
          ? "ring-2 ring-primary/40 hover:ring-primary/60"
          : "hover:border-primary/30",
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-1.5 mb-1.5 cursor-pointer" onClick={onClick}>
          <Badge variant="outline" className={cn("text-[10px] h-4", getLeverStatusColor(lever.status))}>
            {lever.status}
          </Badge>
          {isRecommended && (
            <Badge className="text-[10px] h-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              AI Rec
            </Badge>
          )}
        </div>
        <div className="cursor-pointer" onClick={onClick}>
          <h4 className="text-xs font-semibold text-foreground leading-tight mb-1">
            {lever.name}
          </h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-2">
            {lever.description}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px] h-4", getAnalysisReadinessColor(readiness))}>
              {readiness}
            </Badge>
            <Badge variant="secondary" className="text-[10px] h-4 gap-0.5">
              <Beaker className="h-2.5 w-2.5" />
              {availableAnalyses}
            </Badge>
          </div>
          <Button
            variant={hasModelConfig ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-5 text-[10px] px-2 gap-1",
              !hasModelConfig && "bg-transparent"
            )}
            onClick={(e) => {
              e.stopPropagation()
              onAnalyzeSavings()
            }}
          >
            <Calculator className="h-2.5 w-2.5" />
            Analyze
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (isRecommended && recommendation) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent side="right" className="max-w-[280px]">
          <p className="text-xs font-medium mb-1">Recommended because...</p>
          <p className="text-xs text-muted-foreground">{recommendation.reason}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return card
}
