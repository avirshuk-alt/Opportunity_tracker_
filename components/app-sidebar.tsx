"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  LayoutDashboard,
  HardDriveUpload,
  Database,
  Globe,
  Leaf,
  Building2,
  ShieldAlert,
  Lightbulb,
  ArrowRightLeft,
  CalendarRange,
  Cog,
  Plug,
  Brain,
  ChevronDown,
  Search,
  Plus,
  Bell,
  Hexagon,
  Compass,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { categories, notifications, organization } from "@/lib/data"
import { useCategory } from "@/lib/category-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navItems = [
  { label: "Home", href: "/", icon: Compass },
  { label: "Strategy Workspace", href: "/strategy", icon: LayoutDashboard },
  { label: "Data Ingestion", href: "/scorecard", icon: HardDriveUpload },
  { label: "Internal Fact Base", href: "/fact-base", icon: Database },
  { label: "External Intelligence", href: "/external", icon: Globe },
  { label: "ESG & Diversity", href: "/esg", icon: Leaf },
  { label: "Supplier Strategy", href: "/suppliers", icon: Building2 },
  { label: "Risk Management", href: "/risks", icon: ShieldAlert },
  { label: "Opportunity Tracker", href: "/opportunities", icon: Lightbulb },
  { label: "Impact Simulator", href: "/impact", icon: ArrowRightLeft },
  { label: "Roadmap & Execution", href: "/roadmap", icon: CalendarRange },
  { label: "Orchestration", href: "/orchestration", icon: Cog },
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Advanced Decisioning", href: "/decisioning", icon: Brain },
]

export function AppSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { selectedCategory, setSelectedCategory } = useCategory()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b from-sidebar via-sidebar to-[hsl(222,22%,8%)] text-sidebar-foreground">
        {/* Logo / Org */}
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Hexagon className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
              Value Capture
            </p>
            <p className="truncate text-xs text-sidebar-foreground">
              {organization.name}
            </p>
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Category Selector */}
        <div className="px-3 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 h-9 px-3 text-sm"
              >
                <span className="truncate">{selectedCategory.name}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    cat.id === selectedCategory.id && "bg-accent"
                  )}
                >
                  {cat.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-muted-foreground">
                <Plus className="mr-2 h-3.5 w-3.5" /> Add Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 px-3 pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="mr-1.5 h-3.5 w-3.5" />
            Search
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>New Strategy</DropdownMenuItem>
              <DropdownMenuItem>New Initiative</DropdownMenuItem>
              <DropdownMenuItem>New Risk</DropdownMenuItem>
              <DropdownMenuItem>New Supplier</DropdownMenuItem>
              <DropdownMenuItem>New Contract</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-2">
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const [hrefPath, hrefQuery] = item.href.split("?")
              const isActive = hrefQuery
                ? pathname.startsWith(hrefPath) && searchParams.get("tab") === new URLSearchParams(hrefQuery).get("tab")
                : item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-all duration-150",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-sidebar-primary" />
                  )}
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-sidebar-primary")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* User / Notifications */}
        <div className="flex items-center gap-2 px-3 py-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
              SC
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
              Sarah Chen
            </p>
            <p className="truncate text-xs text-sidebar-foreground">Admin</p>
          </div>
          <Button variant="ghost" size="icon" className="relative h-8 w-8 text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center bg-destructive text-destructive-foreground border-0">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      </aside>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search suppliers, contracts, initiatives, risks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>Search results for &ldquo;{searchQuery}&rdquo; would appear here.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
