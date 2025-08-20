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

    // Verifica che l'utente sia partecipante della room
    const room = await db.collection("chatRooms").findOne({
      _id: new ObjectId(roomId),
      "participants.email": session.user.email,
    })

    if (!room) {
      return NextResponse.json({ error: "Room non trovata" }, { status: 404 })
    }

    // Recupera i messaggi
    const messages = await db
      .collection("messages")
      .find({ roomId: new ObjectId(roomId) })
      .sort({ createdAt: 1 })
      .toArray()

    // Converte gli ObjectId in stringhe per il client
    const formattedMessages = messages.map((msg) => ({
      ...msg,
      _id: msg._id.toString(),
      roomId: msg.roomId.toString(),
      createdAt: msg.createdAt.toISOString(),
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    const { content } = await request.json()

    if (!roomId || !ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "ID room non valido" }, { status: 400 })
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Contenuto messaggio vuoto" }, { status: 400 })
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

    // Crea il messaggio
    const message = {
      roomId: new ObjectId(roomId),
      senderId: session.user.email,
      senderName: session.user.name || "Utente",
      senderImage: session.user.image || null,
      content: content.trim(),
      createdAt: new Date(),
      readBy: [session.user.email],
    }

    const result = await db.collection("messages").insertOne(message)

    // Aggiorna la room con l'ultimo messaggio
    await db.collection("chatRooms").updateOne(
      { _id: new ObjectId(roomId) },
      {
        $set: {
          lastMessage: content.trim(),
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    // Restituisce il messaggio formattato
    const formattedMessage = {
      ...message,
      _id: result.insertedId.toString(),
      roomId: roomId,
      createdAt: message.createdAt.toISOString(),
    }

    return NextResponse.json(formattedMessage)
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
