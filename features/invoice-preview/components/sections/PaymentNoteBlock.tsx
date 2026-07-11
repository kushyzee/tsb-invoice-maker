type PaymentNoteBlockProps = {
  note: string
}

export function PaymentNoteBlock({ note }: PaymentNoteBlockProps) {
  return (
    <p className="max-w-[220px] text-right text-sm leading-relaxed text-neutral-800">
      {note}
    </p>
  )
}
