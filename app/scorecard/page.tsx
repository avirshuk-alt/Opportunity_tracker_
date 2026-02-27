"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { useCategory } from "@/lib/category-context"
import { getUserById } from "@/lib/data"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Upload,
  Plug2,
  FileText,
  FileSpreadsheet,
  FileType2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  RotateCcw,
  Trash2,
  ChevronRight,
  Database,
  BarChart3,
  Truck,
  Shield,
  Leaf,
  Wrench,
  Gauge,
  ScrollText,
  Receipt,
  ClipboardList,
  ListChecks,
  Package,
  HardDriveUpload,
  Server,
  RefreshCw,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ─── Dataset Definitions ────────────────────────────────────────────────────

interface DatasetDef {
  id: string
  name: string
  description: string
  required: boolean
  icon: React.ElementType
  status: "ready" | "partial" | "not-provided"
  filesCount: number
  rowsIngested: number | null
  qualityScore: number | null
  destination: string
}

const DATASET_DEFS: DatasetDef[] = [
  { id: "spend-cube",      name: "Spend Cube",                       description: "Line-level spend data by supplier, category, GL, cost center", required: true,  icon: BarChart3,    status: "ready",         filesCount: 3, rowsIngested: 184200, qualityScore: 94, destination: "Internal Fact Base" },
  { id: "contracts",       name: "Contracts (CLM + PDFs)",           description: "Contract exports from CLM plus scanned agreements",            required: true,  icon: ScrollText,   status: "partial",       filesCount: 2, rowsIngested: 142,    qualityScore: 78, destination: "Internal Fact Base" },
  { id: "purchase-orders", name: "Purchase Orders (POs)",            description: "PO headers and line items from S2P/ERP",                       required: true,  icon: ClipboardList, status: "ready",        filesCount: 1, rowsIngested: 26400,  qualityScore: 91, destination: "Internal Fact Base" },
  { id: "invoices",        name: "Invoices / AP Data",               description: "Invoice and accounts payable transaction records",             required: true,  icon: Receipt,      status: "not-provided",  filesCount: 0, rowsIngested: null,   qualityScore: null, destination: "Internal Fact Base" },
  { id: "supplier-master", name: "Supplier Master / Vendor List",    description: "Master vendor table with DUNS, addresses, classification",     required: true,  icon: Database,     status: "ready",         filesCount: 1, rowsIngested: 312,    qualityScore: 88, destination: "Supplier Strategy" },
  { id: "item-master",     name: "Item / Vehicle / SKU Master",      description: "SKU-level catalog, vehicle types, asset register",             required: false, icon: Package,      status: "partial",       filesCount: 1, rowsIngested: 1840,   qualityScore: 72, destination: "Internal Fact Base" },
  { id: "rate-cards",      name: "Rate Cards / Lease Schedules",     description: "Contracted rate cards, lease payment tables, price lists",     required: false, icon: ListChecks,   status: "not-provided",  filesCount: 0, rowsIngested: null,   qualityScore: null, destination: "Internal Fact Base" },
  { id: "maintenance",     name: "Maintenance & Repair History",     description: "Work orders, service records, parts spend",                    required: false, icon: Wrench,       status: "ready",         filesCount: 2, rowsIngested: 8920,   qualityScore: 85, destination: "Internal Fact Base" },
  { id: "telematics",      name: "Telematics / Mileage / Utilization", description: "GPS pings, odometer reads, fuel card transactions",         required: false, icon: Gauge,        status: "partial",       filesCount: 1, rowsIngested: 42100,  qualityScore: 68, destination: "Internal Fact Base" },
  { id: "policy",          name: "Policy & Exceptions",              description: "Procurement policies, exception logs, approval matrices",      required: false, icon: Shield,       status: "not-provided",  filesCount: 0, rowsIngested: null,   qualityScore: null, destination: "Risk Management" },
  { id: "claims",          name: "Claims / Insurance Loss Runs",     description: "Insurance claims, accident reports, loss summaries",           required: false, icon: Truck,        status: "not-provided",  filesCount: 0, rowsIngested: null,   qualityScore: null, destination: "Risk Management" },
  { id: "esg",             name: "ESG / Compliance Docs",            description: "Emissions data, diversity certifications, compliance reports", required: false, icon: Leaf,         status: "not-provided",  filesCount: 0, rowsIngested: null,   qualityScore: null, destination: "ESG & Diversity" },
]

// ─── Connector Definitions ──────────────────────────────────────────────────

interface ConnectorDef {
  id: string
  name: string
  type: string
  description: string
  icon: React.ElementType
  status: "connected" | "available" | "coming-soon"
  lastSync: string | null
  datasetsProvided: string[]
}

const CONNECTORS: ConnectorDef[] = [
  { id: "sap-ariba",   name: "SAP Ariba",             type: "S2P",         description: "Source-to-pay: POs, contracts, spend analytics",             icon: Server,   status: "connected",    lastSync: "2025-02-12 09:14", datasetsProvided: ["spend-cube", "purchase-orders", "contracts"] },
  { id: "coupa",       name: "Coupa",                 type: "S2P",         description: "Procurement, invoicing, and supplier management",            icon: Server,   status: "available",    lastSync: null,                datasetsProvided: ["spend-cube", "purchase-orders", "invoices"] },
  { id: "icertis",     name: "Icertis",               type: "CLM",         description: "Contract lifecycle management and compliance",               icon: ScrollText, status: "available",  lastSync: null,                datasetsProvided: ["contracts"] },
  { id: "sap-erp",     name: "SAP S/4HANA",           type: "ERP / AP",    description: "ERP financials, AP, vendor master, purchase history",        icon: Database, status: "connected",    lastSync: "2025-02-11 22:00", datasetsProvided: ["invoices", "supplier-master", "purchase-orders"] },
  { id: "geotab",      name: "Geotab",                type: "Telematics",  description: "Fleet telematics, GPS tracking, driver behavior",            icon: Gauge,    status: "connected",    lastSync: "2025-02-12 06:00", datasetsProvided: ["telematics"] },
  { id: "element",     name: "Element Fleet",         type: "FMC",         description: "Fleet management: leasing, maintenance, fuel",               icon: Truck,    status: "available",    lastSync: null,                datasetsProvided: ["rate-cards", "maintenance", "item-master"] },
  { id: "concur",      name: "SAP Concur",            type: "Expense",     description: "Travel and expense management",                              icon: Receipt,  status: "coming-soon",  lastSync: null,                datasetsProvided: ["invoices"] },
  { id: "ecovadis",    name: "EcoVadis",              type: "ESG",         description: "Supplier sustainability ratings and scorecards",              icon: Leaf,     status: "coming-soon",  lastSync: null,                datasetsProvided: ["esg"] },
]

// ─── Ingestion Batch (mock history) ─────────────────────────────────────────

interface BatchFile {
  id: string
  fileName: string
  fileSize: string
  detectedType: string
  destination: string
  status: "processed" | "needs-mapping" | "failed"
  uploadedBy: string
  uploadedAt: string
  rowCount: number | null
  confidence: number | null
}

const MOCK_BATCHES: BatchFile[] = [
  { id: "b1", fileName: "fleet_spend_2024_Q4.xlsx",         fileSize: "4.2 MB",  detectedType: "Spend Cube",            destination: "Internal Fact Base",   status: "processed",     uploadedBy: "Sarah Chen",  uploadedAt: "2025-02-10 14:22", rowCount: 48200,  confidence: 97 },
  { id: "b2", fileName: "enterprise_lease_contracts.pdf",   fileSize: "18.6 MB", detectedType: "Contracts",             destination: "Internal Fact Base",   status: "processed",     uploadedBy: "Sarah Chen",  uploadedAt: "2025-02-09 10:05", rowCount: 42,     confidence: 89 },
  { id: "b3", fileName: "vendor_master_export.csv",         fileSize: "1.1 MB",  detectedType: "Supplier Master",       destination: "Supplier Strategy",    status: "processed",     uploadedBy: "Mike Torres", uploadedAt: "2025-02-08 16:30", rowCount: 312,    confidence: 95 },
  { id: "b4", fileName: "maintenance_records_2024.xlsx",    fileSize: "7.8 MB",  detectedType: "Maintenance History",   destination: "Internal Fact Base",   status: "processed",     uploadedBy: "Sarah Chen",  uploadedAt: "2025-02-07 09:12", rowCount: 8920,   confidence: 92 },
  { id: "b5", fileName: "fleet_sku_catalog.csv",            fileSize: "890 KB",  detectedType: "Item Master",           destination: "Internal Fact Base",   status: "needs-mapping", uploadedBy: "Mike Torres", uploadedAt: "2025-02-06 11:45", rowCount: 1840,   confidence: 74 },
  { id: "b6", fileName: "telematics_jan2025.csv",           fileSize: "22.4 MB", detectedType: "Telematics",            destination: "Internal Fact Base",   status: "processed",     uploadedBy: "System",      uploadedAt: "2025-02-05 06:00", rowCount: 42100,  confidence: 88 },
  { id: "b7", fileName: "po_extract_ariba.xlsx",            fileSize: "3.4 MB",  detectedType: "Purchase Orders",       destination: "Internal Fact Base",   status: "processed",     uploadedBy: "System",      uploadedAt: "2025-02-04 22:15", rowCount: 26400,  confidence: 96 },
  { id: "b8", fileName: "unknown_report_q3.xlsx",           fileSize: "2.1 MB",  detectedType: "Unknown",               destination: "--",                   status: "failed",        uploadedBy: "Mike Torres", uploadedAt: "2025-02-03 08:50", rowCount: null,   confidence: null },
]

// ─── Processing Report Detail (for drawer) ──────────────────────────────────

interface ProcessingReportDetail {
  detectedType: string
  confidence: number | null
  rowsParsed: number | null
  columnsMatched: number
  columnsTotal: number
  warnings: string[]
  dataPreview: string[]
}

function getProcessingReport(batch: BatchFile): ProcessingReportDetail {
  if (batch.status === "failed") {
    return {
      detectedType: "Unknown",
      confidence: null,
      rowsParsed: null,
      columnsMatched: 0,
      columnsTotal: 0,
      warnings: ["File format not recognized", "No column headers detected", "Cannot map to any known dataset schema"],
      dataPreview: [],
    }
  }
  const warnings: string[] = []
  if (batch.status === "needs-mapping") {
    warnings.push("3 columns could not be auto-mapped", "Date format inconsistency detected in column 'service_date'")
  }
  if ((batch.confidence ?? 100) < 90) {
    warnings.push("Detection confidence below 90% -- manual review recommended")
  }
  return {
    detectedType: batch.detectedType,
    confidence: batch.confidence,
    rowsParsed: batch.rowCount,
    columnsMatched: batch.status === "needs-mapping" ? 9 : 12,
    columnsTotal: 12,
    warnings,
    dataPreview: [
      "Row 1: Fleet-001 | Enterprise Sedan | $4,212/mo | Active",
      "Row 2: Fleet-002 | Mid-size SUV | $5,840/mo | Active",
      "Row 3: Fleet-003 | Light Truck | $3,960/mo | Pending",
    ],
  }
}

// ─── Status helpers ─────────────────────────────────────────────────────────

function statusBadge(status: DatasetDef["status"]) {
  switch (status) {
    case "ready":
      return <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Ready</Badge>
    case "partial":
      return <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Partial</Badge>
    case "not-provided":
      return <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Not provided</Badge>
  }
}

function batchStatusBadge(status: BatchFile["status"]) {
  switch (status) {
    case "processed":
      return <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="mr-1 h-3 w-3" />Processed</Badge>
    case "needs-mapping":
      return <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"><AlertTriangle className="mr-1 h-3 w-3" />Needs mapping</Badge>
    case "failed":
      return <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>
  }
}

function connectorStatusBadge(status: ConnectorDef["status"]) {
  switch (status) {
    case "connected":
      return <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Connected</Badge>
    case "available":
      return <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">Available</Badge>
    case "coming-soon":
      return <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Coming soon</Badge>
  }
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase()
  if (ext === "csv") return <FileText className="h-4 w-4 text-emerald-600" />
  if (ext === "xlsx" || ext === "xls") return <FileSpreadsheet className="h-4 w-4 text-sky-600" />
  if (ext === "pdf") return <FileType2 className="h-4 w-4 text-red-500" />
  return <FileText className="h-4 w-4 text-muted-foreground" />
}

// ─── Readiness KPIs ─────────────────────────────────────────────────────────

function ReadinessKPIs() {
  const required = DATASET_DEFS.filter((d) => d.required)
  const optional = DATASET_DEFS.filter((d) => !d.required)
  const reqReady = required.filter((d) => d.status === "ready").length
  const allReady = DATASET_DEFS.filter((d) => d.status === "ready").length
  const allPartial = DATASET_DEFS.filter((d) => d.status === "partial").length
  const totalRows = DATASET_DEFS.reduce((s, d) => s + (d.rowsIngested ?? 0), 0)
  const avgQuality = DATASET_DEFS.filter((d) => d.qualityScore !== null)
  const qualityAvg = avgQuality.length > 0 ? avgQuality.reduce((s, d) => s + (d.qualityScore ?? 0), 0) / avgQuality.length : 0

  const kpis = [
    { label: "Required Datasets", value: `${reqReady}/${required.length}`, sub: "ready", color: reqReady === required.length ? "text-emerald-700" : "text-amber-700" },
    { label: "Total Datasets", value: `${allReady + allPartial}/${DATASET_DEFS.length}`, sub: `${allReady} ready, ${allPartial} partial`, color: "text-foreground" },
    { label: "Rows Ingested", value: totalRows.toLocaleString(), sub: "across all datasets", color: "text-foreground" },
    { label: "Avg. Quality Score", value: `${qualityAvg.toFixed(0)}%`, sub: `${avgQuality.length} datasets scored`, color: qualityAvg >= 80 ? "text-emerald-700" : "text-amber-700" },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map((k) => (
        <Card key={k.label}>
          <CardContent className="py-4 px-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{k.label}</p>
            <p className={cn("text-2xl font-bold mt-1", k.color)}>{k.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Dataset Grid ───────────────────────────────────────────────────────────

function DatasetGrid() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Required Datasets</CardTitle>
            <CardDescription className="text-xs mt-0.5">What data this platform needs and current ingestion status</CardDescription>
          </div>
          <TooltipProvider delayDuration={200}>
            <UITooltip>
              <TooltipTrigger asChild>
                <button className="rounded p-1 text-muted-foreground hover:bg-muted"><Info className="h-3.5 w-3.5" /></button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[260px]">
                <p className="text-xs">Each card represents a dataset the platform can ingest. Upload files or connect systems to populate them.</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {DATASET_DEFS.map((ds) => (
            <div
              key={ds.id}
              className={cn(
                "flex gap-3 rounded-lg border p-3.5 transition-colors",
                ds.status === "ready" && "border-emerald-200/60 bg-emerald-50/30",
                ds.status === "partial" && "border-amber-200/60 bg-amber-50/20",
                ds.status === "not-provided" && "border-border bg-card",
              )}
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                ds.status === "ready" ? "bg-emerald-100 text-emerald-700" :
                ds.status === "partial" ? "bg-amber-100 text-amber-700" :
                "bg-muted text-muted-foreground",
              )}>
                <ds.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{ds.name}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {ds.required ? (
                      <Badge variant="outline" className="text-[9px] bg-red-50 text-red-600 border-red-200">Required</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px]">Optional</Badge>
                    )}
                    {statusBadge(ds.status)}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{ds.description}</p>
                {ds.status !== "not-provided" && (
                  <div className="flex items-center gap-4 mt-2">
                    {ds.rowsIngested !== null && (
                      <span className="text-[10px] text-muted-foreground">{ds.rowsIngested.toLocaleString()} rows</span>
                    )}
                    {ds.qualityScore !== null && (
                      <div className="flex items-center gap-1.5">
                        <Progress value={ds.qualityScore} className="w-12 h-1.5" />
                        <span className="text-[10px] text-muted-foreground">{ds.qualityScore}% quality</span>
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground">{ds.filesCount} file{ds.filesCount !== 1 ? "s" : ""}</span>
                  </div>
                )}
                {ds.status === "not-provided" && (
                  <p className="text-[10px] text-muted-foreground/60 mt-2 italic">No data yet -- upload or connect a system</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Drop Zone ──────────────────────────────────────────────────────────────

function DropZone() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [notes, setNotes] = useState("")

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    setSelectedFiles((prev) => [...prev, ...files])
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    setSelectedFiles((prev) => [...prev, ...files])
  }, [])

  const removeFile = useCallback((idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const handleUpload = useCallback(() => {
    toast.success(`${selectedFiles.length} file${selectedFiles.length !== 1 ? "s" : ""} queued for processing`, {
      description: "Files will be auto-classified and routed to the appropriate module.",
    })
    setSelectedFiles([])
    setNotes("")
  }, [selectedFiles])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Upload Files</CardTitle>
        <CardDescription className="text-xs">Drag and drop or browse. We accept CSV, XLSX, PDF, DOCX, and TXT.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/30",
          )}
        >
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
            isDragging ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}>
            <Upload className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragging ? "Drop files here" : "Drag and drop files here"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              or <span className="text-primary underline underline-offset-2">browse files</span> -- multi-file supported
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">CSV</Badge>
            <Badge variant="outline" className="text-[10px]">XLSX</Badge>
            <Badge variant="outline" className="text-[10px]">PDF</Badge>
            <Badge variant="outline" className="text-[10px]">DOCX</Badge>
            <Badge variant="outline" className="text-[10px]">TXT</Badge>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv,.xlsx,.xls,.pdf,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Selected files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">{selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected</p>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setSelectedFiles([])}>Clear all</Button>
            </div>
            <div className="space-y-1.5">
              {selectedFiles.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {fileIcon(f.name)}
                    <span className="text-sm truncate">{f.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  <button onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-foreground shrink-0">
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <Textarea
              placeholder="Optional notes for this upload batch..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleUpload}>
                <HardDriveUpload className="mr-1.5 h-3.5 w-3.5" />
                Upload & Process
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Batch History Table ────────────────────────────────────────────────────

function BatchHistoryTable({ onViewReport }: { onViewReport: (batch: BatchFile) => void }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Ingestion History</CardTitle>
            <CardDescription className="text-xs mt-0.5">All uploaded and system-synced files</CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px]">{MOCK_BATCHES.length} files</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Detected Type</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Rows</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_BATCHES.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {fileIcon(b.fileName)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate max-w-[200px]">{b.fileName}</p>
                      <p className="text-[10px] text-muted-foreground">{b.fileSize}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{b.detectedType}</span>
                  {b.confidence !== null && (
                    <span className="text-[10px] text-muted-foreground ml-1.5">{b.confidence}%</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{b.destination}</span>
                </TableCell>
                <TableCell className="text-center">{batchStatusBadge(b.status)}</TableCell>
                <TableCell className="text-right">
                  <span className="text-sm tabular-nums">{b.rowCount?.toLocaleString() ?? "--"}</span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-xs">{b.uploadedBy}</p>
                    <p className="text-[10px] text-muted-foreground">{b.uploadedAt}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onViewReport(b)}>
                      <Eye className="mr-1 h-3 w-3" />Report
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ─── Processing Report Drawer ───────────────────────────────────────────────

function ProcessingReportDrawer({ batch, open, onOpenChange }: { batch: BatchFile | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!batch) return null
  const report = getProcessingReport(batch)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Processing Report</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-4">
          {/* File info */}
          <div className="flex items-start gap-3">
            {fileIcon(batch.fileName)}
            <div>
              <p className="text-sm font-semibold">{batch.fileName}</p>
              <p className="text-xs text-muted-foreground">{batch.fileSize} -- Uploaded {batch.uploadedAt} by {batch.uploadedBy}</p>
            </div>
          </div>

          <Separator />

          {/* Detection */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detection</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground">Detected Type</p>
                <p className="text-sm font-medium mt-0.5">{report.detectedType}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Confidence</p>
                <p className="text-sm font-medium mt-0.5">{report.confidence !== null ? `${report.confidence}%` : "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Rows Parsed</p>
                <p className="text-sm font-medium mt-0.5">{report.rowsParsed?.toLocaleString() ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Columns Matched</p>
                <p className="text-sm font-medium mt-0.5">{report.columnsMatched} / {report.columnsTotal}</p>
              </div>
            </div>
            {report.columnsTotal > 0 && (
              <Progress value={(report.columnsMatched / report.columnsTotal) * 100} className="h-2" />
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</h4>
            <div className="flex items-center gap-2">
              {batchStatusBadge(batch.status)}
              <span className="text-xs text-muted-foreground">
                Destination: {batch.destination}
              </span>
            </div>
          </div>

          {/* Warnings */}
          {report.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Warnings</h4>
              <div className="space-y-1.5">
                {report.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/50 p-2.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data preview */}
          {report.dataPreview.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data Preview</h4>
              <div className="rounded-md border bg-muted/30 p-3 space-y-1">
                {report.dataPreview.map((row, i) => (
                  <p key={i} className="text-[11px] font-mono text-muted-foreground">{row}</p>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex gap-2">
            {batch.status === "needs-mapping" && (
              <Button size="sm">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reclassify
              </Button>
            )}
            {batch.status === "failed" && (
              <Button size="sm" variant="destructive">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Remove
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Connector Cards ────────────────────────────────────────────────────────

function ConnectorGrid() {
  return (
    <div className="space-y-6">
      {/* Connected */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connected Systems</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {CONNECTORS.filter((c) => c.status === "connected").map((c) => (
            <Card key={c.id} className="border-emerald-200/60">
              <CardContent className="py-4 px-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{c.name}</p>
                      {connectorStatusBadge(c.status)}
                    </div>
                    <Badge variant="outline" className="text-[9px] mt-1">{c.type}</Badge>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{c.description}</p>
                    {c.lastSync && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Last sync: {c.lastSync}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.datasetsProvided.map((dsId) => {
                        const ds = DATASET_DEFS.find((d) => d.id === dsId)
                        return ds ? (
                          <Badge key={dsId} variant="secondary" className="text-[9px]">{ds.name}</Badge>
                        ) : null
                      })}
                    </div>
                    <div className="flex gap-1.5 mt-3">
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <RefreshCw className="mr-1 h-3 w-3" />Sync Now
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">Settings</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Available */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available Connectors</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {CONNECTORS.filter((c) => c.status === "available").map((c) => (
            <Card key={c.id}>
              <CardContent className="py-4 px-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700 shrink-0">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{c.name}</p>
                      {connectorStatusBadge(c.status)}
                    </div>
                    <Badge variant="outline" className="text-[9px] mt-1">{c.type}</Badge>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{c.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.datasetsProvided.map((dsId) => {
                        const ds = DATASET_DEFS.find((d) => d.id === dsId)
                        return ds ? (
                          <Badge key={dsId} variant="secondary" className="text-[9px]">{ds.name}</Badge>
                        ) : null
                      })}
                    </div>
                    <Button size="sm" className="mt-3 h-7 text-xs">
                      <Plug2 className="mr-1 h-3 w-3" />Connect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Coming soon */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coming Soon</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {CONNECTORS.filter((c) => c.status === "coming-soon").map((c) => (
            <Card key={c.id} className="opacity-60">
              <CardContent className="py-4 px-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{c.name}</p>
                      {connectorStatusBadge(c.status)}
                    </div>
                    <Badge variant="outline" className="text-[9px] mt-1">{c.type}</Badge>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{c.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function DataIngestionPage() {
  const { selectedCategory } = useCategory()
  const owner = getUserById(selectedCategory.ownerId)

  const [reportBatch, setReportBatch] = useState<BatchFile | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  const openReport = useCallback((batch: BatchFile) => {
    setReportBatch(batch)
    setReportOpen(true)
  }, [])

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: selectedCategory.name, href: "/" },
          { label: "Data Ingestion" },
        ]}
        title="Data Ingestion"
        description="Bring your data in -- upload files or connect systems. We'll route it into the right fact base."
        owner={owner?.name}
        lastUpdated={selectedCategory.lastRefreshAt}
        status={`Category: ${selectedCategory.name}`}
        statusVariant="secondary"
      />

      {/* Readiness KPIs */}
      <ReadinessKPIs />

      <div className="mt-6">
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upload" className="text-xs gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="connect" className="text-xs gap-1.5">
              <Plug2 className="h-3.5 w-3.5" />
              Connect Systems
            </TabsTrigger>
          </TabsList>

          {/* ─── Upload Files Tab ─── */}
          <TabsContent value="upload" className="space-y-6">
            <DropZone />
            <DatasetGrid />
            <BatchHistoryTable onViewReport={openReport} />
          </TabsContent>

          {/* ─── Connect Systems Tab ─── */}
          <TabsContent value="connect" className="space-y-6">
            <ConnectorGrid />
          </TabsContent>
        </Tabs>
      </div>

      <ProcessingReportDrawer batch={reportBatch} open={reportOpen} onOpenChange={setReportOpen} />
    </>
  )
}
