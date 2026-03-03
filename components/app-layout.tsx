"use client"

import React from "react"
import { CategoryProvider } from "@/lib/category-context"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/sonner"
import { Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CategoryProvider>
      <div className="min-h-screen bg-background">
        <AppSidebar />

        {/* Main content area with left margin for collapsed sidebar */}
        <div className="pl-16 flex flex-col min-h-screen">
          {/* Top Header */}
          <header className="sticky top-0 z-30 flex items-center justify-end gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search thread"
                className="h-9 w-56 pl-9 text-sm bg-card border-border"
              />
            </div>
            <Button size="sm" className="h-9 gap-1.5 text-sm font-semibold px-4">
              <Plus className="h-4 w-4" />
              New Thread
            </Button>
          </header>

          {/* Page Content */}
          <main className="flex-1">
            <div className="mx-auto max-w-[1440px] 2xl:max-w-[1600px] px-4 md:px-6 xl:px-8 py-6">{children}</div>
          </main>
        </div>
      </div>
      <Toaster />
    </CategoryProvider>
  )
}
