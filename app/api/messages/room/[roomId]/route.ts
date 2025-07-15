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

    // Recupera i dettagli della stanza
    const room = await db.collection("chatRooms").findOne({
      _id: new ObjectId(roomId),
      "participants.id": session.user.id,
    })

    if (!room) {
      return NextResponse.json({ error: "Stanza non trovata o accesso negato" }, { status: 404 })
    }

    // Converti ObjectId in stringhe
    const serializedRoom = {
      ...room,
      _id: room._id.toString(),
      eventId: room.eventId?.toString(),
    }

    return NextResponse.json(serializedRoom)
  } catch (error: any) {
    console.error("Error fetching chat room details:", error)
    return NextResponse.json({ error: "Errore nel caricamento della stanza" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { roomId: string } }) {
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

    // Verifica che l'utente sia partecipante della stanza
    const room = await db.collection("chatRooms").findOne({
      _id: new ObjectId(roomId),
      "participants.id": session.user.id,
    })

    if (!room) {
      return NextResponse.json({ error: "Stanza non trovata o accesso negato" }, { status: 404 })
    }

    // Elimina tutti i messaggi della stanza
    await db.collection("messages").deleteMany({ roomId: new ObjectId(roomId) })

    // Elimina la stanza
    await db.collection("chatRooms").deleteOne({ _id: new ObjectId(roomId) })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting chat room:", error)
    return NextResponse.json({ error: "Errore nell'eliminazione della chat" }, { status: 500 })
  }
}
