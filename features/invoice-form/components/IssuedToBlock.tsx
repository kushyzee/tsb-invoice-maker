type IssuedToBlockProps = {
  customerName: string
}

export function IssuedToBlock({ customerName }: IssuedToBlockProps) {
  return (
    <div>
      <p className="text-xs font-bold tracking-wide text-neutral-900">
        ISSUED TO:
      </p>
      <p className="mt-1 min-h-5 text-sm text-neutral-800">
        {customerName || "—"}
      </p>
    </div>
  )
}
