"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Target,
  FileText,
  Database,
  Globe,
  Building2,
  ShieldAlert,
  Lightbulb,
  Handshake,
  ArrowRightLeft,
  Hexagon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Stakeholder Strategy", href: "/stakeholder-strategy-business-requirements", icon: Target },
  { label: "Strategy Workspace", href: "/strategy", icon: FileText },
  { label: "Internal Fact Base", href: "/fact-base", icon: Database },
  { label: "External Intelligence", href: "/external", icon: Globe },
  { label: "Supplier Strategy", href: "/suppliers", icon: Building2 },
  { label: "Risk Management", href: "/risks", icon: ShieldAlert },
  { label: "Negotiations", href: "/esg", icon: Handshake },
  { label: "Opportunity Tracker", href: "/opportunities", icon: Lightbulb },
  { label: "Impact Simulation", href: "/impact", icon: ArrowRightLeft },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
        expanded ? "w-60" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Hexagon className="h-4.5 w-4.5 text-primary-foreground" />
        </div>
        <div
          className={cn(
            "min-w-0 overflow-hidden transition-all duration-300",
            expanded ? "w-auto opacity-100" : "w-0 opacity-0"
          )}
        >
          <p className="truncate text-sm font-semibold text-foreground">
            Category Strategy
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Hub
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 h-px bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-3 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              title={!expanded ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary" />
              )}
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "truncate whitespace-nowrap transition-all duration-300",
                  expanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
