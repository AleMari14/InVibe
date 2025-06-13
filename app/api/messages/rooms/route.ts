import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import clientPromise from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"

// Forza la route ad essere dinamica
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Fetching chat rooms for user:", session.user.email)

    const client = await clientPromise
    const db = client.db("invibe")

    // Get all chat rooms where the user is a participant
    const chatRooms = await db
      .collection("chatRooms")
      .find({
        "participants.email": session.user.email,
      })
      .sort({ updatedAt: -1 })
      .toArray()

    console.log(`Found ${chatRooms.length} chat rooms for user`)

    // For each chat room, get the last message and unread count
    const roomsWithDetails = await Promise.all(
      chatRooms.map(async (room) => {
        // Get last message
        const lastMessage = await db
          .collection("messages")
          .findOne({ roomId: room.roomId }, { sort: { createdAt: -1 } })

        // Get unread count
        const unreadCount = await db.collection("messages").countDocuments({
          roomId: room.roomId,
          senderId: { $ne: session.user.email },
          readBy: { $ne: session.user.email },
        })

        // Get other user info
        const otherUser = room.participants.find((p: any) => p.email !== session.user.email)

        return {
          _id: room._id,
          roomId: room.roomId,
          eventId: room.eventId,
          eventTitle: room.eventTitle,
          participants: room.participants,
          lastMessage,
          unreadCount,
          otherUser,
          archived: room.archived || false,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
        }
      }),
    )

    console.log("Returning rooms with details:", roomsWithDetails.length)
    return NextResponse.json({ rooms: roomsWithDetails })
  } catch (error) {
    console.error("Error fetching chat rooms:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
