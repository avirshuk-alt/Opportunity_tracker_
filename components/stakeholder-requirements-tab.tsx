"use client"

import React, { useState, useCallback } from "react"
import {
  users,
  initiatives,
  getStrategyByCategory,
  getUserById,
  getRequirementsByCategory,
  getObjectivesByCategory,
  getStakeholderProfiles,
  createRequirement,
  objectives as allObjectives,
  type BusinessRequirement,
  type RequirementDriver,
  type RequirementPriority,
  type RequirementStatus,
  type Objective,
  type StakeholderProfile,
} from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetFooter,
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
  Plus,
  Search,
  Users,
  ClipboardList,
  Target,
  Filter,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Link2,
  Link2Off,
  Sparkles,
  RefreshCw,
  Loader2,
  FileText,
  MessageSquare,
  CalendarDays,
  Send,
  Eye,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// ─── Styling maps ────────────────────────────────────────────────────────────

const driverColors: Record<string, string> = {
  Cost: "bg-sky-50 text-sky-700 border-sky-200",
  Risk: "bg-red-50 text-red-700 border-red-200",
  Growth: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Compliance: "bg-amber-50 text-amber-700 border-amber-200",
  Resilience: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Sustainability: "bg-teal-50 text-teal-700 border-teal-200",
}

const priorityColors: Record<string, string> = {
  Must: "bg-red-50 text-red-700 border-red-200",
  Should: "bg-amber-50 text-amber-700 border-amber-200",
  Could: "bg-slate-100 text-slate-600 border-slate-200",
}

const statusColors: Record<string, string> = {
  Proposed: "bg-slate-100 text-slate-600 border-slate-200",
  Validated: "bg-sky-50 text-sky-700 border-sky-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const influenceColors: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600 border-slate-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const functionColors: Record<string, string> = {
  Procurement: "bg-primary/10 text-primary border-primary/20",
  "Sales Ops": "bg-sky-50 text-sky-700 border-sky-200",
  Finance: "bg-amber-50 text-amber-700 border-amber-200",
  Operations: "bg-teal-50 text-teal-700 border-teal-200",
  Legal: "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Field Service": "bg-red-50 text-red-700 border-red-200",
  EHS: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

// ─── Engagement Assistant types ──────────────────────────────────────────────

interface EngagementPlan {
  questions: string[]
  agenda: string[]
  objections: { objection: string; response: string }[]
  artifacts: { name: string; description: string }[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function StakeholderRequirementsTab({ categoryId }: { categoryId: string }) {
  const strategy = getStrategyByCategory(categoryId)
  const requirements = getRequirementsByCategory(categoryId)
  const categoryObjectives = getObjectivesByCategory(categoryId)
  const profiles = getStakeholderProfiles()

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [filterFunction, setFilterFunction] = useState<string>("all")
  const [filterDriver, setFilterDriver] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterLinked, setFilterLinked] = useState<string>("all")

  // Selected requirement for drawer
  const [selectedReq, setSelectedReq] = useState<BusinessRequirement | null>(null)
  const [drawerTab, setDrawerTab] = useState("details")

  // Stakeholder detail
  const [selectedStakeholder, setSelectedStakeholder] = useState<StakeholderProfile | null>(null)

  // Engagement plan state
  const [engagementPlan, setEngagementPlan] = useState<EngagementPlan | null>(null)
  const [engagementLoading, setEngagementLoading] = useState(false)
  const [engagementChat, setEngagementChat] = useState("")

  // Local promoted objectives (stub adapter)
  const [localObjectives, setLocalObjectives] = useState<Objective[]>([])

  // ─── Add Requirement drawer state ─────────────────────────────────
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [addMode, setAddMode] = useState<"form" | "chat">("form")
  const [localReqs, setLocalReqs] = useState<BusinessRequirement[]>([])

  // Form fields
  const emptyForm = {
    statement: "",
    stakeholderName: "",
    function: "" as string,
    driver: "" as string,
    priority: "" as string,
    status: "Proposed" as string,
    metricTarget: "",
    evidence: "",
    dueDate: "",
  }
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Chat mode state
  interface ChatMsg { role: "assistant" | "user"; text: string }
  const chatQuestions = [
    "What is the business requirement?",
    "Who is this coming from (name)?",
    "What function are they in? (Finance, Sales Ops, Operations, Legal, Field Service, Procurement, EHS, Other)",
    "How will we measure success? (metric/target -- optional, type 'skip' to skip)",
    "Priority: Must, Should, or Could? (optional, type 'skip' to skip)",
  ]
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatStep, setChatStep] = useState(0)
  const [chatInput, setChatInput] = useState("")
  const [chatFields, setChatFields] = useState<Record<string, string>>({})

  const resetAddDrawer = useCallback(() => {
    setForm(emptyForm)
    setFormErrors({})
    setChatMessages([])
    setChatStep(0)
    setChatInput("")
    setChatFields({})
    setAddMode("form")
  }, [])

  const openAddDrawer = useCallback(() => {
    resetAddDrawer()
    setAddDrawerOpen(true)
    setChatMessages([{ role: "assistant", text: chatQuestions[0] }])
  }, [resetAddDrawer])

  // Validate form
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}
    if (!form.statement.trim()) errors.statement = "Requirement statement is required"
    if (!form.stakeholderName.trim()) errors.stakeholderName = "Stakeholder name is required"
    if (!form.function) errors.function = "Function is required"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [form])

  // Save requirement (from either mode)
  const saveRequirement = useCallback((fields: {
    statement: string
    stakeholderName: string
    function: string
    driver?: string
    priority?: string
    status?: string
    metricTarget?: string
    evidence?: string
    dueDate?: string
  }) => {
    const matchedProfile = profiles.find(
      (p) => p.name.toLowerCase() === fields.stakeholderName.toLowerCase()
    )
    const newReq = createRequirement({
      title: fields.statement.length > 60 ? `${fields.statement.substring(0, 60)}...` : fields.statement,
      statement: fields.statement,
      stakeholderId: matchedProfile?.userId ?? "u-unknown",
      stakeholderName: fields.stakeholderName,
      function: fields.function || "Other",
      driver: (fields.driver || "Cost") as RequirementDriver,
      priority: (fields.priority || "Should") as RequirementPriority,
      status: (fields.status || "Proposed") as RequirementStatus,
      metricTarget: fields.metricTarget || undefined,
      evidence: fields.evidence || undefined,
      dueDate: fields.dueDate || undefined,
      objectiveId: undefined,
      constraints: undefined,
    })
    setLocalReqs((prev) => [...prev, newReq])
    setAddDrawerOpen(false)
    resetAddDrawer()
  }, [profiles, resetAddDrawer])

  const handleFormSave = useCallback(() => {
    if (!validateForm()) return
    saveRequirement(form)
  }, [form, validateForm, saveRequirement])

  const handleChatSend = useCallback(() => {
    if (!chatInput.trim()) return
    const newMessages: ChatMsg[] = [...chatMessages, { role: "user", text: chatInput.trim() }]
    const updatedFields = { ...chatFields }
    const input = chatInput.trim()

    switch (chatStep) {
      case 0: updatedFields.statement = input; break
      case 1: updatedFields.stakeholderName = input; break
      case 2: updatedFields.function = input; break
      case 3: if (input.toLowerCase() !== "skip") updatedFields.metricTarget = input; break
      case 4: if (input.toLowerCase() !== "skip") updatedFields.priority = input; break
    }

    setChatFields(updatedFields)
    setChatInput("")

    const nextStep = chatStep + 1
    if (nextStep < chatQuestions.length) {
      setChatStep(nextStep)
      newMessages.push({ role: "assistant", text: chatQuestions[nextStep] })
      setChatMessages(newMessages)
    } else {
      newMessages.push({
        role: "assistant",
        text: "Got it! Here is what I captured. Click \"Save Requirement\" to add it, or continue chatting to refine.",
      })
      setChatMessages(newMessages)
      setChatStep(nextStep)
    }
  }, [chatInput, chatMessages, chatStep, chatFields, chatQuestions])

  const allRequirements = [...requirements, ...localReqs]

  const filteredRequirements = allRequirements.filter((r) => {
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase()) && !r.stakeholderName.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterFunction !== "all" && r.function !== filterFunction) return false
    if (filterDriver !== "all" && r.driver !== filterDriver) return false
    if (filterPriority !== "all" && r.priority !== filterPriority) return false
    if (filterStatus !== "all" && r.status !== filterStatus) return false
    if (filterLinked === "linked" && !r.objectiveId) return false
    if (filterLinked === "unlinked" && r.objectiveId) return false
    return true
  })

  const uniqueFunctions = Array.from(new Set(allRequirements.map((r) => r.function)))
  const uniqueDrivers = Array.from(new Set(allRequirements.map((r) => r.driver)))

  const groupedProfiles = profiles.reduce<Record<string, StakeholderProfile[]>>((acc, p) => {
    if (!acc[p.function]) acc[p.function] = []
    acc[p.function].push(p)
    return acc
  }, {})

  const totalReqs = allRequirements.length
  const approvedReqs = allRequirements.filter((r) => r.status === "Approved").length
  const linkedReqs = allRequirements.filter((r) => r.objectiveId).length
  const missingMetric = allRequirements.filter((r) => !r.metricTarget).length

  const handlePromote = useCallback(
    (req: BusinessRequirement) => {
      const newObj: Objective = {
        id: `obj-local-${Date.now()}`,
        title: req.title,
        description: req.statement,
        metricTarget: req.metricTarget,
        owner: req.stakeholderName,
        ownerId: req.stakeholderId,
        targetDate: req.dueDate,
        requirementIds: [req.id],
        categoryId,
      }
      setLocalObjectives((prev) => [...prev, newObj])
      req.objectiveId = newObj.id
      setSelectedReq({ ...req })
    },
    [categoryId]
  )

  const fetchEngagementPlan = useCallback(async (req: BusinessRequirement) => {
    setEngagementLoading(true)
    setEngagementPlan(null)
    try {
      const res = await fetch("/api/stakeholder-engagement-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stakeholder: req.stakeholderName,
          function: req.function,
          requirementText: req.title,
          contextNotes: req.evidence,
        }),
      })
      const data = await res.json()
      setEngagementPlan(data)
    } catch {
      setEngagementPlan(null)
    } finally {
      setEngagementLoading(false)
    }
  }, [])

  const allObjs = [...categoryObjectives, ...localObjectives]

  return (
    <div className="space-y-6">
      {/* ─── Add Requirement Button ───────────────────────────── */}
      <div className="flex items-center justify-between">
        <div />
        <Button size="sm" onClick={openAddDrawer}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Requirement
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Requirements</p>
            <p className="text-xl font-bold mt-1">{totalReqs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Approved</p>
            <p className="text-xl font-bold mt-1 text-emerald-600">{approvedReqs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Linked to Objectives</p>
            <p className="text-xl font-bold mt-1">{linkedReqs}/{totalReqs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Missing Metric</p>
            <p className="text-xl font-bold mt-1 text-amber-600">{missingMetric}</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Stakeholder Map ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Stakeholder Map</CardTitle>
            <span className="text-xs text-muted-foreground">by Function</span>
          </div>
        </CardHeader>
        <CardContent className="pb-4 px-4 pt-0">
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {Object.entries(groupedProfiles).map(([fn, members]) => (
              <div key={fn} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-2.5">
                  <Badge variant="outline" className={cn("text-[10px]", functionColors[fn] ?? "")}>
                    {fn}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{members.length} stakeholder{members.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {members.map((m) => (
                    <button
                      key={m.userId}
                      type="button"
                      className="flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-left hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedStakeholder(m)}
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                          {m.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{m.title}</p>
                      </div>
                      <Badge variant="outline" className={cn("text-[9px] shrink-0", influenceColors[m.influence])}>
                        {m.influence}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Business Requirements Table ──────────────────────────── */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Business Requirements</CardTitle>
              <span className="text-xs text-muted-foreground">{filteredRequirements.length} of {totalReqs}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search requirements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-52 pl-8 text-xs"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Filters row */}
        <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={filterFunction} onValueChange={setFilterFunction}>
            <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs"><SelectValue placeholder="Function" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Functions</SelectItem>
              {uniqueFunctions.map((f) => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterDriver} onValueChange={setFilterDriver}>
            <SelectTrigger className="h-7 w-auto min-w-[90px] text-xs"><SelectValue placeholder="Driver" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Drivers</SelectItem>
              {uniqueDrivers.map((d) => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-7 w-auto min-w-[80px] text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Priorities</SelectItem>
              <SelectItem value="Must" className="text-xs">Must</SelectItem>
              <SelectItem value="Should" className="text-xs">Should</SelectItem>
              <SelectItem value="Could" className="text-xs">Could</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-7 w-auto min-w-[80px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="Proposed" className="text-xs">Proposed</SelectItem>
              <SelectItem value="Validated" className="text-xs">Validated</SelectItem>
              <SelectItem value="Approved" className="text-xs">Approved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterLinked} onValueChange={setFilterLinked}>
            <SelectTrigger className="h-7 w-auto min-w-[80px] text-xs"><SelectValue placeholder="Linkage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All</SelectItem>
              <SelectItem value="linked" className="text-xs">Linked</SelectItem>
              <SelectItem value="unlinked" className="text-xs">Unlinked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <CardContent className="p-0">
          {filteredRequirements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-sm font-semibold mb-1">No requirements found</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {totalReqs === 0 ? "Add your first requirement to get started." : "Try adjusting your filters."}
              </p>
              {totalReqs === 0 && (
                <Button size="sm" onClick={openAddDrawer}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add your first requirement
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Requirement</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Function</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Metric</TableHead>
                  <TableHead className="text-center">Objective</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequirements.map((req) => (
                  <TableRow
                    key={req.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => {
                      setSelectedReq(req)
                      setDrawerTab("details")
                      setEngagementPlan(null)
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium line-clamp-1">{req.title}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                            {req.stakeholderName.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{req.stakeholderName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", functionColors[req.function] ?? "")}>
                        {req.function}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", driverColors[req.driver])}>
                        {req.driver}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", priorityColors[req.priority])}>
                        {req.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", statusColors[req.status])}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {req.metricTarget ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mx-auto" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {req.objectiveId ? (
                        <Link2 className="h-3.5 w-3.5 text-primary mx-auto" />
                      ) : (
                        <Link2Off className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{req.updatedAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ─── Stakeholder Detail Sheet ─────────────────────────────── */}
      <Sheet open={!!selectedStakeholder} onOpenChange={(open) => !open && setSelectedStakeholder(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {selectedStakeholder && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedStakeholder.name}</SheetTitle>
                <SheetDescription>{selectedStakeholder.title}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Function</p>
                    <Badge variant="outline" className={cn("text-xs", functionColors[selectedStakeholder.function] ?? "")}>
                      {selectedStakeholder.function}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Influence</p>
                    <Badge variant="outline" className={cn("text-xs", influenceColors[selectedStakeholder.influence])}>
                      {selectedStakeholder.influence}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Last Touchpoint</p>
                    <p className="text-sm">{selectedStakeholder.lastTouchpoint}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Next Touchpoint</p>
                    <p className="text-sm">{selectedStakeholder.nextTouchpoint}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{selectedStakeholder.notes}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Requirements from this stakeholder</p>
                  {allRequirements.filter((r) => r.stakeholderId === selectedStakeholder.userId).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No requirements from this stakeholder yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {allRequirements.filter((r) => r.stakeholderId === selectedStakeholder.userId).map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className="flex items-center gap-2 w-full rounded-md border p-2.5 text-left hover:bg-muted/30 transition-colors"
                          onClick={() => {
                            setSelectedStakeholder(null)
                            setTimeout(() => {
                              setSelectedReq(r)
                              setDrawerTab("details")
                              setEngagementPlan(null)
                            }, 200)
                          }}
                        >
                          <ClipboardList className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{r.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className={cn("text-[9px]", priorityColors[r.priority])}>{r.priority}</Badge>
                              <Badge variant="outline" className={cn("text-[9px]", statusColors[r.status])}>{r.status}</Badge>
                            </div>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Requirement Detail Sheet ─────────────────────────────── */}
      <Sheet open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
          {selectedReq && (
            <div className="flex flex-col h-full">
              <div className="p-6 pb-0">
                <SheetHeader>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className={cn("text-[10px]", priorityColors[selectedReq.priority])}>
                      {selectedReq.priority}
                    </Badge>
                    <Badge variant="outline" className={cn("text-[10px]", statusColors[selectedReq.status])}>
                      {selectedReq.status}
                    </Badge>
                    <Badge variant="outline" className={cn("text-[10px]", driverColors[selectedReq.driver])}>
                      {selectedReq.driver}
                    </Badge>
                  </div>
                  <SheetTitle className="text-base">{selectedReq.title}</SheetTitle>
                </SheetHeader>

                {!selectedReq.objectiveId ? (
                  <Button size="sm" className="mt-3 w-full" onClick={() => handlePromote(selectedReq)}>
                    <Target className="mr-1.5 h-3.5 w-3.5" />
                    Promote to Objective
                  </Button>
                ) : (
                  <div className="mt-3 flex items-center gap-2 rounded-md bg-emerald-50 p-2.5">
                    <Link2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <p className="text-xs text-emerald-700 font-medium">
                      Linked to Objective: {allObjs.find((o) => o.id === selectedReq.objectiveId)?.title ?? selectedReq.objectiveId}
                    </p>
                  </div>
                )}
              </div>

              <Tabs value={drawerTab} onValueChange={setDrawerTab} className="flex-1 flex flex-col mt-4">
                <TabsList className="mx-6 w-auto">
                  <TabsTrigger value="details" className="text-xs">
                    <FileText className="mr-1 h-3 w-3" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="mapping" className="text-xs">
                    <Link2 className="mr-1 h-3 w-3" />
                    Mapping
                  </TabsTrigger>
                  <TabsTrigger value="engagement" className="text-xs">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    Engagement
                  </TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="flex-1 overflow-y-auto px-6 pb-6 mt-4 space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Full Requirement</p>
                    <p className="text-sm leading-relaxed">{selectedReq.statement}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Stakeholder</p>
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                            {selectedReq.stakeholderName.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{selectedReq.stakeholderName}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Function</p>
                      <Badge variant="outline" className={cn("text-xs", functionColors[selectedReq.function] ?? "")}>
                        {selectedReq.function}
                      </Badge>
                    </div>
                  </div>
                  {selectedReq.evidence && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Evidence / Source</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selectedReq.evidence}</p>
                    </div>
                  )}
                  {selectedReq.constraints && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Constraints / Dependencies</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selectedReq.constraints}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Metric / Target</p>
                      {selectedReq.metricTarget ? (
                        <p className="text-sm font-medium">{selectedReq.metricTarget}</p>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-xs">Add a measurable target</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Due Date</p>
                      <p className="text-sm">{selectedReq.dueDate ?? "Not set"}</p>
                    </div>
                  </div>
                </TabsContent>

                {/* Mapping Tab */}
                <TabsContent value="mapping" className="flex-1 overflow-y-auto px-6 pb-6 mt-4 space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedReq.tags.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No tags</span>
                      ) : (
                        selectedReq.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Impacted Modules / Workstreams</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedReq.impactedModules.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">None mapped</span>
                      ) : (
                        selectedReq.impactedModules.map((mod) => (
                          <Badge key={mod} variant="secondary" className="text-[10px]">{mod}</Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Related Requirements</p>
                    {allRequirements.filter((r) => r.id !== selectedReq.id && r.driver === selectedReq.driver).length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">No related requirements</span>
                    ) : (
                      <div className="space-y-1.5">
                        {allRequirements
                          .filter((r) => r.id !== selectedReq.id && r.driver === selectedReq.driver)
                          .slice(0, 3)
                          .map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              className="flex items-center gap-2 w-full rounded border p-2 text-left hover:bg-muted/30 transition-colors"
                              onClick={() => {
                                setSelectedReq(r)
                                setEngagementPlan(null)
                              }}
                            >
                              <span className="text-xs font-medium flex-1 truncate">{r.title}</span>
                              <Badge variant="outline" className={cn("text-[9px]", driverColors[r.driver])}>{r.driver}</Badge>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Engagement Tab */}
                <TabsContent value="engagement" className="flex-1 overflow-y-auto px-6 pb-6 mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">AI-Assisted Engagement Plan</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={engagementLoading}
                      onClick={() => fetchEngagementPlan(selectedReq)}
                    >
                      {engagementLoading ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : engagementPlan ? (
                        <RefreshCw className="mr-1 h-3 w-3" />
                      ) : (
                        <Sparkles className="mr-1 h-3 w-3" />
                      )}
                      {engagementPlan ? "Refresh Plan" : "Generate Plan"}
                    </Button>
                  </div>

                  {engagementLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}

                  {engagementPlan && !engagementLoading && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Recommended Next Questions</p>
                        <ul className="space-y-1.5">
                          {engagementPlan.questions.map((q, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                              <span className="text-primary font-bold mt-0.5 text-xs shrink-0">{i + 1}.</span>
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Suggested Meeting Agenda</p>
                        <ul className="space-y-1.5">
                          {engagementPlan.agenda.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Likely Objections + Responses</p>
                        <div className="space-y-3">
                          {engagementPlan.objections.map((o, i) => (
                            <div key={i} className="rounded-lg border p-3 space-y-1.5">
                              <p className="text-xs font-medium text-destructive">{o.objection}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{o.response}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Recommended Artifacts to Share</p>
                        <div className="space-y-1.5">
                          {engagementPlan.artifacts.map((a, i) => (
                            <div key={i} className="flex items-start gap-2 rounded border p-2.5">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-medium">{a.name}</p>
                                <p className="text-[10px] text-muted-foreground">{a.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {!engagementPlan && !engagementLoading && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium mb-1">No engagement plan yet</p>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        Click &quot;Generate Plan&quot; to get AI-assisted engagement suggestions for {selectedReq.stakeholderName}.
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Ask AI</p>
                    <div className="flex gap-2">
                      <Textarea
                        value={engagementChat}
                        onChange={(e) => setEngagementChat(e.target.value)}
                        placeholder="Ask a follow-up question about engagement strategy..."
                        className="text-xs min-h-[60px]"
                        rows={2}
                      />
                    </div>
                    <Button size="sm" className="mt-2 w-full" disabled={!engagementChat.trim()}>
                      <Sparkles className="mr-1.5 h-3 w-3" />
                      Ask
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Add Requirement Sheet ─────────────────────────────────── */}
      <Sheet open={addDrawerOpen} onOpenChange={(open) => { if (!open) { setAddDrawerOpen(false); resetAddDrawer() } }}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <div className="p-6 pb-0">
            <SheetHeader>
              <SheetTitle className="text-base">Add Requirement</SheetTitle>
              <SheetDescription>Capture a new business requirement via form or guided chat.</SheetDescription>
            </SheetHeader>

            <Tabs value={addMode} onValueChange={(v) => setAddMode(v as "form" | "chat")} className="mt-4">
              <TabsList className="w-full">
                <TabsTrigger value="form" className="flex-1 text-xs">
                  <ClipboardList className="mr-1.5 h-3 w-3" />
                  Form
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex-1 text-xs">
                  <MessageSquare className="mr-1.5 h-3 w-3" />
                  Guided Chat
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Form Mode */}
          {addMode === "form" && (
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="req-statement" className="text-xs font-medium">
                  Requirement Statement <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="req-statement"
                  value={form.statement}
                  onChange={(e) => setForm((f) => ({ ...f, statement: e.target.value }))}
                  placeholder="Describe the business requirement..."
                  rows={3}
                  className={cn("text-sm", formErrors.statement && "border-destructive")}
                />
                {formErrors.statement && <p className="text-[11px] text-destructive">{formErrors.statement}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="req-stakeholder" className="text-xs font-medium">
                  Coming From (Stakeholder) <span className="text-destructive">*</span>
                </Label>
                <Select value={form.stakeholderName} onValueChange={(v) => setForm((f) => ({ ...f, stakeholderName: v }))}>
                  <SelectTrigger className={cn("h-9 text-xs", formErrors.stakeholderName && "border-destructive")}>
                    <SelectValue placeholder="Select stakeholder..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.userId} value={p.name} className="text-xs">
                        {p.name} - {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.stakeholderName && <p className="text-[11px] text-destructive">{formErrors.stakeholderName}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Function <span className="text-destructive">*</span>
                </Label>
                <Select value={form.function} onValueChange={(v) => setForm((f) => ({ ...f, function: v }))}>
                  <SelectTrigger className={cn("h-9 text-xs", formErrors.function && "border-destructive")}>
                    <SelectValue placeholder="Select function..." />
                  </SelectTrigger>
                  <SelectContent>
                    {["Finance", "IT", "Operations", "Legal", "Security", "Procurement", "Other"].map((f) => (
                      <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.function && <p className="text-[11px] text-destructive">{formErrors.function}</p>}
              </div>

              <Separator />

              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Optional Fields</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Driver</Label>
                  <Select value={form.driver} onValueChange={(v) => setForm((f) => ({ ...f, driver: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {["Cost", "Risk", "Growth", "Compliance", "Resilience", "Sustainability"].map((d) => (
                        <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {["Must", "Should", "Could"].map((p) => (
                        <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Proposed", "Validated", "Approved"].map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Metric / Target</Label>
                <Input
                  value={form.metricTarget}
                  onChange={(e) => setForm((f) => ({ ...f, metricTarget: e.target.value }))}
                  placeholder="e.g. 18% TCO reduction by 2028"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Evidence / Source</Label>
                <Textarea
                  value={form.evidence}
                  onChange={(e) => setForm((f) => ({ ...f, evidence: e.target.value }))}
                  placeholder="Supporting evidence or data source..."
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Due Date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}

          {/* Chat Mode */}
          {addMode === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(chatFields).length > 0 && (
                <div className="mx-6 mb-2 rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Captured Fields</span>
                  </div>
                  <div className="space-y-1">
                    {chatFields.statement && (
                      <p className="text-xs"><span className="font-medium text-foreground">Requirement:</span> <span className="text-muted-foreground">{chatFields.statement.length > 80 ? `${chatFields.statement.substring(0, 80)}...` : chatFields.statement}</span></p>
                    )}
                    {chatFields.stakeholderName && (
                      <p className="text-xs"><span className="font-medium text-foreground">From:</span> <span className="text-muted-foreground">{chatFields.stakeholderName}</span></p>
                    )}
                    {chatFields.function && (
                      <p className="text-xs"><span className="font-medium text-foreground">Function:</span> <span className="text-muted-foreground">{chatFields.function}</span></p>
                    )}
                    {chatFields.metricTarget && (
                      <p className="text-xs"><span className="font-medium text-foreground">Metric:</span> <span className="text-muted-foreground">{chatFields.metricTarget}</span></p>
                    )}
                    {chatFields.priority && (
                      <p className="text-xs"><span className="font-medium text-foreground">Priority:</span> <span className="text-muted-foreground">{chatFields.priority}</span></p>
                    )}
                  </div>
                </div>
              )}

              {chatStep < chatQuestions.length && (
                <div className="px-6 pb-4">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend() } }}
                      placeholder="Type your answer..."
                      className="h-9 text-xs flex-1"
                    />
                    <Button size="sm" className="h-9" onClick={handleChatSend} disabled={!chatInput.trim()}>
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <SheetFooter className="p-6 pt-3 border-t bg-card">
            <div className="flex items-center justify-between w-full gap-3">
              <Button variant="outline" size="sm" onClick={() => { setAddDrawerOpen(false); resetAddDrawer() }}>
                Cancel
              </Button>
              {addMode === "form" ? (
                <Button size="sm" onClick={handleFormSave}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Save Requirement
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={!chatFields.statement || !chatFields.stakeholderName || !chatFields.function}
                  onClick={() => saveRequirement({
                    statement: chatFields.statement ?? "",
                    stakeholderName: chatFields.stakeholderName ?? "",
                    function: chatFields.function ?? "",
                    metricTarget: chatFields.metricTarget,
                    priority: chatFields.priority,
                  })}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Save Requirement
                </Button>
              )}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
