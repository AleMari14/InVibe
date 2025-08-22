import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Trova tutte le chat rooms dell'utente
    const chatRooms = await db
      .collection("chatRooms")
      .find({
        "participants.email": session.user.email.toLowerCase(),
        archived: { $ne: true },
      })
      .sort({ updatedAt: -1 })
      .toArray()

    // Trasforma i dati per il frontend
    const transformedRooms = await Promise.all(
      chatRooms.map(async (room) => {
        // Trova l'altro partecipante
        const otherParticipant = room.participants.find(
          (p: any) => p.email.toLowerCase() !== session.user.email.toLowerCase(),
        )

        // Conta i messaggi non letti
        const unreadCount = await db.collection("messages").countDocuments({
          roomId: room._id,
          senderId: { $ne: session.user.id },
          read: { $ne: true },
        })

        // Ottieni l'ultimo messaggio
        const lastMessage = await db.collection("messages").findOne({ roomId: room._id }, { sort: { createdAt: -1 } })

        return {
          _id: room._id,
          eventTitle: room.eventTitle || "Chat",
          lastMessage: lastMessage?.content || "",
          lastMessageAt: lastMessage?.createdAt?.toISOString() || room.updatedAt?.toISOString() || "",
          otherUser: {
            name: otherParticipant?.name || "Utente",
            image: otherParticipant?.image,
            email: otherParticipant?.email,
          },
          unreadCount,
          updatedAt: room.updatedAt?.toISOString() || "",
        }
      }),
    )

    return NextResponse.json(transformedRooms)
  } catch (error) {
    console.error("Error fetching chat rooms:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
