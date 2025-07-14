import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { eventId, eventTitle, hostId, hostName, hostEmail, hostImage } = await request.json()

    console.log("Creating room with data:", { eventId, eventTitle, hostId, hostName, hostEmail })

    if (!eventId || !hostId) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 })
    }

    if (!hostEmail) {
      return NextResponse.json({ error: "Email host mancante" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Trova l'utente corrente
    const currentUser = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Controlla se l'utente sta cercando di messaggiare se stesso
    if (currentUser.email === hostEmail) {
      return NextResponse.json({ error: "Non puoi inviare messaggi a te stesso" }, { status: 400 })
    }

    // Trova l'host
    const host = await db.collection("users").findOne({
      email: hostEmail.toLowerCase(),
    })

    if (!host) {
      return NextResponse.json({ error: "Host non trovato" }, { status: 404 })
    }

    // Crea un ID univoco per la room basato sui partecipanti e l'evento
    const participants = [currentUser._id.toString(), host._id.toString()].sort()
    const roomId = `${eventId}_${participants.join("_")}`

    // Controlla se la room esiste già
    const existingRoom = await db.collection("chatRooms").findOne({ roomId })

    if (existingRoom) {
      return NextResponse.json({ roomId, isNewRoom: false })
    }

    // Crea una nuova room
    const newRoom = {
      roomId,
      eventId: new ObjectId(eventId),
      eventTitle,
      participants: [
        {
          userId: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          image: currentUser.image || "",
        },
        {
          userId: host._id,
          name: host.name,
          email: host.email,
          image: host.image || "",
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
      isArchived: false,
    }

    await db.collection("chatRooms").insertOne(newRoom)

    return NextResponse.json({ roomId, isNewRoom: true })
  } catch (error) {
    console.error("Error creating chat room:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
