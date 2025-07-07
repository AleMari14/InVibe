"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function Header() {
  const [notifications, setNotifications] = useState<{ _id: string; title: string; body: string }[]>([])

  // semplice fetch ogni 60 s
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications")
        if (res.ok) {
          const json = await res.json()
          setNotifications(json.notifications ?? [])
        }
      } catch {
        /* ignore */
      }
    }
    fetchNotifications()
    const id = setInterval(fetchNotifications, 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-white px-4">
      <Link href="/" className="text-xl font-bold">
        InVibe
      </Link>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Notifiche">
            <Bell className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
          <h2 className="mb-4 text-lg font-semibold">Notifiche</h2>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna notifica al momento.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li key={n._id} className="rounded-md border p-3">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </SheetContent>
      </Sheet>
    </header>
  )
}
