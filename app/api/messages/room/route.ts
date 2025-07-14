import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    const { eventId, eventTitle, hostId, hostName, hostEmail, hostImage } = body

    console.log("Received data:", { eventId, eventTitle, hostId, hostName, hostEmail })

    // Validazione dei dati richiesti
    if (!eventId) {
      return NextResponse.json({ error: "ID evento mancante" }, { status: 400 })
    }

    if (!hostId) {
      return NextResponse.json({ error: "ID host mancante" }, { status: 400 })
    }

    if (!hostEmail) {
      return NextResponse.json({ error: "Email host mancante" }, { status: 400 })
    }

    if (!hostName) {
      return NextResponse.json({ error: "Nome host mancante" }, { status: 400 })
    }

    if (!eventTitle) {
      return NextResponse.json({ error: "Titolo evento mancante" }, { status: 400 })
    }

    // Controlla che l'utente non stia cercando di chattare con se stesso
    if (session.user.email === hostEmail) {
      return NextResponse.json({ error: "Non puoi chattare con te stesso" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Cerca una chat room esistente tra questi due utenti per questo evento
    const existingRoom = await db.collection("chatRooms").findOne({
      eventId: new ObjectId(eventId),
      participants: {
        $all: [
          { $elemMatch: { userId: new ObjectId(session.user.id) } },
          { $elemMatch: { userId: new ObjectId(hostId) } },
        ],
      },
    })

    if (existingRoom) {
      return NextResponse.json({
        roomId: existingRoom._id.toString(),
        isNewRoom: false,
      })
    }

    // Crea una nuova chat room
    const newRoom = {
      eventId: new ObjectId(eventId),
      eventTitle,
      participants: [
        {
          userId: new ObjectId(session.user.id),
          name: session.user.name || "Utente",
          email: session.user.email,
          image: session.user.image || "",
        },
        {
          userId: new ObjectId(hostId),
          name: hostName,
          email: hostEmail,
          image: hostImage || "",
        },
      ],
      createdAt: new Date(),
      lastMessage: null,
      lastMessageAt: null,
      isArchived: false,
    }

    const result = await db.collection("chatRooms").insertOne(newRoom)

    return NextResponse.json({
      roomId: result.insertedId.toString(),
      isNewRoom: true,
    })
  } catch (error) {
    console.error("Error creating/finding chat room:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
