import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.email || !session.user.name) {
      return NextResponse.json({ error: "Non autorizzato o dati utente mancanti" }, { status: 401 })
    }

    const body = await request.json()
    const { hostEmail, hostName, eventId, eventTitle } = body

    if (!hostEmail || !hostName || !eventId || !eventTitle) {
      return NextResponse.json({ error: "Dati mancanti per creare la chat" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const usersCollection = db.collection("users")
    const chatRoomsCollection = db.collection("chatRooms")

    // Find host user
    const hostUser = await usersCollection.findOne({ email: hostEmail })
    if (!hostUser) {
      return NextResponse.json({ error: "Host non trovato" }, { status: 404 })
    }

    const currentUser = {
      _id: new ObjectId(session.user.id),
      name: session.user.name,
      email: session.user.email,
    }

    const participants = [currentUser._id, hostUser._id].sort()

    // Check if a room already exists for this event and participants
    let room = await chatRoomsCollection.findOne({
      eventId: new ObjectId(eventId),
      "participants.id": { $all: participants.map((id) => id) },
    })

    let isNewRoom = false
    if (!room) {
      // If not, check for a room without eventId (for general chat)
      room = await chatRoomsCollection.findOne({
        eventId: { $exists: false },
        "participants.id": { $all: participants.map((id) => id) },
      })
    }

    if (!room) {
      // If still no room, create a new one
      const newRoomData = {
        participants: [
          { id: currentUser._id, name: currentUser.name, image: session.user.image },
          { id: hostUser._id, name: hostUser.name, image: hostUser.image },
        ],
        eventId: new ObjectId(eventId),
        eventTitle: eventTitle,
        lastMessage: null,
        lastMessageAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const result = await chatRoomsCollection.insertOne(newRoomData)
      room = { ...newRoomData, _id: result.insertedId }
      isNewRoom = true
    }

    return NextResponse.json({
      roomId: room._id.toString(),
      isNewRoom,
    })
  } catch (error: any) {
    console.error("💥 Error creating/finding chat room:", error)
    return NextResponse.json(
      {
        error: "Errore interno del server",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
