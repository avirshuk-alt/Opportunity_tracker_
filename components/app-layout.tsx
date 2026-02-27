"use client"

import React from "react"

import { CategoryProvider } from "@/lib/category-context"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/sonner"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CategoryProvider>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <main className="pl-64">
          <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
        </main>
      </div>
      <Toaster />
    </CategoryProvider>
  )
}
