import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { connectToDatabase } from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"

// GET handler to fetch details of a specific chat room
export async function GET(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "ID della chat non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const room = await db.collection("chatRooms").findOne({
      _id: new ObjectId(roomId),
    })

    if (!room) {
      return NextResponse.json({ error: "Chat room non trovata" }, { status: 404 })
    }

    // Verify user is a participant
    const isParticipant = room.participants.some((p: any) => p.id.toString() === session.user.id)
    if (!isParticipant) {
      return NextResponse.json({ error: "Accesso non consentito" }, { status: 403 })
    }

    return NextResponse.json(room)
  } catch (error: any) {
    console.error("💥 Error fetching chat room details:", error)
    return NextResponse.json(
      {
        error: "Errore interno del server",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// DELETE handler to archive or delete a chat room
export async function DELETE(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "ID della chat non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // For now, we just delete it. A soft delete (archiving) would be better.
    const result = await db.collection("chatRooms").deleteOne({
      _id: new ObjectId(roomId),
      "participants.id": new ObjectId(session.user.id), // Ensure user is in the chat they're trying to delete
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Chat non trovata o non autorizzato a eliminarla" }, { status: 404 })
    }

    // Optionally, delete all messages associated with the room
    await db.collection("messages").deleteMany({
      roomId: roomId,
    })

    return NextResponse.json({ message: "Chat eliminata con successo" })
  } catch (error: any) {
    console.error("💥 Error deleting chat room:", error)
    return NextResponse.json(
      {
        error: "Errore interno del server",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
