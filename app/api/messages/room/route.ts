import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { hostId, hostEmail, hostName, eventId, eventTitle } = await request.json()

    // Validazione parametri
    if (!hostEmail || !eventId || !eventTitle) {
      console.error("Missing parameters:", { hostEmail, eventId, eventTitle })
      return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Trova l'utente corrente
    const currentUser = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Trova l'host
    const hostUser = await db.collection("users").findOne({
      email: hostEmail.toLowerCase(),
    })

    if (!hostUser) {
      return NextResponse.json({ error: "Host non trovato" }, { status: 404 })
    }

    // Crea un ID univoco per la room basato sui partecipanti e l'evento
    const participantEmails = [session.user.email.toLowerCase(), hostEmail.toLowerCase()].sort()
    const roomId = `${eventId}_${participantEmails.join("_")}`
    console.log("🏗️ Creating chat room with ID:", roomId)
    console.log("🏗️ Event ID:", eventId)
    console.log("🏗️ Participant emails:", participantEmails)

    // Verifica se esiste già una chat room
    const existingRoom = await db.collection("chatRooms").findOne({ _id: roomId })
    console.log("🏗️ Existing room found:", existingRoom ? "YES" : "NO")

    if (existingRoom) {
      console.log("🏗️ Returning existing room:", existingRoom._id)
      return NextResponse.json({
        roomId: existingRoom._id,
        isNewRoom: false,
      })
    }

    // Crea una nuova chat room
    const chatRoom = {
      _id: roomId,
      participants: [
        {
          id: currentUser._id.toString(),
          email: currentUser.email,
          name: currentUser.name || "Utente",
          image: currentUser.image,
        },
        {
          id: hostUser._id.toString(),
          email: hostUser.email,
          name: hostUser.name || hostName || "Host",
          image: hostUser.image,
        },
      ],
      eventId,
      eventTitle,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: null,
    }

    console.log("🏗️ Inserting new chat room:", chatRoom)
    const result = await db.collection("chatRooms").insertOne(chatRoom)
    console.log("🏗️ Chat room inserted successfully:", result.insertedId)

    return NextResponse.json({
      roomId: chatRoom._id,
      isNewRoom: true,
    })
  } catch (error) {
    console.error("Error creating/finding chat room:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
