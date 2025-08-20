import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("invibe")

    // Trova tutte le chat rooms dell'utente
    const chatRooms = await db
      .collection("chatRooms")
      .find({
        "participants.email": session.user.email,
      })
      .sort({ lastMessageAt: -1 })
      .toArray()

    const roomsWithDetails = await Promise.all(
      chatRooms.map(async (room) => {
        // Trova l'ultimo messaggio
        const lastMessage = await db.collection("messages").findOne({ roomId: room._id }, { sort: { createdAt: -1 } })

        // Conta i messaggi non letti
        const unreadCount = await db.collection("messages").countDocuments({
          roomId: room._id,
          senderId: { $ne: session.user.email },
          readBy: { $ne: session.user.email },
        })

        // Trova l'altro utente
        const otherUser = room.participants.find((p: any) => p.email !== session.user.email)

        return {
          _id: room._id,
          eventTitle: room.eventTitle,
          lastMessage: lastMessage?.content || "",
          lastMessageAt: lastMessage?.createdAt || room.createdAt,
          otherUser: otherUser || { name: "Utente sconosciuto", email: "", image: null },
          unreadCount,
        }
      }),
    )

    return NextResponse.json({ rooms: roomsWithDetails })
  } catch (error) {
    console.error("Error fetching chat rooms:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
