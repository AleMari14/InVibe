import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const userEmail = session.user.email
    console.log("Fetching chat rooms for user:", userEmail)

    const client = await clientPromise
    const db = client.db("invibe")

    // Ottieni tutte le chat room dove l'utente è partecipante
    const chatRooms = await db
      .collection("chatRooms")
      .find({
        "participants.email": userEmail,
      })
      .sort({ updatedAt: -1 })
      .toArray()

    console.log("Found chat rooms:", chatRooms.length)

    // Arricchisci ogni chat room con dettagli aggiuntivi
    const roomsWithDetails = await Promise.all(
      chatRooms.map(async (room) => {
        // Trova l'altro utente
        const otherUser = room.participants.find((p: any) => p.email !== userEmail)

        // Conta i messaggi non letti per l'utente corrente
        const unreadCount = await db.collection("messages").countDocuments({
          roomId: room.roomId,
          senderId: { $ne: userEmail },
          readBy: { $ne: userEmail },
        })

        // Ottieni l'ultimo messaggio
        const lastMessageDoc = await db
          .collection("messages")
          .findOne({ roomId: room.roomId }, { sort: { createdAt: -1 } })

        const lastMessage = lastMessageDoc
          ? {
              content: lastMessageDoc.content,
              senderId: lastMessageDoc.senderId,
              createdAt: lastMessageDoc.createdAt,
            }
          : null

        return {
          _id: room._id,
          roomId: room.roomId,
          participants: room.participants,
          initialEvent: room.eventId
            ? {
                eventId: room.eventId,
                eventTitle: room.eventTitle,
              }
            : undefined,
          lastMessage,
          unreadCount,
          archived: room.archived || false,
          otherUser: otherUser || {
            email: "unknown",
            name: "Utente Sconosciuto",
            image: null,
          },
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
        }
      }),
    )

    console.log("Returning rooms with details:", roomsWithDetails.length)
    return NextResponse.json({ rooms: roomsWithDetails })
  } catch (error) {
    console.error("Errore nel recupero delle chat rooms:", error)
    return NextResponse.json({ error: "Errore nel recupero delle chat rooms" }, { status: 500 })
  }
}
