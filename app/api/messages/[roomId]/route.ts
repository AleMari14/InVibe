import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    const client = await clientPromise
    const db = client.db("invibe")

    // Verifica che l'utente sia autorizzato ad accedere a questa chat
    const chatRoom = await db.collection("chatRooms").findOne({ _id: roomId })
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room non trovata" }, { status: 404 })
    }

    const isParticipant = chatRoom.participants.some((p: any) => p.email === session.user.email)
    if (!isParticipant) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    // Recupera i messaggi
    const messages = await db.collection("messages").find({ roomId }).sort({ createdAt: 1 }).toArray()

    // Segna i messaggi come letti dall'utente corrente
    await db.collection("messages").updateMany(
      {
        roomId,
        senderId: { $ne: session.user.email },
        readBy: { $ne: session.user.email },
      },
      { $addToSet: { readBy: session.user.email } },
    )

    return NextResponse.json({ messages })
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
    if (!content?.trim()) {
      return NextResponse.json({ error: "Contenuto messaggio richiesto" }, { status: 400 })
    }

    const { roomId } = params
    const client = await clientPromise
    const db = client.db("invibe")

    // Verifica che la chat room esista
    const chatRoom = await db.collection("chatRooms").findOne({ _id: roomId })
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room non trovata" }, { status: 404 })
    }

    const isParticipant = chatRoom.participants.some((p: any) => p.email === session.user.email)
    if (!isParticipant) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    // Crea il messaggio
    const message = {
      roomId,
      senderId: session.user.email,
      senderName: session.user.name || "Utente",
      senderImage: session.user.image,
      content: content.trim(),
      createdAt: new Date(),
      readBy: [session.user.email],
    }

    const result = await db.collection("messages").insertOne(message)
    const savedMessage = { ...message, _id: result.insertedId }

    // Aggiorna l'ultimo messaggio nella chat room
    await db.collection("chatRooms").updateOne({ _id: roomId }, { $set: { lastMessageAt: new Date() } })

    // Crea notifica per l'altro utente
    const recipient = chatRoom.participants.find((p: any) => p.email !== session.user.email)
    if (recipient) {
      const notification = {
        userId: recipient.email,
        type: "message",
        title: "Nuovo messaggio",
        message: `${session.user.name}: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
        eventId: chatRoom.eventId,
        fromUserId: session.user.email,
        fromUserName: session.user.name,
        read: false,
        createdAt: new Date(),
      }

      await db.collection("notifications").insertOne(notification)
    }

    return NextResponse.json(savedMessage)
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
