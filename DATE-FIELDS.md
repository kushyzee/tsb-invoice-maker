# Date fields: `issueDate`, `dueDate`, `createdAt`

Written 2026-09-27. Analysis only — **no code was changed.**

Method: read every reference to each date field across the codebase (see the grep
inventory below), plus the field's full git history. The timezone behaviour was verified by
executing the exact expressions the app uses under `TZ=Africa/Lagos` and three other zones.
The app itself was **not** run — `node_modules/` is not installed.

**Question this answers:** which field should monthly financial aggregation group by?

**Answer: `issueDate`.** Reasoning and caveats below.

---

## 1. Field inventory

| | `issueDate` | `dueDate` | `createdAt` | `updatedAt` |
|---|---|---|---|---|
| Format | `"YYYY-MM-DD"` | `"YYYY-MM-DD"` | ISO 8601 UTC, with time + `Z` | same as `createdAt` |
| Set by | user, `<input type="date">` | user, `<input type="date">` | `new Date().toISOString()` | `new Date().toISOString()` |
| Default | `todayISO()` — **UTC-derived** | `""` (must be filled) | n/a | n/a |
| Required | yes, `min(1)` | yes, `min(1)` | n/a | n/a |
| Mutable | **yes** — editable, and editable post-hoc on the edit page | yes | **no** — preserved across edits | yes, refreshed on every save |
| Indexed in Dexie | **no** | no | **yes** | no |
| Read by any logic | display only | **nothing** | history sort order only | **nothing** |

Source: [types.ts](features/invoice-form/types.ts#L14-L20), [schema.ts](features/invoice-form/schema.ts#L13-L14),
[useInvoiceForm.ts](features/invoice-form/hooks/useInvoiceForm.ts#L13-L15), [db.ts:13](shared/lib/db.ts#L13),
[new/page.tsx:45-55](app/(invoice)/new/page.tsx#L45-L55), [edit/page.tsx:47-51](app/(invoice)/history/[id]/edit/page.tsx#L47-L51).

### Verified behaviours

- **`issueDate` and `dueDate` have existed unchanged since the first commit** (`494f6fb`), and
  both have been Zod-required since the commit that introduced persistence (`e287280` — the same
  commit that added `todayISO()`). **No stored record can have an empty `issueDate`**, so
  aggregation needs no fallback for missing dates.
- **`dueDate` is functionally inert.** It's validated, stored, and printed by
  [InvoiceMetaBlock.tsx:32](features/invoice-preview/components/sections/InvoiceMetaBlock.tsx#L32),
  and read by zero logic. It affects nothing.
- **`createdAt` is preserved on edit; `updatedAt` is overwritten.** So `createdAt` reliably means
  "when this record was first entered" and `updatedAt` means "when it was last touched".
- **`issueDate` is the date the UI already treats as primary** — shown in the history list
  ([InvoiceHistoryItem.tsx:31](features/invoice-history/components/InvoiceHistoryItem.tsx#L31))
  and printed on the customer-facing document as `DATE:`.
- **Only `createdAt` is indexed**, so `orderBy("createdAt")` is the one efficient query.
  Everything else (including the existing search and invoice-number logic) loads all rows and
  filters in memory.

---

## 2. The timezone finding (verified)

`todayISO()` is `new Date().toISOString().slice(0, 10)` — **UTC**, not local
([useInvoiceForm.ts:13-15](features/invoice-form/hooks/useInvoiceForm.ts#L13-L15)). For a Lagos
user (UTC+1, no DST), executing the exact expression:

```
Local wall time          →  issueDate defaults to
Oct 1, 00:30 local       →  2026-09-30    ← previous month
Oct 1, 00:59 local       →  2026-09-30
Oct 1, 01:00 local       →  2026-10-01    ← correct
Oct 31, 23:30 local      →  2026-10-31
```

For the first hour of every local day, the default `issueDate` is **yesterday**. The worst place
for that is midnight on the 1st — exactly where a monthly boundary sits.

`createdAt` has the identical rollover, and there it is **uncorrectable**, because it's immutable:

```
Lagos local Nov 1, 00:30  →  createdAt = "2026-10-31T23:30:00.000Z"  →  month key "2026-10"
```

That invoice is permanently filed in October by any report that keys off `createdAt`.

### Month-key extraction (verified across timezones)

Extracting a month from `issueDate` must be done by **string**, not by parsing:

| Timezone | `issueDate.slice(0, 7)` | `new Date(issueDate).getMonth()` |
|---|---|---|
| `Africa/Lagos` | `2026-10` | `2026-10` |
| `UTC` | `2026-10` | `2026-10` |
| `America/Los_Angeles` | `2026-10` | **`2026-09` — mismatch** |
| `Pacific/Kiritimati` | `2026-10` | `2026-10` |

A bare `"YYYY-MM-DD"` string parses as **UTC midnight**, so month extraction breaks in any
negative-offset timezone. `slice(0, 7)` is correct everywhere, and ISO strings also sort
lexicographically — so range filtering works as plain string comparison with no `Date` involved.
This matches the existing convention in
[formatDateForPrint](shared/lib/money.ts#L9-L13), which already splits the string manually.

---

## 3. Recommendation: group by `issueDate`

**1. Only `issueDate` can express the user's intent — this is the decisive point.**
`createdAt` records when the record was *typed*, not when the sale happened. The realistic
workflow for this business is batch entry: typing up several orders on a Sunday, or catching up
at month end. Concretely — three invoices created Nov 3 for October orders, backdated to
Oct 28–31:

- group by `issueDate` → **October** (correct; that's the period being billed)
- group by `createdAt` → **November** (wrong)

`createdAt` cannot be adjusted. `issueDate` can. That asymmetry is the whole argument.

**2. It's the date the business already treats as authoritative.** It's printed on the invoice the
customer receives, and it's what the history list displays. A monthly report grouped by anything
else will visibly disagree with the list the user scrolls every day.

**3. It's date-only, so it's timezone-proof by construction.** No offset makes `"2026-10-01"`
ambiguous. Group with `invoice.issueDate.slice(0, 7)`.

**4. The alternatives fail on semantics, not just convention:**

- **`createdAt`** — use as the audit trail ("when was this entered"; it's already indexed and is
  the right sort key for history), never as the aggregation key. Also carries the uncorrectable
  UTC month-boundary error above.
- **`dueDate`** — never for revenue. It's a payment deadline deliberately in a *later* month
  (issued Jan 28, due Feb 10 would shift revenue into February). It's currently inert. Its only
  legitimate future role is an "outstanding/overdue" view.

---

## 4. Prerequisites and caveats before building it

1. **The UTC default is a prerequisite, not a side quest.** Aggregating by `issueDate` while the
   default can silently land a day early means the report inherits that error at exactly the month
   boundary. Fix `todayISO()` to construct the local date rather than round-tripping through
   `toISOString()`.
2. **`issueDate` is not indexed.** Grouping means loading all invoices and filtering in memory —
   the same pattern [useInvoiceHistory](features/invoice-history/hooks/useInvoiceHistory.ts#L10-L21)
   and `getHighestInvoiceNumber` already use, so it's at least consistent. Fine at a boutique's
   volume (tens to low hundreds per year); a `db.version(3)` adding an `issueDate` index is
   available later.
3. **Historical months change retroactively.** Invoices are not immutable and `issueDate` is
   freely editable, so editing a September invoice moves its amount out of September's total. A
   past month's figure is not stable.
4. **Future dates are unbounded.** `z.string().min(1)` is the only validation — no maximum, no
   range check, no "due ≥ issue" check. An invoice dated 2062 creates a phantom future month.
   Decide whether the report clamps, warns, or ignores.
5. **A monthly total is *billed*, never *collected*.** There is no status, no payment records, and
   no balance-due concept anywhere in the data model. Given the terms note — "70% payment is
   required before we commence, while the balance must be settled before pickup" — the gap between
   invoiced and received is large by design. Labelling the figure "revenue" or "income" would
   mislead; "invoiced" or "billed" is accurate.

---

## 5. Reference: all date-field references in the codebase

```
issueDate   types.ts:14 · schema.ts:13 · InvoiceForm.tsx:81 · useInvoiceForm.ts:31,44
            InvoiceHistoryItem.tsx:31 · InvoicePreview.tsx:70 · InvoiceMetaBlock.tsx:5,11,26
dueDate     types.ts:15 · schema.ts:14 · InvoiceForm.tsx:99 · useInvoiceForm.ts:32,45
            InvoicePreview.tsx:71 · InvoiceMetaBlock.tsx:6,12,32
createdAt   types.ts:19 · new/page.tsx:40,49 · edit/page.tsx:38
            useInvoiceHistory.ts:11 · db.ts:13,17
updatedAt   types.ts:20 · new/page.tsx:41,50 · edit/page.tsx:39,50
```

Related: [CODEBASE.md](CODEBASE.md) covers the wider data model, including that totals are
recomputed on read and that invoices are not immutable snapshots.
