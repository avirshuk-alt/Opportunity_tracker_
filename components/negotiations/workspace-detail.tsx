"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Database, Crosshair, Wrench, Target,
  MessageSquareText, Radio, CheckCircle2, ArrowLeft, Sparkles,
  UsersRound,
} from "lucide-react"
import {
  type NegotiationWorkspace,
  type WorkspaceSection,
  SECTION_ORDER,
  SECTION_LABELS,
  STATUS_COLORS,
} from "@/lib/negotiations-data"

import { OverviewSection } from "./sections/overview-section"
import { FactBaseSection } from "./sections/fact-base-section"
import { SpectrumSection } from "./sections/spectrum-section"
import { LeversSection } from "./sections/levers-section"
import { ObjectivesSection } from "./sections/objectives-section"
import { NegotiationPlanSection } from "./sections/negotiation-plan-section"
import { TeamScriptsSection } from "./sections/team-scripts-section"
import { LiveNegotiationSection } from "./sections/live-negotiation-section"
import { CloseOutSection } from "./sections/close-out-section"

const SECTION_ICONS: Record<WorkspaceSection, React.ElementType> = {
  overview: LayoutDashboard,
  "fact-base": Database,
  spectrum: Crosshair,
  levers: Wrench,
  objectives: Target,
  narrative: MessageSquareText, // now "Negotiation Plan"
  "team-scripts": UsersRound,
  "live-negotiation": Radio,
  "close-out": CheckCircle2,
}

interface WorkspaceDetailProps {
  workspace: NegotiationWorkspace
  onBack: () => void
  onUpdate: (ws: NegotiationWorkspace) => void
}

function getSectionComplete(ws: NegotiationWorkspace, section: WorkspaceSection): boolean {
  switch (section) {
    case "overview": return true
    case "fact-base": return ws.factSections.length > 0 && ws.factSections.some((fs) => fs.items.length > 0)
    case "spectrum": return ws.spectrumPlacements.length > 0
    case "levers": return ws.levers.length > 0 && ws.levers.some((l) => l.status === "complete")
    case "objectives": return ws.objectives.length > 0
    case "narrative": return ws.arguments.length > 0 && ws.objectives.length > 0 && ws.levers.length > 0
    case "team-scripts": return false // scripts are generated on-demand
    case "live-negotiation": return ws.rounds.length > 0
    case "close-out": return ws.closeOut != null
  }
}

function BuildStatusBanner({ workspace }: { workspace: NegotiationWorkspace }) {
  const hasAutoPopulated =
    workspace.factSections.length > 0 &&
    workspace.spectrumPlacements.length > 0 &&
    workspace.levers.length > 0

  if (!hasAutoPopulated) return null

  const sections = [
    { label: "Fact Base", done: workspace.factSections.length > 0 },
    { label: "Supplier Matrix", done: workspace.spectrumPlacements.length > 0 },
    { label: "Lever Recs", done: workspace.levers.length > 0 },
  ]
  const doneCount = sections.filter((s) => s.done).length
  const progress = Math.round((doneCount / sections.length) * 100)

  return (
    <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-center gap-2.5 mb-2">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground">
            Strategy auto-generated &mdash; {progress}% complete
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            All sections populated from scope. Review and refine data as needed.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {sections.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-[10px]">
            <CheckCircle2
              className={cn("h-3 w-3", s.done ? "text-emerald-500" : "text-muted-foreground/40")}
            />
            <span className={s.done ? "text-foreground" : "text-muted-foreground"}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function WorkspaceDetail({ workspace, onBack, onUpdate }: WorkspaceDetailProps) {
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("overview")
  const sc = STATUS_COLORS[workspace.status]

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection workspace={workspace} onNavigate={setActiveSection} />
      case "fact-base":
        return <FactBaseSection workspace={workspace} onUpdate={onUpdate} />
      case "spectrum":
        return <SpectrumSection workspace={workspace} />
      case "levers":
        return <LeversSection workspace={workspace} onUpdate={onUpdate} />
      case "objectives":
        return <ObjectivesSection workspace={workspace} onUpdate={onUpdate} />
      case "narrative":
        return <NegotiationPlanSection workspace={workspace} onUpdate={onUpdate} />
      case "team-scripts":
        return <TeamScriptsSection workspace={workspace} onUpdate={onUpdate} />
      case "live-negotiation":
        return <LiveNegotiationSection workspace={workspace} onUpdate={onUpdate} />
      case "close-out":
        return <CloseOutSection workspace={workspace} onUpdate={onUpdate} />
    }
  }

  return (
    <div className="flex gap-0 min-h-[calc(100vh-12rem)]">
      {/* Left rail nav */}
      <nav className="w-52 shrink-0 border-r border-border pr-1 pt-1 mr-5">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground w-full justify-start px-3">
          <ArrowLeft className="h-3.5 w-3.5" />
          All Strategies
        </Button>

        <div className="px-3 mb-3">
          <h3 className="text-xs font-semibold text-foreground truncate">{workspace.name}</h3>
          <Badge variant="outline" className={cn("text-[10px] mt-1", sc.bg, sc.text)}>
            {sc.label}{workspace.status === "live" && workspace.liveRound ? ` (R${workspace.liveRound})` : ""}
          </Badge>
        </div>

        <div className="space-y-0.5">
          {SECTION_ORDER.map((section) => {
            const Icon = SECTION_ICONS[section]
            const isActive = activeSection === section
            const isDone = getSectionComplete(workspace, section)
            return (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-xs transition-colors text-left",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {isActive && <span className="absolute left-0 w-[3px] h-5 rounded-full bg-primary" />}
                <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : isDone ? "text-emerald-500" : "")} />
                <span className="truncate">{SECTION_LABELS[section]}</span>
                {isDone && !isActive && (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-auto shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <BuildStatusBanner workspace={workspace} />
        {renderSection()}
      </main>
    </div>
  )
}
