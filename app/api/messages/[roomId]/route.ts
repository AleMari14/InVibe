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

    // Verifica che l'utente sia partecipante della stanza
    const room = await db.collection("chatRooms").findOne({
      _id: new ObjectId(roomId),
      "participants.id": session.user.id,
    })

    if (!room) {
      return NextResponse.json({ error: "Stanza non trovata o accesso negato" }, { status: 404 })
    }

    // Recupera i messaggi della stanza
    const messages = await db
      .collection("messages")
      .find({ roomId: new ObjectId(roomId) })
      .sort({ createdAt: 1 })
      .toArray()

    // Converti ObjectId in stringhe
    const serializedMessages = messages.map((msg) => ({
      ...msg,
      _id: msg._id.toString(),
      roomId: msg.roomId.toString(),
      senderId: msg.senderId.toString(),
    }))

    return NextResponse.json({ messages: serializedMessages })
  } catch (error: any) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Errore nel caricamento dei messaggi" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    const { content } = await request.json()

    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "ID stanza non valido" }, { status: 400 })
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Contenuto messaggio mancante" }, { status: 400 })
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

    // Crea il messaggio
    const messageData = {
      roomId: new ObjectId(roomId),
      senderId: new ObjectId(session.user.id),
      senderName: session.user.name || "Utente",
      senderImage: session.user.image || "",
      content: content.trim(),
      createdAt: new Date(),
      readBy: [new ObjectId(session.user.id)],
    }

    const result = await db.collection("messages").insertOne(messageData)

    // Aggiorna la stanza con l'ultimo messaggio
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

    const newMessage = {
      ...messageData,
      _id: result.insertedId.toString(),
      roomId: roomId,
      senderId: session.user.id,
    }

    return NextResponse.json(newMessage)
  } catch (error: any) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Errore nell'invio del messaggio" }, { status: 500 })
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
