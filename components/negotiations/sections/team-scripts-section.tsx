"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  UsersRound, Plus, Pencil, Trash2, Sparkles, FileText,
  ChevronRight, ChevronDown, Clock, ShieldCheck, Copy,
  BookOpen, AlertTriangle, Users, X, Check,
  ClipboardList, MessageSquareText, Eye, Download, Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type NegotiationWorkspace,
  type NegotiationTeamMember,
  type TeamRole,
  type ScriptPack,
  type RoundScript,
  type PersonRoundScript,
  type ScriptSection,
  TEAM_ROLE_LABELS,
  TEAM_ROLE_COLORS,
  ROUND_PURPOSE_CONFIG,
  DEFAULT_TEAM,
  generateNegotiationPlan,
  generateScriptPack,
} from "@/lib/negotiations-data"

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface TeamScriptsSectionProps {
  workspace: NegotiationWorkspace
  onUpdate: (ws: NegotiationWorkspace) => void
}

/* ─── Add/Edit Member Dialog ────────────────────────────────────────────── */

const ALL_ROLES: TeamRole[] = [
  "lead-negotiator", "analyst", "note-taker", "technical-sme",
  "finance", "legal", "executive-sponsor", "other",
]

function MemberDialog({
  open,
  onOpenChange,
  member,
  onSave,
  maxRounds,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  member: NegotiationTeamMember | null
  onSave: (m: NegotiationTeamMember) => void
  maxRounds: number
}) {
  const [name, setName] = useState(member?.name ?? "")
  const [email, setEmail] = useState(member?.email ?? "")
  const [org, setOrg] = useState(member?.org ?? "")
  const [internal, setInternal] = useState(member?.internal ?? true)
  const [roles, setRoles] = useState<TeamRole[]>(member?.roles ?? [])
  const [customRole, setCustomRole] = useState(member?.customRole ?? "")
  const [participation, setParticipation] = useState<number[]>(member?.participationRounds ?? [])
  const [notes, setNotes] = useState(member?.notes ?? "")

  const toggleRole = (r: TeamRole) => {
    setRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r])
  }

  const toggleRound = (n: number) => {
    setParticipation((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort())
  }

  const handleSave = () => {
    if (!name.trim() || roles.length === 0) return
    onSave({
      id: member?.id ?? `tm-${Date.now()}`,
      name: name.trim(),
      email: email.trim() || undefined,
      org: org.trim() || undefined,
      internal,
      roles,
      customRole: roles.includes("other") ? customRole.trim() : undefined,
      participationRounds: participation,
      notes: notes.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">{member ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-[11px]">Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="mt-1 h-8 text-xs" />
            </div>
            <div className="flex-1">
              <Label className="text-[11px]">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" className="mt-1 h-8 text-xs" />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-[11px]">Organization</Label>
              <Input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Department / Company" className="mt-1 h-8 text-xs" />
            </div>
            <div className="w-28">
              <Label className="text-[11px]">Type</Label>
              <Select value={internal ? "internal" : "external"} onValueChange={(v) => setInternal(v === "internal")}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal" className="text-xs">Internal</SelectItem>
                  <SelectItem value="external" className="text-xs">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Roles */}
          <div>
            <Label className="text-[11px]">Roles * (select one or more)</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {ALL_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => toggleRole(r)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                    roles.includes(r)
                      ? cn(TEAM_ROLE_COLORS[r].bg, TEAM_ROLE_COLORS[r].text, "border-current/20")
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {TEAM_ROLE_LABELS[r]}
                </button>
              ))}
            </div>
            {roles.includes("other") && (
              <Input
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Custom role name..."
                className="mt-2 h-7 text-xs"
              />
            )}
          </div>

          {/* Round participation */}
          {maxRounds > 0 && (
            <div>
              <Label className="text-[11px]">Round Participation (leave empty for all rounds)</Label>
              <div className="flex gap-1.5 mt-1.5">
                {Array.from({ length: maxRounds }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => toggleRound(n)}
                    className={cn(
                      "h-8 w-8 rounded-full border text-xs font-semibold transition-colors",
                      participation.includes(n)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    R{n}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-[11px]">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." className="mt-1 text-xs min-h-[60px]" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!name.trim() || roles.length === 0} className="text-xs">
            {member ? "Save Changes" : "Add Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Team Roster Card ──────────────────────────────────────────────────── */

function TeamRoster({
  team,
  onAdd,
  onEdit,
  onRemove,
  maxRounds,
}: {
  team: NegotiationTeamMember[]
  onAdd: () => void
  onEdit: (m: NegotiationTeamMember) => void
  onRemove: (id: string) => void
  maxRounds: number
}) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Team Roster</CardTitle>
            <Badge variant="outline" className="text-[10px]">{team.length} members</Badge>
          </div>
          <Button size="sm" variant="outline" onClick={onAdd} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" />
            Add Member
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {team.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No team members added yet.</p>
            <Button size="sm" variant="outline" onClick={onAdd} className="mt-3 text-xs gap-1">
              <Plus className="h-3 w-3" />
              Add First Member
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Name</TableHead>
                  <TableHead className="text-[10px]">Org</TableHead>
                  <TableHead className="text-[10px]">Roles</TableHead>
                  <TableHead className="text-[10px]">Rounds</TableHead>
                  <TableHead className="text-[10px] w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div>
                        <p className="text-xs font-medium">{m.name}</p>
                        {m.email && <p className="text-[10px] text-muted-foreground">{m.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{m.org ?? "--"}</span>
                        {!m.internal && (
                          <Badge variant="outline" className="text-[9px]">Ext</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {m.roles.map((r) => (
                          <Badge
                            key={r}
                            variant="outline"
                            className={cn("text-[9px]", TEAM_ROLE_COLORS[r].bg, TEAM_ROLE_COLORS[r].text)}
                          >
                            {r === "other" && m.customRole ? m.customRole : TEAM_ROLE_LABELS[r]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {m.participationRounds.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground">All</span>
                      ) : (
                        <div className="flex gap-1">
                          {m.participationRounds.map((n) => (
                            <span key={n} className="text-[10px] font-medium">R{n}</span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-0.5 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(m)} className="h-6 w-6 p-0">
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onRemove(m.id)} className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ─── Script Section Block ──────────────────────────────────────────────── */

function ScriptSectionBlock({
  section,
  isEditing,
  editValue,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onCopy,
}: {
  section: ScriptSection
  isEditing: boolean
  editValue: string
  onEditStart: () => void
  onEditChange: (v: string) => void
  onEditSave: () => void
  onEditCancel: () => void
  onCopy: () => void
}) {
  const typeConfig: Record<ScriptSection["type"], { icon: React.ElementType; color: string; label: string }> = {
    opening: { icon: MessageSquareText, color: "text-primary", label: "Opening" },
    argument: { icon: ShieldCheck, color: "text-amber-600", label: "Argument" },
    question: { icon: BookOpen, color: "text-blue-600", label: "Questions" },
    rebuttal: { icon: AlertTriangle, color: "text-red-600", label: "Rebuttal" },
    transition: { icon: ChevronRight, color: "text-muted-foreground", label: "Transition" },
    guardrail: { icon: ShieldCheck, color: "text-red-600", label: "Guardrail" },
    "capture-notes": { icon: ClipboardList, color: "text-emerald-600", label: "Capture" },
    closing: { icon: Check, color: "text-emerald-600", label: "Closing" },
  }

  const cfg = typeConfig[section.type]
  const Icon = cfg.icon

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-muted/30">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
        <span className="text-xs font-medium flex-1">{section.heading}</span>
        <Badge variant="outline" className="text-[9px]">{cfg.label}</Badge>
        <Button variant="ghost" size="sm" onClick={onCopy} className="h-5 w-5 p-0">
          <Copy className="h-3 w-3 text-muted-foreground" />
        </Button>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={onEditStart} className="h-5 w-5 p-0">
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>

      <div className="px-3 py-2.5">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              className="text-xs min-h-[120px] font-mono"
            />
            <div className="flex items-center gap-1.5 justify-end">
              <Button variant="ghost" size="sm" onClick={onEditCancel} className="h-6 text-xs">Cancel</Button>
              <Button size="sm" onClick={onEditSave} className="h-6 text-xs">Save</Button>
            </div>
          </div>
        ) : (
          <pre className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans">
            {section.content}
          </pre>
        )}
      </div>

      {/* Evidence refs */}
      {section.evidenceRefs.length > 0 && (
        <div className="px-3 pb-2.5 flex flex-wrap gap-1.5 border-t border-border/30 pt-2">
          {section.evidenceRefs.map((ref, i) => (
            <div key={i} className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px]">
              <BookOpen className="h-2.5 w-2.5 text-muted-foreground" />
              <span>{ref.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Person Script View ────────────────────────────────────────────────── */

function PersonScriptView({ script }: { script: PersonRoundScript }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [sections, setSections] = useState(script.sections)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const rc = TEAM_ROLE_COLORS[script.role]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn("text-[10px]", rc.bg, rc.text)}>
          {TEAM_ROLE_LABELS[script.role]}
        </Badge>
        <span className="text-xs font-medium">{script.memberName}</span>
      </div>

      <div className="space-y-2.5">
        {sections.map((sec) => (
          <ScriptSectionBlock
            key={sec.id}
            section={sec}
            isEditing={editingId === sec.id}
            editValue={editValue}
            onEditStart={() => {
              setEditingId(sec.id)
              setEditValue(sec.content)
            }}
            onEditChange={setEditValue}
            onEditSave={() => {
              setSections((prev) =>
                prev.map((s) => (s.id === sec.id ? { ...s, content: editValue } : s))
              )
              setEditingId(null)
            }}
            onEditCancel={() => setEditingId(null)}
            onCopy={() => handleCopy(sec.content, sec.id)}
          />
        ))}
      </div>

      {/* Watch-outs */}
      {script.watchOuts.length > 0 && (
        <div className="rounded-md bg-amber-50 border border-amber-200/50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1.5">Watch-outs</p>
          <ul className="space-y-1">
            {script.watchOuts.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-amber-800">
                <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Do not concede */}
      {script.doNotConcede.length > 0 && (
        <div className="rounded-md bg-red-50 border border-red-200/50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-700 mb-1.5">Do Not Concede</p>
          <ul className="space-y-1">
            {script.doNotConcede.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-red-800">
                <ShieldCheck className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ─── Round Detail Panel ────────────────────────────────────────────────── */

function RoundScriptDetail({
  roundScript,
  personFilter,
}: {
  roundScript: RoundScript
  personFilter: string // "all" or member id
}) {
  const [expandedAgenda, setExpandedAgenda] = useState(true)
  const [expandedGiveGet, setExpandedGiveGet] = useState(false)
  const [copiedMaster, setCopiedMaster] = useState(false)
  const cfg = ROUND_PURPOSE_CONFIG[roundScript.purpose]

  const filteredPersonScripts = personFilter === "all"
    ? roundScript.personScripts
    : roundScript.personScripts.filter((ps) => ps.memberId === personFilter)

  const totalDuration = roundScript.agenda.reduce((acc, a) => acc + a.durationMinutes, 0)

  return (
    <div className="space-y-4">
      {/* Round header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 border-primary bg-primary text-primary-foreground">
          R{roundScript.roundNumber}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{roundScript.roundName}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className={cn("text-[9px]", cfg.bg, cfg.color)}>
              {cfg.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              ~{totalDuration} min
            </span>
            <Badge variant="outline" className="text-[10px]">
              {roundScript.personScripts.length} scripts
            </Badge>
          </div>
        </div>
      </div>

      {/* Agenda */}
      <Card>
        <button
          onClick={() => setExpandedAgenda(!expandedAgenda)}
          className="w-full flex items-center gap-2 px-4 py-3 text-left"
        >
          <ClipboardList className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-semibold flex-1">Agenda & Timing</span>
          <Badge variant="outline" className="text-[10px]">{roundScript.agenda.length} items</Badge>
          {expandedAgenda ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
        {expandedAgenda && (
          <CardContent className="pt-0 pb-3">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] w-8">#</TableHead>
                    <TableHead className="text-[10px]">Item</TableHead>
                    <TableHead className="text-[10px]">Owner</TableHead>
                    <TableHead className="text-[10px] text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roundScript.agenda.map((item) => {
                    const rc = TEAM_ROLE_COLORS[item.ownerRole]
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs font-medium text-muted-foreground">{item.order}</TableCell>
                        <TableCell>
                          <p className="text-xs font-medium">{item.title}</p>
                          {item.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{item.notes}</p>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{item.ownerName}</span>
                            <Badge variant="outline" className={cn("text-[9px]", rc.bg, rc.text)}>
                              {TEAM_ROLE_LABELS[item.ownerRole]}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{item.durationMinutes}m</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Master Script */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <CardTitle className="text-xs">Master Round Script</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(roundScript.masterScript)
                setCopiedMaster(true)
                setTimeout(() => setCopiedMaster(false), 1500)
              }}
              className="h-6 text-xs gap-1"
            >
              {copiedMaster ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedMaster ? "Copied" : "Copy"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <pre className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans bg-muted/30 rounded-md px-3 py-2.5">
            {roundScript.masterScript}
          </pre>
        </CardContent>
      </Card>

      {/* Give/Get Guidance */}
      {roundScript.giveGetGuidance.length > 0 && (
        <Card>
          <button
            onClick={() => setExpandedGiveGet(!expandedGiveGet)}
            className="w-full flex items-center gap-2 px-4 py-3 text-left"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold flex-1">Give / Get Guidance</span>
            <Badge variant="outline" className="text-[10px]">{roundScript.giveGetGuidance.length}</Badge>
            {expandedGiveGet ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
          {expandedGiveGet && (
            <CardContent className="pt-0 pb-3">
              <div className="space-y-2">
                {roundScript.giveGetGuidance.map((gg, i) => (
                  <div key={i} className="rounded-md border px-3 py-2.5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-0.5">Can Give</p>
                        <p className="text-xs">{gg.canGive}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-0.5">Must Get</p>
                        <p className="text-xs">{gg.mustGet}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      <span className="font-medium text-foreground">Condition:</span> {gg.condition}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Guardrails */}
      {roundScript.guardrails.length > 0 && (
        <div className="rounded-md bg-red-50 border border-red-200/50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-700 mb-1.5">Guardrails (All Participants)</p>
          <ul className="space-y-1">
            {roundScript.guardrails.map((g, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-red-800">
                <Lock className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Separator />

      {/* Person Scripts */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Individual Scripts ({filteredPersonScripts.length})
        </p>
        {filteredPersonScripts.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No scripts for this member in this round.</p>
        ) : (
          <div className="space-y-5">
            {filteredPersonScripts.map((ps) => (
              <PersonScriptView key={ps.id} script={ps} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── AI Notes Panel ────────────────────────────────────────────────────── */

function AiNotesPanel({ scriptPack, team }: { scriptPack: ScriptPack; team: NegotiationTeamMember[] }) {
  const hasLead = team.some((m) => m.roles.includes("lead-negotiator"))
  const hasAnalyst = team.some((m) => m.roles.includes("analyst"))
  const hasNoteTaker = team.some((m) => m.roles.includes("note-taker"))

  const gaps: string[] = []
  if (!hasLead) gaps.push("No Lead Negotiator assigned -- opening/closing scripts may be incomplete")
  if (!hasAnalyst) gaps.push("No Analyst assigned -- data presentation points assigned to lead instead")
  if (!hasNoteTaker) gaps.push("No Note-taker assigned -- consider adding one for decision tracking")
  if (team.length < 2) gaps.push("Team has fewer than 2 members -- scripts assume minimal role coverage")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold">AI Generation Notes</h3>
      </div>

      {/* Status */}
      <div className="rounded-md bg-primary/5 border border-primary/10 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Script Pack</p>
        <div className="space-y-1 text-[11px]">
          <p>Version: <span className="font-medium">{scriptPack.version}</span></p>
          <p>Status: <Badge variant="outline" className="text-[9px]">{scriptPack.status}</Badge></p>
          <p>Source: <span className="font-medium">{scriptPack.source === "ai" ? "AI-generated" : "User-edited"}</span></p>
          <p>Rounds: <span className="font-medium">{scriptPack.roundScripts.length}</span></p>
        </div>
      </div>

      {/* Coverage */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Role Coverage</p>
        <div className="space-y-1.5">
          {ALL_ROLES.filter((r) => r !== "other").map((r) => {
            const members = team.filter((m) => m.roles.includes(r))
            const rc = TEAM_ROLE_COLORS[r]
            return (
              <div key={r} className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full shrink-0", members.length > 0 ? "bg-emerald-400" : "bg-muted-foreground/20")} />
                <span className={cn("text-[11px] flex-1", members.length > 0 ? "text-foreground" : "text-muted-foreground")}>
                  {TEAM_ROLE_LABELS[r]}
                </span>
                {members.length > 0 ? (
                  <span className="text-[10px] text-muted-foreground">{members.map((m) => m.name.split(" ")[0]).join(", ")}</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground/50">--</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Gaps */}
      {gaps.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-2">Gaps & Assumptions</p>
          <div className="space-y-1.5">
            {gaps.map((g, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-800">
                <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                {g}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assumptions */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Generation Assumptions</p>
        <ul className="space-y-1 text-[11px] text-muted-foreground">
          <li>{"- Scripts are grounded in Negotiation Plan rounds and arguments"}</li>
          <li>{"- Evidence references link to Fact Base items"}</li>
          <li>{"- Guardrails enforce LAA floors from Must-have objectives"}</li>
          <li>{"- Agenda timing is estimated; adjust based on meeting format"}</li>
        </ul>
      </div>
    </div>
  )
}

/* ─── Main Section ──────────────────────────────────────────────────────── */

export function TeamScriptsSection({ workspace, onUpdate }: TeamScriptsSectionProps) {
  const [team, setTeam] = useState<NegotiationTeamMember[]>([...DEFAULT_TEAM])
  const [scriptPack, setScriptPack] = useState<ScriptPack | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<NegotiationTeamMember | null>(null)
  const [selectedRoundIdx, setSelectedRoundIdx] = useState(0)
  const [personFilter, setPersonFilter] = useState("all")
  const [generating, setGenerating] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(true)

  const planSet = useMemo(() => generateNegotiationPlan(workspace), [workspace])
  const maxRounds = planSet.plans.reduce((acc, p) => Math.max(acc, p.rounds.length), 0)

  const hasPrereqs =
    workspace.objectives.length > 0 &&
    workspace.arguments.length > 0 &&
    workspace.levers.length > 0

  const handleAddMember = () => {
    setEditingMember(null)
    setDialogOpen(true)
  }

  const handleEditMember = (m: NegotiationTeamMember) => {
    setEditingMember(m)
    setDialogOpen(true)
  }

  const handleSaveMember = (m: NegotiationTeamMember) => {
    setTeam((prev) => {
      const idx = prev.findIndex((x) => x.id === m.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = m
        return next
      }
      return [...prev, m]
    })
  }

  const handleRemoveMember = (id: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== id))
  }

  const handleGenerate = useCallback(() => {
    if (team.length === 0 || planSet.plans.length === 0) return
    setGenerating(true)
    // Simulate brief generation delay
    setTimeout(() => {
      const pack = generateScriptPack(workspace, team, planSet)
      setScriptPack(pack)
      setSelectedRoundIdx(0)
      setPersonFilter("all")
      setGenerating(false)
    }, 800)
  }, [workspace, team, planSet])

  // Not enough upstream data
  if (!hasPrereqs) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Team & Scripts</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Assign team roles and generate per-person, per-round negotiation scripts
          </p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <UsersRound className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Complete upstream sections first</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Team & Scripts requires a generated Negotiation Plan. Complete Objectives, Levers,
                and Negotiation Plan sections to unlock script generation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedRoundScript = scriptPack?.roundScripts[selectedRoundIdx] ?? null

  // Get unique team members from personScripts for filter
  const memberOptions = scriptPack
    ? Array.from(
      new Map(
        scriptPack.roundScripts
          .flatMap((rs) => rs.personScripts)
          .map((ps) => [ps.memberId, ps.memberName])
      ).entries()
    )
    : []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Team & Scripts</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Assign team roles, generate per-person scripts, and prepare round-by-round briefs
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {scriptPack && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="h-7 text-xs gap-1"
            >
              <Eye className="h-3 w-3" />
              {showAiPanel ? "Hide" : "Show"} AI Notes
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={team.length === 0 || planSet.plans.length === 0 || generating}
            className="h-7 text-xs gap-1"
          >
            <Sparkles className="h-3 w-3" />
            {generating ? "Generating..." : scriptPack ? "Regenerate Scripts" : "Generate Scripts"}
          </Button>
        </div>
      </div>

      {/* Team Roster */}
      <TeamRoster
        team={team}
        onAdd={handleAddMember}
        onEdit={handleEditMember}
        onRemove={handleRemoveMember}
        maxRounds={maxRounds}
      />

      {/* Member Dialog */}
      <MemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={editingMember}
        onSave={handleSaveMember}
        maxRounds={maxRounds}
      />

      {/* Scripts Area */}
      {scriptPack && (
        <>
          <Separator />

          {/* Stats */}
          <div className="grid gap-3 md:grid-cols-4">
            <Card>
              <CardContent className="py-3 px-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rounds</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{scriptPack.roundScripts.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 px-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Person Scripts</p>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  {scriptPack.roundScripts.reduce((acc, rs) => acc + rs.personScripts.length, 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 px-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Team Members</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{team.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 px-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pack Status</p>
                <Badge variant="outline" className="text-[10px] mt-1.5">
                  v{scriptPack.version} &middot; {scriptPack.status}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Selectors */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Round:</span>
              <div className="flex gap-1">
                {scriptPack.roundScripts.map((rs, idx) => {
                  const cfg = ROUND_PURPOSE_CONFIG[rs.purpose]
                  return (
                    <button
                      key={rs.id}
                      onClick={() => setSelectedRoundIdx(idx)}
                      className={cn(
                        "h-8 rounded-md border px-3 text-xs font-medium transition-colors flex items-center gap-1.5",
                        idx === selectedRoundIdx
                          ? "bg-primary text-primary-foreground border-primary"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      R{rs.roundNumber}
                      <Badge variant="outline" className={cn("text-[8px] py-0", idx === selectedRoundIdx ? "border-primary-foreground/30 text-primary-foreground" : cn(cfg.bg, cfg.color))}>
                        {cfg.label}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Person:</span>
              <Select value={personFilter} onValueChange={setPersonFilter}>
                <SelectTrigger className="h-8 text-xs w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Team</SelectItem>
                  {memberOptions.map(([id, name]) => (
                    <SelectItem key={id} value={id} className="text-xs">{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main content area: scripts + AI panel */}
          <div className="flex gap-5">
            {/* Scripts column */}
            <div className="flex-1 min-w-0">
              {selectedRoundScript && (
                <RoundScriptDetail
                  roundScript={selectedRoundScript}
                  personFilter={personFilter}
                />
              )}
            </div>

            {/* AI Notes side panel */}
            {showAiPanel && (
              <div className="w-64 shrink-0">
                <div className="sticky top-4">
                  <AiNotesPanel scriptPack={scriptPack} team={team} />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty state when no scripts generated yet */}
      {!scriptPack && team.length > 0 && (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium">Ready to generate scripts</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Your team roster is set with {team.length} member(s) and {planSet.plans.length} supplier plan(s) available.
                Click "Generate Scripts" to create per-person, per-round negotiation briefs.
              </p>
              <Button size="sm" onClick={handleGenerate} className="mt-4 text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                Generate Scripts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
