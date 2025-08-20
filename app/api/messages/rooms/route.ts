import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Recupera tutte le chat room dell'utente
    const rooms = await db
      .collection("chatRooms")
      .find({
        "participants.email": session.user.email,
        archived: { $ne: true },
      })
      .sort({ updatedAt: -1 })
      .toArray()

    // Formatta le room per il client
    const formattedRooms = rooms.map((room) => {
      const otherParticipant = room.participants.find((p: any) => p.email !== session.user.email)

      return {
        _id: room._id.toString(),
        eventTitle: room.eventTitle || "Evento",
        lastMessage: room.lastMessage || "",
        lastMessageAt: room.lastMessageAt ? room.lastMessageAt.toISOString() : null,
        otherUser: {
          name: otherParticipant?.name || "Utente Sconosciuto",
          email: otherParticipant?.email || "",
          image: otherParticipant?.image || null,
        },
        unreadCount: 0, // TODO: implementare conteggio messaggi non letti
      }
    })

    return NextResponse.json({ rooms: formattedRooms })
  } catch (error) {
    console.error("Error fetching chat rooms:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
