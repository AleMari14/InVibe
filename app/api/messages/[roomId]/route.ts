import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "ID stanza non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // --- CONTROLLO PERMESSI CORRETTO ---
    // Verifica che l'utente faccia parte della chat usando il suo ID.
    const chatRoom = await db.collection("chatRooms").findOne({
      _id: new ObjectId(roomId),
      "participants.id": session.user.id,
    })

    if (!chatRoom) {
      console.log(`Access denied or chat not found for user ${session.user.id} in room ${roomId}`)
      return NextResponse.json({ error: "Chat non trovata o accesso negato" }, { status: 404 })
    }

    const messages = await db
      .collection("messages")
      .find({ roomId: new ObjectId(roomId) })
      .sort({ createdAt: 1 })
      .toArray()

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Errore nel recupero dei messaggi", details: error.message }, { status: 500 })
  }
}
