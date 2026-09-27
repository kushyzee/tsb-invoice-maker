# Finance Tracking Implementation

Persistent implementation log for the finance-tracking feature.

**Status:** Phase 1 implemented and verified. Phases 2–3 not started.
**Last updated:** 2026-09-27

---

## Scope

Approved feature scope:

* **Invoice expenses** — costs attributable to an invoice.
* **Amount paid** — payment received against an invoice.
* **Projected profit** — expected profit, before actuals are known.
* **Actual profit** — realised profit, from actual costs and payments.
* **Outstanding balance** — amount still owed on an invoice.
* **Monthly finance overview** — month-by-month aggregation of the above.

Context carried in: the current `Invoice` model has **no expense, payment, status, or balance
concept of any kind** — it is `id`, `invoiceNumber`, `customerName`, `issueDate`, `dueDate`,
`lineItems`, `discountType`, `discountValue`, `createdAt`, `updatedAt` (see
[../CODEBASE.md](../CODEBASE.md#5-data-model)). Every scope item above therefore introduces data
that does not exist yet, which is why Phase 1 and Phase 2 carry schema migrations.

Related analysis: [../DATE-FIELDS.md](../DATE-FIELDS.md) — date-field semantics, which Phase 3 depends on.

---

## Phases

* [x] Phase 1 — Invoice financial inputs
* [ ] Phase 2 — Payment tracking & invoice financial summary
* [ ] Phase 3 — Monthly finance overview

---

## Decisions

### Confirmed decisions

**1. Monthly aggregation groups by `issueDate`.**

Established by the date-field analysis in [../DATE-FIELDS.md](../DATE-FIELDS.md). `issueDate` is the
only field that can express the user's intent: `createdAt` records when a record was *typed*, not
when the sale happened, and it cannot be adjusted — while this workflow involves batch and late
entry. `issueDate` is also what the app already prints on the customer's invoice and shows in the
history list, so a report grouped any other way would visibly disagree with the list.

Consequences established by the same analysis (not optional — these are prerequisites for Phase 3):

* `todayISO()` is **UTC-derived** and defaults `issueDate` to *yesterday* during the first hour of
  the local day — precisely where month boundaries sit. Must be fixed, not worked around.
* Month keys must come from `issueDate.slice(0, 7)`. Never `new Date(issueDate).getMonth()`, which
  returns the **previous** month in negative-offset timezones (verified).
* `issueDate` is **not indexed** in Dexie. Group in memory initially, consistent with the existing
  query pattern in `useInvoiceHistory` and `getHighestInvoiceNumber`.
* Any monthly figure is **billed, not collected** — until Phase 2 lands, there is no payment data
  to report on. This is why "amount paid" and "actual profit" are gated behind Phase 2.

### Verified constraints

Not decisions — these are facts about the current codebase that constrain the design:

* **Dexie schema is at version 2** (`invoices`, `settings`). Expenses and payments require a
  `db.version(3)` migration.
* **No error handling exists anywhere** in the app — all seven `try` blocks are `try/finally` with
  no `catch` — and there is **no notification/toast mechanism**. Any new failure path (a failed
  payment write, a bad expense value) has nowhere to surface.
* **No tests exist**, and no test tooling is installed. (Phase 1 was verified with a throwaway
  Playwright harness kept outside the repo — see the Phase 1 log. The project still has no test
  setup of its own.)
* ~~**`node_modules/` is not installed.**~~ **Stale as of Phase 1** — dependencies are now
  installed and `typecheck` / `lint` / `build` all run. The AGENTS.md requirement to read the
  bundled Next.js 16 guides in `node_modules/next/dist/docs/` is now satisfiable.

### Open — deliberately not decided

Listed so a returning developer does not mistake any of these for settled:

* **Money representation** — float naira (current: `unitPrice` is a float, formatted with
  `maximumFractionDigits: 0`, so kobo are invisible) vs integer kobo. Affects stored data.
* **Whether invoices become immutable snapshots** — today totals are recomputed on read and
  settings are resolved at render time, so historical invoices change retroactively.
* **Shape of payment records** — a single "amount paid" field on the invoice vs a list of dated
  payments. Determines whether partial payments and payment dates are trackable at all.
* **Definition of "projected profit" vs "actual profit"** — **resolved for projected in Phase 1**:
  projected profit is computed live as Invoiced − Expenses, never manually entered and never
  stored (see the Phase 1 log). "Actual profit" is still undefined pending Phase 2.
* **Whether `issueDate` gains real validation** — currently `z.string().min(1)` only: no maximum,
  no range check, no "due date ≥ issue date" check, so an invoice can be dated in the future and
  create a phantom month.
* **Whether to add tests and/or a toast mechanism** before introducing failure paths.

---

## Implementation Log

### Phase 1 — Invoice financial inputs

**Status:** Complete — implemented and verified.

**Changes:**

1. `Invoice` gains two stored inputs, `expenses: number` and `amountPaid: number`. No derived
   value is persisted (no `projectedProfit`, `actualProfit`, or `outstanding`).
2. Both fields are validated by `invoiceFormSchema` as `z.number().min(0, "Must be 0 or more")`.
3. Dexie `version(3)` backfills both fields to `0` on every invoice that predates the feature.
4. `getInvoiceById` normalizes missing fields to `0` on read.
5. The form has a new **Costs** card with the Expenses input, marked internal. New invoices
   default to `expenses = 0` and `amountPaid = 0`.
6. `InvoiceSummary` shows an internal section with Expenses and live **Projected Profit**, and the
   edit form loads stored values back into it.
7. `todayISO()` now builds the local calendar date from local getters instead of going through
   `toISOString()`.

**Files:**

Modified (7):

* [../features/invoice-form/types.ts](../features/invoice-form/types.ts) — the two new fields
* [../features/invoice-form/schema.ts](../features/invoice-form/schema.ts) — Zod rules
* [../features/invoice-form/hooks/useInvoiceForm.ts](../features/invoice-form/hooks/useInvoiceForm.ts)
  — defaults, reset, `todayISO()` fix
* [../features/invoice-form/components/InvoiceForm.tsx](../features/invoice-form/components/InvoiceForm.tsx)
  — Costs card
* [../features/invoice-form/components/InvoiceSummary.tsx](../features/invoice-form/components/InvoiceSummary.tsx)
  — projected profit
* [../shared/lib/db.ts](../shared/lib/db.ts) — `version(3)` upgrade
* [../shared/lib/invoiceRepository.ts](../shared/lib/invoiceRepository.ts) — read-site defaults

Deliberately **not** touched: everything under `features/invoice-preview/` and
`features/invoice-export/`. The export boundary is structural and needed no changes — see the
export decision below.

**Data/schema changes:**

`db.version(3)` restates the v2 stores unchanged (`invoices` keyed on `id` with `invoiceNumber`,
`customerName`, `createdAt` indexed; `settings` keyed on `id`). No index changes — the version
exists only to run an upgrade:

```ts
tx.table("invoices").toCollection().modify((invoice) => {
  invoice.expenses ??= 0
  invoice.amountPaid ??= 0
})
```

`??=` is deliberate: it backfills missing fields without overwriting real values on a re-run.
Verified that existing non-zero values and explicit zeros both survive. Money stays float naira;
no kobo migration.

**Implementation decisions:**

* **Reused the canonical `calculateTotals`** from
  [../features/invoice-preview/utils.ts](../features/invoice-preview/utils.ts) — the copy all
  three existing consumers already import. The identical dead copy in `shared/lib/utils.ts` was
  left alone (out of scope; catalogued in CODEBASE.md §8 #8).
* **Projected Profit = Invoiced − Expenses**, where Invoiced is the existing calculated total
  after discounts. Computed live from watched form values; never stored. Negative values are
  shown as-is (red), never clamped.
* **The new fields are required on `Invoice`, not optional.** Optional fields would push `?? 0`
  into every consumer; instead the migration plus the read-site normalization make the type
  honest, with the defensive default in one place.
* **Export separation is structural, and was already in place.** `useExportInvoice` rasterizes
  only the preview node (`previewRef`) via `html-to-image`; `InvoicePreview` renders only
  customer-facing fields and never receives financial values. Internal figures live in the form
  column, a sibling of the exported node, so they cannot enter the exported DOM, PNG, or PDF.
  No CSS hiding is involved anywhere.
* **Expenses follows the existing numeric-field convention** (`value={field.value === 0 ? "" :
  field.value}` plus `Number(e.target.value) || 0`), so a negative value is rejected by Zod on
  blur with a field error — the same behaviour as the existing `discountValue` field.
* **`amountPaid` has no UI in this phase**, per the phase brief. It exists in the type, the schema,
  the form defaults, persistence, and the migration, so Phase 2 can add an input without touching
  the data layer.
* **`todayISO()` builds `YYYY-MM-DD` from `getFullYear`/`getMonth`/`getDate`.** No date library.
  The field's meaning is unchanged — it is still the user's calendar date, now correct.

**Verification:**

Static: `pnpm typecheck` clean; `pnpm build` clean (all 9 routes); `eslint` clean on the changed
directories. Repo-wide lint still reports one pre-existing error in the committed generated
`public/sw.js`, which this phase did not touch.

Logic, executing the actual shipped source in Node:

* `todayISO` was extracted from the source file and run under `Africa/Lagos`,
  `America/Los_Angeles`, `Pacific/Kiritimati`, and `UTC` against an independent `Intl` oracle.
  All match. The previous UTC implementation returns the wrong local date inside the rollover
  windows — e.g. Lagos 00:30 on Oct 1 returned `2026-09-30`, the exact month-boundary error
  predicted in [../DATE-FIELDS.md](../DATE-FIELDS.md).
* The real Dexie `contentUpgrade` callback was invoked against sample rows: legacy rows backfilled
  to `0`; existing non-zero values and explicit zeros preserved.
* Schema registration asserted directly on the constructed `Dexie` instance: version 3, both
  tables still present, primary key and indexes unchanged from v2.

End-to-end (Chromium via Playwright, real IndexedDB; run under both `Africa/Lagos` and
`America/Los_Angeles`; 28 assertions, all passing):

* a new invoice starts at `expenses = 0` and `amountPaid = 0`, confirmed by reading IndexedDB
  rather than the UI
* a faithful **v2 database seeded with a pre-feature invoice** upgrades on first load: both fields
  backfilled to `0`, and its total (80,000 − 5,000 = ₦75,000) and every other field unchanged
* expenses save, survive a reload, and load back into the edit form; edits persist and preserve
  `amountPaid` and `createdAt`
* negative expenses are rejected — "Must be 0 or more" is the only validation error, and saving is
  blocked until the value is valid
* projected profit updates live (100,000 − 30,000 = ₦70,000) and goes negative without clamping
  (−₦50,000)
* the default issue date equals the browser's own local date in both timezones
* the DOM node handed to `html-to-image` contains no financial identifiers, and the customer
  detail page shows no internal terms
* PNG and PDF exports still produce valid files with correct filenames

The harness is throwaway and lives outside the repo, so no test framework or dependency was added
to the project.

**Discoveries for Phase 2:**

* **`useInvoiceHistory` reads `db.invoices` directly**, bypassing the repository (and therefore the
  read-site normalization). Harmless now — it uses no financial fields — but a Phase 2 finance
  summary on the history page must either route through the repository or normalize there too.
* **`amountPaid` is already end-to-end** (type, schema, defaults, persistence, migration) with no
  UI. Phase 2 needs only the input and the derived figures.
* **Editing is still subject to the `form.reset()` re-fire** documented in CODEBASE.md §8 #3:
  Dexie emitting a new object for the row resets the form. More relevant once financial values can
  be edited from more places.
* **Each new form field compounds the existing per-keystroke cost** (CODEBASE.md §8 #13/#14:
  argument-less `form.watch()` plus `[invoice]` in the preview's layout effect). Behaviour was
  acceptable with this phase's single added input, but Phase 2 should not pile on inputs before
  that is addressed.

**Notes:**

Changes made during this phase that are **not** part of the feature:

* `next.config.ts` — `allowedDevOrigins` gained `"192.168.0.*"`. Next 16 blocks dev-only endpoints
  for unlisted origins, which silently prevents hydration (and therefore all client-only UI,
  including the preview's fit-to-width scaling) when the app is opened from a LAN address. The
  hardcoded list had gone stale against the machine's DHCP address — the failure mode described in
  CODEBASE.md §8 #20. The wildcard survives future DHCP changes within that subnet. Dev
  ergonomics only; no production effect.
* The production build's `public/sw.js` regeneration was reverted so this phase's diff contains
  only its own changes (CODEBASE.md §8 #19).
* `.next` was cleared after that build. Running `pnpm build` leaves production artifacts in the
  same `.next` a dev server uses, and `next/font/google` then serves **fallback fonts only** in
  dev — both webfonts silently render as system fonts. Verified by A/B against a clean copy of the
  project: 4 `@font-face` rules (fallbacks only) vs 11 (real fonts + fallbacks) with a fresh
  `.next`. Clearing `.next` restores the real fonts.

### Phase 2 — Payment tracking & invoice financial summary

**Status:** Not started

**Changes:**

**Files:**

**Data/schema changes:**

**Verification:**

**Notes:**

### Phase 3 — Monthly finance overview

**Status:** Not started

**Changes:**

**Files:**

**Data/schema changes:**

**Verification:**

**Notes:**

---

## Deferred / Follow-up Items

Pre-existing technical debt relevant to this feature is catalogued in
[../CODEBASE.md](../CODEBASE.md#8-what-will-bite-when-adding-features). Items move here only when
they become active during implementation.

Items surfaced by Phase 1 and deliberately left alone:

* **`useInvoiceHistory` bypasses the repository** — see Discoveries above. Decide in Phase 2
  whether history should normalize through the repository or read raw.
* **Duplicate utilities still present**: `calculateTotals` in `shared/lib/utils.ts` (dead) and
  `generateId` in both `shared/lib/id.ts` and `shared/lib/utils.ts`. Consolidating them is not
  required by this feature and was not done.
* **`public/sw.js` is regenerated by every production build** — reverted after this phase's build,
  but it will dirty the tree again for whoever runs `pnpm build`.
* **`pnpm build` and `pnpm dev` must not share a `.next`** — the build's artifacts make
  `next/font/google` fall back to system fonts in dev (see Phase 1 Notes). Clear `.next` after a
  production build before starting a dev server, or give the dev server its own `distDir`.
* **Export file sizes**: for one modest invoice the PNG was ~270 KB and the PDF ~14 MB (the PDF
  embeds the 3× PNG). Pre-existing and unrelated to this phase, but worth a decision if invoices
  are shared via the Web Share path often.
* **Phase 3 prerequisite still open**: `issueDate` has no maximum or range validation, so an
  invoice can be dated in the future and create a phantom month (see §4 of
  [../DATE-FIELDS.md](../DATE-FIELDS.md)).

---

## Tracking rules

1. Read this file before beginning every phase.
2. Update it only after the current phase has been implemented and verified.
3. Never mark a phase complete before verification.
4. Record actual changes, not planned changes.
5. Record important implementation decisions and why they were made.
6. Record files actually created, modified, or deleted.
7. Record schema/data migrations explicitly.
8. Record important discoveries that affect later phases.
9. Record deferred work instead of implementing it opportunistically.
10. Do not use this file as a substitute for git history; it should explain the feature-level
    implementation state and decisions.
11. Do not start the next phase automatically after updating the file.
12. Keep the document concise and useful for another developer returning to the feature later.
