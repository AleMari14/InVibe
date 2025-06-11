import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import clientPromise from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("invibe")

    // Get unread message count
    const chatRooms = await db
      .collection("chatRooms")
      .find({
        "participants.email": session.user.email,
      })
      .toArray()

    let unreadCount = 0
    for (const room of chatRooms) {
      const unreadMessages = await db.collection("messages").countDocuments({
        roomId: room.roomId,
        senderId: { $ne: session.user.email },
        readBy: { $ne: session.user.email },
      })
      unreadCount += unreadMessages
    }

    // Get recent notifications
    const notifications = await db
      .collection("notifications")
      .find({ userId: session.user.email })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json({
      unreadMessages: unreadCount,
      notifications,
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type, title, message, targetUserId, eventId } = await request.json()

    const client = await clientPromise
    const db = client.db("invibe")

    const notification = {
      userId: targetUserId,
      type,
      title,
      message,
      eventId,
      fromUserId: session.user.email,
      fromUserName: session.user.name,
      read: false,
      createdAt: new Date(),
    }

    await db.collection("notifications").insertOne(notification)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
