import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    const client = await clientPromise
    const db = client.db("invibe")

    // Trova la chat room
    const chatRoom = await db.collection("chatRooms").findOne({ _id: roomId })
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room non trovata" }, { status: 404 })
    }

    // Verifica che l'utente sia un partecipante
    const isParticipant = chatRoom.participants.some((p: any) => p.email === session.user.email)
    if (!isParticipant) {
      return NextResponse.json({ error: "Non autorizzato ad accedere a questa chat" }, { status: 403 })
    }

    // Trova l'altro utente
    const otherUser = chatRoom.participants.find((p: any) => p.email !== session.user.email)

    return NextResponse.json({
      _id: chatRoom._id,
      participants: chatRoom.participants,
      eventTitle: chatRoom.eventTitle,
      otherUser: otherUser || null,
    })
  } catch (error) {
    console.error("Error fetching chat room:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    const client = await clientPromise
    const db = client.db("invibe")

    // Verifica che la chat room esista e l'utente sia autorizzato
    const chatRoom = await db.collection("chatRooms").findOne({ _id: roomId })
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room non trovata" }, { status: 404 })
    }

    const isParticipant = chatRoom.participants.some((p: any) => p.email === session.user.email)
    if (!isParticipant) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    // Elimina tutti i messaggi della chat
    await db.collection("messages").deleteMany({ roomId })

    // Elimina la chat room
    await db.collection("chatRooms").deleteOne({ _id: roomId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting chat room:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
