import type { Metadata } from "next"
import { Inter, Mrs_Saint_Delafield } from "next/font/google"
import "./globals.css"

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const script = Mrs_Saint_Delafield({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
})

export const metadata: Metadata = {
  title: "TSB Invoice Maker",
  description: "Offline invoice maker for The Stars Brand",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${script.variable} min-h-svh bg-background font-sans text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
