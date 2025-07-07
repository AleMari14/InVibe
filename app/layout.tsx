import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import Navigation from "@/components/navigation"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "InVibe - Trova e crea eventi unici",
  description: "La piattaforma per scoprire e organizzare feste ed eventi indimenticabili.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <Providers>
          <main className="pb-24">{children}</main>
          <Navigation />
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  )
}
