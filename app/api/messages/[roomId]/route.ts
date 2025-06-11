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
    console.log("Fetching messages for room:", roomId)

    const client = await clientPromise
    const db = client.db("invibe")

    // First check if the chat room exists and user has access
    const chatRoom = await db.collection("chatRooms").findOne({ roomId })
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 })
    }

    const userEmails = chatRoom.participants.map((p: any) => p.email)
    if (!userEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get messages for this room
    const messages = await db.collection("messages").find({ roomId }).sort({ createdAt: 1 }).toArray()

    // Mark messages as read by current user
    await db.collection("messages").updateMany(
      {
        roomId,
        senderId: { $ne: session.user.email },
        readBy: { $ne: session.user.email },
      },
      { $addToSet: { readBy: session.user.email } },
    )

    console.log(`Found ${messages.length} messages for room ${roomId}`)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = params
    const { content } = await request.json()

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    console.log("Sending message to room:", roomId, "Content:", content)

    const client = await clientPromise
    const db = client.db("invibe")

    // Check if chat room exists and user has access
    const chatRoom = await db.collection("chatRooms").findOne({ roomId })
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 })
    }

    const userEmails = chatRoom.participants.map((p: any) => p.email)
    if (!userEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get sender info
    const sender = chatRoom.participants.find((p: any) => p.email === session.user.email)
    const recipient = chatRoom.participants.find((p: any) => p.email !== session.user.email)

    // Create message
    const message = {
      roomId,
      content: content.trim(),
      senderId: session.user.email,
      senderName: sender?.name || session.user.name,
      senderImage: sender?.image || session.user.image,
      createdAt: new Date(),
      readBy: [session.user.email],
    }

    // Insert message
    const result = await db.collection("messages").insertOne(message)

    // Update chat room's last message and timestamp
    await db.collection("chatRooms").updateOne(
      { roomId },
      {
        $set: {
          lastMessage: {
            content: message.content,
            senderId: message.senderId,
            createdAt: message.createdAt,
          },
          updatedAt: new Date(),
        },
      },
    )

    // Create notification for recipient
    if (recipient) {
      const notification = {
        userId: recipient.email,
        type: "message",
        title: "Nuovo messaggio",
        message: `${sender?.name || session.user.name} ti ha inviato un messaggio: "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
        eventId: chatRoom.eventId,
        eventTitle: chatRoom.eventTitle,
        fromUserId: session.user.email,
        fromUserName: sender?.name || session.user.name,
        fromUserImage: sender?.image || session.user.image,
        roomId: roomId,
        read: false,
        createdAt: new Date(),
      }

      await db.collection("notifications").insertOne(notification)
      console.log("Notification created for:", recipient.email)
    }

    console.log("Message sent successfully:", result.insertedId)
    return NextResponse.json({ ...message, _id: result.insertedId })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
