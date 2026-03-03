"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  type Lever,
  type LeverModelConfig,
  type AnalysisReadiness,
  leverModelConfigs,
  getLeverAnalysisReadiness,
  getAnalysisReadinessColor,
  getBucketColor,
} from "@/lib/opportunity-tracker-data"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  DollarSign,
  Sparkles,
  BarChart3,
  TableProperties,
  Info,
  Save,
  AlertTriangle,
  Check,
  Settings2,
  FileText,
} from "lucide-react"

interface LeverSavingsAnalysisProps {
  lever: Lever
  onBack: () => void
}

export function LeverSavingsAnalysis({ lever, onBack }: LeverSavingsAnalysisProps) {
  const [activeTab, setActiveTab] = useState("savings")
  
  // Get the model config for this lever
  const modelConfig = leverModelConfigs[lever.id]
  const readiness = getLeverAnalysisReadiness(lever)
  const hasConfig = !!modelConfig
  
  // Slider state
  const [sliderValue, setSliderValue] = useState(modelConfig?.primarySliderDefault ?? 30)
  const [scenarioLabel, setScenarioLabel] = useState<string>(
    modelConfig?.presets?.find(p => p.value === modelConfig.primarySliderDefault)?.label ?? "Base"
  )
  
  // Additional inputs state
  const [additionalInputs, setAdditionalInputs] = useState<Record<string, number>>(() => {
    if (!modelConfig) return {}
    return modelConfig.requiredInputs.reduce((acc, input) => {
      acc[input.key] = input.defaultValue
      return acc
    }, {} as Record<string, number>)
  })

  // Handle slider change
  const handleSliderChange = useCallback((values: number[]) => {
    const newValue = values[0]
    setSliderValue(newValue)
    
    // Check if it matches a preset
    const matchingPreset = modelConfig?.presets?.find(p => p.value === newValue)
    if (matchingPreset) {
      setScenarioLabel(matchingPreset.label)
    } else {
      setScenarioLabel(`Custom (${newValue}${modelConfig?.primarySliderUnit ?? "%"})`)
    }
  }, [modelConfig])

  // Handle preset selection
  const handlePresetSelect = useCallback((presetLabel: string) => {
    const preset = modelConfig?.presets?.find(p => p.label === presetLabel)
    if (preset) {
      setSliderValue(preset.value)
      setScenarioLabel(preset.label)
    }
  }, [modelConfig])

  // Calculate savings
  const savingsCalc = useMemo(() => {
    if (!modelConfig) {
      return { estimatedSavings: 0, savingsRate: 0, addressable: 0 }
    }
    
    const rate = sliderValue / 100
    let coverage = 1
    
    // Check for coverage in additional inputs
    if (additionalInputs.coverage !== undefined) {
      coverage = additionalInputs.coverage / 100
    } else {
      const coverageInput = modelConfig.requiredInputs.find(i => i.key === "coverage")
      if (coverageInput) {
        coverage = additionalInputs[coverageInput.key] !== undefined 
          ? additionalInputs[coverageInput.key] / 100 
          : coverageInput.defaultValue / 100
      }
    }

    const addressable = modelConfig.addressableBaseValue
    const estimatedSavings = Math.round(addressable * rate * coverage)
    const savingsRate = Math.round(rate * coverage * 100)

    return {
      estimatedSavings,
      savingsRate,
      addressable,
      coverage: Math.round(coverage * 100),
    }
  }, [modelConfig, sliderValue, additionalInputs])

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n}`

  // If lever is "Reduce Trim Proliferation", redirect to dedicated component
  if (lever.id === "lev-20") {
    // This component shouldn't be used for lev-20, but handle gracefully
    return null
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn("text-[10px]", getBucketColor(lever.bucket))}>
                {lever.bucket}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px]", getAnalysisReadinessColor(readiness))}>
                {readiness}
              </Badge>
            </div>
            <h2 className="text-lg font-semibold text-foreground">{lever.name}</h2>
            <p className="text-sm text-muted-foreground">{lever.description}</p>
          </div>
        </div>

        {/* Data Readiness Banner */}
        {readiness === "Needs data" && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <AlertTitle className="text-amber-800">Needs data to size precisely</AlertTitle>
            <AlertDescription className="text-amber-700 text-sm">
              <p className="mb-2">The following data is required for accurate sizing:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                {lever.analyses
                  .filter(a => a.status === "Needs data")
                  .flatMap(a => a.requiredDatasets)
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .slice(0, 4)
                  .map(dataset => (
                    <li key={dataset}>{dataset}</li>
                  ))}
              </ul>
              <p className="mt-2 text-xs">You can still model savings using manual assumptions below.</p>
            </AlertDescription>
          </Alert>
        )}

        {/* KPI Summary Row */}
        {hasConfig && (
          <div className="grid grid-cols-4 gap-4">
            <Card className="shadow-none">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Total Spend in Scope</p>
                <p className="text-xl font-bold text-foreground mt-1">{fmt(modelConfig.addressableBaseValue)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{modelConfig.addressableBaseLabel}</p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Addressable Spend</p>
                <p className="text-xl font-bold text-foreground mt-1">
                  {fmt(Math.round(modelConfig.addressableBaseValue * (savingsCalc.coverage / 100)))}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{savingsCalc.coverage}% coverage</p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Est. Savings ({scenarioLabel})</p>
                <p className="text-xl font-bold text-primary mt-1">{fmt(savingsCalc.estimatedSavings)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Annual, at {sliderValue}{modelConfig.primarySliderUnit}</p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Savings Rate</p>
                <p className="text-xl font-bold text-foreground mt-1">{savingsCalc.savingsRate}%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Of addressable spend</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="savings" className="gap-1.5 text-xs">
              <DollarSign className="h-3.5 w-3.5" />
              Savings Analysis
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="gap-1.5 text-xs">
              <TableProperties className="h-3.5 w-3.5" />
              Breakdown
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* Savings Analysis Tab */}
          <TabsContent value="savings" className="space-y-6 mt-4">
            {hasConfig ? (
              <>
                {/* Model Controls */}
                <Card className="shadow-none">
                  <CardContent className="p-5 space-y-5">
                    {/* Primary Slider */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{modelConfig.primarySliderLabel}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Adjust to model different scenarios
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20 font-mono">
                            {sliderValue}{modelConfig.primarySliderUnit}
                          </Badge>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-[240px]">
                              <p className="text-xs">{modelConfig.savingsEquation}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      
                      {/* Slider */}
                      <div className="px-1">
                        <Slider
                          value={[sliderValue]}
                          onValueChange={handleSliderChange}
                          min={modelConfig.primarySliderMin}
                          max={modelConfig.primarySliderMax}
                          step={modelConfig.primarySliderStep}
                          className="w-full"
                        />
                        {/* Tick marks */}
                        <div className="flex justify-between mt-1.5 px-0.5">
                          {[0, 25, 50, 75, 100].map((tick) => {
                            const scaledTick = Math.round(modelConfig.primarySliderMin + (tick / 100) * (modelConfig.primarySliderMax - modelConfig.primarySliderMin))
                            return (
                              <button
                                key={tick}
                                onClick={() => handleSliderChange([scaledTick])}
                                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              >
                                {scaledTick}{modelConfig.primarySliderUnit}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Preset buttons */}
                      {modelConfig.presets && modelConfig.presets.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Quick presets:</span>
                          <div className="flex gap-1.5">
                            {modelConfig.presets.map((preset) => (
                              <button
                                key={preset.label}
                                onClick={() => handlePresetSelect(preset.label)}
                                className={cn(
                                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                                  scenarioLabel === preset.label
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                                )}
                              >
                                {preset.label} ({preset.value}{modelConfig.primarySliderUnit})
                              </button>
                            ))}
                          </div>
                          {scenarioLabel.startsWith("Custom") && (
                            <Badge variant="secondary" className="text-[10px]">
                              {scenarioLabel}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Additional Inputs */}
                    {modelConfig.requiredInputs.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Settings2 className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium text-foreground">Additional Parameters</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {modelConfig.requiredInputs.map((input) => (
                              <div key={input.key}>
                                <Label className="text-xs">{input.label}</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <Input
                                    type="number"
                                    value={additionalInputs[input.key] ?? input.defaultValue}
                                    onChange={(e) => setAdditionalInputs(prev => ({
                                      ...prev,
                                      [input.key]: Number(e.target.value)
                                    }))}
                                    className="h-8 text-sm"
                                  />
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">{input.unit}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Savings Summary */}
                <Card className="shadow-none border-primary/20">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Savings Summary</p>
                      <Badge variant="outline" className="text-[10px] ml-auto bg-primary/5 text-primary border-primary/20">
                        {scenarioLabel}
                      </Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground">
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p className="text-xs">Save this scenario</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{modelConfig.addressableBaseLabel}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{fmt(modelConfig.addressableBaseValue)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Total addressable</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Estimated Savings</p>
                        <p className="text-2xl font-bold text-primary mt-1">{fmt(savingsCalc.estimatedSavings)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Annual, at {sliderValue}{modelConfig.primarySliderUnit}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Savings Rate</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{savingsCalc.savingsRate}%</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Of addressable spend</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Model Type</p>
                        <p className="text-lg font-bold text-foreground mt-1">{modelConfig.modelType}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Sizing engine</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Assumptions */}
                <div className="rounded-md border bg-muted/10 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Info className="h-3 w-3 text-muted-foreground" />
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Assumptions</p>
                  </div>
                  <ul className="space-y-0.5 text-[11px] text-muted-foreground leading-relaxed">
                    {modelConfig.assumptions.map((assumption, idx) => (
                      <li key={idx}>{assumption}</li>
                    ))}
                    <li><span className="font-medium text-foreground">Equation:</span> {modelConfig.savingsEquation}</li>
                  </ul>
                </div>
              </>
            ) : (
              // No model config - show placeholder
              <Card className="shadow-none">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">Sizing model not yet configured</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    This lever does not have a standardized sizing model. You can still review the analysis library and create manual estimates.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Label className="text-xs">Manual savings estimate ($)</Label>
                    <Input type="number" placeholder="Enter amount" className="w-[180px] h-8 text-sm" />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-6 mt-4">
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Analysis Library</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {lever.analyses.length} analyses
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Analysis</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lever.analyses.map((analysis) => (
                      <TableRow key={analysis.id}>
                        <TableCell className="font-medium">{analysis.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-[300px]">
                          {analysis.purpose}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              analysis.status === "Available" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                              analysis.status === "Needs data" && "bg-amber-50 text-amber-700 border-amber-200",
                              analysis.status === "Not available" && "bg-red-50 text-red-700 border-red-200",
                            )}
                          >
                            {analysis.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs bg-transparent"
                            disabled={analysis.status === "Not available"}
                          >
                            {analysis.status === "Needs data" ? "Request Data" : "View"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Required Datasets */}
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Required Datasets</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {lever.analyses
                    .flatMap(a => a.requiredDatasets)
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .map(dataset => {
                      const isAvailable = lever.analyses.some(
                        a => a.requiredDatasets.includes(dataset) && a.status === "Available"
                      )
                      return (
                        <Badge
                          key={dataset}
                          variant="outline"
                          className={cn(
                            "text-xs",
                            isAvailable
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200",
                          )}
                        >
                          {isAvailable && <Check className="h-3 w-3 mr-1" />}
                          {dataset}
                        </Badge>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">AI-Generated Insights</p>
              <Badge variant="secondary" className="text-[10px]">Coming soon</Badge>
            </div>
            <Card className="shadow-none">
              <CardContent className="p-8 text-center">
                <Sparkles className="h-8 w-8 text-primary/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">AI Insights for this lever</p>
                <p className="text-xs text-muted-foreground">
                  Insights will be generated once sufficient data is available for analysis.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
