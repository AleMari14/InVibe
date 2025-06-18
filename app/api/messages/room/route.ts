import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    const { hostEmail, eventId, eventTitle } = body

    if (!hostEmail || !eventId || !eventTitle) {
      return NextResponse.json(
        { error: "Parametri mancanti: hostEmail, eventId e eventTitle sono richiesti" },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    // Trova l'utente corrente e l'host
    const currentUser = await db.collection("users").findOne({ email: session.user.email })
    const hostUser = await db.collection("users").findOne({ email: hostEmail })

    if (!currentUser) {
      return NextResponse.json({ error: "Utente corrente non trovato" }, { status: 404 })
    }

    if (!hostUser) {
      return NextResponse.json({ error: "Host non trovato" }, { status: 404 })
    }

    // Verifica che l'evento esista
    const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) })
    if (!event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    // Crea un ID univoco per la chat room basato sui partecipanti e l'evento
    const participants = [currentUser._id.toString(), hostUser._id.toString()].sort()
    const roomId = `${eventId}_${participants.join("_")}`

    // Controlla se la chat room esiste già
    let chatRoom = await db.collection("chatRooms").findOne({ roomId })

    let isNew = false
    if (!chatRoom) {
      // Crea una nuova chat room
      const newChatRoom = {
        roomId,
        eventId: new ObjectId(eventId),
        eventTitle,
        participants: [
          {
            userId: currentUser._id,
            email: currentUser.email,
            name: currentUser.name || "Utente",
            image: currentUser.image || null,
          },
          {
            userId: hostUser._id,
            email: hostUser.email,
            name: hostUser.name || "Host",
            image: hostUser.image || null,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: null,
        unreadCount: {
          [currentUser._id.toString()]: 0,
          [hostUser._id.toString()]: 0,
        },
      }

      const result = await db.collection("chatRooms").insertOne(newChatRoom)
      chatRoom = { ...newChatRoom, _id: result.insertedId }
      isNew = true
    } else {
      // Aggiorna la data di ultimo accesso
      await db.collection("chatRooms").updateOne({ roomId }, { $set: { updatedAt: new Date() } })
    }

    return NextResponse.json({
      success: true,
      roomId: chatRoom.roomId,
      isNew,
      participants: chatRoom.participants,
      eventTitle: chatRoom.eventTitle,
    })
  } catch (error) {
    console.error("Errore nella creazione/ricerca della chat room:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
