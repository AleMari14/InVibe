import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params

    if (!roomId || !ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "ID room non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const room = await db.collection("chatRooms").findOne({
      _id: new ObjectId(roomId),
      "participants.email": session.user.email,
    })

    if (!room) {
      return NextResponse.json({ error: "Room non trovata" }, { status: 404 })
    }

    // Trova l'altro partecipante
    const otherParticipant = room.participants.find((p: any) => p.email !== session.user.email)

    return NextResponse.json({
      _id: room._id.toString(),
      participants: room.participants,
      eventTitle: room.eventTitle || "Evento",
      otherUser: otherParticipant || {
        name: "Utente Sconosciuto",
        email: "unknown",
        image: null,
      },
    })
  } catch (error) {
    console.error("Error fetching chat room:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params

    if (!roomId || !ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "ID room non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verifica che l'utente sia partecipante della room
    const room = await db.collection("chatRooms").findOne({
      _id: new ObjectId(roomId),
      "participants.email": session.user.email,
    })

    if (!room) {
      return NextResponse.json({ error: "Room non trovata" }, { status: 404 })
    }

    // Elimina tutti i messaggi della room
    await db.collection("messages").deleteMany({
      roomId: new ObjectId(roomId),
    })

    // Elimina la room
    await db.collection("chatRooms").deleteOne({
      _id: new ObjectId(roomId),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting chat room:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
