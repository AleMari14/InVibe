import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    const { db } = await connectToDatabase()

    // Verifica che l'utente sia partecipante della chat room
    const chatRoom = await db.collection("chatRooms").findOne({ _id: roomId })
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room non trovata" }, { status: 404 })
    }

    const userEmails = chatRoom.participants.map((p: any) => p.email.toLowerCase())
    if (!userEmails.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    // Ottieni i messaggi della room
    const messages = await db.collection("messages").find({ roomId }).sort({ createdAt: 1 }).toArray()

    // Trasforma i messaggi per il client
    const transformedMessages = messages.map((msg) => ({
      _id: msg._id.toString(),
      roomId: msg.roomId,
      senderId: msg.senderId?.toString() || msg.senderId,
      senderName: msg.senderName,
      senderImage: msg.senderImage,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      read: msg.read || false,
    }))

    return NextResponse.json(transformedMessages)
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

    const { content } = await request.json()
    const { roomId } = params
    const { db } = await connectToDatabase()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Contenuto messaggio richiesto" }, { status: 400 })
    }

    // Verifica che l'utente sia partecipante della chat room
    const chatRoom = await db.collection("chatRooms").findOne({ _id: roomId })
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room non trovata" }, { status: 404 })
    }

    const userEmails = chatRoom.participants.map((p: any) => p.email.toLowerCase())
    if (!userEmails.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    // Trova l'utente corrente
    const currentUser = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Crea il messaggio
    const message = {
      roomId,
      senderId: currentUser._id.toString(),
      senderName: currentUser.name || session.user.name || "Utente",
      senderImage: currentUser.image || session.user.image,
      content: content.trim(),
      createdAt: new Date(),
      read: false,
    }

    const result = await db.collection("messages").insertOne(message)

    // Aggiorna la chat room con l'ultimo messaggio
    await db.collection("chatRooms").updateOne(
      { _id: roomId },
      {
        $set: {
          lastMessage: content.trim(),
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    // Restituisci il messaggio creato
    const responseMessage = {
      _id: result.insertedId.toString(),
      roomId,
      senderId: currentUser._id.toString(),
      senderName: message.senderName,
      senderImage: message.senderImage,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      read: false,
    }

    return NextResponse.json(responseMessage)
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
