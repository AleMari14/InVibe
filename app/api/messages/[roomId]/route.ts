import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params

    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "ID room non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verifica che l'utente sia partecipante della chat
    const room = await db.collection("chatRooms").findOne({
      _id: new ObjectId(roomId),
      "participants.userId": new ObjectId(session.user.id),
    })

    if (!room) {
      return NextResponse.json({ error: "Chat room non trovata" }, { status: 404 })
    }

    // Recupera i messaggi
    const messages = await db
      .collection("messages")
      .find({ roomId: new ObjectId(roomId) })
      .sort({ createdAt: 1 })
      .toArray()

    // Serializza i dati
    const serializedMessages = messages.map((msg) => ({
      ...msg,
      _id: msg._id.toString(),
      roomId: msg.roomId.toString(),
      senderId: msg.senderId.toString(),
      createdAt: msg.createdAt.toISOString(),
    }))

    const serializedRoom = {
      ...room,
      _id: room._id.toString(),
      eventId: room.eventId.toString(),
      participants: room.participants.map((p) => ({
        ...p,
        userId: p.userId.toString(),
      })),
      createdAt: room.createdAt.toISOString(),
      lastMessageAt: room.lastMessageAt?.toISOString() || null,
    }

    return NextResponse.json({
      room: serializedRoom,
      messages: serializedMessages,
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    const body = await request.json()
    const { content } = body

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Contenuto messaggio mancante" }, { status: 400 })
    }

    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "ID room non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verifica che l'utente sia partecipante della chat
    const room = await db.collection("chatRooms").findOne({
      _id: new ObjectId(roomId),
      "participants.userId": new ObjectId(session.user.id),
    })

    if (!room) {
      return NextResponse.json({ error: "Chat room non trovata" }, { status: 404 })
    }

    // Crea il nuovo messaggio
    const newMessage = {
      roomId: new ObjectId(roomId),
      senderId: new ObjectId(session.user.id),
      senderName: session.user.name || "Utente",
      senderImage: session.user.image || "",
      content: content.trim(),
      createdAt: new Date(),
      isRead: false,
    }

    const result = await db.collection("messages").insertOne(newMessage)

    // Aggiorna la chat room con l'ultimo messaggio
    await db.collection("chatRooms").updateOne(
      { _id: new ObjectId(roomId) },
      {
        $set: {
          lastMessage: content.trim(),
          lastMessageAt: new Date(),
        },
      },
    )

    // Serializza il messaggio per la risposta
    const serializedMessage = {
      ...newMessage,
      _id: result.insertedId.toString(),
      roomId: newMessage.roomId.toString(),
      senderId: newMessage.senderId.toString(),
      createdAt: newMessage.createdAt.toISOString(),
    }

    return NextResponse.json(serializedMessage)
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
