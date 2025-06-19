import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    const client = await clientPromise
    const db = client.db("invibe")

    // Trova l'utente per ottenere l'ObjectId
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    const userId = user._id

    // Verifica che l'utente sia partecipante della chat room
    const chatRoom = await db.collection("chatRooms").findOne({
      _id: new ObjectId(roomId),
      participants: userId,
    })

    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room non trovata" }, { status: 404 })
    }

    // Recupera i messaggi della room
    const messages = await db
      .collection("messages")
      .find({ roomId: new ObjectId(roomId) })
      .sort({ createdAt: 1 })
      .toArray()

    // Marca come letti tutti i messaggi non inviati dall'utente corrente
    await db.collection("messages").updateMany(
      {
        roomId: new ObjectId(roomId),
        senderId: { $ne: userId },
        $or: [{ readBy: { $exists: false } }, { readBy: { $ne: userId } }],
      },
      {
        $addToSet: { readBy: userId },
      },
    )

    // Popola i dati del sender per ogni messaggio
    const populatedMessages = await Promise.all(
      messages.map(async (message) => {
        const sender = await db.collection("users").findOne({ _id: message.senderId })
        return {
          ...message,
          _id: message._id.toString(),
          roomId: message.roomId.toString(),
          senderId: message.senderId.toString(),
          sender: sender
            ? {
                _id: sender._id.toString(),
                name: sender.name,
                email: sender.email,
                image: sender.image,
              }
            : null,
          createdAt: message.createdAt.toISOString(),
        }
      }),
    )

    return NextResponse.json({ messages: populatedMessages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Errore nel recupero dei messaggi" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Il messaggio non può essere vuoto" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("invibe")

    // Trova l'utente per ottenere l'ObjectId
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    const userId = user._id

    // Verifica che l'utente sia partecipante della chat room
    const chatRoom = await db.collection("chatRooms").findOne({
      _id: new ObjectId(roomId),
      participants: userId,
    })

    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room non trovata" }, { status: 404 })
    }

    // Crea il nuovo messaggio
    const newMessage = {
      roomId: new ObjectId(roomId),
      senderId: userId,
      content: content.trim(),
      createdAt: new Date(),
      readBy: [userId], // Il mittente ha automaticamente letto il proprio messaggio
    }

    const result = await db.collection("messages").insertOne(newMessage)

    // Aggiorna la chat room con l'ultimo messaggio
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

    // Popola i dati del sender
    const populatedMessage = {
      ...newMessage,
      _id: result.insertedId.toString(),
      roomId: roomId,
      senderId: userId.toString(),
      sender: {
        _id: userId.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
      },
      createdAt: newMessage.createdAt.toISOString(),
    }

    return NextResponse.json({ message: populatedMessage })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Errore nell'invio del messaggio" }, { status: 500 })
  }
}
