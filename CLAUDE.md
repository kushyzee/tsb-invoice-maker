# Project Instructions — Finance Tracking

## Project

The Stars Brand invoice maker.

This is an offline-first, single-user invoice/PWA used internally by The Stars Brand to create and manage customer invoices.

## Stack

- Next.js App Router
- React
- TypeScript
- pnpm
- Tailwind CSS v4
- shadcn/ui / Base UI
- React Hook Form
- Zod
- Dexie / IndexedDB
- `useLiveQuery` for reactive local data

Follow the existing project architecture and conventions rather than introducing new patterns.

## Working Style

Work incrementally.

For feature work:

1. Inspect the relevant existing code.
2. Understand the current data flow.
3. Plan the smallest appropriate change.
4. Implement only the approved phase.
5. Verify the implementation.
6. Update `docs/finance-tracking-implementation.md`.
7. Stop and wait for approval before starting another phase.

Do not implement future phases automatically.

Do not make broad refactors unless they are directly required for the current phase.

Preserve existing behavior unless a change is explicitly part of the feature or is necessary for correctness.

## Finance Feature Scope

The finance feature tracks internal financial information associated with individual invoices.

The underlying financial inputs are:

- `expenses`
- `amountPaid`

Derived values are:

- **Invoiced** = existing invoice total
- **Projected Profit** = Invoiced − Expenses
- **Actual Profit** = Amount Paid − Expenses
- **Outstanding** = Invoiced − Amount Paid

Do not persist derived profit or outstanding values.

### Terminology

Use **Invoiced** rather than Revenue for the existing invoice total.

The application does not currently track payment transactions, so an invoice total must not be treated as money actually collected.

Use:

- Invoiced
- Amount Paid / Collected
- Expenses
- Projected Profit
- Actual Profit
- Outstanding

## Financial Rules

- `expenses` must not be negative.
- `amountPaid` must not be negative.
- `amountPaid` defaults to `0`.
- `expenses` defaults to `0`.
- Existing invoices that do not contain these fields must continue to work and should be treated as having `0` for both values.
- Profit may be negative. Do not clamp actual profit to zero.
- Do not add a separate Revenue input.
- Do not add a separate Profit input.
- Do not introduce a kobo/integer-money migration for this feature. Preserve the application's existing naira/number representation.
- Do not introduce payment transaction history, payment dates, payment methods, customer accounts, or a general accounting system.

## Invoice Export

Expenses, Amount Paid, Projected Profit, Actual Profit, and Outstanding are internal information.

They must not appear in:

- customer-facing invoice previews
- generated invoice images
- generated PDFs
- shared/downloaded invoice output

Prefer structural separation from the export view rather than relying only on CSS hiding.

## Monthly Finance

The finance page should aggregate invoices by `issueDate`.

Use:

```ts
invoice.issueDate.slice(0, 7)
```

for the month key.

Do not use:

- `dueDate`
- `createdAt`
- `updatedAt`
- JavaScript `Date` parsing of the `YYYY-MM-DD` issue date for month grouping

Monthly figures should be derived from the underlying invoice data rather than stored as monthly totals.

The first version should provide:

- Invoiced
- Amount Paid / Collected
- Expenses
- Actual Profit
- Outstanding
- invoice count
- invoice-level breakdown

Charts are out of scope for V1.

## Date Handling

The existing `todayISO()` implementation uses UTC conversion and can produce the previous calendar date around midnight in Nigeria.

When working on the relevant code, fix this so the default issue date is based on the user's local calendar date.

Do not introduce unnecessary date-library dependencies.

## Existing Architecture

Respect the current feature-based structure:

```text
app/
features/
shared/
components/ui/
```

Continue using existing patterns for:

- React Hook Form
- Zod
- Controller
- field validation
- Dexie repositories
- `useLiveQuery`
- page shells
- Tailwind styling
- existing UI components

Do not introduce a new state-management library.

Do not introduce a backend, API, authentication, or synchronization layer.

## Data Compatibility

Existing production invoice data must remain readable.

If the invoice schema changes, use the appropriate Dexie migration/versioning strategy.

Adding the new financial fields must not invalidate existing invoices.

Before implementation, inspect the current Dexie schema and persistence flow rather than assuming how migration should be handled.

## Calculations

Reuse the application's existing canonical invoice-total calculation.

Do not create another independent implementation of invoice totals unless there is a demonstrated architectural reason to do so.

Derived financial calculations should be centralized where appropriate, but avoid broad refactoring.

## Change Tracking

Maintain:

```text
docs/finance-tracking-implementation.md
```

This file is the implementation record for this feature.

Read it before beginning each phase.

Update it only after a phase has been implemented and verified.

Record:

- phase status
- files created/modified
- implementation decisions
- schema/data changes
- verification performed
- important discoveries
- issues or follow-up items
- anything intentionally deferred

Do not record speculative changes as completed work.

## Scope Discipline

Do not:

- redesign unrelated parts of the application
- introduce charts in V1
- introduce general business expense tracking
- introduce payment transaction history
- migrate the money model to kobo
- add a backend
- add authentication
- add customer/product entities
- introduce a new test framework solely for this feature
- perform unrelated cleanup
- refactor existing architecture merely because it could be improved

If an architectural improvement appears useful but is not required for the current phase, document it and defer it.

## Verification

After implementation, verify the actual user flow rather than only checking that TypeScript compiles.

At minimum, consider:

- creating an invoice
- editing an invoice
- saving/reloading an invoice
- existing invoices created before this feature
- changing expenses
- changing amount paid
- calculating projected profit
- calculating actual profit
- calculating outstanding balance
- invoice export remaining customer-facing only
- monthly finance aggregation
- invoice deletion/editing updating the finance page

Do not automatically start the next phase after verification.
