import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import clientPromise from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { hostEmail, eventId, eventTitle } = await request.json()

    if (!hostEmail || !eventId || !eventTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (hostEmail === session.user.email) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })
    }

    console.log("Creating chat room between:", session.user.email, "and", hostEmail)

    const client = await clientPromise
    const db = client.db("invibe")

    // Generate a unique room ID
    const roomId = `${eventId}_${session.user.email}_${hostEmail}`.replace(/[^a-zA-Z0-9_]/g, "_")

    // Check if chat room already exists
    const existingRoom = await db.collection("chatRooms").findOne({ roomId })

    if (existingRoom) {
      console.log("Chat room already exists:", roomId)
      return NextResponse.json({ roomId: existingRoom.roomId })
    }

    // Get user details
    const currentUser = await db.collection("users").findOne({ email: session.user.email })
    const hostUser = await db.collection("users").findOne({ email: hostEmail })

    if (!hostUser) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 })
    }

    // Create new chat room
    const chatRoom = {
      roomId,
      eventId,
      eventTitle,
      participants: [
        {
          email: session.user.email,
          name: currentUser?.name || session.user.name,
          image: currentUser?.image || session.user.image,
        },
        {
          email: hostEmail,
          name: hostUser.name,
          image: hostUser.image,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
      archived: false,
    }

    const result = await db.collection("chatRooms").insertOne(chatRoom)
    console.log("Chat room created:", result.insertedId)

    return NextResponse.json({ roomId })
  } catch (error) {
    console.error("Error creating chat room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
