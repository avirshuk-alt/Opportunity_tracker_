"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertTriangle,
  Shield,
  MapPin,
  Activity,
  FileWarning,
  Search,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fleetSuppliers,
  SUPPLIER_TYPE_COLORS,
  formatCurrencyShort,
  upstreamDependencies,
  type FleetSupplier,
  type UpstreamDependency,
  type SupplierType,
} from "@/lib/supplier-strategy-data"

// ─── Derived Types ──────────────────────────────────────────────────────────

interface GraphNode {
  id: string
  name: string
  tier: 1 | 2 | 3
  category: SupplierType | "Component" | "Sub-tier"
  spend: number
  regions: string[]
  riskScore: number
  riskCount: number
  oppCount: number
  parentId: string | null
  x: number
  y: number
  supplier?: FleetSupplier
  upstream?: UpstreamDependency
}

interface GraphEdge {
  id: string
  sourceId: string
  targetId: string
  strength: "high" | "medium" | "low"
  riskDrivers: string[]
  label: string
}

interface LedgerRow {
  id: string
  type: "risk" | "opportunity"
  nodeId: string
  nodeName: string
  tier: 1 | 2 | 3
  category: string
  description: string
  severity: "High" | "Medium" | "Low"
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function riskFlagsFromUpstream(d: UpstreamDependency): string[] {
  const flags: string[] = []
  if (d.concentration === "High") flags.push("single-source")
  const geo = d.geoExposure.toLowerCase()
  if (geo.includes("china") || geo.includes("korea")) flags.push("geo-concentration")
  if (d.leadTimeSensitivity === "High") flags.push("capacity-constraint")
  const n = d.notes.toLowerCase()
  if (n.includes("regulat") || n.includes("tariff") || n.includes("privacy") || n.includes("gdpr")) flags.push("regulatory")
  return flags
}

const riskFlagMeta: Record<string, { label: string; icon: typeof AlertTriangle; color: string }> = {
  "geo-concentration": { label: "Geo Concentration", icon: MapPin, color: "text-amber-600" },
  "single-source": { label: "Single Source", icon: AlertTriangle, color: "text-red-600" },
  "capacity-constraint": { label: "Capacity Constraint", icon: Activity, color: "text-orange-600" },
  "regulatory": { label: "Regulatory Risk", icon: FileWarning, color: "text-violet-600" },
}

const TIER_COLORS: Record<number, { bg: string; stroke: string; text: string; fill: string }> = {
  1: { bg: "hsl(22, 92%, 52%)", stroke: "hsl(22, 92%, 45%)", text: "#fff", fill: "hsla(22,92%,52%,0.08)" },
  2: { bg: "hsl(210, 70%, 50%)", stroke: "hsl(210, 70%, 42%)", text: "#fff", fill: "hsla(210,70%,50%,0.06)" },
  3: { bg: "hsl(220, 14%, 50%)", stroke: "hsl(220, 14%, 40%)", text: "#fff", fill: "hsla(220,14%,50%,0.05)" },
}

const ALL_REGIONS = Array.from(new Set(fleetSuppliers.flatMap((s) => s.regions))).sort()
const ALL_CATEGORIES = Array.from(new Set(fleetSuppliers.map((s) => s.type))).sort() as SupplierType[]

// ─── Main Component ─────────────────────────────────────────────────────────

export function SupplierNetworkTab() {
  // Filters
  const [tierDepth, setTierDepth] = useState<"all" | "1" | "2" | "3">("all")
  const [categoryFilter, setCategoryFilter] = useState<SupplierType | "all">("all")
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [riskThreshold, setRiskThreshold] = useState<number>(0)
  const [showRisks, setShowRisks] = useState(true)
  const [showOpps, setShowOpps] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // UI State
  const [expandedTier1, setExpandedTier1] = useState<Set<string>>(new Set(fleetSuppliers.filter((s) => s.tier === 1).map((s) => s.id)))
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null)
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null)
  const [ledgerOpen, setLedgerOpen] = useState(true)
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)

  // ─── Build Graph ──────────────────────────────────────────────────────────

  const { nodes, edges, ledger, hotspots } = useMemo(() => {
    const tier1Suppliers = fleetSuppliers.filter((s) => s.tier === 1)
    const graphNodes: GraphNode[] = []
    const graphEdges: GraphEdge[] = []
    const ledgerRows: LedgerRow[] = []

    const CANVAS_W = 1200
    const T1_X = 140
    const T2_X = 480
    const T3_X = 780
    const Y_START = 60
    const Y_GAP = 90

    let yIdx = 0

    tier1Suppliers.forEach((s) => {
      const deps = upstreamDependencies.filter((d) => d.parentId === s.id)
      const depsRiskFlags = deps.flatMap(riskFlagsFromUpstream)
      const isExpanded = expandedTier1.has(s.id)

      const node: GraphNode = {
        id: s.id,
        name: s.name,
        tier: 1,
        category: s.type,
        spend: s.annualSpend,
        regions: s.regions,
        riskScore: s.riskScore,
        riskCount: s.keyRisks.length + depsRiskFlags.length,
        oppCount: s.keyOpportunities.length,
        parentId: null,
        x: T1_X,
        y: Y_START + yIdx * Y_GAP,
        supplier: s,
      }
      graphNodes.push(node)

      // Ledger entries for T1
      s.keyRisks.forEach((r, i) => {
        ledgerRows.push({ id: `${s.id}-risk-${i}`, type: "risk", nodeId: s.id, nodeName: s.name, tier: 1, category: s.type, description: r, severity: s.riskScore >= 35 ? "High" : s.riskScore >= 20 ? "Medium" : "Low" })
      })
      s.keyOpportunities.forEach((o, i) => {
        ledgerRows.push({ id: `${s.id}-opp-${i}`, type: "opportunity", nodeId: s.id, nodeName: s.name, tier: 1, category: s.type, description: o, severity: "Medium" })
      })

      if (isExpanded) {
        let subIdx = 0
        deps.forEach((dep) => {
          const flags = riskFlagsFromUpstream(dep)
          const isTier3 = dep.dependencyType === "Subcontractor" || dep.dependencyType === "Parts distributor"
          const tier = isTier3 ? 3 : 2
          const depX = tier === 2 ? T2_X : T3_X
          const depY = Y_START + yIdx * Y_GAP + subIdx * 55

          const depNode: GraphNode = {
            id: dep.id,
            name: dep.name,
            tier,
            category: "Sub-tier",
            spend: 0,
            regions: [dep.geoExposure],
            riskScore: dep.impact === "High" ? 70 : dep.impact === "Medium" ? 40 : 15,
            riskCount: flags.length,
            oppCount: 0,
            parentId: s.id,
            x: depX,
            y: depY,
            upstream: dep,
          }
          graphNodes.push(depNode)

          const strength = dep.concentration === "High" ? "high" : dep.concentration === "Medium" ? "medium" : "low"
          graphEdges.push({
            id: `edge-${s.id}-${dep.id}`,
            sourceId: s.id,
            targetId: dep.id,
            strength,
            riskDrivers: flags,
            label: `${dep.dependencyType} | ${dep.concentration} conc.`,
          })

          // Ledger entries for sub-tier
          flags.forEach((f, fi) => {
            const meta = riskFlagMeta[f]
            ledgerRows.push({ id: `${dep.id}-rflag-${fi}`, type: "risk", nodeId: dep.id, nodeName: dep.name, tier, category: dep.dependencyType, description: `${meta?.label ?? f}: ${dep.notes.split(".")[0]}`, severity: dep.impact as "High" | "Medium" | "Low" })
          })
          dep.mitigations.forEach((m, mi) => {
            ledgerRows.push({ id: `${dep.id}-mit-${mi}`, type: "opportunity", nodeId: dep.id, nodeName: dep.name, tier, category: dep.dependencyType, description: m, severity: "Low" })
          })

          subIdx++
        })
        yIdx += Math.max(1, deps.length)
      } else {
        yIdx++
      }
    })

    // Scale nodes so canvas is used well
    const maxY = Math.max(...graphNodes.map((n) => n.y), 400)
    const scale = Math.min(1, 600 / maxY)
    graphNodes.forEach((n) => { n.y = n.y * scale + 20 })

    // Hotspots: T1 suppliers with cumulative risk >= 3 across their tree
    const hs = tier1Suppliers
      .map((s) => {
        const deps = upstreamDependencies.filter((d) => d.parentId === s.id)
        const totalRisk = s.keyRisks.length + deps.flatMap(riskFlagsFromUpstream).length
        return { supplierId: s.id, supplierName: s.name, cumulativeRisk: totalRisk }
      })
      .filter((h) => h.cumulativeRisk >= 3)

    return { nodes: graphNodes, edges: graphEdges, ledger: ledgerRows, hotspots: hs }
  }, [expandedTier1])

  // ─── Filtering ────────────────────────────────────────────────────────────

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (tierDepth !== "all" && n.tier > parseInt(tierDepth)) return false
      if (categoryFilter !== "all" && n.tier === 1 && n.category !== categoryFilter) return false
      if (regionFilter !== "all" && !n.regions.some((r) => r.includes(regionFilter))) return false
      if (n.riskScore < riskThreshold) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!n.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [nodes, tierDepth, categoryFilter, regionFilter, riskThreshold, searchQuery])

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes])

  const filteredEdges = useMemo(() => {
    return edges.filter((e) => filteredNodeIds.has(e.sourceId) && filteredNodeIds.has(e.targetId))
  }, [edges, filteredNodeIds])

  const filteredLedger = useMemo(() => {
    let rows = ledger.filter((r) => filteredNodeIds.has(r.nodeId))
    if (!showRisks) rows = rows.filter((r) => r.type !== "risk")
    if (!showOpps) rows = rows.filter((r) => r.type !== "opportunity")
    return rows
  }, [ledger, filteredNodeIds, showRisks, showOpps])

  // ─── Drawer State ─────────────────────────────────────────────────────────

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) ?? null, [nodes, selectedNodeId])

  const toggleExpand = useCallback((id: string) => {
    setExpandedTier1((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // ─── Canvas Dimensions ────────────────────────────────────────────────────

  const canvasHeight = useMemo(() => {
    if (filteredNodes.length === 0) return 400
    return Math.max(400, Math.max(...filteredNodes.map((n) => n.y)) + 80)
  }, [filteredNodes])

  const svgWidth = 900

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Filter Bar */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 w-48 text-xs"
              />
            </div>

            <Select value={tierDepth} onValueChange={(v) => setTierDepth(v as typeof tierDepth)}>
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue placeholder="Tier Depth" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="1">Tier 1 Only</SelectItem>
                <SelectItem value="2">Tier 1-2</SelectItem>
                <SelectItem value="3">Tier 1-3</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ALL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {ALL_REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(riskThreshold)} onValueChange={(v) => setRiskThreshold(parseInt(v))}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="Risk Threshold" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Risk Levels</SelectItem>
                <SelectItem value="20">Risk &ge; 20</SelectItem>
                <SelectItem value="30">Risk &ge; 30</SelectItem>
                <SelectItem value="40">Risk &ge; 40</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5 ml-auto">
              <Button
                size="sm"
                variant={showRisks ? "default" : "outline"}
                className="h-7 text-[10px] gap-1"
                onClick={() => setShowRisks(!showRisks)}
              >
                <AlertTriangle className="h-3 w-3" />
                Risks
              </Button>
              <Button
                size="sm"
                variant={showOpps ? "default" : "outline"}
                className="h-7 text-[10px] gap-1"
                onClick={() => setShowOpps(!showOpps)}
              >
                <Lightbulb className="h-3 w-3" />
                Opportunities
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph Canvas + Ledger */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-3">
        {/* Graph Canvas */}
        <Card className="overflow-hidden">
          <CardHeader className="py-2.5 px-4 flex-row items-center justify-between border-b">
            <div>
              <CardTitle className="text-sm">Supply Network Graph</CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">Click nodes for details. Click edges for relationship info. Double-click Tier 1 to expand/collapse.</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.min(zoom + 0.15, 2))}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.max(zoom - 0.15, 0.5))}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(1)}>
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={canvasRef}
              className="overflow-auto relative"
              style={{ height: Math.min(canvasHeight * zoom + 40, 560) }}
            >
              {/* Tier lane labels */}
              <div className="absolute top-2 left-0 right-0 flex pointer-events-none" style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
                <div className="text-[9px] font-bold uppercase tracking-widest text-primary/60 ml-[80px]">Tier 1</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-sky-500/60 ml-[270px]">Tier 2</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-[230px]">Tier 3</div>
              </div>

              <svg
                width={svgWidth * zoom}
                height={canvasHeight * zoom}
                viewBox={`0 0 ${svgWidth} ${canvasHeight}`}
                className="mt-2"
              >
                {/* Tier lane lines */}
                <line x1={340} y1={0} x2={340} y2={canvasHeight} stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
                <line x1={640} y1={0} x2={640} y2={canvasHeight} stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4 4" opacity={0.3} />

                {/* Hotspot overlays */}
                {hotspots.map((hs) => {
                  const n = filteredNodes.find((fn) => fn.id === hs.supplierId)
                  if (!n) return null
                  const childNodes = filteredNodes.filter((fn) => fn.parentId === hs.supplierId)
                  const allY = [n.y, ...childNodes.map((c) => c.y)]
                  const minY = Math.min(...allY) - 30
                  const maxY = Math.max(...allY) + 30
                  const maxX = childNodes.length > 0 ? Math.max(...childNodes.map((c) => c.x)) + 90 : n.x + 90
                  return (
                    <rect
                      key={`hs-${hs.supplierId}`}
                      x={n.x - 80}
                      y={minY}
                      width={maxX - n.x + 160}
                      height={maxY - minY}
                      rx={8}
                      fill="hsla(0, 80%, 60%, 0.04)"
                      stroke="hsla(0, 80%, 60%, 0.15)"
                      strokeWidth={1}
                      strokeDasharray="6 3"
                    />
                  )
                })}

                {/* Edges */}
                {filteredEdges.map((edge) => {
                  const source = filteredNodes.find((n) => n.id === edge.sourceId)
                  const target = filteredNodes.find((n) => n.id === edge.targetId)
                  if (!source || !target) return null

                  const isHighlighted = highlightedNodeId === edge.sourceId || highlightedNodeId === edge.targetId
                  const hasRisk = edge.riskDrivers.length > 0
                  const strokeW = edge.strength === "high" ? 2.5 : edge.strength === "medium" ? 1.5 : 1
                  const strokeColor = hasRisk
                    ? (edge.strength === "high" ? "hsl(0, 62%, 48%)" : "hsl(36, 82%, 54%)")
                    : "hsl(var(--border))"

                  const sx = source.x + 70
                  const sy = source.y
                  const tx = target.x - 70
                  const ty = target.y
                  const mx = (sx + tx) / 2

                  return (
                    <g key={edge.id}>
                      <path
                        d={`M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isHighlighted ? strokeW + 1 : strokeW}
                        strokeDasharray={edge.strength === "low" ? "4 3" : undefined}
                        opacity={isHighlighted ? 1 : 0.5}
                        className="transition-opacity cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setSelectedEdge(edge); setSelectedNodeId(null) }}
                      />
                      {hasRisk && (
                        <circle
                          cx={mx}
                          cy={(sy + ty) / 2}
                          r={7}
                          fill="hsl(0, 62%, 48%)"
                          opacity={0.8}
                          className="cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); setSelectedEdge(edge); setSelectedNodeId(null) }}
                        />
                      )}
                      {hasRisk && (
                        <text
                          x={mx}
                          y={(sy + ty) / 2 + 3.5}
                          textAnchor="middle"
                          fill="#fff"
                          fontSize={8}
                          fontWeight={700}
                          className="pointer-events-none"
                        >
                          {edge.riskDrivers.length}
                        </text>
                      )}
                    </g>
                  )
                })}

                {/* Nodes */}
                {filteredNodes.map((node) => {
                  const tierColor = TIER_COLORS[node.tier]
                  const isSelected = selectedNodeId === node.id
                  const isHighlighted = highlightedNodeId === node.id
                  const isExpanded = node.tier === 1 && expandedTier1.has(node.id)
                  const nodeW = 140
                  const nodeH = 48

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer"
                      onClick={() => { setSelectedNodeId(node.id); setSelectedEdge(null) }}
                      onDoubleClick={() => { if (node.tier === 1) toggleExpand(node.id) }}
                      onMouseEnter={() => setHighlightedNodeId(node.id)}
                      onMouseLeave={() => setHighlightedNodeId(null)}
                    >
                      {/* Node background */}
                      <rect
                        x={node.x - nodeW / 2}
                        y={node.y - nodeH / 2}
                        width={nodeW}
                        height={nodeH}
                        rx={8}
                        fill={isSelected || isHighlighted ? tierColor.fill : "hsl(var(--card))"}
                        stroke={isSelected ? tierColor.bg : "hsl(var(--border))"}
                        strokeWidth={isSelected ? 2 : 1}
                        className="transition-all"
                      />

                      {/* Tier badge */}
                      <rect x={node.x - nodeW / 2 + 6} y={node.y - 14} width={22} height={16} rx={4} fill={tierColor.bg} />
                      <text x={node.x - nodeW / 2 + 17} y={node.y - 3} textAnchor="middle" fill={tierColor.text} fontSize={8} fontWeight={700}>
                        T{node.tier}
                      </text>

                      {/* Name */}
                      <text
                        x={node.x - nodeW / 2 + 34}
                        y={node.y - 2}
                        fill="hsl(var(--foreground))"
                        fontSize={10}
                        fontWeight={600}
                        className="pointer-events-none"
                      >
                        {node.name.length > 16 ? node.name.slice(0, 15) + "\u2026" : node.name}
                      </text>

                      {/* Bottom row: spend + region */}
                      <text x={node.x - nodeW / 2 + 8} y={node.y + 15} fill="hsl(var(--muted-foreground))" fontSize={8}>
                        {node.spend > 0 ? formatCurrencyShort(node.spend) : node.regions[0]?.split("/")[0]?.trim() ?? ""}
                        {node.spend > 0 && node.regions.length > 0 ? ` \u00B7 ${node.regions[0]}` : ""}
                      </text>

                      {/* Risk badge */}
                      {node.riskCount > 0 && showRisks && (
                        <>
                          <circle cx={node.x + nodeW / 2 - 22} cy={node.y - 10} r={8} fill="hsl(0, 62%, 48%)" opacity={0.9} />
                          <text x={node.x + nodeW / 2 - 22} y={node.y - 7} textAnchor="middle" fill="#fff" fontSize={8} fontWeight={700}>
                            {node.riskCount}
                          </text>
                        </>
                      )}

                      {/* Opp badge */}
                      {node.oppCount > 0 && showOpps && (
                        <>
                          <circle cx={node.x + nodeW / 2 - 8} cy={node.y - 10} r={8} fill="hsl(150, 50%, 40%)" opacity={0.9} />
                          <text x={node.x + nodeW / 2 - 8} y={node.y - 7} textAnchor="middle" fill="#fff" fontSize={8} fontWeight={700}>
                            {node.oppCount}
                          </text>
                        </>
                      )}

                      {/* Expand/collapse indicator for T1 */}
                      {node.tier === 1 && (
                        <text x={node.x + nodeW / 2 - 10} y={node.y + 16} fill="hsl(var(--muted-foreground))" fontSize={9}>
                          {isExpanded ? "\u25BC" : "\u25B6"}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-4 py-2 border-t bg-muted/20 text-[9px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: TIER_COLORS[1].bg }} />
                <span>Tier 1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: TIER_COLORS[2].bg }} />
                <span>Tier 2</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ background: TIER_COLORS[3].bg }} />
                <span>Tier 3</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                <span>Risk count</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: "hsl(150,50%,40%)" }} />
                <span>Opportunity count</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="h-px w-4 bg-destructive" style={{ borderBottom: "2px solid hsl(0,62%,48%)" }} />
                <span>High-risk link</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-px w-4 border-b border-dashed border-muted-foreground" />
                <span>Low-dep link</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded border border-dashed border-red-300 bg-red-50/50" />
                <span>Hotspot cluster</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk & Opportunity Ledger */}
        <Card className="overflow-hidden">
          <CardHeader className="py-2.5 px-4 flex-row items-center justify-between border-b cursor-pointer" onClick={() => setLedgerOpen(!ledgerOpen)}>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Risk & Opportunity Ledger</CardTitle>
              <Badge variant="outline" className="text-[9px]">{filteredLedger.length}</Badge>
            </div>
            {ledgerOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          {ledgerOpen && (
            <ScrollArea className="h-[480px]">
              <div className="divide-y">
                {filteredLedger.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground">No items match current filters</div>
                )}
                {filteredLedger.map((row) => (
                  <button
                    key={row.id}
                    className={cn(
                      "w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors",
                      highlightedNodeId === row.nodeId && "bg-primary/[0.04]",
                    )}
                    onClick={() => {
                      setHighlightedNodeId(row.nodeId)
                      setSelectedNodeId(row.nodeId)
                      setSelectedEdge(null)
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "mt-0.5 h-1.5 w-1.5 rounded-full shrink-0",
                        row.type === "risk" ? "bg-destructive" : "bg-emerald-500",
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium text-foreground truncate">{row.nodeName}</span>
                          <Badge variant="outline" className="text-[8px] shrink-0">T{row.tier}</Badge>
                          {row.type === "risk" && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[8px] shrink-0",
                                row.severity === "High" ? "bg-red-50 text-red-700 border-red-200" : row.severity === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-muted text-muted-foreground",
                              )}
                            >
                              {row.severity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{row.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>

      {/* Node Drawer */}
      <Sheet open={!!selectedNode && !selectedEdge} onOpenChange={() => setSelectedNodeId(null)}>
        <SheetContent className="sm:max-w-lg">
          {selectedNode && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-base">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold shrink-0"
                    style={{ backgroundColor: TIER_COLORS[selectedNode.tier].bg, color: TIER_COLORS[selectedNode.tier].text }}
                  >
                    T{selectedNode.tier}
                  </div>
                  {selectedNode.name}
                </SheetTitle>
                <SheetDescription>
                  {selectedNode.supplier
                    ? `${selectedNode.supplier.type} | ${selectedNode.regions.join(", ")} | ${formatCurrencyShort(selectedNode.spend)}`
                    : `${selectedNode.upstream?.dependencyType ?? "Sub-tier"} | ${selectedNode.regions.join(", ")}`}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-140px)] pr-4 mt-4">
                <div className="space-y-5">
                  {/* Summary */}
                  {selectedNode.supplier && (
                    <div>
                      <p className="text-xs font-semibold mb-2">Role in Ecosystem</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{selectedNode.supplier.roleInEcosystem}</p>
                    </div>
                  )}
                  {selectedNode.upstream && (
                    <div>
                      <p className="text-xs font-semibold mb-2">Dependency Details</p>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
                            <p className="text-[9px] text-muted-foreground">Type</p>
                            <p className="font-medium">{selectedNode.upstream.dependencyType}</p>
                          </div>
                          <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
                            <p className="text-[9px] text-muted-foreground">Concentration</p>
                            <p className="font-medium">{selectedNode.upstream.concentration}</p>
                          </div>
                          <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
                            <p className="text-[9px] text-muted-foreground">Geo Exposure</p>
                            <p className="font-medium">{selectedNode.upstream.geoExposure}</p>
                          </div>
                          <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
                            <p className="text-[9px] text-muted-foreground">Impact</p>
                            <p className="font-medium">{selectedNode.upstream.impact}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{selectedNode.upstream.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Risk Cards */}
                  {selectedNode.supplier && selectedNode.supplier.keyRisks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        Risks ({selectedNode.supplier.keyRisks.length})
                      </p>
                      <div className="space-y-1.5">
                        {selectedNode.supplier.keyRisks.map((risk, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-md border border-red-100 bg-red-50/50 px-3 py-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                            <p className="text-xs text-foreground">{risk}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk flags for sub-tier */}
                  {selectedNode.upstream && (
                    <div>
                      <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        Risk Flags
                      </p>
                      {riskFlagsFromUpstream(selectedNode.upstream).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No elevated risk flags</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {riskFlagsFromUpstream(selectedNode.upstream).map((flag) => {
                            const meta = riskFlagMeta[flag]
                            if (!meta) return null
                            const FlagIcon = meta.icon
                            return (
                              <Badge key={flag} variant="outline" className={cn("text-[10px] gap-1", meta.color)}>
                                <FlagIcon className="h-3 w-3" />
                                {meta.label}
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Opportunity Cards */}
                  {selectedNode.supplier && selectedNode.supplier.keyOpportunities.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-emerald-600" />
                        Opportunities ({selectedNode.supplier.keyOpportunities.length})
                      </p>
                      <div className="space-y-1.5">
                        {selectedNode.supplier.keyOpportunities.map((opp, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-md border border-emerald-100 bg-emerald-50/50 px-3 py-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <p className="text-xs text-foreground">{opp}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mitigations for sub-tier */}
                  {selectedNode.upstream && selectedNode.upstream.mitigations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                        Mitigations
                      </p>
                      <div className="space-y-1.5">
                        {selectedNode.upstream.mitigations.map((m, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2">
                            <span className="text-primary text-xs font-semibold shrink-0">{i + 1}.</span>
                            <p className="text-xs text-foreground">{m}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button size="sm" variant="outline" className="w-full bg-transparent" onClick={() => setSelectedNodeId(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edge Drawer */}
      <Sheet open={!!selectedEdge} onOpenChange={() => setSelectedEdge(null)}>
        <SheetContent className="sm:max-w-md">
          {selectedEdge && (() => {
            const source = nodes.find((n) => n.id === selectedEdge.sourceId)
            const target = nodes.find((n) => n.id === selectedEdge.targetId)
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-base">
                    <Link2 className="h-4 w-4" />
                    Relationship Details
                  </SheetTitle>
                  <SheetDescription>
                    {source?.name ?? "?"} &rarr; {target?.name ?? "?"}
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-140px)] pr-4 mt-4">
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md bg-muted/50 px-2.5 py-2">
                        <p className="text-[9px] text-muted-foreground">Dependency Strength</p>
                        <p className="font-semibold capitalize">{selectedEdge.strength}</p>
                      </div>
                      <div className="rounded-md bg-muted/50 px-2.5 py-2">
                        <p className="text-[9px] text-muted-foreground">Risk Drivers</p>
                        <p className="font-semibold">{selectedEdge.riskDrivers.length}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold mb-1">Relationship</p>
                      <p className="text-xs text-muted-foreground">{selectedEdge.label}</p>
                    </div>

                    {selectedEdge.riskDrivers.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2">Risk Drivers</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedEdge.riskDrivers.map((flag) => {
                            const meta = riskFlagMeta[flag]
                            if (!meta) return null
                            const FlagIcon = meta.icon
                            return (
                              <Badge key={flag} variant="outline" className={cn("text-[10px] gap-1", meta.color)}>
                                <FlagIcon className="h-3 w-3" />
                                {meta.label}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {target?.upstream && (
                      <div>
                        <p className="text-xs font-semibold mb-2">Mitigations</p>
                        <div className="space-y-1.5">
                          {target.upstream.mitigations.map((m, i) => (
                            <div key={i} className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2">
                              <span className="text-primary text-xs font-semibold shrink-0">{i + 1}.</span>
                              <p className="text-xs text-foreground">{m}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button size="sm" variant="outline" className="w-full bg-transparent" onClick={() => setSelectedEdge(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>
    </div>
  )
}
