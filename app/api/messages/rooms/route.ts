import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Trova tutte le chat rooms dell'utente
    const chatRooms = await db
      .collection("chatRooms")
      .find({
        "participants.email": session.user.email.toLowerCase(),
      })
      .sort({ updatedAt: -1 })
      .toArray()

    const roomsWithDetails = await Promise.all(
      chatRooms.map(async (room) => {
        // Trova l'ultimo messaggio
        const lastMessage = await db.collection("messages").findOne({ roomId: room._id }, { sort: { createdAt: -1 } })

        // Conta i messaggi non letti
        const unreadCount = await db.collection("messages").countDocuments({
          roomId: room._id,
          senderId: { $ne: session.user.email },
          readBy: { $ne: session.user.email },
        })

        // Trova l'altro utente
        const otherUser = room.participants.find((p: any) => p.email !== session.user.email)

        return {
          _id: room._id,
          eventTitle: room.eventTitle,
          lastMessage: lastMessage?.content || "",
          lastMessageAt: lastMessage?.createdAt || room.createdAt,
          otherUser: otherUser || { name: "Utente sconosciuto", email: "", image: null },
          unreadCount,
          updatedAt: room.updatedAt,
        }
      }),
    )

    return NextResponse.json(roomsWithDetails)
  } catch (error) {
    console.error("Error fetching chat rooms:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { participantId, eventTitle } = await request.json()
    const { db } = await connectToDatabase()

    if (!ObjectId.isValid(participantId)) {
      return NextResponse.json({ error: "Invalid participant ID" }, { status: 400 })
    }

    // Check if a chat room already exists between these users
    const existingRoom = await db.collection("chatRooms").findOne({
      $and: [{ "participants.id": new ObjectId(session.user.id) }, { "participants.id": new ObjectId(participantId) }],
    })

    if (existingRoom) {
      return NextResponse.json({
        _id: existingRoom._id.toString(),
        participants: existingRoom.participants.map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          image: p.image,
        })),
        eventTitle: existingRoom.eventTitle,
        lastMessage: existingRoom.lastMessage,
        lastMessageAt: existingRoom.lastMessageAt?.toISOString(),
      })
    }

    // Get participant details
    const participant = await db.collection("users").findOne({
      _id: new ObjectId(participantId),
    })

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 })
    }

    // Create new chat room
    const newRoom = {
      participants: [
        {
          id: new ObjectId(session.user.id),
          name: session.user.name,
          image: session.user.image,
          email: session.user.email.toLowerCase(),
        },
        {
          id: new ObjectId(participantId),
          name: participant.name,
          image: participant.image,
          email: participant.email.toLowerCase(),
        },
      ],
      eventTitle,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("chatRooms").insertOne(newRoom)

    return NextResponse.json({
      _id: result.insertedId.toString(),
      participants: newRoom.participants.map((p) => ({
        id: p.id.toString(),
        name: p.name,
        image: p.image,
        email: p.email,
      })),
      eventTitle: newRoom.eventTitle,
      createdAt: newRoom.createdAt.toISOString(),
      updatedAt: newRoom.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Error creating chat room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
