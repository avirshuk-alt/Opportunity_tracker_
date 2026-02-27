"use client"

import React from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Crumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  crumbs: Crumb[]
  title: string
  description?: string
  status?: string
  statusVariant?: "default" | "secondary" | "destructive" | "outline"
  owner?: string
  lastUpdated?: string
  actions?: React.ReactNode
}

export function PageHeader({
  crumbs,
  title,
  description,
  status,
  statusVariant = "secondary",
  owner,
  lastUpdated,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-1">
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <React.Fragment key={crumb.label}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.href ? (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
              {title}
            </h1>
            {status && (
              <Badge
                variant={statusVariant}
                className={cn(
                  statusVariant === "default" &&
                    "bg-primary text-primary-foreground"
                )}
              >
                {status}
              </Badge>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
          {(owner || lastUpdated) && (
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              {owner && <span>Owner: {owner}</span>}
              {owner && lastUpdated && <span aria-hidden="true">|</span>}
              {lastUpdated && <span>Updated: {lastUpdated}</span>}
            </div>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
