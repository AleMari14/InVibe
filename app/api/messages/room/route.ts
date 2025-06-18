import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { hostEmail, hostName, eventId, eventTitle } = await request.json()
    const currentUserEmail = session.user.email
    const currentUserName = session.user.name || "Utente"

    console.log("Creating chat room between:", currentUserEmail, "and", hostEmail)

    if (currentUserEmail === hostEmail) {
      return NextResponse.json({ error: "Non puoi creare una chat con te stesso" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("invibe")

    // Genera un roomId univoco basato su evento e partecipanti
    const participants = [currentUserEmail, hostEmail].sort()
    const roomId = `${eventId}_${participants.join("_").replace(/[^a-zA-Z0-9]/g, "")}`

    console.log("Generated roomId:", roomId)

    // Controlla se la chat room esiste già
    const existingRoom = await db.collection("chatRooms").findOne({ roomId })

    if (existingRoom) {
      console.log("Chat room already exists")
      return NextResponse.json({ roomId, isNewRoom: false })
    }

    // Ottieni i dettagli dell'host dal database
    const hostUser = await db.collection("users").findOne({ email: hostEmail })
    const currentUser = await db.collection("users").findOne({ email: currentUserEmail })

    // Crea la nuova chat room
    const chatRoom = {
      roomId,
      eventId,
      eventTitle,
      participants: [
        {
          email: currentUserEmail,
          name: currentUser?.name || currentUserName,
          image: currentUser?.image || null,
        },
        {
          email: hostEmail,
          name: hostUser?.name || hostName,
          image: hostUser?.image || null,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false,
    }

    await db.collection("chatRooms").insertOne(chatRoom)
    console.log("Chat room created successfully")

    return NextResponse.json({ roomId, isNewRoom: true })
  } catch (error) {
    console.error("Error creating chat room:", error)
    return NextResponse.json({ error: "Errore nella creazione della chat room" }, { status: 500 })
  }
}
