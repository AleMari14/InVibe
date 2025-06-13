import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

// Indica a Next.js che questa è una route dinamica
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const userId = session.user.id

    const { db } = await connectToDatabase()

    // Ottieni tutti gli eventi creati dall'utente
    const events = await db.collection("events").find({ hostId: userId }).sort({ createdAt: -1 }).toArray()

    // Ottieni le prenotazioni per ogni evento
    const eventsWithBookings = await Promise.all(
      events.map(async (event) => {
        const bookings = await db.collection("bookings").find({ eventId: event._id.toString() }).toArray()

        return {
          ...event,
          bookings,
        }
      }),
    )

    return NextResponse.json(eventsWithBookings)
  } catch (error) {
    console.error("Errore nel recupero degli eventi dell'utente:", error)
    return NextResponse.json({ error: "Errore nel recupero degli eventi" }, { status: 500 })
  }
}
