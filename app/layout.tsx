import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Navigation } from "@/components/navigation"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "InVibe - Trova e crea eventi",
  description: "L'app per scoprire e organizzare feste ed eventi vicino a te.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <main className="pb-20">{children}</main>
          <Navigation />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  )
}
