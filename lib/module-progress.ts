// ─── Module Progress Helpers ─────────────────────────────────────
// Deterministic stubs isolated for easy wiring to a real backend later.

export interface ModuleInfo {
  key: string
  label: string
  description: string
  href: string
  icon: string // lucide icon name for mapping
}

export const MODULES: ModuleInfo[] = [
  { key: "strategic-objectives", label: "Stakeholder Strategy", description: "Translate insights into structured business requirements and validate alignment.", href: "/stakeholder-strategy-business-requirements", icon: "Target" },
  { key: "strategy",      label: "Strategy Workspace",      description: "Author your strategy narrative and objectives.",                href: "/strategy",       icon: "FileText" },
  { key: "fact-base",     label: "Internal Fact Base",       description: "Spend, contracts, SKUs, and stakeholder-driven requirements.", href: "/fact-base",      icon: "Database" },
  { key: "external",      label: "External Intelligence",    description: "Search sources and save market insights.",                     href: "/external",       icon: "Globe" },
  { key: "suppliers",     label: "Supplier Strategy",        description: "Segmentation, scorecards, and relationship plans.",            href: "/suppliers",      icon: "Building2" },
  { key: "risks",         label: "Risk Management",          description: "Identify and mitigate supply and delivery risks.",             href: "/risks",          icon: "ShieldAlert" },
  { key: "esg",           label: "Negotiations",              description: "Classify suppliers, build fact bases, and execute deals.",     href: "/esg",            icon: "Handshake" },
  { key: "opportunities", label: "Opportunity Tracker",      description: "Levers, savings analyses, and initiative pipeline.",           href: "/opportunities",  icon: "Lightbulb" },
  { key: "impact",        label: "Impact Simulator",         description: "Model scenarios and quantify strategy outcomes.",              href: "/impact",         icon: "ArrowRightLeft" },
]

// Deterministic per-category progress (stub)
// Uses a simple hash to produce stable values per (category, module) pair
function stablePercent(categoryId: string, moduleKey: string): number {
  let hash = 0
  const str = `${categoryId}:${moduleKey}`
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  const base = Math.abs(hash) % 100
  // Clamp to a realistic range per module
  const floors: Record<string, number> = {
    "strategic-objectives": 35,
    "strategy": 60,
    "fact-base": 40,
    "external": 10,
    "suppliers": 30,
    "risks": 20,
    "esg": 5,
    "opportunities": 25,
    "impact": 0,
  }
  const floor = floors[moduleKey] ?? 15
  return Math.min(100, floor + (base % (100 - floor)))
}

export interface ModuleProgress {
  key: string
  percent: number
  status: "Not started" | "In progress" | "Complete"
}

export function getModuleProgressByCategory(categoryId: string): ModuleProgress[] {
  return MODULES.map((m) => {
    const pct = stablePercent(categoryId, m.key)
    let status: ModuleProgress["status"] = "In progress"
    if (pct === 0) status = "Not started"
    else if (pct >= 100) status = "Complete"
    return { key: m.key, percent: pct, status }
  })
}

export interface LastVisited {
  moduleKey: string
  route: string
  label: string
  timestamp: string
}

export function getLastVisitedModule(categoryId: string): LastVisited {
  // Stub: pick the highest-priority incomplete module
  const progress = getModuleProgressByCategory(categoryId)
  const incomplete = progress.filter((p) => p.status !== "Complete")
  const pick = incomplete.length > 0 ? incomplete[0] : progress[0]
  const mod = MODULES.find((m) => m.key === pick.key)!
  // Stub timestamp: 2 hours ago
  const ts = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  return {
    moduleKey: mod.key,
    route: mod.href,
    label: mod.label,
    timestamp: ts,
  }
}
