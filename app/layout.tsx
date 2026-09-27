import type { Metadata, Viewport } from "next"
import { Inter, Herr_Von_Muellerhoff } from "next/font/google"
import { AppHeader } from "@/components/app-header"
import { Toaster } from "@/components/ui/toast"
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
        className={`${sans.variable} ${script.variable} flex min-h-svh flex-col bg-neutral-100 font-sans text-foreground antialiased`}
      >
        <Toaster>
          <AppHeader />
          <div className="flex-1">{children}</div>
        </Toaster>
      </body>
    </html>
  )
}
