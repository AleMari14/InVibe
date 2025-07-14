import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { eventId, hostId, hostName, hostImage, hostEmail, eventTitle } = await request.json()

    console.log("Received data:", { eventId, hostId, hostName, hostImage, hostEmail, eventTitle })

    if (!eventId) {
      return NextResponse.json({ error: "ID evento mancante" }, { status: 400 })
    }

    if (!hostId) {
      return NextResponse.json({ error: "ID host mancante" }, { status: 400 })
    }

    if (!hostName) {
      return NextResponse.json({ error: "Nome host mancante" }, { status: 400 })
    }

    if (!hostEmail) {
      return NextResponse.json({ error: "Email host mancante" }, { status: 400 })
    }

    if (!eventTitle) {
      return NextResponse.json({ error: "Titolo evento mancante" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Controlla se esiste già una stanza tra questi due utenti per questo evento
    let room = await db.collection("chatRooms").findOne({
      eventId: new ObjectId(eventId),
      "participants.id": { $all: [session.user.id, hostId] },
    })

    let isNewRoom = false
    if (!room) {
      isNewRoom = true
      const newRoomData = {
        eventId: new ObjectId(eventId),
        eventTitle,
        participants: [
          { id: session.user.id, name: session.user.name, image: session.user.image, email: session.user.email },
          { id: hostId, name: hostName, image: hostImage, email: hostEmail },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const result = await db.collection("chatRooms").insertOne(newRoomData)
      room = { ...newRoomData, _id: result.insertedId }
    }

    return NextResponse.json({
      roomId: room._id.toString(),
      newRoom: isNewRoom,
    })
  } catch (error: any) {
    console.error("Error creating/finding chat room:", error)
    return NextResponse.json({ error: "Errore nella gestione della chat", details: error.message }, { status: 500 })
  }
}
