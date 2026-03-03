"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { OrgNode } from "@/lib/strategic-objectives-data"

interface OrgTreeProps {
  root: OrgNode
  selectedIds: Set<string>
  onToggle: (id: string) => void
}

// ─── Constants ───────────────────────────────────────────────────
const NODE_W = 172
const NODE_H = 68
const H_GAP = 20
const V_GAP = 52
const PADDING = 80

// ─── Layout algorithm ────────────────────────────────────────────
interface LayoutNode {
  node: OrgNode
  x: number
  y: number
  subtreeWidth: number
  children: LayoutNode[]
}

function layoutTree(node: OrgNode, depth: number): LayoutNode {
  const kids = (node.children || []).map((c) => layoutTree(c, depth + 1))
  if (kids.length === 0) {
    return { node, x: 0, y: depth * (NODE_H + V_GAP), subtreeWidth: NODE_W, children: [] }
  }
  const totalChildrenWidth =
    kids.reduce((s, k) => s + k.subtreeWidth, 0) + (kids.length - 1) * H_GAP
  let offsetX = 0
  for (const kid of kids) {
    kid.x = offsetX + kid.subtreeWidth / 2 - NODE_W / 2
    offsetX += kid.subtreeWidth + H_GAP
  }
  const firstCenter = kids[0].x + NODE_W / 2
  const lastCenter = kids[kids.length - 1].x + NODE_W / 2
  const parentX = (firstCenter + lastCenter) / 2 - NODE_W / 2
  for (const kid of kids) {
    kid.x -= parentX
  }
  return {
    node,
    x: 0,
    y: depth * (NODE_H + V_GAP),
    subtreeWidth: Math.max(NODE_W, totalChildrenWidth),
    children: kids,
  }
}

// ─── Flatten to absolute positions ───────────────────────────────
interface FlatNode {
  node: OrgNode
  absX: number
  absY: number
  parentCenterX?: number
  parentBottomY?: number
}

function flattenLayout(
  layout: LayoutNode,
  offsetX: number,
  paddingY: number,
  parent?: { cx: number; by: number },
): FlatNode[] {
  const absX = offsetX + layout.x
  // layout.y is absolute (depth * row height), so just add top padding
  const absY = paddingY + layout.y
  const result: FlatNode[] = [
    {
      node: layout.node,
      absX,
      absY,
      parentCenterX: parent?.cx,
      parentBottomY: parent?.by,
    },
  ]
  const myCx = absX + NODE_W / 2
  const myBy = absY + NODE_H
  for (const child of layout.children) {
    // Pass absX as x-offset for children (their x is relative to parent)
    // Pass paddingY unchanged (child.y is already absolute depth)
    result.push(...flattenLayout(child, absX, paddingY, { cx: myCx, by: myBy }))
  }
  return result
}

// ─── Compute true canvas bounds from flat nodes ──────────────────
function computeBounds(flat: FlatNode[]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const f of flat) {
    minX = Math.min(minX, f.absX)
    minY = Math.min(minY, f.absY)
    maxX = Math.max(maxX, f.absX + NODE_W)
    maxY = Math.max(maxY, f.absY + NODE_H)
  }
  return { minX, minY, maxX, maxY }
}

// ─── Org Node Card ───────────────────────────────────────────────
function OrgNodeCard({
  node,
  selected,
  onToggle,
  style,
}: {
  node: OrgNode
  selected: boolean
  onToggle: (id: string) => void
  style: React.CSSProperties
}) {
  return (
    <div className="absolute" style={style}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle(node.id)
        }}
        className={cn(
          "relative flex items-center gap-2.5 rounded-xl border-2 px-3 transition-all duration-200 cursor-pointer text-left",
          selected
            ? "border-[hsl(var(--primary))] bg-orange-50/80 shadow-[0_0_0_3px_rgba(234,88,12,0.12)]"
            : "border-border bg-card hover:border-orange-200 hover:shadow-sm",
        )}
        style={{ width: NODE_W, height: NODE_H }}
      >
        {selected && (
          <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
        )}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
            selected
              ? "bg-[hsl(var(--primary))] text-white"
              : "bg-muted text-muted-foreground",
          )}
        >
          {node.avatarInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-foreground leading-tight truncate">
            {node.name}
          </p>
          <p className="text-[9px] text-muted-foreground leading-tight truncate">{node.title}</p>
          <p className="text-[9px] text-[hsl(var(--primary))]/70 leading-tight truncate">
            {node.department}
          </p>
        </div>
      </button>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────
export function OrgTree({ root, selectedIds, onToggle }: OrgTreeProps) {
  const viewportRef = useRef<HTMLDivElement>(null)

  // State
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.5)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })

  // Layout (computed once from data)
  const layout = layoutTree(root, 0)
  const rawFlat = flattenLayout(layout, PADDING, PADDING)
  
  // Shift all nodes so the leftmost is at PADDING (fix negative X values)
  const minX = Math.min(...rawFlat.map((f) => f.absX))
  const shiftX = minX < PADDING ? PADDING - minX : 0
  const flat = rawFlat.map((f) => ({
    ...f,
    absX: f.absX + shiftX,
    parentCenterX: f.parentCenterX !== undefined ? f.parentCenterX + shiftX : undefined,
  }))
  
  const bounds = computeBounds(flat)
  const canvasW = bounds.maxX + PADDING
  const canvasH = bounds.maxY + PADDING



  // ─── Fit helper ────────────────────────────────────────────────
  const fitToView = useCallback(() => {
    if (!viewportRef.current) return
    const vp = viewportRef.current.getBoundingClientRect()
    const scaleX = vp.width / canvasW
    const scaleY = vp.height / canvasH
    const newZoom = Math.min(scaleX, scaleY, 1) * 0.9
    const scaledW = canvasW * newZoom
    const scaledH = canvasH * newZoom
    setPan({
      x: (vp.width - scaledW) / 2,
      y: (vp.height - scaledH) / 2,
    })
    setZoom(newZoom)
  }, [canvasW, canvasH])

  // ─── Auto-center on mount at 50% ──────────────────────────────
  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current || !viewportRef.current) return
    initialized.current = true
    const vp = viewportRef.current.getBoundingClientRect()
    const initZoom = 0.5
    const scaledW = canvasW * initZoom
    const scaledH = canvasH * initZoom
    setPan({
      x: (vp.width - scaledW) / 2,
      y: Math.max(8, (vp.height - scaledH) / 2),
    })
    setZoom(initZoom)
  }, [canvasW, canvasH])

  // ─── Pan: mouse drag ──────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return
      e.preventDefault()
      setDragging(true)
      dragStart.current = { x: e.clientX, y: e.clientY }
      panStart.current = { x: pan.x, y: pan.y }
    },
    [pan],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return
      e.preventDefault()
      setPan({
        x: panStart.current.x + (e.clientX - dragStart.current.x),
        y: panStart.current.y + (e.clientY - dragStart.current.y),
      })
    },
    [dragging],
  )

  const stopDrag = useCallback(() => setDragging(false), [])

  // Global mouseup
  useEffect(() => {
    window.addEventListener("mouseup", stopDrag)
    return () => window.removeEventListener("mouseup", stopDrag)
  }, [stopDrag])

  // ─── Zoom: wheel around cursor ────────────────────────────────
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!viewportRef.current) return

      const rect = viewportRef.current.getBoundingClientRect()
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      const delta = -e.deltaY * 0.001
      const oldZoom = zoom
      const newZoom = Math.min(1.25, Math.max(0.25, oldZoom + delta))
      const ratio = newZoom / oldZoom

      // Zoom around cursor point
      setPan((prev) => ({
        x: cursorX - ratio * (cursorX - prev.x),
        y: cursorY - ratio * (cursorY - prev.y),
      }))
      setZoom(newZoom)
    },
    [zoom],
  )

  // Attach wheel with { passive: false } to allow preventDefault
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  // ─── Build SVG connector paths ─────────────────────────────────
  const connectors = flat
    .filter((f) => f.parentCenterX !== undefined && f.parentBottomY !== undefined)
    .map((f) => {
      const childCx = f.absX + NODE_W / 2
      const childTopY = f.absY
      const midY = f.parentBottomY! + V_GAP / 2
      return (
        <path
          key={`c-${f.node.id}`}
          d={`M ${f.parentCenterX} ${f.parentBottomY} L ${f.parentCenterX} ${midY} L ${childCx} ${midY} L ${childCx} ${childTopY}`}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      )
    })

  return (
    <div
      ref={viewportRef}
      className="relative rounded-xl border border-border bg-card select-none"
      style={{ height: 560, width: "100%", overflow: "hidden", position: "relative" }}
    >
      {/* Dotted grid background */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--border)) 0.7px, transparent 0.7px)",
          backgroundSize: "18px 18px",
          opacity: 0.45,
        }}
      />

      {/* Zoom toolbar */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 bg-card/90 backdrop-blur-sm"
          onClick={() => setZoom((z) => Math.min(1.25, z + 0.1))}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 bg-card/90 backdrop-blur-sm"
          onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 bg-card/90 backdrop-blur-sm"
          onClick={fitToView}
          title="Fit to view"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[10px] text-muted-foreground ml-1 bg-card/80 px-1.5 py-0.5 rounded tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Hint */}
      <div className="absolute bottom-3 right-3 z-30">
        <span className="text-[10px] text-muted-foreground bg-card/80 px-2 py-1 rounded-md">
          Drag to pan &middot; Scroll to zoom &middot; Click to select
        </span>
      </div>

      {/* Panning surface — captures all mouse events */}
      <div
        className={cn(
          "absolute inset-0 z-10",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        {/* Canvas — absolutely positioned, explicit size, transformed */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: canvasW,
            height: canvasH,
            transformOrigin: "0 0",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            willChange: "transform",
          }}
        >
          {/* SVG connectors layer */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={canvasW}
            height={canvasH}
            viewBox={`0 0 ${canvasW} ${canvasH}`}
            style={{ zIndex: 1 }}
          >
            {connectors}
          </svg>

          {/* HTML node cards */}
          {flat.map((f) => (
            <OrgNodeCard
              key={f.node.id}
              node={f.node}
              selected={selectedIds.has(f.node.id)}
              onToggle={onToggle}
              style={{
                left: f.absX,
                top: f.absY,
                width: NODE_W,
                height: NODE_H,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
