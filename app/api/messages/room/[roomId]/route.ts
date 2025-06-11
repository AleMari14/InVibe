import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = params
    console.log("Fetching chat room:", roomId)

    const client = await clientPromise
    const db = client.db("invibe")
    const roomsCollection = db.collection("chatRooms")

    // Find the chat room
    const chatRoom = await roomsCollection.findOne({ roomId })

    if (!chatRoom) {
      console.error("Chat room not found:", roomId)
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 })
    }

    // Check if user is participant
    const userEmails = chatRoom.participants.map((p: any) => p.email)
    if (!userEmails.includes(session.user.email)) {
      console.error("User not authorized for this chat room")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Find the other user
    const otherUser = chatRoom.participants.find((p: any) => p.email !== session.user.email)

    const response = {
      _id: chatRoom._id,
      roomId: chatRoom.roomId,
      eventId: chatRoom.eventId,
      eventTitle: chatRoom.eventTitle,
      participants: chatRoom.participants,
      lastMessage: chatRoom.lastMessage,
      otherUser: otherUser || null,
      createdAt: chatRoom.createdAt,
      updatedAt: chatRoom.updatedAt,
    }

    console.log("Chat room found:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching chat room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
