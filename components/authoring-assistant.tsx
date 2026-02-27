"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChevronRight,
  ChevronLeft,
  Send,
  Copy,
  FileInput,
  Replace,
  Bot,
  User,
  AlertTriangle,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  draft?: string
  draftApplied?: "insert" | "replace" | "copied" | null
}

interface NarrativeState {
  [moduleKey: string]: string
}

interface AuthoringAssistantProps {
  narratives: NarrativeState
  onInsertDraft: (moduleKey: string, draft: string) => void
  onReplaceDraft: (moduleKey: string, draft: string) => void
  /** Which module to target initially (e.g. from clicking a section card) */
  targetModule?: string | null
}

// ─── Module list (matches strategy page modules + Overall) ──────────────────

const MODULE_OPTIONS = [
  { key: "overall", label: "Overall Strategy", group: "strategy" },
  { key: "executiveSummary", label: "Executive Summary", group: "section" },
  { key: "currentState", label: "Current State Analysis", group: "section" },
  { key: "futureState", label: "Future State Vision", group: "section" },
  { key: "approach", label: "Strategic Approach", group: "section" },
  { key: "risks", label: "Risk Assessment", group: "section" },
  { key: "timeline", label: "Timeline & Milestones", group: "section" },
  { key: "fact-base", label: "Internal Fact Base", group: "module" },
  { key: "stakeholders", label: "Stakeholders", group: "module" },
  { key: "external", label: "External Intelligence", group: "module" },
  { key: "esg", label: "ESG & Diversity", group: "module" },
  { key: "suppliers", label: "Supplier Strategy", group: "module" },
  { key: "opportunities", label: "Opportunity Backlog", group: "module" },
  { key: "roadmap", label: "Roadmap & Execution", group: "module" },
] as const

const QUICK_ACTIONS = [
  "Generate outline",
  "Rewrite executive style",
  "Shorten",
  "Add quantified impact",
  "Draft next paragraph",
]

// ─── Chat Panel Content (shared between desktop panel + mobile drawer) ──────

function AssistantContent({
  selectedModule,
  setSelectedModule,
  messages,
  isLoading,
  inputValue,
  setInputValue,
  onSend,
  onQuickAction,
  onInsertDraft,
  onReplaceDraft,
  onCopyDraft,
  scrollRef,
}: {
  selectedModule: string
  setSelectedModule: (v: string) => void
  messages: ChatMessage[]
  isLoading: boolean
  inputValue: string
  setInputValue: (v: string) => void
  onSend: () => void
  onQuickAction: (action: string) => void
  onInsertDraft: (messageId: string) => void
  onReplaceDraft: (messageId: string) => void
  onCopyDraft: (messageId: string) => void
  scrollRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b p-3">
        <div className="flex items-center gap-2 mb-1">
          <Bot className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Authoring Assistant</h3>
          <Badge variant="outline" className="text-[9px] h-4 px-1">AI</Badge>
        </div>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <AlertTriangle className="h-2.5 w-2.5" />
          AI drafts may be inaccurate. Review before saving.
        </p>
      </div>

      {/* Module selector */}
      <div className="shrink-0 border-b px-3 py-2">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
          Working on:
        </label>
        <Select value={selectedModule} onValueChange={setSelectedModule}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {MODULE_OPTIONS.filter((o) => o.group === "strategy").map((opt) => (
                <SelectItem key={opt.key} value={opt.key} className="text-xs font-medium">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground pl-2">Sections</SelectLabel>
              {MODULE_OPTIONS.filter((o) => o.group === "section").map((opt) => (
                <SelectItem key={opt.key} value={opt.key} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground pl-2">Modules</SelectLabel>
              {MODULE_OPTIONS.filter((o) => o.group === "module").map((opt) => (
                <SelectItem key={opt.key} value={opt.key} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Sparkles className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-xs text-muted-foreground">
              Ask the assistant to help draft, refine, or restructure your strategy narratives.
              Select a module above and start typing or use a quick action.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-2", msg.role === "user" && "justify-end")}>
            {msg.role === "assistant" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Draft block */}
              {msg.draft && (
                <div className="mt-2 rounded-md border bg-card p-2.5">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Badge variant="outline" className="text-[9px] h-4 px-1 bg-primary/5 text-primary border-primary/20">
                      Draft
                    </Badge>
                    {msg.draftApplied && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                        {msg.draftApplied === "insert" ? "Inserted" : msg.draftApplied === "replace" ? "Replaced" : "Copied"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mb-2">
                    {msg.draft}
                  </p>
                  {!msg.draftApplied && (
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] bg-transparent"
                        onClick={() => onInsertDraft(msg.id)}
                      >
                        <FileInput className="mr-1 h-3 w-3" />
                        Insert into narrative
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] bg-transparent"
                        onClick={() => onReplaceDraft(msg.id)}
                      >
                        <Replace className="mr-1 h-3 w-3" />
                        Replace narrative
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] bg-transparent"
                        onClick={() => onCopyDraft(msg.id)}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copy draft
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary mt-0.5">
                <User className="h-3.5 w-3.5 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="rounded-lg bg-muted px-3 py-2">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="shrink-0 border-t px-3 pt-2">
        <div className="flex flex-wrap gap-1 mb-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => onQuickAction(action)}
              disabled={isLoading}
              className="inline-flex items-center rounded-full border bg-card px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 pb-3">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && inputValue.trim()) {
                e.preventDefault()
                onSend()
              }
            }}
            placeholder="Ask the assistant..."
            disabled={isLoading}
            className="flex-1 rounded-md border border-input bg-card px-3 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40 disabled:opacity-50 transition-colors"
          />
          <Button
            size="sm"
            className="h-[30px] w-[30px] p-0"
            disabled={!inputValue.trim() || isLoading}
            onClick={onSend}
          >
            <Send className="h-3.5 w-3.5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Exported Component ────────────────────────────────────────────────

export function AuthoringAssistant({
  narratives,
  onInsertDraft,
  onReplaceDraft,
  targetModule,
}: AuthoringAssistantProps) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState("overall")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Sync target module from parent
  useEffect(() => {
    if (targetModule) {
      setSelectedModule(targetModule)
    }
  }, [targetModule])

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const buildContext = useCallback(() => {
    const mod = MODULE_OPTIONS.find((m) => m.key === selectedModule)
    const currentNarrative = narratives[selectedModule] || null
    const relevantContext = currentNarrative
      ? `Module: ${mod?.label ?? selectedModule}. Current narrative length: ${currentNarrative.length} chars.`
      : null
    return { moduleName: mod?.label ?? selectedModule, currentNarrative, relevantContext }
  }, [selectedModule, narratives])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
      }
      setMessages((prev) => [...prev, userMsg])
      setInputValue("")
      setIsLoading(true)

      try {
        const ctx = buildContext()
        const res = await fetch("/api/authoring-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleName: ctx.moduleName,
            userMessage: text.trim(),
            currentNarrative: ctx.currentNarrative,
            relevantContext: ctx.relevantContext,
          }),
        })
        const data = await res.json()
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: data.assistantMessage,
          draft: data.draft ?? undefined,
          draftApplied: null,
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch {
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        }
        setMessages((prev) => [...prev, errorMsg])
      } finally {
        setIsLoading(false)
      }
    },
    [buildContext]
  )

  const handleSend = useCallback(() => {
    sendMessage(inputValue)
  }, [inputValue, sendMessage])

  const handleQuickAction = useCallback(
    (action: string) => {
      sendMessage(action)
    },
    [sendMessage]
  )

  const handleInsertDraft = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId)
      if (!msg?.draft) return
      onInsertDraft(selectedModule, msg.draft)
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, draftApplied: "insert" } : m))
      )
    },
    [messages, selectedModule, onInsertDraft]
  )

  const handleReplaceDraft = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId)
      if (!msg?.draft) return
      onReplaceDraft(selectedModule, msg.draft)
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, draftApplied: "replace" } : m))
      )
    },
    [messages, selectedModule, onReplaceDraft]
  )

  const handleCopyDraft = useCallback(
    async (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId)
      if (!msg?.draft) return
      await navigator.clipboard.writeText(msg.draft)
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, draftApplied: "copied" } : m))
      )
    },
    [messages]
  )

  const contentProps = {
    selectedModule,
    setSelectedModule,
    messages,
    isLoading,
    inputValue,
    setInputValue,
    onSend: handleSend,
    onQuickAction: handleQuickAction,
    onInsertDraft: handleInsertDraft,
    onReplaceDraft: handleReplaceDraft,
    onCopyDraft: handleCopyDraft,
    scrollRef,
  }

  // ─── Mobile: slide-over dialog ────────────────────────────────────────────

  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 shadow-elevated bg-transparent"
          onClick={() => setMobileOpen(true)}
        >
          <Bot className="mr-1.5 h-4 w-4" />
          Assistant
        </Button>
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent className="h-[85vh] max-w-md p-0 flex flex-col">
            <DialogHeader className="sr-only">
              <DialogTitle>Authoring Assistant</DialogTitle>
            </DialogHeader>
            <AssistantContent {...contentProps} />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // ─── Desktop: persistent side panel ───────────────────────────────────────

  return (
    <div
      className={cn(
        "relative shrink-0 border-l bg-card transition-[width] duration-200 ease-in-out",
        isOpen ? "w-[340px]" : "w-0"
      )}
    >
      {/* Collapse / expand toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="absolute -left-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-card shadow-card hover:shadow-card-hover transition-shadow"
        aria-label={isOpen ? "Collapse assistant panel" : "Expand assistant panel"}
      >
        {isOpen ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="h-full overflow-hidden">
          <AssistantContent {...contentProps} />
        </div>
      )}
    </div>
  )
}
