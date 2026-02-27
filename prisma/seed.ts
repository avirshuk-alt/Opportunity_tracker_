/**
 * Seed database with data aligned to lib/data.ts mock data.
 * Run: pnpm db:seed (or npx prisma db seed)
 */
import { PrismaClient } from "@prisma/client"
import {
  organization,
  users,
  categories,
  strategies,
  initiatives,
  risks,
  suppliers,
  contracts,
  kpis,
  roadmapItems,
  businessRequirements,
  objectives,
} from "../lib/data"

const prisma = new PrismaClient()

type Role = "admin" | "contributor" | "viewer"
const mapRole = (r: string): Role => {
  if (r === "admin") return "admin"
  return "contributor"
}

function toDate(s: string): Date {
  return new Date(s)
}

async function main() {
  const idMap = new Map<string, string>()

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { id: "org-1" },
    update: {},
    create: {
      id: "org-1",
      name: organization.name,
      businessUnits: organization.businessUnits,
      regions: organization.regions,
    },
  })
  idMap.set("org-1", org.id)

  // 2. Users
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: mapRole(u.role),
        orgId: org.id,
      },
    })
    idMap.set(u.id, user.id)
  }

  // 3. Categories
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        organizationId: org.id,
        name: c.name,
        taxonomyPath: c.taxonomyPath,
        ownerId: idMap.get(c.ownerId) ?? c.ownerId,
        totalSpend: c.totalSpend,
        supplierCount: c.supplierCount,
        contractCount: c.contractCount,
        riskScore: c.riskScore,
        strategyStatus: c.strategyStatus as "Draft" | "InReview" | "Approved",
        lastRefreshAt: c.lastRefreshAt ? toDate(c.lastRefreshAt) : null,
      },
    })
    idMap.set(c.id, cat.id)
  }

  // 4. Suppliers
  for (const s of suppliers) {
    const sup = await prisma.supplier.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        normalizedName: s.normalizedName,
        segment: s.segment as "Strategic" | "Preferred" | "Approved" | "Transactional" | "PhaseOut",
        annualSpend: s.annualSpend,
        riskScore: s.riskScore,
        performanceScore: s.performanceScore,
        country: s.country,
        tier: s.tier,
        diversityClassification: s.diversityClassification ?? undefined,
      },
    })
    idMap.set(s.id, sup.id)
  }

  // 5. CategorySupplier (many-to-many)
  for (const s of suppliers) {
    for (const catId of s.categoryIds) {
      await prisma.categorySupplier.upsert({
        where: {
          categoryId_supplierId: { categoryId: catId, supplierId: s.id },
        },
        update: {},
        create: {
          categoryId: catId,
          supplierId: s.id,
        },
      })
    }
  }

  // 6. Strategies
  for (const st of strategies) {
    await prisma.strategy.upsert({
      where: { categoryId: st.categoryId },
      update: {},
      create: {
        id: st.id,
        categoryId: st.categoryId,
        version: st.version,
        status: st.status as "Draft" | "InReview" | "Approved",
        title: st.title,
        objectives: st.objectives,
        narrative: st.narrative as object,
        assumptions: st.assumptions as object[],
        decisionLog: st.decisionLog as object[],
        refreshCadenceDays: st.refreshCadenceDays,
        lastRefreshAt: st.lastRefreshAt ? toDate(st.lastRefreshAt) : null,
        ownerId: idMap.get(st.ownerId) ?? st.ownerId,
        completionPct: st.completionPct,
      },
    })
  }

  // 7. Initiatives
  for (const i of initiatives) {
    await prisma.initiative.upsert({
      where: { id: i.id },
      update: {},
      create: {
        id: i.id,
        title: i.title,
        categoryId: i.categoryId,
        strategyId: i.strategyId ?? undefined,
        lifecycle: "Approved",
        stage: i.stage as "Idea" | "Qualify" | "Source" | "Contract" | "Implement" | "Realize",
        baseline: i.baseline,
        targetSavings: i.targetSavings,
        confidence: i.confidence,
        effort: i.effort,
        ownerId: idMap.get(i.ownerId) ?? i.ownerId,
        description: i.description,
        dependencyIds: i.dependencies,
        stakeholderIds: i.stakeholders,
      },
    })
  }

  // 8. Risks
  for (const r of risks) {
    const risk = await prisma.risk.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        title: r.title,
        scope: r.scope as "Supplier" | "Category" | "Material",
        categoryId: r.categoryId ?? undefined,
        supplierId: r.supplierId ?? undefined,
        likelihood: r.likelihood,
        impact: r.impact,
        detectability: r.detectability,
        riskScore: r.riskScore,
        appetiteThreshold: r.appetiteThreshold,
        status: r.status as "Open" | "Mitigating" | "Accepted" | "Closed",
        ownerId: idMap.get(r.ownerId) ?? r.ownerId,
        acceptedRationale: r.acceptedRationale ?? undefined,
        mitigationPlan: r.mitigationPlan ?? undefined,
      },
    })
    if (r.linkedInitiativeId) {
      await prisma.initiativeRisk.upsert({
        where: {
          initiativeId_riskId: { initiativeId: r.linkedInitiativeId, riskId: risk.id },
        },
        update: {},
        create: {
          initiativeId: r.linkedInitiativeId,
          riskId: risk.id,
        },
      })
    }
  }

  // 9. Contracts
  for (const c of contracts) {
    await prisma.contract.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        supplierId: c.supplierId,
        categoryId: c.categoryId,
        title: c.title,
        startDate: toDate(c.startDate),
        endDate: toDate(c.endDate),
        renewalDate: toDate(c.renewalDate),
        annualValue: c.annualValue,
        status: c.status as "Active" | "Expiring" | "Expired" | "UnderReview",
        keyTerms: c.keyTerms as object,
        clauseScores: c.clauseScores as object,
      },
    })
  }

  // 10. KPIs
  for (const k of kpis) {
    await prisma.kPI.upsert({
      where: { id: k.id },
      update: {},
      create: {
        id: k.id,
        name: k.name,
        definition: k.definition,
        calcMethod: k.calcMethod,
        unit: k.unit,
        target: k.target,
        actual: k.actual,
        rag: k.rag as "Red" | "Amber" | "Green",
        trend: k.trend,
        categoryId: k.categoryId,
      },
    })
  }

  // 11. Roadmap items
  for (const rm of roadmapItems) {
    await prisma.roadmapItem.upsert({
      where: { id: rm.id },
      update: {},
      create: {
        id: rm.id,
        initiativeId: rm.initiativeId,
        wave: rm.wave,
        startDate: toDate(rm.startDate),
        endDate: toDate(rm.endDate),
        milestones: rm.milestones as object[],
        ownerIds: rm.owners,
        dependencyIds: rm.dependencies,
        criticalPath: rm.criticalPath,
        progress: rm.progress,
      },
    })
  }

  // 12. Objectives
  for (const o of objectives) {
    await prisma.objective.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id,
        title: o.title,
        description: o.description,
        metricTarget: o.metricTarget ?? undefined,
        owner: o.owner,
        ownerId: o.ownerId ?? undefined,
        targetDate: o.targetDate ? toDate(o.targetDate) : undefined,
        categoryId: o.categoryId,
      },
    })
  }

  // 13. Business requirements
  for (const br of businessRequirements) {
    await prisma.businessRequirement.upsert({
      where: { id: br.id },
      update: {},
      create: {
        id: br.id,
        title: br.title,
        statement: br.statement,
        stakeholderId: br.stakeholderId,
        stakeholderName: br.stakeholderName,
        function: br.function,
        driver: br.driver as "Cost" | "Risk" | "Growth" | "Compliance" | "Resilience" | "Sustainability",
        priority: br.priority as "Must" | "Should" | "Could",
        status: br.status as "Proposed" | "Validated" | "Approved",
        metricTarget: br.metricTarget ?? undefined,
        evidence: br.evidence ?? undefined,
        constraints: br.constraints ?? undefined,
        dueDate: br.dueDate ? toDate(br.dueDate) : undefined,
        tags: br.tags,
        impactedModules: br.impactedModules,
        objectiveId: br.objectiveId ?? undefined,
        categoryId: (br.objectiveId && objectives.find((o) => o.id === br.objectiveId)?.categoryId) ?? categories[0]!.id,
      },
    })
  }

  console.log("Seed completed: org, users, categories, strategies, initiatives, risks, suppliers, contracts, KPIs, roadmap, objectives, requirements")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
