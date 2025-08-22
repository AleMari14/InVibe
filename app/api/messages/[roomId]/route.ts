import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const roomId = params.roomId

    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 })
    }

    // Get messages for the room
    const messages = await db
      .collection("messages")
      .find({ roomId: new ObjectId(roomId) })
      .sort({ createdAt: 1 })
      .toArray()

    // Transform messages for client
    const transformedMessages = messages.map((msg) => ({
      _id: msg._id.toString(),
      roomId: msg.roomId.toString(),
      senderId: msg.senderId.toString(),
      senderName: msg.senderName,
      senderImage: msg.senderImage,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      read: msg.read || false,
    }))

    return NextResponse.json(transformedMessages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, receiverId } = await request.json()
    const { db } = await connectToDatabase()
    const roomId = params.roomId

    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 })
    }

    // Create message
    const message = {
      roomId: new ObjectId(roomId),
      senderId: new ObjectId(session.user.id),
      senderName: session.user.name || "Unknown",
      senderImage: session.user.image,
      content,
      createdAt: new Date(),
      read: false,
    }

    const result = await db.collection("messages").insertOne(message)

    // Update chat room's last message
    await db.collection("chatRooms").updateOne(
      { _id: new ObjectId(roomId) },
      {
        $set: {
          lastMessage: content,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    // Return the created message
    const responseMessage = {
      _id: result.insertedId.toString(),
      roomId,
      senderId: session.user.id,
      senderName: session.user.name || "Unknown",
      senderImage: session.user.image,
      content,
      createdAt: message.createdAt.toISOString(),
      read: false,
    }

    return NextResponse.json(responseMessage)
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
