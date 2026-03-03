"use client"

import { useCategory } from "@/lib/category-context"
import { MODULES, getModuleProgressByCategory } from "@/lib/module-progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import {
  Target,
  FileText,
  Database,
  Globe,
  Building2,
  ShieldAlert,
  Lightbulb,
  Handshake,
  ArrowRightLeft,
  ArrowRight,
  Sparkles,
  Paperclip,
  Send,
  Loader2,
} from "lucide-react"

// ── Icon map ─────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Target,
  FileText,
  Database,
  Globe,
  Building2,
  ShieldAlert,
  Lightbulb,
  Handshake,
  ArrowRightLeft,
}

// ── Fixed progress values per spec ───────────────────────────────

const FIXED_PROGRESS: Record<string, { percent: number; status: string }> = {
  "strategic-objectives": { percent: 38, status: "In progress" },
  strategy: { percent: 63, status: "In progress" },
  "fact-base": { percent: 62, status: "In progress" },
  external: { percent: 21, status: "In progress" },
  suppliers: { percent: 67, status: "In progress" },
  risks: { percent: 20, status: "Recommended" },
  esg: { percent: 32, status: "In progress" },
  opportunities: { percent: 66, status: "In progress" },
  impact: { percent: 22, status: "In progress" },
}

// ── Updated module routes ────────────────────────────────────────

const MODULE_ROUTES: Record<string, string> = {
  "strategic-objectives": "/stakeholder-strategy-business-requirements",
  strategy: "/strategy",
  "fact-base": "/fact-base",
  external: "/external",
  suppliers: "/suppliers",
  risks: "/risks",
  esg: "/esg",
  opportunities: "/opportunities",
  impact: "/impact",
}

// ── Intent router ────────────────────────────────────────────────

const INTENT_MAP: { keywords: string[]; route: string }[] = [
  { keywords: ["objective", "alignment", "stakeholder", "requirement"], route: "/stakeholder-strategy-business-requirements" },
  { keywords: ["risk", "mitigation"], route: "/risks" },
  { keywords: ["opportunity", "lever", "savings"], route: "/opportunities" },
  { keywords: ["supplier", "vendor", "scorecard"], route: "/suppliers" },
  { keywords: ["external", "market", "intelligence"], route: "/external" },
  { keywords: ["internal", "spend", "contract", "fact"], route: "/fact-base" },
  { keywords: ["strategy", "objective", "narrative"], route: "/strategy" },
  { keywords: ["negotiat", "deal", "offer", "counteroffer", "spectrum"], route: "/esg" },
  { keywords: ["impact", "simulator", "scenario"], route: "/impact" },
]

function resolveIntent(input: string): string | null {
  const lower = input.toLowerCase().trim()
  if (!lower) return null
  for (const intent of INTENT_MAP) {
    if (intent.keywords.some((kw) => lower.includes(kw))) return intent.route
  }
  return null
}

// ── Animated Orb Component (25-40% larger) ───────────────────────

function AnimatedOrb() {
  return (
    <div className="relative mx-auto mb-6" style={{ width: 100, height: 100 }}>
      {/* Outer glow ring – slow spin */}
      <div
        className="absolute inset-0 rounded-full opacity-30 blur-lg"
        style={{
          background:
            "conic-gradient(from 0deg, hsl(22 92% 52% / 0.6), hsl(260 60% 60% / 0.4), hsl(22 92% 52% / 0.6))",
          animation: "orb-spin 8s linear infinite",
        }}
      />
      {/* Middle layer – pulsing glow */}
      <div
        className="absolute inset-3 rounded-full blur-sm"
        style={{
          background:
            "radial-gradient(circle, hsl(22 92% 52% / 0.5) 0%, hsl(260 50% 58% / 0.3) 60%, transparent 100%)",
          animation: "orb-pulse 3s ease-in-out infinite",
        }}
      />
      {/* Core sphere – float */}
      <div
        className="absolute inset-4 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, hsl(280 50% 72% / 0.9), hsl(22 80% 55% / 0.8) 60%, hsl(260 40% 45% / 0.7))",
          boxShadow:
            "0 0 28px hsl(22 92% 52% / 0.3), inset 0 -6px 12px hsl(260 50% 40% / 0.3), inset 0 6px 12px hsl(0 0% 100% / 0.2)",
          animation: "orb-float 4s ease-in-out infinite",
        }}
      />
      {/* Highlight spot */}
      <div
        className="absolute rounded-full"
        style={{
          top: 22,
          left: 30,
          width: 18,
          height: 14,
          background:
            "radial-gradient(ellipse, hsl(0 0% 100% / 0.6), transparent)",
          filter: "blur(2px)",
          animation: "orb-float 4s ease-in-out infinite",
        }}
      />
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────

export default function HomePage() {
  const { selectedCategory } = useCategory()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const progressData = useMemo(
    () => getModuleProgressByCategory(selectedCategory.id),
    [selectedCategory.id]
  )

  const [chatInput, setChatInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleChatSubmit = useCallback(() => {
    if (!chatInput.trim()) return
    setIsSending(true)
    const route = resolveIntent(chatInput)
    setTimeout(() => {
      if (!mountedRef.current) return
      router.push(route || "/strategy")
      setChatInput("")
      setIsSending(false)
    }, 600)
  }, [chatInput, router])

  const handleGenerate = useCallback(() => {
    setIsGenerating(true)
    setTimeout(() => {
      if (!mountedRef.current) return
      router.push("/strategy")
      setIsGenerating(false)
    }, 800)
  }, [router])

  function getStatusInfo(key: string) {
    const fixed = FIXED_PROGRESS[key]
    if (!fixed)
      return {
        label: "Not started",
        className: "bg-muted text-muted-foreground border-border",
      }
    if (fixed.status === "Recommended") {
      return {
        label: "Recommended",
        className: "bg-primary/10 text-primary border-primary/20",
      }
    }
    return {
      label: "In progress",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Shared-width container for hero + chat + grid */}
      <div className="w-full max-w-[1120px] flex flex-col">
        {/* ══ HERO AREA ═══════════════════════════════════════════ */}
        {/* Large top padding to push modules below the fold */}
        <div className="flex flex-col items-center pt-16 sm:pt-20 mb-16 md:mb-20">
          <AnimatedOrb />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground text-center text-balance">
            {"Welcome back, Sarah!"}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-5 text-center">
            {"This is your AI-powered Category Strategy platform."}
          </p>
        </div>

        {/* ══ AI CHAT COMPOSER ══════════════════════════════════════ */}
        <Card className="w-full shadow-md border-border rounded-2xl">
          <CardContent className="p-5">
            {/* Top label */}
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Ask me anything
              </span>
            </div>

            {/* Textarea – taller */}
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleChatSubmit()
                }
              }}
              placeholder="What would you like to explore? Try 'summarize risk exposure' or 'generate strategy brief'..."
              rows={5}
              className="w-full resize-none rounded-xl border border-border bg-muted/30 px-4 py-3.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              style={{ minHeight: 150 }}
            />

            {/* Bottom actions:  [Attach] [Generate] ---- [Send] */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  aria-hidden="true"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 text-muted-foreground"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Attach
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs font-semibold gap-1.5"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Generate Category Strategy Summary
                </Button>
              </div>

              <Button
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={handleChatSubmit}
                disabled={isSending || !chatInput.trim()}
                aria-label="Send message"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ══ SECTION TITLE ═══════════════════════════════════════ */}
        <h2 className="mt-20 text-sm md:text-base font-semibold text-slate-900 uppercase tracking-wide mb-4">
          Get Started with a Module
        </h2>

        {/* ══ MODULE GRID ═════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 pb-10">
          {MODULES.map((mod) => {
            const fixed = FIXED_PROGRESS[mod.key]
            const pct = fixed?.percent ?? 0
            const statusInfo = getStatusInfo(mod.key)
            const Icon = ICON_MAP[mod.icon]
            const route = MODULE_ROUTES[mod.key] || mod.href

            return (
              <Card
                key={mod.key}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out hover:-translate-y-[3px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.08),0_4px_10px_rgba(0,0,0,0.04)] hover:border-orange-200 hover:ring-2 hover:ring-orange-100"
              >
                {/* Orange accent rail */}
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-orange-100 transition-colors duration-200 group-hover:bg-orange-400" />

                <CardContent className="p-5 pl-6">
                  {/* Icon badge + Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                      {Icon && (
                        <Icon className="h-[18px] w-[18px] text-orange-500" />
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] shrink-0 whitespace-nowrap",
                        statusInfo.className
                      )}
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>

                  <p className="text-base font-semibold text-foreground mb-3 leading-snug">
                    {mod.label}
                  </p>

                  {/* Progress bar – thicker */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                  </div>

                  {/* Open link – orange + bold on hover, NO underline */}
                  <Link href={route}>
                    <span className="inline-flex items-center gap-1 text-xs text-foreground/60 no-underline transition-all group-hover:text-primary group-hover:font-semibold">
                      Open
                      <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
