"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronRight, Search, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { ALL_STAKEHOLDERS, groupByDepartment } from "@/lib/strategic-objectives-data"

interface PeopleDirectoryProps {
  selectedIds: Set<string>
  onToggle: (id: string) => void
}

export function PeopleDirectory({ selectedIds, onToggle }: PeopleDirectoryProps) {
  const [search, setSearch] = useState("")
  // Default: all collapsed
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_STAKEHOLDERS
    const q = search.toLowerCase()
    return ALL_STAKEHOLDERS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q)
    )
  }, [search])

  const grouped = useMemo(() => groupByDepartment(filtered), [filtered])
  const departments = Object.keys(grouped).sort()

  const toggleGroup = (dept: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(dept)) next.delete(dept)
      else next.add(dept)
      return next
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ height: "440px" }}>
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, department, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* Scrollable groups */}
      <div className="overflow-y-auto" style={{ height: "calc(440px - 57px)" }}>
        {departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No people match your search.</p>
          </div>
        ) : (
          departments.map((dept) => {
            const people = grouped[dept]
            const isExpanded = expandedGroups.has(dept)
            const selectedInGroup = people.filter((p) => selectedIds.has(p.id)).length

            return (
              <div key={dept} className="border-b border-border last:border-b-0">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(dept)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-foreground flex-1">{dept}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {selectedInGroup > 0 && (
                      <span className="text-primary font-semibold mr-1">{selectedInGroup} selected</span>
                    )}
                    {people.length} {people.length === 1 ? "person" : "people"}
                  </span>
                </button>

                {/* People rows */}
                {isExpanded && (
                  <div className="pb-1">
                    {people.map((person) => {
                      const isSelected = selectedIds.has(person.id)
                      return (
                        <button
                          key={person.id}
                          onClick={() => onToggle(person.id)}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-2 pl-9 text-left transition-colors",
                            isSelected ? "bg-orange-50/60" : "hover:bg-muted/20"
                          )}
                        >
                          {/* Avatar */}
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {person.name.split(" ").map((n) => n[0]).join("")}
                          </div>

                          {/* Info - fixed layout that never shifts */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{person.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{person.title}</p>
                          </div>

                          <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                            {person.email}
                          </span>

                          {/* Fixed-width selection indicator slot (always takes space) */}
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                            <div
                              className={cn(
                                "h-2.5 w-2.5 rounded-full transition-all duration-200",
                                isSelected ? "bg-primary scale-100" : "bg-transparent scale-0"
                              )}
                            />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
