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
    console.log("Fetching chat room details for:", roomId)

    const client = await clientPromise
    const db = client.db("invibe")

    // Cerca la chat room per roomId
    const chatRoom = await db.collection("chatRooms").findOne({ roomId })

    if (!chatRoom) {
      console.log("Chat room not found:", roomId)
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 })
    }

    console.log("Found chat room:", chatRoom)

    // Verifica che l'utente sia autorizzato ad accedere a questa chat
    const userEmails = chatRoom.participants.map((p: any) => p.email)
    if (!userEmails.includes(session.user.email)) {
      console.log("User not authorized for this chat room")
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    // Trova l'altro utente
    const otherUser = chatRoom.participants.find((p: any) => p.email !== session.user.email)

    // Ottieni l'ultimo messaggio
    const lastMessage = await db.collection("messages").findOne({ roomId }, { sort: { createdAt: -1 } })

    // Conta i messaggi non letti
    const unreadCount = await db.collection("messages").countDocuments({
      roomId,
      senderId: { $ne: session.user.email },
      readBy: { $ne: session.user.email },
    })

    const response = {
      _id: chatRoom._id,
      roomId: chatRoom.roomId,
      participants: chatRoom.participants,
      initialEvent: chatRoom.eventId
        ? {
            eventId: chatRoom.eventId,
            eventTitle: chatRoom.eventTitle,
          }
        : undefined,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
          }
        : null,
      unreadCount,
      otherUser: otherUser || {
        email: "unknown",
        name: "Utente Sconosciuto",
        image: null,
      },
      createdAt: chatRoom.createdAt,
      updatedAt: chatRoom.updatedAt,
    }

    console.log("Returning chat room data:", response)
    return NextResponse.json(response)
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
    console.log("Deleting chat room:", roomId)

    const client = await clientPromise
    const db = client.db("invibe")

    // Verifica che la chat room esista e che l'utente sia autorizzato
    const chatRoom = await db.collection("chatRooms").findOne({ roomId })

    if (!chatRoom) {
      console.log("Chat room not found:", roomId)
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 })
    }

    // Verifica che l'utente sia autorizzato ad eliminare questa chat
    const userEmails = chatRoom.participants.map((p: any) => p.email)
    if (!userEmails.includes(session.user.email)) {
      console.log("User not authorized to delete this chat room")
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
    }

    // Elimina tutti i messaggi della chat room
    const deleteMessagesResult = await db.collection("messages").deleteMany({ roomId })
    console.log(`Deleted ${deleteMessagesResult.deletedCount} messages for room ${roomId}`)

    // Elimina la chat room
    const deleteChatRoomResult = await db.collection("chatRooms").deleteOne({ roomId })
    console.log(`Deleted chat room ${roomId}:`, deleteChatRoomResult.deletedCount > 0)

    if (deleteChatRoomResult.deletedCount === 0) {
      return NextResponse.json({ error: "Errore nell'eliminazione della chat room" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Chat eliminata con successo",
      deletedMessages: deleteMessagesResult.deletedCount,
    })
  } catch (error) {
    console.error("Error deleting chat room:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
