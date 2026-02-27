# Opportunity Tracker — Domain Model & Prisma Schema

This document defines the **domain model** for the production-ready Opportunity Tracker and maps it to the **Prisma schema**. Open **`prisma/schema.prisma`** in the repo for the concrete schema.

---

## 1. Core Entities

### 1.1 Organization & Users

| Entity       | Purpose |
|-------------|---------|
| **Organization** | Tenant; holds business units and regions. |
| **User**         | Identity with role (Admin, Contributor, Viewer). Belongs to one Organization. |

**Roles:** `ADMIN` \| `CONTRIBUTOR` \| `VIEWER` (refined from current admin/category_manager/analyst/finance_approver/stakeholder for RBAC).

---

### 1.2 Category

- **Category** — Procurement/category scope. One strategy per category; all opportunities, risks, suppliers, KPIs, roadmap items are scoped by category.
- **Fields:** name, taxonomyPath, ownerId (User), totalSpend, supplierCount, contractCount, riskScore, strategyStatus, lastRefreshAt.
- **Relationships:** 1 Strategy, many Initiatives, Risks, Suppliers (via CategorySupplier), KPIs, RoadmapItems (via Initiative).

---

### 1.3 Opportunity (Initiative)

- **Opportunity** (alias: Initiative) — A value-capture initiative (savings, efficiency, risk reduction).
- **Lifecycle:** `Draft` → `UnderReview` → `Approved` → `InExecution` → `Completed` → `Archived`.
- **Stage (execution):** `Idea` \| `Qualify` \| `Source` \| `Contract` \| `Implement` \| `Realize`.
- **Scoring:** Composite score from financial impact, strategic alignment, risk exposure, ESG, feasibility (see Scoring Model below).
- **Relationships:** belongs to Category and optional Strategy; has many Benefits; linked to Risks (many-to-many); has RoadmapItems; owner (User).

---

### 1.4 Risk

- **Risk** — Register item with likelihood, impact, detectability; computed risk score; appetite threshold.
- **Status:** `Open` \| `Mitigating` \| `Accepted` \| `Closed`.
- **Scope:** `Supplier` \| `Category` \| `Material`.
- **Relationships:** optional Category, optional Supplier, optional linked Initiative; owner (User).

---

### 1.5 KPI

- **KPI** — Metric with definition, target, actual, RAG, trend. Category-scoped.
- **RAG:** `Red` \| `Amber` \| `Green`.

---

### 1.6 Supplier

- **Supplier** — Single unified model: name, normalizedName, segment, annualSpend, riskScore, performanceScore, country, tier, optional diversityClassification.
- **CategorySupplier** — Join: which categories a supplier serves (categoryIds → many-to-many).
- **SupplierProfile** (optional extension) — Fleet/strategy-specific fields (type, signals, scorecard dimensions) for the supplier strategy module.

---

### 1.7 Stakeholder

- **Stakeholder** — Maps to User or external; name, title, function, influence (Low/Medium/High), touchpoints, notes. Used in requirements and initiative ownership.

---

### 1.8 Strategic Lever

- **StrategicLever** — Levers (e.g. Cost/Demand/Value buckets); name, bucket, description, status, dataReadiness. Can be reference data or DB-backed.
- **LeverRecommendation** (optional) — AI/recommendation linking lever to opportunity or category (evidence insights).

---

### 1.9 ESG Impact

- **ESGImpact** (or tags on Initiative/Supplier) — Sustainability/diversity impact; can be a small entity or JSON on Initiative/Supplier.

---

### 1.10 Roadmap Item

- **RoadmapItem** — Timeline entry for an Initiative: wave, startDate, endDate, progress, criticalPath; **milestones** as JSON array `[{ name, date, completed }]`; owners (user IDs); dependencies (roadmap item IDs or initiative IDs).

---

### 1.11 Strategy

- **Strategy** — One per Category. Version, status (Draft/InReview/Approved), title, objectives (array), narrative (JSON: executiveSummary, currentState, futureState, approach, risks, timeline), assumptions, decisionLog, refreshCadenceDays, lastRefreshAt, ownerId, completionPct.

---

### 1.12 Supporting Entities

- **Contract** — supplierId, categoryId, title, dates, annualValue, status, keyTerms (JSON), clauseScores (JSON).
- **BusinessRequirement** — stakeholderId, driver, priority, status, metricTarget, tags, objectiveId, categoryId.
- **Objective** — categoryId, requirementIds, ownerId, targetDate.
- **Benefit** — initiativeId, type (Hard/Soft/Avoidance), amount, realizationStatus, timingCurve (JSON).
- **AuditEvent** — objectType, objectId, action, actorId, timestamp, summary (and optional payload).
- **Notification** — userId, title, message, type, read, link.

---

## 2. Relationships & Cardinality

| From          | To           | Cardinality |
|---------------|-------------|-------------|
| Organization | User        | 1 : N       |
| Category     | Strategy    | 1 : 1       |
| Category     | Initiative  | 1 : N       |
| Category     | Risk        | 1 : N       |
| Category     | KPI         | 1 : N       |
| Strategy     | Initiative  | 1 : N       |
| Initiative   | RoadmapItem | 1 : N       |
| Initiative   | Benefit     | 1 : N       |
| Initiative   | Risk        | N : M (linked) |
| Supplier     | Category    | N : M (CategorySupplier) |
| Supplier     | Risk        | 1 : N       |
| User         | Initiative (owner) | 1 : N |
| User         | Risk (owner)      | 1 : N |

---

## 3. Status & Lifecycle

- **Strategy:** `Draft` \| `InReview` \| `Approved`
- **Opportunity (Initiative):** `Draft` \| `UnderReview` \| `Approved` \| `InExecution` \| `Completed` \| `Archived`
- **Initiative stage:** `Idea` \| `Qualify` \| `Source` \| `Contract` \| `Implement` \| `Realize`
- **Risk:** `Open` \| `Mitigating` \| `Accepted` \| `Closed`
- **Requirement:** `Proposed` \| `Validated` \| `Approved`

---

## 4. Scoring Model

- **Opportunity composite score** (0–100 or similar):
  - Financial impact (e.g. target savings vs baseline)
  - Strategic alignment (e.g. link to strategy objectives)
  - Risk exposure (linked risks’ scores)
  - ESG score (optional)
  - Feasibility (confidence, effort)
  - Weighted formula in `lib/domain/scoring/opportunity-scoring.ts`; stored on Initiative and recalculated on update.
- **Risk score:** `likelihood * impact * (6 - detectability)` or equivalent; stored and optionally recomputed in `lib/domain/scoring/risk-scoring.ts`.

---

## 5. Ownership & Audit

- **Ownership:** Initiative, Risk, Strategy, Category have `ownerId` → User.
- **Timestamps:** `createdAt`, `updatedAt` on all main entities.
- **Soft deletes:** `deletedAt` (optional) on Initiative, Risk, Supplier, etc.
- **Audit:** AuditEvent written on Create/Update/Delete/Approve/Reject with objectType, objectId, action, actorId, timestamp, summary.

---

## 6. Prisma Schema

The concrete schema is in **`prisma/schema.prisma`**. It implements:

- All entities above with PascalCase model names (e.g. `Organization`, `User`, `Category`, `Initiative`, `Risk`, `KPI`, `Supplier`, `Strategy`, `RoadmapItem`, `Contract`, `BusinessRequirement`, `Objective`, `Benefit`, `AuditEvent`, `Notification`).
- Enums for Role, StrategyStatus, InitiativeLifecycle, InitiativeStage, RiskStatus, RAG, RequirementDriver, RequirementPriority, RequirementStatus, BenefitType.
- JSON fields for narrative, assumptions, decisionLog, keyTerms, clauseScores, milestones, timingCurve.
- Relations with `@relation` and foreign keys; optional soft delete and audit fields where specified.

---

## 7. Links to Open in This Repo

| What | Path |
|------|------|
| **Domain model (this doc)** | [docs/DOMAIN-MODEL.md](../docs/DOMAIN-MODEL.md) |
| **Prisma schema** | [prisma/schema.prisma](../prisma/schema.prisma) |
| **Architecture summary** | See Step 1 analysis (in chat or save as docs/ARCHITECTURE.md if needed) |

Use the paths above in your IDE or file explorer to open the files.
