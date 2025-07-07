import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import Header from "@/components/header"
import { Providers } from "@/app/providers"
import Navigation from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "InVibe",
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
          <Header />
          <main className="pb-16">{children}</main>
          <Navigation />
        </Providers>
      </body>
    </html>
  )
}
