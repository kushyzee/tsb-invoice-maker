# Finance Tracking Implementation

Persistent implementation log for the finance-tracking feature.

**Status:** All three phases implemented and verified.
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
* [x] Phase 2 — Payment tracking & invoice financial summary
* [x] Phase 3 — Monthly finance overview

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
* **Shape of payment records** — **settled for now as a single scalar `amountPaid`** (Phases 1–2).
  The scope constraints exclude payment history, dates, and methods, so partial payments can be
  recorded as a running total but cannot be attributed to a date or split into transactions. A
  dated-payment model remains a possible future change; it would be a new table plus a migration,
  and it would change how "amount paid" is entered.
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

**Status:** Complete — implemented and verified.

**Changes:**

1. New `features/invoice-finance/` — the finance feature's home.
   * `utils.ts` — `calculateFinance()` centralises the six derived figures and delegates
     the invoice total to the canonical `calculateTotals`.
   * `components/InvoiceFinanceSummary.tsx` — the shared internal summary, rendering
     Invoiced, Amount paid, Expenses, Projected profit, Actual profit, Outstanding.
2. The form's **Costs** card becomes **Costs & Payment** and gains an `amountPaid` input
   alongside Expenses (a payment is not a cost, hence the rename).
3. `InvoiceSummary` (live, on the new and edit pages) now renders all six figures through the
   shared component instead of showing only Expenses and Projected profit.
4. The invoice detail page gains a read-only **Internal finance** card below the document.

**Files:**

Created (2):

* [../features/invoice-finance/utils.ts](../features/invoice-finance/utils.ts) — derived figures
* [../features/invoice-finance/components/InvoiceFinanceSummary.tsx](../features/invoice-finance/components/InvoiceFinanceSummary.tsx)
  — shared internal summary

Modified (3):

* [../features/invoice-form/components/InvoiceForm.tsx](../features/invoice-form/components/InvoiceForm.tsx)
  — Costs & Payment card with the Amount paid input
* [../features/invoice-form/components/InvoiceSummary.tsx](../features/invoice-form/components/InvoiceSummary.tsx)
  — renders the shared finance summary
* [../app/(invoice)/history/[id]/page.tsx](../app/(invoice)/history/[id]/page.tsx) — internal
  finance card

Not touched: the preview, export, and history features, and the whole data layer (see below).

**Data/schema changes:**

None. No new migration, and no change to the persisted shape. `amountPaid` has been stored,
validated, defaulted, and normalised on read since Phase 1 — Phase 2 is derived calculations plus
UI. Derived values remain computed on read and are never persisted.

**Implementation decisions:**

* **Amount paid is entered in the edit form**, in the same card as Expenses. That keeps a single
  write path, reuses the existing RHF/Zod validation and save flow, and needs no new pattern. The
  rejected alternative — editing it inline on the detail page — would have introduced the app's
  first inline-edit surface and a second write path, and the app still has no error/toast
  mechanism to report a failed write (CODEBASE.md §5).
* **The detail page gets a read-only panel** so the financial position is visible without entering
  edit mode. That page is otherwise purely the customer document, so the panel is labelled
  "Internal finance" and carries the same "never shown on the customer's invoice" note as the form.
* **One shared component for both surfaces**, so the labels and derivations cannot drift apart.
  `calculateFinance` accepts `Pick<Invoice, …>`, which both a stored `Invoice` and live
  `InvoiceFormValues` satisfy.
* **The invoice total is not reimplemented.** `calculateFinance` calls the canonical
  `calculateTotals`; verified that the internal Invoiced equals the TOTAL printed on the customer
  document (₦180,000 in the recorded run).
* **Negative values are never clamped.** Negative profit and negative outstanding render in
  `text-destructive`, the treatment Phase 1 introduced for projected profit.
* **Overpayment — flagged UX decision.** The app has no established treatment for paying more than
  was invoiced (CODEBASE.md §5 records that no status, payment, or balance concept exists). Phase 2
  therefore shows the negative outstanding as-is and adds an `(overpaid)` hint beside the label
  rather than hiding or clamping it. Negative *profit* gets no hint, because a loss is an ordinary
  outcome while overpayment is anomalous. If the business prefers a different treatment — a
  warning, or refusing the entry — it is isolated to `InvoiceFinanceSummary`.
* **`Invoiced` is shown in the internal block even though the form summary already shows the same
  number as `Total`.** Deliberate: the internal block is specified to communicate all six figures
  and is reused verbatim on the detail page, so a self-contained block beats a variant system.

**Verification:**

Static: `pnpm typecheck` clean; `eslint` clean on the changed paths; production build clean across
all 9 routes. The build was run in an **isolated copy** of the project so the dev server's `.next`
was not polluted (the failure mode recorded in the Phase 1 Notes); `public/sw.js` was therefore
left untouched.

End-to-end (Chromium via Playwright, real IndexedDB, `Africa/Lagos`), 30 assertions, all passing,
covering every item in the phase brief:

* a new invoice starts with all six figures at ₦0 and is persisted with `amountPaid = 0`,
  `expenses = 0` (items 1, 5)
* a payment recorded after creation survives the save, and the detail page reflects it (item 2)
* a later payment edit persists and re-renders (item 3); Expenses stay editable throughout (item 4)
* Invoiced tracks the line items (100,000 → 200,000) and the discount (fixed 20,000 →
  ₦180,000), and projected profit and outstanding follow it, while **actual profit is unaffected by
  price** (item 10)
* changing Expenses updates projected *and* actual profit live (item 11); changing Amount paid
  updates actual profit *and* outstanding live (item 12)
* actual profit is correctly negative when nothing has been paid against costs (−₦30,000), and is
  neither clamped nor hidden (item 8)
* paying more than the invoice total yields outstanding of −₦20,000 with the `(overpaid)` hint and
  destructive styling; outstanding of ₦0 renders on exact payment (items 7, 8)
* the internal Invoiced equals the total on the customer document
* a **v2 database seeded with a pre-finance invoice** opens with all six figures zeroed and the
  correct ₦75,000 Invoiced (item 9)
* deleting the invoice removes the record and its financial data (item 13)
* the internal panel is **structurally outside** the node handed to `html-to-image`, that node
  contains no internal text or attributes, and PNG and PDF still export as valid files (item 14)

The Phase 1 suite was re-run as a regression check and passes (29 assertions). Two of its
assertions were **rescoped, not weakened**: they asserted that the whole *detail page* contained no
internal financial terms, which Phase 2 intentionally makes false by adding the panel there. They
now assert it of the customer-facing document node instead — the invariant the brief actually
states.

**Discoveries for Phase 3:**

* **`calculateFinance` is the aggregation primitive.** Monthly figures are a sum of
  `calculateFinance(invoice)` over the invoices in a month, so the per-invoice and per-month
  numbers cannot diverge. Nothing derived is stored, so months recompute after edits and deletes.
* **Nothing in the finance code touches dates.** `calculateFinance` takes no date input at all, so
  Phase 3's grouping stays entirely in the aggregation layer, keyed on `issueDate.slice(0, 7)`.
* **`useInvoiceHistory` still reads Dexie directly**, bypassing the repository's defaults
  normalisation. This did not matter in Phase 2 (the detail page reads through the repository), but
  Phase 3's aggregation must decide: route through the repository, or normalise where it reads.
  Still open from Phase 1.
* **`issueDate` still has no range validation**, so a future-dated invoice creates a phantom month
  (still open; §4 of [../DATE-FIELDS.md](../DATE-FIELDS.md)).

**Notes:**

The form summary now shows `Invoiced` immediately below `Total` with the same value — intentional,
see the decisions above.

### Phase 3 — Monthly finance overview

**Status:** Complete — implemented and verified.

**Changes:**

1. New `/finance` route — "Financial Overview": a month selector, the month's totals, and an
   invoice-level breakdown.
2. Month helpers and `calculateMonthlyFinance()` added to the finance utils.
3. `listInvoices()` added to the invoice repository, applying the same financial-field defaults as
   `getInvoiceById`.
4. `useFinanceInvoices` hook — `useLiveQuery` over `listInvoices()`.
5. `MonthlyFinanceSummary` and `MonthlyInvoiceBreakdown` components.
6. A Finance link added to the `/new` and `/history` headers so the page is reachable.

**Files:**

Created (4):

* [../app/(invoice)/finance/page.tsx](../app/(invoice)/finance/page.tsx) — the page
* [../features/invoice-finance/hooks/useFinanceInvoices.ts](../features/invoice-finance/hooks/useFinanceInvoices.ts)
* [../features/invoice-finance/components/MonthlyFinanceSummary.tsx](../features/invoice-finance/components/MonthlyFinanceSummary.tsx)
* [../features/invoice-finance/components/MonthlyInvoiceBreakdown.tsx](../features/invoice-finance/components/MonthlyInvoiceBreakdown.tsx)

Modified (4):

* [../features/invoice-finance/utils.ts](../features/invoice-finance/utils.ts) — `monthKeyOf`,
  `currentMonth`, `shiftMonth`, `calculateMonthlyFinance`
* [../shared/lib/invoiceRepository.ts](../shared/lib/invoiceRepository.ts) — `listInvoices()`
* [../app/(invoice)/new/page.tsx](../app/(invoice)/new/page.tsx) — Finance link
* [../app/(invoice)/history/page.tsx](../app/(invoice)/history/page.tsx) — Finance link

**Data/schema changes:**

None. No migration, no new table, and no stored aggregates — the month totals are recomputed from
the invoice records on every read.

**Implementation decisions:**

* **`/finance` sits in the existing `(invoice)` route group**, matching how `/new` and `/history`
  are organised. There is no route-group layout in this app (page chrome is per page), so the page
  repeats the established shell: `min-h-svh bg-neutral-100` with a centred `max-w` column.
* **The page reads through the repository**, via a new `listInvoices()`. This resolves the question
  left open in Phases 1–2: aggregation reads *normalised* records, so an invoice created before the
  finance feature contributes `0`/`0` rather than `undefined` (which would have propagated `NaN`
  through every sum). `useInvoiceHistory` still reads Dexie directly; it uses no financial fields,
  so it was left alone rather than refactored.
* **Month totals sum `calculateFinance()` per invoice** rather than summing the raw fields
  independently, so the monthly and per-invoice figures cannot drift apart. This was the Phase 2
  discovery, now cashed in.
* **`issueDate.slice(0, 7)` for the month key, always by string.** `dueDate`, `createdAt`, and
  `updatedAt` are not read anywhere in the finance code, and no `Date` is ever constructed from an
  issue date.
* **The default month is the user's local calendar month**, from local getters (`currentMonth()`),
  for the same reason `todayISO()` was corrected in Phase 1 — `toISOString()` would report the
  previous month during the first hours of the local day.
* **The month selector is a native `<input type="month">` plus prev/next buttons.** The input gives
  a `YYYY-MM` value and a picker, consistent with the app's existing native date inputs; the
  stepper exists because Firefox does not support `type="month"` and silently degrades it to a text
  field.
* **`shiftMonth` moves the month by arithmetic on its numeric parts**, never by constructing a
  `Date` from the string — the same UTC-parse trap the month key avoids.
* **Breakdown ordering is `issueDate`, then invoice number**, so a month reads chronologically
  rather than in whatever order Dexie returns; the invoice number links to the invoice.
* **Terminology follows the phase brief exactly**, which uses *Collected* for the month tiles and
  *Amount paid* for the breakdown column; the Phase 2 per-invoice panel also says "Amount paid".
  Noted below as something to unify if the split is unwanted.
* **Negative month totals render in the destructive colour**, as in Phases 1–2. The "(overpaid)"
  hint is *not* repeated at month level: across several invoices a negative outstanding is an
  aggregate, not a single overpayment.
* **An empty month is a normal state**, showing zeros plus "No invoices in this month." rather than
  an error or a blank page.

**Verification:**

Static: `pnpm typecheck` clean; `eslint` clean on the changed paths; production build clean across
all 10 routes (now including `/finance`), run in an isolated copy of the project so the dev
server's `.next` was not polluted.

End-to-end (Chromium via Playwright, real IndexedDB, `Africa/Lagos`). The fixture set is seeded
straight into schema v3 and is deliberately adversarial: four July invoices — #1 with a `dueDate`
in August *and* a `createdAt` in September, #2 with a `dueDate` *before* its issue date, #3 a
pre-finance record with no financial fields at all, #4 loss-making — plus one August invoice.

* items 1, 2 — the page loads; the default month equals the browser's own current local month
  (2026-09), which is empty: zeros and the empty state, not an error (item 17)
* item 3 — switching to August shows different figures; the stepper crosses a year boundary
  (2026-01 → 2025-12 → 2026-01)
* items 4, 5, 6 — July contains exactly the four July issue dates, and #1/#2 stay in July although
  their `dueDate` and `createdAt` point at other months
* items 7–11 — July: Invoiced ₦230,000, Collected ₦50,000, Expenses ₦80,000, Actual profit
  −₦30,000 (= 50,000 − 80,000), Outstanding ₦180,000 (= 230,000 − 50,000)
* item 12 — the pre-finance row shows ₦40,000 invoiced with ₦0 paid, ₦0 expenses, ₦0 profit: no
  `NaN`
* item 16 — #4's −₦40,000 renders negative, in the destructive colour
* cross-check — the breakdown's Invoiced for #2 (₦80,000, after a fixed ₦20,000 discount) equals
  the TOTAL printed on that invoice's own page, confirming one canonical total
* item 13 — editing #1's amount paid to ₦100,000 moved July to Collected ₦110,000, profit
  ₦30,000, outstanding ₦120,000, with no manual refresh
* item 14 — moving #4 to August removed it from July (3 invoices) **taking its payment and its loss
  with it** (Collected ₦100,000, profit ₦70,000, outstanding ₦120,000), and August absorbed it
  (2 invoices, ₦80,000 invoiced, ₦60,000 expenses, ₦20,000 profit, ₦0 outstanding)
* item 15 — deleting #5 updated August to 1 invoice with the correspondingly reduced totals
* item 18 — the Phase 1 (29 assertion) and Phase 2 (33 assertion) suites re-run green, alongside
  24 assertions for this phase: 86 in total, no failures

**Notes:**

* Two problems found while verifying were in the throwaway harness, not the app: month selection
  was landing *before* React hydrated after a navigation (the input event was discarded and the
  month stayed at its default, showing zeros), and one July expectation had not accounted for #4's
  payment leaving July when the invoice did. Both were fixed in the harness; the app's figures were
  correct throughout.
* **Google Fonts is intermittently flaky from this machine.** The first production build of this
  phase failed with `next/font` "Failed to fetch `Inter`/`Herr Von Muellerhoff` from Google Fonts",
  and the identical source built cleanly on retry, with `curl` returning 200 either side. A build
  can therefore fail for reasons unrelated to the code. This is separate from the `.next`-sharing
  failure recorded in the Phase 1 Notes.

**Deferred for this phase:**

* **The selected month is component state, not a URL parameter**, so a month cannot be linked or
  bookmarked. The brief asks for a simple selector in V1; search params would be the next step.
* **Terminology split** — *Collected* on the month tiles vs *Amount paid* on the breakdown column
  and per-invoice panel. This follows the brief's own wording, but unifying it is a one-line change
  if the split reads oddly.
* **Charts** remain explicitly out of scope.
* **Month totals scan every invoice on each render.** Fine at boutique volume (the existing search
  and invoice-number code already load the whole table); a `db.version(4)` index on `issueDate`, or
  a stored aggregate, is the answer if the table ever grows to thousands of rows.
* `useInvoiceHistory` still bypasses the repository — harmless today (no financial fields), but it
  is the one remaining raw read.

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
