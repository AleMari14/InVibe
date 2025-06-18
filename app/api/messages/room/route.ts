import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/database"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { hostEmail, eventId, eventTitle } = await request.json()

    if (!hostEmail || !eventId || !eventTitle) {
      return NextResponse.json(
        { error: "Parametri mancanti: hostEmail, eventId, eventTitle sono richiesti" },
        { status: 400 },
      )
    }

    // Don't allow users to create chat with themselves
    if (hostEmail === session.user.email) {
      return NextResponse.json({ error: "Non puoi creare una chat con te stesso" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get user details
    const currentUser = await db.collection("users").findOne({ email: session.user.email })
    const hostUser = await db.collection("users").findOne({ email: hostEmail })

    if (!currentUser || !hostUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Get event details
    const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) })
    if (!event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    // Create a unique room identifier based on participants and event
    const participants = [session.user.email, hostEmail].sort()
    const roomIdentifier = `${participants.join("_")}_${eventId}`

    // Check if room already exists
    const existingRoom = await db.collection("chatRooms").findOne({
      identifier: roomIdentifier,
    })

    let roomId: string
    let isNew = false

    if (existingRoom) {
      roomId = existingRoom._id.toString()
      console.log("Found existing room:", roomId)
    } else {
      // Create new room
      const newRoom = {
        identifier: roomIdentifier,
        participants: [
          {
            email: session.user.email,
            name: currentUser.name || session.user.name,
            image: currentUser.image || session.user.image,
          },
          {
            email: hostEmail,
            name: hostUser.name,
            image: hostUser.image,
          },
        ],
        eventId: eventId,
        eventTitle: eventTitle,
        eventDetails: {
          title: event.title,
          location: event.location,
          dateStart: event.dateStart,
          price: event.price,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: null,
        unreadCount: {
          [session.user.email]: 0,
          [hostEmail]: 0,
        },
      }

      const result = await db.collection("chatRooms").insertOne(newRoom)
      roomId = result.insertedId.toString()
      isNew = true
      console.log("Created new room:", roomId)
    }

    return NextResponse.json({
      success: true,
      roomId,
      isNew,
      eventTitle,
    })
  } catch (error) {
    console.error("Error in chat room creation:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
