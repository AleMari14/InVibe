import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import clientPromise from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"

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

    // Get chat room
    const chatRoom = await db.collection("chatRooms").findOne({ roomId })

    if (!chatRoom) {
      console.log("Chat room not found:", roomId)
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 })
    }

    // Check if user is participant
    const userEmails = chatRoom.participants.map((p: any) => p.email)
    if (!userEmails.includes(session.user.email)) {
      console.log("User not authorized for chat room:", session.user.email, userEmails)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get other user
    const otherUser = chatRoom.participants.find((p: any) => p.email !== session.user.email)

    console.log("Chat room found successfully:", roomId)
    return NextResponse.json({
      roomId: chatRoom.roomId,
      eventId: chatRoom.eventId,
      eventTitle: chatRoom.eventTitle,
      otherUser,
    })
  } catch (error) {
    console.error("Error fetching chat room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = params
    console.log("Deleting chat room:", roomId)

    const client = await clientPromise
    const db = client.db("invibe")

    // Check if user is participant
    const chatRoom = await db.collection("chatRooms").findOne({ roomId })
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 })
    }

    const userEmails = chatRoom.participants.map((p: any) => p.email)
    if (!userEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete all messages in the chat room
    await db.collection("messages").deleteMany({ roomId })

    // Delete the chat room
    await db.collection("chatRooms").deleteOne({ roomId })

    console.log("Chat room deleted successfully:", roomId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting chat room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
