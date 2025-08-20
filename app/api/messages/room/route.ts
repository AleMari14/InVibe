import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { hostId, hostEmail, hostName, eventId, eventTitle } = await request.json()

    console.log("Creating chat room with params:", {
      hostId,
      hostEmail,
      hostName,
      eventId,
      eventTitle,
      currentUser: session.user.email,
    })

    if (!hostEmail || !hostName || !eventId || !eventTitle) {
      return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Crea un roomId univoco basato sui due utenti e l'evento (ordinati alfabeticamente per consistenza)
    const participants = [session.user.email, hostEmail].sort()
    const roomIdString = `${participants[0]}_${participants[1]}_${eventId}`

    // Cerca se esiste già una chat room tra questi due utenti per questo evento
    const existingRoom = await db.collection("chatRooms").findOne({
      $or: [
        {
          "participants.email": { $all: [session.user.email, hostEmail] },
          eventId: eventId,
        },
        {
          roomId: roomIdString,
        },
      ],
    })

    if (existingRoom) {
      console.log("Found existing room:", existingRoom._id.toString())
      return NextResponse.json({
        roomId: existingRoom._id.toString(),
        isNewRoom: false,
      })
    }

    // Crea una nuova chat room
    const newRoom = {
      roomId: roomIdString,
      participants: [
        {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name || "Utente",
          image: session.user.image,
        },
        {
          id: hostId,
          email: hostEmail,
          name: hostName,
          image: null, // Sarà aggiornata quando l'host accederà
        },
      ],
      eventId: eventId,
      eventTitle: eventTitle,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
      lastMessageAt: null,
      archived: false,
    }

    const result = await db.collection("chatRooms").insertOne(newRoom)
    console.log("Created new room:", result.insertedId.toString())

    return NextResponse.json({
      roomId: result.insertedId.toString(),
      isNewRoom: true,
    })
  } catch (error) {
    console.error("Error creating/finding chat room:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const url = new URL(request.url)
    const roomId = url.searchParams.get("roomId")

    if (!roomId || !ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "ID room non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const room = await db.collection("chatRooms").findOne({
      _id: new ObjectId(roomId),
      "participants.email": session.user.email,
    })

    if (!room) {
      return NextResponse.json({ error: "Room non trovata" }, { status: 404 })
    }

    // Trova l'altro partecipante
    const otherParticipant = room.participants.find((p: any) => p.email !== session.user.email)

    return NextResponse.json({
      _id: room._id.toString(),
      participants: room.participants,
      eventTitle: room.eventTitle || "Evento",
      otherUser: otherParticipant || {
        name: "Utente Sconosciuto",
        email: "unknown",
        image: null,
      },
    })
  } catch (error) {
    console.error("Error fetching chat room:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
