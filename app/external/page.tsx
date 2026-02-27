"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useCategory } from "@/lib/category-context"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
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
import {
  Search,
  Send,
  Bot,
  ExternalLink,
  Check,
  BookmarkPlus,
  Plug,
  Unplug,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  SortAsc,
  Sparkles,
  Loader2,
  Copy,
  FileText,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { MarketContextTab } from "@/components/market-context-tab"
import { ValueChainTab } from "@/components/value-chain-tab"
import { UPGRADED_SUGGESTED_TOPICS } from "@/lib/external-market-data"
import { Globe, GitBranch } from "lucide-react"

import type { SearchResult } from "@/app/api/external-intelligence/search/route"
import type { AnalysisResult } from "@/app/api/external-intelligence/analyze/route"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExternalFact {
  id: string
  title: string
  sourceName: string
  sourceType: string
  publishedAt: string
  url?: string
  excerpt: string
  aiSummary: string
  implications: string[]
  tags: string[]
  linkedCategoryId: string
  createdAt: string
}

interface Source {
  id: string
  name: string
  description: string
  connected: boolean
  type: "web" | "research" | "market" | "filings" | "news"
}

interface ChatMessage {
  role: "user" | "assistant"
  text: string
  type?: "search" | "summary" | "general"
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const INITIAL_SOURCES: Source[] = [
  { id: "web", name: "Online Research (Web)", description: "General web search including industry publications", connected: true, type: "web" },
  { id: "statista", name: "Statista", description: "Statistics, market data and studies", connected: false, type: "research" },
  { id: "ibisworld", name: "IBISWorld", description: "Industry research and analysis reports", connected: false, type: "research" },
  { id: "gartner", name: "Gartner", description: "Technology research and advisory", connected: true, type: "research" },
  { id: "bloomberg", name: "Bloomberg / Reuters", description: "Financial and market data feeds", connected: false, type: "market" },
  { id: "filings", name: "Company Filings", description: "SEC / Companies House filings and reports", connected: false, type: "filings" },
  { id: "news", name: "News Wires", description: "Real-time news from major wire services", connected: true, type: "news" },
]

const DATE_PRESETS = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "1 year", value: "1y" },
  { label: "All time", value: "all" },
]

const SUGGESTED_TOPICS = UPGRADED_SUGGESTED_TOPICS

// ─── Helper ───────────────────────────────────────────────────────────────────

function getDateFrom(preset: string): string | undefined {
  const now = new Date()
  switch (preset) {
    case "7d": { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10) }
    case "30d": { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10) }
    case "90d": { const d = new Date(now); d.setDate(d.getDate() - 90); return d.toISOString().slice(0, 10) }
    case "1y": { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.toISOString().slice(0, 10) }
    default: return undefined
  }
}

function relevanceBadge(score: number) {
  if (score >= 60) return { label: "High", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
  if (score >= 35) return { label: "Medium", className: "bg-amber-50 text-amber-700 border-amber-200" }
  return { label: "Low", className: "bg-muted text-muted-foreground border-border" }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExternalPage() {
  const { selectedCategory } = useCategory()

  // Tab
  const [activeTab, setActiveTab] = useState("market-context")

  // Sources
  const [sources, setSources] = useState<Source[]>(INITIAL_SOURCES)
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(
    new Set(INITIAL_SOURCES.filter((s) => s.connected).map((s) => s.id))
  )

  // Search / Filter
  const [query, setQuery] = useState("")
  const [datePreset, setDatePreset] = useState("90d")
  const [sortBy, setSortBy] = useState<"relevance" | "newest" | "oldest">("relevance")

  // Results
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Saved facts
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [externalFacts, setExternalFacts] = useState<ExternalFact[]>([])

  // Detail drawer
  const [drawerResult, setDrawerResult] = useState<SearchResult | null>(null)
  const [drawerAnalysis, setDrawerAnalysis] = useState<AnalysisResult | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages, chatLoading])

  // ─── Actions ─────────────────────────────────────────────────────

  const toggleSource = useCallback((id: string) => {
    setSelectedSourceIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const connectSource = useCallback((id: string) => {
    setSources((prev) => prev.map((s) => s.id === id ? { ...s, connected: true } : s))
    setSelectedSourceIds((prev) => new Set([...prev, id]))
    toast.success(`Connected to ${sources.find((s) => s.id === id)?.name}`)
  }, [sources])

  const runSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setHasSearched(true)

    try {
      const res = await fetch("/api/external-intelligence/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          sources: Array.from(selectedSourceIds),
          dateFrom: getDateFrom(datePreset),
          categoryId: selectedCategory.id,
        }),
      })
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      toast.error("Search failed. Please try again.")
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [selectedSourceIds, datePreset, selectedCategory.id])

  const openDetail = useCallback(async (result: SearchResult) => {
    setDrawerResult(result)
    setDrawerAnalysis(null)
    setDrawerLoading(true)

    try {
      const res = await fetch("/api/external-intelligence/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId: result.id,
          title: result.title,
          snippet: result.snippet,
          fullText: result.fullText,
          categoryContext: selectedCategory.name,
        }),
      })
      const data = await res.json()
      setDrawerAnalysis(data)
    } catch {
      setDrawerAnalysis(null)
    } finally {
      setDrawerLoading(false)
    }
  }, [selectedCategory.name])

  const pullIntoFactBase = useCallback((result: SearchResult, analysis?: AnalysisResult | null) => {
    if (savedIds.has(result.id)) return

    const fact: ExternalFact = {
      id: `ef-${Date.now()}`,
      title: result.title,
      sourceName: result.sourceName,
      sourceType: result.sourceType,
      publishedAt: result.publishedAt,
      url: result.url,
      excerpt: analysis?.excerpt ?? result.snippet,
      aiSummary: analysis?.summary ?? "",
      implications: analysis?.implications ?? [],
      tags: analysis?.suggestedTags ?? result.tags,
      linkedCategoryId: selectedCategory.id,
      createdAt: new Date().toISOString().slice(0, 10),
    }

    setExternalFacts((prev) => [...prev, fact])
    setSavedIds((prev) => new Set([...prev, result.id]))
    toast.success("Added to External Fact Base", {
      description: result.title,
      action: {
        label: "View",
        onClick: () => {},
      },
    })
  }, [savedIds, selectedCategory.id])

  const copyCitation = useCallback((result: SearchResult) => {
    const citation = `${result.title}. ${result.sourceName}, ${result.publishedAt}. ${result.url}`
    navigator.clipboard.writeText(citation)
    toast.success("Citation copied to clipboard")
  }, [])

  // Chat actions
  const handleChatSend = useCallback(async (message?: string) => {
    const msg = (message ?? chatInput).trim()
    if (!msg) return
    setChatInput("")
    setChatMessages((prev) => [...prev, { role: "user", text: msg }])
    setChatLoading(true)

    // Run search in background
    try {
      const res = await fetch("/api/external-intelligence/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: msg,
          sources: Array.from(selectedSourceIds),
          dateFrom: getDateFrom(datePreset),
          categoryId: selectedCategory.id,
        }),
      })
      const data = await res.json()
      const searchResults: SearchResult[] = data.results ?? []
      setResults(searchResults)
      setHasSearched(true)

      // Build structured response
      const topResults = searchResults.slice(0, 5)
      let response = ""

      if (topResults.length > 0) {
        response += "**What I found:**\n"
        topResults.forEach((r, i) => {
          response += `${i + 1}. ${r.title} (${r.sourceName}, ${r.publishedAt})\n`
        })

        response += "\n**Key excerpts:**\n"
        topResults.slice(0, 3).forEach((r) => {
          response += `- "${r.snippet.slice(0, 120)}..."\n`
        })

        response += "\n**Implications for strategy:**\n"
        const implications = [
          "Review current supplier contracts for alignment with emerging market dynamics.",
          "Update risk register with newly identified supply chain or regulatory risks.",
          "Factor cost index movements into upcoming negotiation preparation.",
          "Brief stakeholders on competitive landscape changes that may impact sourcing strategy.",
          "Consider adjusting timeline for planned sourcing events based on market conditions.",
        ]
        implications.slice(0, 4).forEach((imp) => {
          response += `- ${imp}\n`
        })

        response += "\n**Follow-up questions:**\n"
        response += `- How does this affect our ${selectedCategory.name} strategy specifically?\n`
        response += `- What are the pricing implications for the next 6 months?\n`
        response += `- Should we accelerate any planned sourcing activities?`
      } else {
        response = "No results found for that query. Try broadening your search terms or extending the date range."
      }

      setChatMessages((prev) => [...prev, { role: "assistant", text: response, type: "search" }])
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I encountered an error while searching. Please try again." }])
    } finally {
      setChatLoading(false)
    }
  }, [chatInput, selectedSourceIds, datePreset, selectedCategory.id, selectedCategory.name])

  const summarizeResults = useCallback(async () => {
    if (results.length === 0) return
    setChatLoading(true)
    setChatMessages((prev) => [...prev, { role: "user", text: "Summarize current results" }])

    // Build a consolidated summary from loaded results
    await new Promise((r) => setTimeout(r, 800))

    const topResults = results.slice(0, 6)
    let response = "**Combined Summary of Current Results:**\n\n"

    // Group by theme
    const themes = new Map<string, string[]>()
    topResults.forEach((r) => {
      const primaryTag = r.tags[0] ?? "General"
      if (!themes.has(primaryTag)) themes.set(primaryTag, [])
      themes.get(primaryTag)!.push(r.title)
    })

    response += "**Themes identified:**\n"
    themes.forEach((titles, theme) => {
      response += `- **${theme}**: ${titles.join("; ")}\n`
    })

    response += "\n**Key takeaways:**\n"
    response += `- ${topResults.length} relevant sources analyzed across ${themes.size} themes.\n`
    response += `- Market conditions suggest a mix of cost pressures and emerging opportunities.\n`
    response += `- Regulatory landscape is evolving; contract compliance reviews recommended.\n`
    response += `- Supply chain diversification remains a priority given geopolitical uncertainties.\n`

    response += "\n**Recommended actions:**\n"
    response += "1. Pull high-relevance findings into the External Fact Base for strategy integration.\n"
    response += "2. Schedule a cross-functional briefing on market intelligence findings.\n"
    response += `3. Update ${selectedCategory.name} category strategy with relevant insights.`

    setChatMessages((prev) => [...prev, { role: "assistant", text: response, type: "summary" }])
    setChatLoading(false)
  }, [results, selectedCategory.name])

  // Navigate to research tab with a prefilled query
  const navigateToResearch = useCallback((topic: string) => {
    setActiveTab("research")
    setQuery(topic)
    // Trigger search after tab switch
    setTimeout(() => runSearch(topic), 300)
  }, [runSearch])

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "newest") return b.publishedAt.localeCompare(a.publishedAt)
    if (sortBy === "oldest") return a.publishedAt.localeCompare(b.publishedAt)
    return b.relevanceScore - a.relevanceScore
  })

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "External Intelligence" },
        ]}
        title="External Intelligence"
        description="Research topics, discover market signals, and pull structured insights into your fact base."
      />

      {/* ── Top-level Tabs ──────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-9">
          <TabsTrigger value="market-context" className="text-xs gap-1.5"><Globe className="h-3.5 w-3.5" />Market Context</TabsTrigger>
          <TabsTrigger value="value-chain" className="text-xs gap-1.5"><GitBranch className="h-3.5 w-3.5" />Value Chain</TabsTrigger>
          <TabsTrigger value="research" className="text-xs gap-1.5"><Search className="h-3.5 w-3.5" />Research</TabsTrigger>
        </TabsList>

        {/* ═══════════ TAB 1: MARKET CONTEXT ════════════════════════ */}
        <TabsContent value="market-context" className="space-y-0">
          <MarketContextTab />
        </TabsContent>

        {/* ═══════════ TAB 2: VALUE CHAIN ═══════════════════════════ */}
        <TabsContent value="value-chain" className="space-y-0">
          <ValueChainTab onNavigateToResearch={navigateToResearch} />
        </TabsContent>

        {/* ═══════════ TAB 3: RESEARCH (existing) ══════════════════= */}
        <TabsContent value="research" className="space-y-4">

      {/* ── Search Bar + Filters ───────────────────────────────────── */}
      <Card className="mb-0">
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") runSearch(query) }}
                placeholder="Search topics, market trends, suppliers..."
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Date preset */}
            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="h-9 w-[110px] text-xs">
                <Clock className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Source chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {sources.filter((s) => s.connected).map((s) => {
                const active = selectedSourceIds.has(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSource(s.id)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      active
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {active && <Check className="h-2.5 w-2.5" />}
                    {s.name.split(" ")[0]}
                  </button>
                )
              })}
            </div>

            <Button size="sm" className="h-9 gap-1.5" onClick={() => runSearch(query)} disabled={searching || !query.trim()}>
              {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Main Content: 2-column layout ──────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">

        {/* ── Left Panel: Sources + Saved Count ─────────────────── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sources & Connections</CardTitle>
              <CardDescription className="text-xs">{sources.filter((s) => s.connected).length} of {sources.length} connected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {sources.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-md border px-2.5 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {s.connected
                        ? <Plug className="h-3 w-3 text-emerald-600 shrink-0" />
                        : <Unplug className="h-3 w-3 text-muted-foreground shrink-0" />
                      }
                      <span className="text-xs font-medium truncate">{s.name}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 ml-[18px] line-clamp-1">{s.description}</p>
                  </div>
                  {s.connected ? (
                    <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                      Connected
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" className="h-6 text-[10px] shrink-0" onClick={() => connectSource(s.id)}>
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Saved Facts Summary */}
          {externalFacts.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">External Fact Base</CardTitle>
                <CardDescription className="text-xs">{externalFacts.length} insight{externalFacts.length !== 1 ? "s" : ""} saved</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {externalFacts.slice(-5).reverse().map((f) => (
                  <div key={f.id} className="flex items-start gap-2 rounded border px-2 py-1.5">
                    <FileText className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium truncate">{f.title}</p>
                      <p className="text-[10px] text-muted-foreground">{f.sourceName} - {f.publishedAt}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right Panel: Chat + Results ───────────────────────── */}
        <div className="space-y-4">

          {/* AI Research Assistant */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">AI Research Assistant</CardTitle>
                </div>
                {results.length > 0 && (
                  <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1" onClick={summarizeResults} disabled={chatLoading}>
                    <Sparkles className="h-3 w-3" />
                    Summarize Results
                  </Button>
                )}
              </div>
            </CardHeader>

            {/* Suggested Topics */}
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => { setQuery(topic); handleChatSend(topic) }}
                    className="inline-flex items-center rounded-full border bg-card px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="h-2.5 w-2.5 mr-1" />
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Chat Messages */}
            <div className="max-h-[320px] overflow-y-auto p-3 space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Select a suggested topic or type a query to begin research.</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[92%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-line",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}>
                    {/* Render markdown-like bold */}
                    {msg.text.split("\n").map((line, li) => {
                      const boldParsed = line.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
                      return <span key={li} dangerouslySetInnerHTML={{ __html: boldParsed + (li < msg.text.split("\n").length - 1 ? "<br/>" : "") }} />
                    })}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Researching...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <Separator />

            {/* Chat Input */}
            <div className="p-3">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend() } }}
                  placeholder="Ask a question or search..."
                  className="h-8 text-xs flex-1"
                />
                <Button size="sm" className="h-8 gap-1" onClick={() => handleChatSend()} disabled={!chatInput.trim() || chatLoading}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => { if (query.trim()) runSearch(query); else handleChatSend() }} disabled={searching || chatLoading}>
                  <Search className="h-3.5 w-3.5" />
                  Search sources
                </Button>
              </div>
            </div>
          </Card>

          {/* ── Results List ──────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                {hasSearched ? `${results.length} Result${results.length !== 1 ? "s" : ""}` : "Results"}
              </h2>
              {results.length > 0 && (
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="h-7 w-[130px] text-[11px]">
                    <SortAsc className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance" className="text-xs">Relevance</SelectItem>
                    <SelectItem value="newest" className="text-xs">Newest</SelectItem>
                    <SelectItem value="oldest" className="text-xs">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {!hasSearched && (
              <Card>
                <CardContent className="py-10 text-center">
                  <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Try a suggested topic or enter a search query to find external intelligence.</p>
                </CardContent>
              </Card>
            )}

            {hasSearched && searching && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="py-4 px-4">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-5/6" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {hasSearched && !searching && results.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No results found. Try broadening your search or extending the date range.</p>
                </CardContent>
              </Card>
            )}

            {!searching && sortedResults.length > 0 && (
              <div className="space-y-2">
                {sortedResults.map((r) => {
                  const rel = relevanceBadge(r.relevanceScore)
                  const isSaved = savedIds.has(r.id)
                  return (
                    <Card key={r.id} className={cn("transition-colors", isSaved && "border-emerald-200 bg-emerald-50/30")}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Title row */}
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-medium text-foreground line-clamp-1">{r.title}</h3>
                              <Badge variant="outline" className={cn("text-[9px] shrink-0", rel.className)}>
                                {rel.label}
                              </Badge>
                              {isSaved && (
                                <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0 gap-0.5">
                                  <Check className="h-2 w-2" />
                                  Saved
                                </Badge>
                              )}
                            </div>
                            {/* Source + date */}
                            <div className="flex items-center gap-2 mb-1.5 text-[11px] text-muted-foreground">
                              <span className="font-medium">{r.sourceName}</span>
                              <span aria-hidden="true">-</span>
                              <span>{r.publishedAt}</span>
                              {r.tags.slice(0, 2).map((t) => (
                                <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0 h-4">{t}</Badge>
                              ))}
                            </div>
                            {/* Snippet */}
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{r.snippet}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => openDetail(r)}>
                              <ExternalLink className="h-3 w-3" />
                              Open
                            </Button>
                            <Button
                              variant={isSaved ? "secondary" : "outline"}
                              size="sm"
                              className="h-7 text-[10px] gap-1"
                              onClick={() => pullIntoFactBase(r)}
                              disabled={isSaved}
                            >
                              {isSaved ? <Check className="h-3 w-3" /> : <BookmarkPlus className="h-3 w-3" />}
                              {isSaved ? "Saved" : "Pull"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

        </TabsContent>
      </Tabs>

      {/* ── Detail Drawer ────────────────────────────────────────── */}
      <Sheet open={!!drawerResult} onOpenChange={(open) => { if (!open) setDrawerResult(null) }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {drawerResult && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="text-base leading-snug">{drawerResult.title}</SheetTitle>
                <SheetDescription asChild>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{drawerResult.sourceName}</span>
                    <span aria-hidden="true">-</span>
                    <span>{drawerResult.publishedAt}</span>
                  </div>
                </SheetDescription>
              </SheetHeader>

              <Separator className="my-3" />

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {drawerResult.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
              </div>

              {/* Full Text */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-foreground mb-2">Full Text</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {drawerResult.fullText || drawerResult.snippet}
                </p>
              </div>

              <Separator className="my-4" />

              {/* AI Analysis */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground">AI Analysis</h4>
                </div>

                {drawerLoading && (
                  <div className="py-6 text-center">
                    <Loader2 className="h-5 w-5 mx-auto mb-2 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Analyzing...</p>
                  </div>
                )}

                {drawerAnalysis && (
                  <div className="space-y-4">
                    {/* Key Excerpt */}
                    <div className="rounded-md border-l-2 border-primary/40 bg-primary/5 px-3 py-2">
                      <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">Key Excerpt</p>
                      <p className="text-xs text-foreground italic leading-relaxed">&ldquo;{drawerAnalysis.excerpt}&rdquo;</p>
                    </div>

                    {/* Summary */}
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">What It Means</p>
                      <p className="text-xs text-foreground leading-relaxed">{drawerAnalysis.summary}</p>
                    </div>

                    {/* Implications */}
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Implications for Strategy</p>
                      <ul className="space-y-1.5">
                        {drawerAnalysis.implications.map((imp, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
                            <span className="text-primary mt-0.5 shrink-0 text-[10px] font-bold">{i + 1}.</span>
                            {imp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Risk / Opportunity Tags */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[10px] gap-1",
                        drawerAnalysis.riskLevel === "High" ? "bg-red-50 text-red-700 border-red-200"
                          : drawerAnalysis.riskLevel === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}>
                        <ArrowUpRight className="h-2.5 w-2.5" />
                        Risk: {drawerAnalysis.riskLevel}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px] gap-1",
                        drawerAnalysis.opportunityLevel === "High" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : drawerAnalysis.opportunityLevel === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-muted text-muted-foreground"
                      )}>
                        <ArrowDownRight className="h-2.5 w-2.5" />
                        Opportunity: {drawerAnalysis.opportunityLevel}
                      </Badge>
                    </div>

                    {/* Suggested Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {drawerAnalysis.suggestedTags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => pullIntoFactBase(drawerResult, drawerAnalysis)}
                  disabled={savedIds.has(drawerResult.id)}
                >
                  {savedIds.has(drawerResult.id) ? <Check className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
                  {savedIds.has(drawerResult.id) ? "Saved to Fact Base" : "Pull into External Fact Base"}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => copyCitation(drawerResult)}>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Citation
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
