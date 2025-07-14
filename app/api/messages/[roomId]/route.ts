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

    // Get messages for this room
    const messages = await db
      .collection("messages")
      .find({ roomId: new ObjectId(roomId) })
      .sort({ createdAt: 1 })
      .toArray()

    // Serialize ObjectIds
    const serializedMessages = messages.map((msg) => ({
      ...msg,
      _id: msg._id.toString(),
      roomId: msg.roomId.toString(),
      senderId: msg.senderId.toString(),
      createdAt: msg.createdAt.toISOString(),
    }))

    return NextResponse.json({ messages: serializedMessages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Errore nel recupero dei messaggi" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "ID room non valido" }, { status: 400 })
    }

    const { content } = await request.json()
    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Contenuto messaggio richiesto" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verify room exists and user is participant
    const room = await db.collection("chatRooms").findOne({
      _id: new ObjectId(roomId),
      "participants.id": session.user.id,
    })

    if (!room) {
      return NextResponse.json({ error: "Room non trovata o accesso negato" }, { status: 404 })
    }

    // Create message
    const message = {
      roomId: new ObjectId(roomId),
      senderId: new ObjectId(session.user.id),
      senderName: session.user.name,
      senderImage: session.user.image,
      content: content.trim(),
      createdAt: new Date(),
      readBy: [session.user.id],
    }

    const result = await db.collection("messages").insertOne(message)

    // Update room's last message
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

    const serializedMessage = {
      ...message,
      _id: result.insertedId.toString(),
      roomId: roomId,
      senderId: session.user.id,
      createdAt: message.createdAt.toISOString(),
    }

    return NextResponse.json({ message: serializedMessage })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Errore nell'invio del messaggio" }, { status: 500 })
  }
}
