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

    const { hostId, hostEmail, hostName, eventId, eventTitle } = await request.json()

    if (!hostEmail || !eventId || !eventTitle) {
      return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("invibe")

    // Trova l'utente corrente
    const currentUser = await db.collection("users").findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Trova l'host
    const hostUser = await db.collection("users").findOne({ email: hostEmail })
    if (!hostUser) {
      return NextResponse.json({ error: "Host non trovato" }, { status: 404 })
    }

    // Crea un ID univoco per la room basato sui partecipanti e l'evento
    const participantEmails = [session.user.email, hostEmail].sort()
    const roomId = `${eventId}_${participantEmails.join("_")}`

    // Verifica se esiste già una chat room
    const existingRoom = await db.collection("chatRooms").findOne({ _id: roomId })

    if (existingRoom) {
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
          name: hostUser.name || hostName,
          image: hostUser.image,
        },
      ],
      eventId,
      eventTitle,
      createdAt: new Date(),
      lastMessageAt: null,
    }

    await db.collection("chatRooms").insertOne(chatRoom)

    return NextResponse.json({
      roomId: chatRoom._id,
      isNewRoom: true,
    })
  } catch (error) {
    console.error("Error creating/finding chat room:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
