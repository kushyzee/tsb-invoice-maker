# TSB Invoice Maker

An offline-first invoice maker and PWA for **The Stars Brand**, a fashion brand. It creates
customer invoices, exports them as images or PDFs to send to clients, and tracks the internal
financial position of each job.

Everything runs in the browser. There is no backend, no API, no authentication, and no database
server — invoice data lives in the browser's IndexedDB, so the app works offline once loaded and
there is no server-side copy of anything.

## What it does

**Invoices**

- Line items with quantity and unit price, plus fixed-amount or percentage discounts.
- A live customer-facing preview as you type — a fixed 700px page scaled to fit the screen.
- Export to PNG or PDF and share through the Web Share API (falling back to a download).
- History with search by customer or invoice number, plus edit and delete.
- Your business name, bank details, and payment terms come from Settings and are rendered onto
  every invoice.

**Internal finance** — never shown to the customer

Each invoice carries two internal inputs, `expenses` and `amountPaid`, from which the position is
derived:

| Figure | Meaning |
|---|---|
| **Invoiced** | the invoice total, after discounts |
| **Projected profit** | Invoiced − Expenses |
| **Actual profit** | Amount paid − Expenses |
| **Outstanding** | Invoiced − Amount paid |

Profit and outstanding are deliberately allowed to go negative — a job can lose money, and a client
can overpay.

**Monthly overview** (`/finance`) — pick a month and see Invoiced, Collected, Expenses, Actual
profit, Outstanding, and an invoice-by-invoice breakdown. Invoices are grouped by the month of
their `issueDate`.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript |
| Package manager | pnpm |
| Styling | Tailwind CSS v4, shadcn/ui on **Base UI** (not Radix) |
| Forms | React Hook Form + Zod |
| Storage | Dexie (IndexedDB) with `useLiveQuery` for reactive reads |
| Export | `html-to-image` → PNG, `jsPDF` → PDF, Web Share API |
| PWA | Serwist |
| Icons / fonts | lucide-react; Inter and Herr Von Muellerhoff via `next/font` |

## Getting started

Requires Node 20.9+ and pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Script | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier (writes) |

Both dev and build run with `--webpack`; do not drop that flag. There is **no test suite** — verify
changes by running the app.

## Project structure

```
app/                 routes only — thin pages that compose features
  layout.tsx         app shell: fonts, header, toaster, page background
  (invoice)/         new · history · history/[id] · history/[id]/edit · finance
  settings/
features/<domain>/   one folder per domain, with components/ hooks/ services/
                     schema.ts types.ts utils.ts as needed
  invoice-form/      the Invoice model, its Zod schema, and the edit form
  invoice-preview/   the customer-facing document, and the canonical totals
  invoice-export/    PNG/PDF generation, share-or-download
  invoice-history/   list, search, delete
  invoice-finance/   derived financial figures and summaries
  settings/          business details and payment terms
shared/lib/          infrastructure: Dexie database, repositories, formatting
components/          app chrome (the header) + shadcn primitives in components/ui/
```

## Data model

`Invoice`, in [features/invoice-form/types.ts](features/invoice-form/types.ts):

```ts
{
  id, invoiceNumber, customerName,
  issueDate, dueDate,          // "YYYY-MM-DD" from <input type="date">
  lineItems: LineItem[],
  discountType, discountValue, // "none" | "fixed" | "percentage"
  expenses, amountPaid,        // internal, default 0, never negative
  createdAt, updatedAt,        // ISO 8601
}
```

Two rules matter more than they look:

- **Totals are never stored.** `calculateTotals()` recomputes subtotal, discount, and total from
  the line items on every read, and `calculateFinance()` derives the profit figures from that.
- **The financial month comes from `issueDate.slice(0, 7)`** — a string slice, never `dueDate`,
  never `createdAt`, and never by parsing the date with `new Date()` (a bare `YYYY-MM-DD` parses as
  UTC midnight and reports the wrong month in negative-offset timezones).

### Persistence

Dexie database `tsb-invoice-maker`, currently at version 3:

| Version | Change |
|---|---|
| 1 | `invoices` |
| 2 | `+ settings` |
| 3 | backfills `expenses` / `amountPaid` to `0` on rows written before finance tracking |

Writes go through [shared/lib/invoiceRepository.ts](shared/lib/invoiceRepository.ts) and
[shared/lib/settingsRepository.ts](shared/lib/settingsRepository.ts). One read path — the history
list — still queries Dexie directly rather than through the repository.

## Before you change something

- **Internal figures must never reach the customer.** Expenses, amount paid, profit, and
  outstanding are internal. The export pipeline rasterizes *only* the invoice preview node, so keep
  those values out of `features/invoice-preview/**` and anything that node renders — structural
  separation, not CSS hiding.
- **Money is float naira, not kobo.** `formatNaira` uses `maximumFractionDigits: 0`, so a displayed
  amount can disagree with the sum of the stored values.
- **Invoices are not immutable snapshots.** Totals recompute at render time and the preview reads
  the *current* settings, so changing a calculation or the business details changes how historical
  invoices render.
- **Failed writes are silent.** Toasts confirm successes only; nothing catches a failed
  `saveInvoice`, `toPng`, or jsPDF call.
- **Testing on a phone:** Next blocks dev-only resources for origins it doesn't recognise, and
  without them React never hydrates — the app renders but the preview won't scale. Your machine's
  LAN address must match `allowedDevOrigins` in [next.config.ts](next.config.ts) (it currently
  carries a `192.168.0.*` wildcard).
- **Never share a `.next` between `pnpm build` and `pnpm dev`.** A production build leaves artifacts
  that make `next/font` serve *fallback* fonts in dev. Clear `.next` after building.
- **`public/sw.js` is generated by Serwist but committed**, so a production build dirties the
  working tree.

## Docs

- [CLAUDE.md](CLAUDE.md) — conventions to follow in this repo (forms, styling, scope discipline)
- [docs/finance-tracking-implementation.md](docs/finance-tracking-implementation.md) — how the
  finance feature was built, phase by phase, including what was verified and what was deferred
- [AGENTS.md](AGENTS.md) — read the bundled Next.js 16 docs before writing Next-specific code
