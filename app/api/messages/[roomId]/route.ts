import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Verifica che l'utente sia parte della conversazione
    const conversation = await db.collection("messages").findOne({
      _id: new ObjectId(params.roomId),
      participants: session.user.email,
    })

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 })
    }

    // Recupera i messaggi della conversazione
    const messages = await db
      .collection("messages")
      .find({
        roomId: params.roomId,
      })
      .sort({ createdAt: 1 })
      .toArray()

    // Aggiorna lo stato di lettura dei messaggi
    await db.collection("messages").updateMany(
      {
        roomId: params.roomId,
        senderId: { $ne: session.user.email },
        readBy: { $ne: session.user.email },
      },
      {
        $addToSet: { readBy: session.user.email },
      }
    )

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { content } = await req.json()
    if (!content) {
      return new NextResponse("Message content is required", { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verifica che l'utente sia parte della conversazione
    const conversation = await db.collection("messages").findOne({
      _id: new ObjectId(params.roomId),
      participants: session.user.email,
    })

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 })
    }

    // Crea il nuovo messaggio
    const message = {
      _id: new ObjectId(),
      roomId: params.roomId,
      content,
      senderId: session.user.email,
      createdAt: new Date(),
      readBy: [session.user.email],
    }

    // Salva il messaggio nel database
    await db.collection("messages").insertOne(message)

    // Aggiorna la data di modifica della conversazione
    await db.collection("messages").updateOne(
      { _id: new ObjectId(params.roomId) },
      {
        $set: { 
          updatedAt: new Date(),
          [`messages.${Date.now()}`]: message 
        }
      }
    )

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error sending message:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
