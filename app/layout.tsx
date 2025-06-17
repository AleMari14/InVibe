import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Navigation } from "@/components/navigation"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "InVibe - Condividi Esperienze Uniche",
  description: "Scopri e crea eventi, viaggi e esperienze da condividere con altre persone",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <Providers>
          <main className="min-h-screen bg-background">{children}</main>
          <Navigation />
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  )
}
