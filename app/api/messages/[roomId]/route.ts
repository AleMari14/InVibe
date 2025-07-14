import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    const { db } = await connectToDatabase()

    // Trova l'utente corrente
    const currentUser = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Verifica che l'utente sia partecipante della room
    const room = await db.collection("chatRooms").findOne({
      roomId,
      "participants.userId": currentUser._id,
    })

    if (!room) {
      return NextResponse.json({ error: "Room non trovata o accesso negato" }, { status: 404 })
    }

    // Recupera i messaggi
    const messages = await db.collection("messages").find({ roomId }).sort({ createdAt: 1 }).toArray()

    // Serializza i messaggi
    const serializedMessages = messages.map((msg) => ({
      ...msg,
      _id: msg._id.toString(),
      userId: msg.userId.toString(),
      createdAt: msg.createdAt.toISOString(),
    }))

    return NextResponse.json({ messages: serializedMessages, room })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    const { message } = await request.json()

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Messaggio vuoto" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Trova l'utente corrente
    const currentUser = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Verifica che l'utente sia partecipante della room
    const room = await db.collection("chatRooms").findOne({
      roomId,
      "participants.userId": currentUser._id,
    })

    if (!room) {
      return NextResponse.json({ error: "Room non trovata o accesso negato" }, { status: 404 })
    }

    // Crea il nuovo messaggio
    const newMessage = {
      roomId,
      userId: currentUser._id,
      userName: currentUser.name,
      userImage: currentUser.image || "",
      message: message.trim(),
      createdAt: new Date(),
      isRead: false,
    }

    const result = await db.collection("messages").insertOne(newMessage)

    // Aggiorna la room con l'ultimo messaggio
    await db.collection("chatRooms").updateOne(
      { roomId },
      {
        $set: {
          lastMessage: {
            message: message.trim(),
            createdAt: new Date(),
            userName: currentUser.name,
          },
          updatedAt: new Date(),
        },
      },
    )

    // Serializza il messaggio per la risposta
    const serializedMessage = {
      ...newMessage,
      _id: result.insertedId.toString(),
      userId: newMessage.userId.toString(),
      createdAt: newMessage.createdAt.toISOString(),
    }

    return NextResponse.json({ message: serializedMessage })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
