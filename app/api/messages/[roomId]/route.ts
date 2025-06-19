import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import clientPromise from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    console.log("Fetching messages for room:", roomId)

    const client = await clientPromise
    const db = client.db("invibe")

    // Verifica che la chat room esista e l'utente abbia accesso
    const chatRoom = await db.collection("chatRooms").findOne({ roomId })
    if (!chatRoom) {
      console.log("Chat room not found:", roomId)
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 })
    }

    const userEmails = chatRoom.participants.map((p: any) => p.email)
    if (!userEmails.includes(session.user.email)) {
      console.log("User not authorized for this chat room")
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    // Ottieni i messaggi per questa room
    const messages = await db.collection("messages").find({ roomId }).sort({ createdAt: 1 }).toArray()

    // Marca i messaggi come letti dall'utente corrente
    await db.collection("messages").updateMany(
      {
        roomId,
        senderId: { $ne: session.user.email },
        readBy: { $ne: session.user.email },
      },
      { $addToSet: { readBy: session.user.email } },
    )

    console.log(`Found ${messages.length} messages for room ${roomId}`)
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

    const { roomId } = params
    const { content } = await request.json()

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Il contenuto del messaggio è obbligatorio" }, { status: 400 })
    }

    console.log("Sending message to room:", roomId, "Content:", content)

    const client = await clientPromise
    const db = client.db("invibe")

    // Verifica che la chat room esista e l'utente abbia accesso
    const chatRoom = await db.collection("chatRooms").findOne({ roomId })
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 })
    }

    const userEmails = chatRoom.participants.map((p: any) => p.email)
    if (!userEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    // Trova i dati del mittente
    const sender = chatRoom.participants.find((p: any) => p.email === session.user.email)
    const recipient = chatRoom.participants.find((p: any) => p.email !== session.user.email)

    // Crea il messaggio
    const message = {
      roomId,
      content: content.trim(),
      senderId: session.user.email,
      senderName: sender?.name || session.user.name,
      senderImage: sender?.image || session.user.image,
      createdAt: new Date(),
      readBy: [session.user.email],
    }

    // Inserisci il messaggio
    const result = await db.collection("messages").insertOne(message)

    // Aggiorna la chat room con l'ultimo messaggio
    await db.collection("chatRooms").updateOne(
      { roomId },
      {
        $set: {
          lastMessage: {
            content: message.content,
            senderId: message.senderId,
            createdAt: message.createdAt,
          },
          updatedAt: new Date(),
        },
      },
    )

    // Crea notifica per il destinatario
    if (recipient) {
      const notification = {
        userId: recipient.email,
        type: "message",
        title: "Nuovo messaggio",
        message: `${sender?.name || session.user.name} ti ha inviato un messaggio: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
        eventId: chatRoom.eventId,
        eventTitle: chatRoom.eventTitle,
        roomId: roomId,
        fromUserId: session.user.email,
        fromUserName: sender?.name || session.user.name,
        fromUserImage: sender?.image || session.user.image,
        read: false,
        createdAt: new Date(),
      }

      await db.collection("notifications").insertOne(notification)
    }

    console.log("Message sent successfully:", result.insertedId)
    return NextResponse.json({ ...message, _id: result.insertedId })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
