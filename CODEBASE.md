# TSB Invoice Maker — Codebase Map

Written 2026-09-27, after reading every source file in the repo (~2,900 lines).
**Verified by reading source only** — `node_modules/` was not installed at the time, so
nothing here was confirmed by running the app, `typecheck`, `lint`, or a build.

**Updated 2026-09-27**, after two pieces of work that post-date the original read: the finance
feature (per-invoice expenses and amount paid, plus a monthly overview) and the persistent-header
navigation refactor. Both were verified against a running app — `typecheck`, `lint`, a production
build, and browser end-to-end runs — and the statements they invalidated have been corrected. The
rest of the document still reflects the original source-only read.

---

## 1. What this is

An offline-first, single-user invoice maker for a fashion brand (The Stars Brand).
Fully client-side PWA: **no backend, no API routes, no auth, no database server, no tests.**
Persistence is browser IndexedDB.

Everything a user creates lives in their browser profile. There is no sync, no backup,
and no server-side copy.

---

## 2. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js **16.2.6** (App Router), React **19.2.4** |
| Package manager | pnpm (`pnpm-lock.yaml`, `pnpm-workspace.yaml`) |
| Styling | Tailwind CSS **v4** (CSS-first, `@theme inline`) in [app/globals.css](app/globals.css) |
| UI kit | shadcn/ui, `base-sera` style, on **`@base-ui/react`** — *not* Radix |
| Forms | react-hook-form 7 + `@hookform/resolvers` v3 + Zod 3.25 |
| Persistence | **Dexie 4** (IndexedDB) + `dexie-react-hooks` (`useLiveQuery`) |
| Export | `html-to-image` → PNG, `jspdf` → PDF, Web Share API |
| PWA | Serwist 9, SW source [app/sw.ts](app/sw.ts) |
| Icons / fonts | lucide-react; Inter (`--font-sans`), Herr Von Muellerhoff (`--font-script`) |

Not present: TanStack Query, Supabase, Drizzle, Pino, Sentry, Vitest/Playwright,
`error.tsx` / `loading.tsx` / `not-found.tsx`, any toast library.

Build requires webpack — `next dev --webpack` / `next build --webpack` (Turbopack opted out,
presumably for Serwist).

Scripts: `dev`, `build`, `start`, `lint`, `format`, `typecheck`. No `test`.

---

## 3. Structure

Feature-based, three tiers:

```
app/                routing only; pages are thin composition + orchestration
features/<domain>/  components/ hooks/ services/ schema.ts types.ts utils.ts
shared/lib/         infrastructure: db, repositories, constants, formatting
components/         app chrome: app-header.tsx (the persistent header) + theme-provider.tsx
components/ui/      shadcn primitives
lib/utils.ts        cn() only
hooks/              EMPTY (.gitkeep) — vestigial
```

| Route | File | Role |
|---|---|---|
| `/` | [app/page.tsx](app/page.tsx) | `redirect("/new")` |
| `/new` | [app/(invoice)/new/page.tsx](app/(invoice)/new/page.tsx) | Create + export |
| `/history` | [app/(invoice)/history/page.tsx](app/(invoice)/history/page.tsx) | List, search, delete |
| `/history/[id]` | [app/(invoice)/history/[id]/page.tsx](app/(invoice)/history/[id]/page.tsx) | View + export + delete |
| `/history/[id]/edit` | [app/(invoice)/history/[id]/edit/page.tsx](app/(invoice)/history/[id]/edit/page.tsx) | Edit |
| `/finance` | [app/(invoice)/finance/page.tsx](app/(invoice)/finance/page.tsx) | Monthly internal finance overview |
| `/settings` | [app/settings/page.tsx](app/settings/page.tsx) | Business + payment details |

All pages are `"use client"` except `app/page.tsx` and `app/settings/page.tsx`.

`(invoice)` is a route group with **no `layout.tsx`** of its own, and `/settings` sits outside it —
so the chrome shared by every page lives in [app/layout.tsx](app/layout.tsx): it mounts
[components/app-header.tsx](components/app-header.tsx) and owns `min-h-svh bg-neutral-100`. Pages
keep only their own `p-4 sm:p-6` padding plus an `mx-auto max-w-*` wrapper, and add no navigation
of their own.

---

## 4. How the invoice workflow actually works

### Create — [app/(invoice)/new/page.tsx](app/(invoice)/new/page.tsx)

1. `useNextInvoiceNumber()` → `useLiveQuery(getHighestInvoiceNumber)` → `String(highest + 1).padStart(2, "0")`.
   Returns `""` while Dexie loads.
2. `useInvoiceForm(suggestedNumber)` builds the RHF form; an effect pushes the suggestion in,
   but only if the field isn't already dirty ([useInvoiceForm.ts:62-67](features/invoice-form/hooks/useInvoiceForm.ts#L62-L67)).
3. `const values = form.watch()` — a full-form subscription. A **new `Invoice` object literal
   is built on every render** and passed to `<InvoicePreview>` for the live preview.
4. Three submit paths, all gated by `form.handleSubmit` (Zod):
   - **Save** → `persistInvoice()` → `db.invoices.put` → `router.push("/history")` → `form.reset()`
   - **Export PDF / image** → **also persists the invoice first**, then exports, then resets the
     form and **stays on `/new`** (no redirect).
5. `activeAction` state drives button labels and `disabled`.

### Preview — [InvoicePreview.tsx](features/invoice-preview/components/InvoicePreview.tsx)

Fixed `PAGE_WIDTH = 700`. A `ResizeObserver` measures the container and computes
`scale = min(containerWidth / 700, 1)`; the page is `transform: scale()`-ed with the wrapper
sized to `height * scale`. `useImperativeHandle` exposes the **unscaled 700px node** — that's
what gets rasterized.

Composed of 8 presentational sections in [components/sections/](features/invoice-preview/components/sections/):
Header (script-font brand name + letterspaced "INVOICE"), IssuedTo, Meta, PayTo, PaymentNote,
ItemsTable, TotalsBlock, Footer.

### Export — [useExportInvoice.ts](features/invoice-export/hooks/useExportInvoice.ts)

`toPng(node, { pixelRatio: 3, style: { transform: "none" } })` → PNG data URL.
- **Image:** `dataUrlToFile` → `File` → share-or-download.
- **PDF:** PNG → `jsPDF({ format: [offsetWidth, offsetHeight], unit: "px" })` → one giant
  single-page PDF sized to the invoice's pixel dimensions.
- Prefers `navigator.share({ files })` when `canShare` allows; user-cancelled share returns
  silently; any other share error falls back to an `<a download>` click.

### History — [useInvoiceHistory.ts](features/invoice-history/hooks/useInvoiceHistory.ts)

`db.invoices.orderBy("createdAt").reverse().toArray()`, then **in-memory** case-insensitive
substring filter on `customerName` / `invoiceNumber`, re-run by `useLiveQuery` on every keystroke.

### Edit — [edit/page.tsx](app/(invoice)/history/[id]/edit/page.tsx)

`useLiveQuery(getInvoiceById)` → record passed into `useInvoiceForm("", existingInvoice)` → an
effect calls `form.reset(invoice)` when it arrives. Save spreads `...existingInvoice, ...data,
updatedAt: now`, preserving `id` and `createdAt`. **No export buttons on the edit page**, and no
preview ref is passed — so exports are only reachable from `/new` and `/history/[id]`.

### Settings — [useSettings.ts](features/settings/hooks/useSettings.ts)

Single row `id: "singleton"`. `useSettings()` returns `settings ?? DEFAULT_SETTINGS`, so
consumers **never see undefined**. Save shows "Saved ✓" inline.

---

## 5. Data model

### `Invoice` — [features/invoice-form/types.ts](features/invoice-form/types.ts)

```ts
LineItem { id, description, unitPrice: number, qty: number }
DiscountType = "none" | "fixed" | "percentage"

Invoice {
  id, invoiceNumber, customerName,
  issueDate, dueDate,          // "YYYY-MM-DD" from <input type="date">
  lineItems: LineItem[],
  discountType, discountValue: number,
  expenses, amountPaid,        // internal finance inputs, default 0, never negative
  createdAt, updatedAt,        // ISO 8601
}
```

`expenses` and `amountPaid` are the only stored financial inputs — profit and outstanding are
derived on read (`calculateFinance`, [features/invoice-finance/utils.ts](features/invoice-finance/utils.ts))
and never persisted. Records written before that feature simply lack the two fields; the v3 upgrade
backfills them and `withFinancialDefaults` covers any that slipped through.

### `Settings` — [features/settings/types.ts](features/settings/types.ts)

`businessName`, `payToBankName`, `payToAccountName`, `payToAccountNumber`,
`paymentTermsNote` — all strings. Defaults in [shared/lib/constants.ts](shared/lib/constants.ts)
contain real bank details.

### Dexie schema — [shared/lib/db.ts](shared/lib/db.ts)

```ts
version(1): invoices: "id, invoiceNumber, customerName, createdAt"  // id = PK, rest indexed
version(2): + settings: "id"
version(3): same stores; upgrade() backfills expenses/amountPaid = 0 on pre-existing rows
```

### Sources of truth

| Data | Lives in | Note |
|---|---|---|
| Invoice record | IndexedDB `invoices` via [invoiceRepository.ts](shared/lib/invoiceRepository.ts) | `id` = `crypto.randomUUID()` |
| Totals | **Not stored — recomputed on every read** | `calculateTotals()` from lineItems + discount |
| Business identity on an invoice | **`settings`, resolved at render time** | editing settings rewrites how history renders |
| Form values | RHF in-memory | projected into an `Invoice`-shaped object for preview |
| Customer | just `customerName: string` | no customer entity |
| Products | free-text `description` + `unitPrice` | no catalogue |
| Status / payments | **only `amountPaid`, a single scalar** | no draft/sent/paid status, no payment history, no dates or methods, no balance-due field |

**Two facts with the widest blast radius:**

1. **Invoices are not immutable snapshots.** `calculateTotals` runs at render time and the
   preview pulls bank details and terms from *current* settings. Change the calculation or the
   settings and every historical invoice changes.
2. **Money is float, and never rounded to kobo.** `formatNaira` uses
   `maximumFractionDigits: 0`, so displayed naira can disagree with the sum of stored values.

---

## 6. State & data flow

```
IndexedDB ──useLiveQuery──► hooks (useInvoiceHistory / useSettings / detail / edit)
                              │
                              ▼
                        page component ──props──► feature components
                              ▲
        RHF form state ───────┘  form.watch() → Invoice object → InvoicePreview
```

- **Server state:** none. Dexie is the only store; `useLiveQuery` is the reactivity backbone,
  so writes auto-trigger re-render.
- **Client state:** `useState` only (`activeAction`, `isSaving`, `justSaved`, `searchTerm`,
  `month`, `scale`, `pageHeight`). No Context, no Zustand, no query cache.
- **Mutations:** repositories write directly, awaited inside `try/finally` — **with no `catch`
  anywhere in the codebase.**

---

## 7. Conventions to follow

- **Forms:** always `useForm` + `zodResolver` + **`Controller` render-prop per field** (never
  `register`). Every field wrapped in `<Field data-invalid={fieldState.invalid}>` with
  `<FieldLabel htmlFor={field.name}>` and a conditional `<FieldError errors={[fieldState.error]}/>`.
  This pattern is applied with zero exceptions — copy it exactly.
- **Numeric inputs:** controlled, `value={field.value === 0 ? "" : field.value}`,
  `onChange(Number(e.target.value) || 0)` to avoid the `0`-in-input problem.
- **Validation:** `mode: "onBlur"`; short imperative Zod messages ("Customer name is required").
- **Loading states:** the string `Loading…` in `text-neutral-500`; busy buttons swap to
  `"Saving…"` / `"Exporting…"`. No skeletons or spinners.
- **Page shell:** `p-4 sm:p-6` plus an `mx-auto max-w-*` inner wrapper. The
  `min-h-svh bg-neutral-100` background belongs to [app/layout.tsx](app/layout.tsx) — do not repeat
  it per page.
- **Navigation:** the four destinations are defined once in
  [components/app-header.tsx](components/app-header.tsx) and rendered from the root layout. Pages
  must not add their own nav links; page-level back/cancel affordances are fine and expected.
- **Color:** raw Tailwind neutrals (`neutral-900`, `neutral-500`) outside `components/ui`;
  design tokens (`bg-background`, `text-destructive`) inside it. Both patterns coexist.
- **Repositories:** plain exported async functions wrapping Dexie. No classes, no query builders.
- **Types:** `type` not `interface`; `import type` used consistently; local `type XProps = {}`.
- **Prettier:** no semicolons, double quotes, 80 cols, `prettier-plugin-tailwindcss` with
  `cn`/`cva` as class functions. ([shared/lib/id.ts](shared/lib/id.ts) is the one file violating this.)
- **House visual style:** square (`rounded-none`), uppercase, letterspaced, underline-only inputs.

---

## 8. What will bite when adding features

Ordered by how likely each is to affect new work.

### Correctness

1. **Duplicate invoice numbers.** `getHighestInvoiceNumber()` takes `Math.max` over existing rows
   ([invoiceRepository.ts:38-44](shared/lib/invoiceRepository.ts#L38-L44)), so deleting the highest
   invoice reuses its number. There's no uniqueness check — duplicates store silently. Numbering
   also ignores other tabs and manual edits.
2. **Discount is unbounded.** `discountValue: z.number().min(0)` has no max; `percentage: 200`
   yields a discount of 2× the subtotal, and only `Math.max(total, 0)` in
   [invoice-preview/utils.ts:17](features/invoice-preview/utils.ts#L17) prevents a negative total.
   The summary then shows a discount larger than the subtotal.
3. **`form.reset([initialInvoice])`** re-fires whenever Dexie emits a new object for that row —
   editing while another tab writes silently discards unsaved edits.
4. **Money stored as float, totals never persisted.** `unitPrice * qty` accumulates FP error,
   percentage discounts produce fractional naira, and nothing rounds to kobo.

### Error handling

5. **Almost no `catch` in the codebase** — seven `try` blocks, and only one of them catches: the
   `AbortError` guard in `shareOrDownload`
   ([useExportInvoice.ts:29](features/invoice-export/hooks/useExportInvoice.ts#L29)), which returns
   silently by design. Everywhere else a failed `saveInvoice`, `toPng`, or jsPDF call leaves the
   button re-enabled with no message and an unhandled rejection. There is no toast mechanism to hook
   into, so this needs a decision before adding anything that can fail.
6. **Silent no-op exports** if the preview ref is null (guarded by an early `return`, no feedback).

### Coupling & duplication

7. **The domain type `Invoice` lives inside `features/invoice-form/types.ts`**, while
   `shared/lib/db.ts`, `constants.ts`, preview, export, and history all import from it. Likewise
   `Settings` lives in `features/settings/types.ts` but is imported by `shared/lib/`. The domain
   model has no home of its own — this is the coupling most likely to complicate new features.
8. **`calculateTotals` is defined twice**: [features/invoice-preview/utils.ts:5](features/invoice-preview/utils.ts#L5)
   (used by all 3 consumers) and [shared/lib/utils.ts:5](shared/lib/utils.ts#L5) (**dead code**).
   `invoice-form` and `invoice-history` import the preview feature's copy — a layering violation.
9. **`generateId` is defined twice, byte-identical**: [shared/lib/id.ts](shared/lib/id.ts) and
   [shared/lib/utils.ts:22](shared/lib/utils.ts#L22), each used by a different caller.
10. **Delete-confirm logic duplicated verbatim** (same string, `window.confirm`) in
    [history/page.tsx:12](app/(invoice)/history/page.tsx#L12) and [[id]/page.tsx:32](app/(invoice)/history/[id]/page.tsx#L32).
11. **Page shells still repeat their padding and max-width.** The header, background and
    min-height are now shared ([app/layout.tsx](app/layout.tsx)), but each page still opens with its
    own `p-4 sm:p-6` and a different `mx-auto max-w-*` (`md`/`2xl`/`4xl`/`6xl`/`700px`), and the
    two `[id]` pages repeat that shell three times each for their loading and not-found states.
12. **Three different "utils" locations** (`lib/utils.ts`, `shared/lib/`, `features/*/utils.ts`)
    plus an empty root `hooks/` — note `components.json` aliases hooks to `@/hooks`, where no
    existing hook actually lives.

### Performance

13. **Per-keystroke observer churn.** `InvoicePreview`'s `useLayoutEffect` depends on `[invoice]`,
    but `invoice` is a fresh object literal every render — so every keystroke tears down and
    recreates **two `ResizeObserver`s** and forces a synchronous layout read.
14. **`form.watch()` with no arguments** re-renders the whole page (including the 700px preview
    tree) per character typed. Compounds with #13.
15. `pdf.output("datauristring")` is always computed even when sharing succeeds and the fallback
    is unused — a large base64 encode for nothing.
16. Full-table reads: `getHighestInvoiceNumber` does `toArray()`; history loads every row then
    filters in JS. Fine at hundreds of invoices, not at thousands.

### Dead code / config

17. **`components/theme-provider.tsx` is never mounted** — `next-themes` is a dependency, `.dark`
    tokens exist in `globals.css`, and the provider ships a `d`-key dark-mode hotkey, but nothing
    imports it. `--brand-accent` is likewise defined and never used. (`app/layout.tsx` *does* wrap
    `children` now — in the flex column that holds the header — but still not in a theme provider.)
18. **Unused UI exports:** `CardFooter`, `CardAction`, `CardDescription`, `TableFooter`,
    `TableCaption`, `SelectGroup`, `SelectLabel`, `SelectSeparator`, and 8 of 10 `Field*`
    components are imported by nothing outside `components/ui`.
19. **`public/sw.js` (50 KB, generated) is committed** though Serwist regenerates it each build —
    builds dirty the tree, and it isn't in `.gitignore`.
20. **`allowedDevOrigins` hardcodes LAN IPs** ([next.config.ts:15](next.config.ts#L15)) — it now
    carries a `192.168.0.*` wildcard alongside the pinned addresses, so it survives DHCP within that
    subnet, but a move to a different subnet still silently blocks the dev client (React never
    hydrates, and client-only UI such as the preview's fit-to-width scaling never runs).
21. `settings!` non-null assertions in [InvoicePreview.tsx](features/invoice-preview/components/InvoicePreview.tsx#L64)
    are redundant, since `useSettings()` never returns nullish.
22. Minor: typing a trailing decimal point in price fields is fought by the controlled
    `Number()` round-trip, making kobo awkward to enter — even though they're then hidden by
    `maximumFractionDigits: 0`.

---

## 9. Highest-value things to decide before the next feature

1. **Do invoices need to become immutable snapshots** (store totals + settings on the record at
   save time)? It's a Dexie schema migration and it changes how existing records render.
2. **Float naira or integer kobo?** Affects stored data — better decided once than migrated twice.
3. **Which entities should exist that still don't** — customers, product catalogue, invoice
   status, payment history/part-payment transactions, balance due? Each has its own migration shape.
   Expenses and a scalar `amountPaid` now exist, so "money paid" is recorded but cannot be dated,
   split, or attributed to a method.
4. **Still offline-only and single-device?** No backend, auth, or sync exists. Anything implying
   sharing or multi-device is a new architecture tier.
5. **Add tests?** None exist. `calculateTotals`, `buildExportFilename`, `formatNaira`, and the
   invoice-number logic are pure and trivial to cover, but Vitest would be the first new pattern
   in the repo.
6. **Add a toast/notification mechanism, or keep inline text?** Any feature that can fail needs
   this answered first, given #5 in the previous section.
7. **Fix debt as part of feature work, or stay strictly additive?** Items 13–14 are the ones most
   likely to make a new form field feel broken rather than merely slow.
