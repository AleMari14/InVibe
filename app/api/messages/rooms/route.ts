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

    // Ottieni tutte le stanze di chat in cui l'utente è coinvolto
    const rooms = await db
      .collection("chatRooms")
      .find({
        $or: [{ userId1: userId }, { userId2: userId }],
        archived: { $ne: true }, // Escludi le stanze archiviate
      })
      .sort({ updatedAt: -1 })
      .toArray()

    // Ottieni i dettagli degli utenti per ogni stanza
    const roomsWithDetails = await Promise.all(
      rooms.map(async (room) => {
        const otherUserId = room.userId1 === userId ? room.userId2 : room.userId1

        const otherUser = await db
          .collection("users")
          .findOne({ _id: otherUserId }, { projection: { name: 1, email: 1, image: 1 } })

        // Conta i messaggi non letti per l'utente corrente
        const unreadCount = await db.collection("messages").countDocuments({
          roomId: room._id.toString(),
          senderId: { $ne: userId },
          read: { $ne: true },
        })

        // Ottieni l'ultimo messaggio
        const lastMessage = await db
          .collection("messages")
          .find({ roomId: room._id.toString() })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray()

        return {
          ...room,
          otherUser,
          unreadCount,
          lastMessage: lastMessage[0] || null,
        }
      }),
    )

    return NextResponse.json(roomsWithDetails)
  } catch (error) {
    console.error("Errore nel recupero delle stanze di chat:", error)
    return NextResponse.json({ error: "Errore nel recupero delle stanze di chat" }, { status: 500 })
  }
}
