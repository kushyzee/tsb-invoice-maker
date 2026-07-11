import type { Metadata, Viewport } from "next"
import { Inter, Herr_Von_Muellerhoff } from "next/font/google"
import "./globals.css"

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const script = Herr_Von_Muellerhoff({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
})

export const metadata: Metadata = {
  title: "TSB Invoice Maker",
  description: "Offline invoice maker for The Stars Brand",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TSB Invoice Maker",
  },
}

export const viewport: Viewport = {
  themeColor: "#171717",
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
