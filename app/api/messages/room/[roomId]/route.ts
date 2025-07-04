import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    console.log("🔍 Fetching messages for room:", roomId)

    const client = await clientPromise
    const db = client.db("invibe")

    // Verifica che l'utente faccia parte della chat room
    const chatRoom = await db.collection("chatRooms").findOne({ roomId })
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room non trovata" }, { status: 404 })
    }

    const userEmails = chatRoom.participants.map((p: any) => p.email)
    if (!userEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "Non autorizzato per questa chat" }, { status: 403 })
    }

    // Recupera i messaggi
    const messages = await db.collection("messages").find({ roomId }).sort({ createdAt: 1 }).toArray()

    console.log("✅ Messages fetched:", messages.length)

    return NextResponse.json(messages)
  } catch (error) {
    console.error("💥 Error fetching messages:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { roomId } = params
    console.log("🗑️ Deleting chat room:", roomId)

    const client = await clientPromise
    const db = client.db("invibe")

    // Verifica che l'utente faccia parte della chat room
    const chatRoom = await db.collection("chatRooms").findOne({ roomId })
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room non trovata" }, { status: 404 })
    }

    const userEmails = chatRoom.participants.map((p: any) => p.email)
    if (!userEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "Non autorizzato per questa chat" }, { status: 403 })
    }

    // Elimina tutti i messaggi della chat room
    const deleteMessagesResult = await db.collection("messages").deleteMany({ roomId })
    console.log("🗑️ Messages deleted:", deleteMessagesResult.deletedCount)

    // Elimina la chat room
    const deleteChatRoomResult = await db.collection("chatRooms").deleteOne({ roomId })
    console.log("🗑️ Chat room deleted:", deleteChatRoomResult.deletedCount)

    return NextResponse.json({
      success: true,
      messagesDeleted: deleteMessagesResult.deletedCount,
      chatRoomDeleted: deleteChatRoomResult.deletedCount > 0,
    })
  } catch (error) {
    console.error("💥 Error deleting chat room:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
