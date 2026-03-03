"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus, Search, Calendar, DollarSign, Users, ArrowRight, Handshake, X, Check, ChevronsUpDown, Sparkles, MapPin, Package,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type NegotiationWorkspace,
  type NegotiationSupplier,
  STATUS_COLORS,
  formatCurrencyCompact,
  negotiationSuppliers,
  MASTER_CATEGORIES,
  MASTER_REGIONS,
  getSkusForCategoryAndRegions,
  type MasterSKU,
} from "@/lib/negotiations-data"

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface WorkspaceLandingProps {
  workspaces: NegotiationWorkspace[]
  onOpen: (id: string) => void
  onCreate: (ws: {
    name: string
    category: string
    supplierIds: string[]
    regions: string[]
    businessUnits: string[]
    skuGroups: string[]
  }) => void
}

/* ─── Multi-Select Popover (inline, no Popover dependency) ─────────────── */

function MultiSelectDropdown({
  label,
  options,
  selected,
  onToggle,
  onSelectAll,
  onClearAll,
  renderOption,
  searchable = false,
  placeholder = "Select...",
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (val: string) => void
  onSelectAll: () => void
  onClearAll: () => void
  renderOption?: (val: string) => React.ReactNode
  searchable?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = searchable && search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            selected.length === 0 && "text-muted-foreground"
          )}
        >
          <span className="truncate text-xs">
            {selected.length === 0
              ? placeholder
              : selected.length <= 2
                ? selected.join(", ")
                : `${selected.length} selected`}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
            {searchable && (
              <div className="p-2 border-b border-border">
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-7 text-xs"
                  autoFocus
                />
              </div>
            )}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
              <button type="button" onClick={onSelectAll} className="text-[10px] text-primary hover:underline">Select all</button>
              <button type="button" onClick={onClearAll} className="text-[10px] text-muted-foreground hover:underline">Clear</button>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No matches</p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onToggle(opt)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent",
                      selected.includes(opt) && "bg-primary/5"
                    )}
                  >
                    <div className={cn(
                      "h-3.5 w-3.5 rounded-sm border flex items-center justify-center shrink-0",
                      selected.includes(opt) ? "bg-primary border-primary" : "border-muted-foreground/30"
                    )}>
                      {selected.includes(opt) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                    {renderOption ? renderOption(opt) : <span>{opt}</span>}
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-border p-1.5">
              <Button size="sm" variant="outline" className="w-full h-7 text-[10px]" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        )}
      </div>
      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.slice(0, 5).map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px] gap-1 pr-1">
              {s.length > 20 ? s.slice(0, 18) + "..." : s}
              <button type="button" onClick={() => onToggle(s)} className="hover:text-destructive">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          {selected.length > 5 && (
            <Badge variant="outline" className="text-[10px]">+{selected.length - 5} more</Badge>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function WorkspaceLanding({ workspaces, onOpen, onCreate }: WorkspaceLandingProps) {
  const [search, setSearch] = useState("")
  const [showCreate, setShowCreate] = useState(false)

  // Step 1 form
  const [newName, setNewName] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedSkus, setSelectedSkus] = useState<string[]>([])
  const [skuSearch, setSkuSearch] = useState("")

  // Step 2 suppliers
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([])
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1)

  // Derived SKU options
  const availableSkus = useMemo(
    () => newCategory ? getSkusForCategoryAndRegions(newCategory, selectedRegions) : [],
    [newCategory, selectedRegions]
  )

  const skuOptionStrings = useMemo(
    () => availableSkus.map((s) => `${s.name} (${s.code})`),
    [availableSkus]
  )

  // Filtered supplier list based on selected category
  const filteredSuppliers = useMemo(
    () => newCategory
      ? negotiationSuppliers.filter((s) => s.category === newCategory)
      : negotiationSuppliers,
    [newCategory]
  )

  // Validation
  const step1Valid = newName.trim().length > 0 && newCategory.length > 0 && selectedRegions.length > 0 && selectedSkus.length > 0

  const filtered = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(search.toLowerCase()) ||
    ws.category.toLowerCase().includes(search.toLowerCase())
  )

  const totalSpend = workspaces.reduce((sum, ws) =>
    sum + ws.supplierIds.reduce((s, sid) => {
      const sup = negotiationSuppliers.find((n) => n.id === sid)
      return s + (sup?.annualSpend ?? 0)
    }, 0), 0)

  const liveCount = workspaces.filter((ws) => ws.status === "live").length
  const inProgressCount = workspaces.filter((ws) => ws.status === "in-progress").length

  const toggleRegion = (r: string) => setSelectedRegions((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])
  const toggleSku = (s: string) => setSelectedSkus((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  const toggleSupplier = (id: string) => setSelectedSupplierIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  // Reset SKUs when category changes
  const handleCategoryChange = (cat: string) => {
    setNewCategory(cat)
    setSelectedSkus([])
  }

  const resetForm = () => {
    setCreateStep(1)
    setNewName("")
    setNewCategory("")
    setSelectedRegions([])
    setSelectedSkus([])
    setSelectedSupplierIds([])
  }

  const handleCreate = () => {
    if (!step1Valid) return
    onCreate({
      name: newName,
      category: newCategory,
      supplierIds: selectedSupplierIds,
      regions: selectedRegions,
      businessUnits: [],
      skuGroups: selectedSkus,
    })
    setShowCreate(false)
    resetForm()
  }

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Strategies", value: String(workspaces.length) },
          { label: "Live Rounds", value: String(liveCount) },
          { label: "In Progress", value: String(inProgressCount) },
          { label: "Spend Under Negotiation", value: formatCurrencyCompact(totalSpend) },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="py-3 px-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search strategies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Negotiation Strategy
        </Button>
      </div>

      {/* Workspace cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Handshake className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No negotiation strategies yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first strategy to get started.</p>
              <Button size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Strategy
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((ws) => {
            const suppliers = ws.supplierIds.map((sid) => negotiationSuppliers.find((s) => s.id === sid)).filter(Boolean) as NegotiationSupplier[]
            const spend = suppliers.reduce((s, sup) => s + sup.annualSpend, 0)
            const sc = STATUS_COLORS[ws.status]
            const completedSections = [ws.factSections.length > 0, ws.spectrumPlacements.length > 0, ws.levers.length > 0, ws.objectives.length > 0, ws.arguments.length > 0, ws.rounds.length > 0].filter(Boolean).length
            const progress = Math.round((completedSections / 6) * 100)

            return (
              <Card key={ws.id} className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group" onClick={() => onOpen(ws.id)}>
                <CardHeader className="pb-2 pt-4 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{ws.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{ws.category}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] shrink-0", sc.bg, sc.text)}>
                      {sc.label}{ws.status === "live" && ws.liveRound ? ` (Round ${ws.liveRound})` : ""}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-4 pt-0">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{suppliers.map((s) => s.name).join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatCurrencyCompact(spend)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{ws.lastModified}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{progress}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-muted-foreground">Created by {ws.createdBy}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── Creation Dialog ──────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) resetForm() }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Negotiation Strategy</DialogTitle>
            <DialogDescription>
              {createStep === 1
                ? "Define the strategy scope: name, category, regions, and SKUs."
                : createStep === 2
                  ? "Select suppliers to include in this negotiation."
                  : "Review your strategy scope and confirm to auto-generate all downstream sections."}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-2 pb-1">
            {([
              { num: 1, label: "Scope" },
              { num: 2, label: "Suppliers" },
              { num: 3, label: "Review" },
            ] as const).map(({ num, label }) => (
              <div key={num} className="flex items-center gap-1.5">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                  createStep >= num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {createStep > num ? <Check className="h-3 w-3" /> : num}
                </div>
                <span className="text-[10px] text-muted-foreground">{label}</span>
                {num < 3 && <div className={cn("w-8 h-px", createStep > num ? "bg-primary" : "bg-border")} />}
              </div>
            ))}
          </div>

          {createStep === 1 && (
            <div className="space-y-4 py-1">
              {/* Strategy Name */}
              <div className="space-y-1.5">
                <Label htmlFor="ws-name" className="text-xs font-medium">
                  Strategy Name <span className="text-destructive">*</span>
                </Label>
                <Input id="ws-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Alpha Plastics Q3 2026 Renewal" className="h-9 text-sm" />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Category Scope <span className="text-destructive">*</span>
                </Label>
                <Select value={newCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {MASTER_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-sm">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Regions multi-select */}
              <MultiSelectDropdown
                label={`Region *`}
                options={[...MASTER_REGIONS]}
                selected={selectedRegions}
                onToggle={toggleRegion}
                onSelectAll={() => setSelectedRegions([...MASTER_REGIONS])}
                onClearAll={() => setSelectedRegions([])}
                placeholder="Select regions"
              />

              {/* SKU multi-select with search */}
              <MultiSelectDropdown
                label={`SKU Scope *${!newCategory ? " (select category first)" : ""}`}
                options={skuOptionStrings}
                selected={selectedSkus}
                onToggle={toggleSku}
                onSelectAll={() => setSelectedSkus([...skuOptionStrings])}
                onClearAll={() => setSelectedSkus([])}
                searchable
                placeholder={newCategory ? "Search and select SKUs..." : "Select a category first"}
                renderOption={(opt) => {
                  const parts = opt.match(/^(.+)\s\(([^)]+)\)$/)
                  return parts ? (
                    <span className="flex items-center gap-1.5">
                      <span>{parts[1]}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{parts[2]}</span>
                    </span>
                  ) : <span>{opt}</span>
                }}
              />

              {/* Validation message */}
              {!step1Valid && newName.trim().length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  All fields marked with * are required. Select at least one region and one SKU.
                </p>
              )}
            </div>
          )}

          {createStep === 2 && (
            <div className="space-y-3 py-1">
              <p className="text-xs text-muted-foreground">
                {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? "s" : ""} in {newCategory || "all categories"}
              </p>
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {filteredSuppliers.map((sup) => (
                  <label
                    key={sup.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
                      selectedSupplierIds.includes(sup.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    )}
                  >
                    <Checkbox checked={selectedSupplierIds.includes(sup.id)} onCheckedChange={() => toggleSupplier(sup.id)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{sup.name}</p>
                      <p className="text-xs text-muted-foreground">{sup.category} &middot; {sup.country}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-2.5 w-2.5" />Spend: {formatCurrencyCompact(sup.annualSpend)}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />Contract ends: {sup.contractEnd}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{sup.segment}</Badge>
                  </label>
                ))}
                {filteredSuppliers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground">No suppliers found for this category.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review & Create */}
          {createStep === 3 && (
            <div className="space-y-4 py-1">
              {/* Scope summary */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strategy Scope</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{newName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Category</p>
                    <p className="text-sm font-medium">{newCategory}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />Regions</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRegions.map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Package className="h-2.5 w-2.5" />SKUs ({selectedSkus.length})</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedSkus.slice(0, 6).map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s.length > 25 ? s.slice(0, 23) + "..." : s}</Badge>
                    ))}
                    {selectedSkus.length > 6 && (
                      <Badge variant="outline" className="text-[10px]">+{selectedSkus.length - 6} more</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Suppliers summary */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Suppliers ({selectedSupplierIds.length})
                </h4>
                <div className="space-y-2">
                  {selectedSupplierIds.map((sid) => {
                    const sup = negotiationSuppliers.find((s) => s.id === sid)
                    if (!sup) return null
                    return (
                      <div key={sid} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{sup.name}</span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatCurrencyCompact(sup.annualSpend)}</span>
                          <span>Ends {sup.contractEnd}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
                  <span className="text-muted-foreground">Total spend in scope</span>
                  <span className="font-semibold">
                    {formatCurrencyCompact(
                      selectedSupplierIds.reduce((sum, sid) => {
                        const sup = negotiationSuppliers.find((s) => s.id === sid)
                        return sum + (sup?.annualSpend ?? 0)
                      }, 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Auto-generation notice */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground">Auto-generation on create</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                    The system will automatically populate: Fact Base (spend trends, price-volume, SLA, contracts),
                    Market Overview (growth indices, supplier overlays), Supplier Matrix (AI-scored placements with reasoning),
                    and Lever Recommendations (top 2-3 per supplier with rationale).
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {createStep > 1 && (
              <Button variant="outline" size="sm" onClick={() => setCreateStep((createStep - 1) as 1 | 2 | 3)}>Back</Button>
            )}
            {createStep === 1 ? (
              <Button size="sm" onClick={() => setCreateStep(2)} disabled={!step1Valid}>
                Next: Select Suppliers
              </Button>
            ) : createStep === 2 ? (
              <Button size="sm" onClick={() => setCreateStep(3)} disabled={selectedSupplierIds.length === 0}>
                Next: Review
              </Button>
            ) : (
              <Button size="sm" onClick={handleCreate}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Create Strategy
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
