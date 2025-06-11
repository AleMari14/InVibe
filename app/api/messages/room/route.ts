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

    console.log("Looking for chat between:", session.user.email, "and", hostEmail)

    const client = await clientPromise
    const db = client.db("invibe")

    // Create a consistent room ID based on the two users (sorted to ensure uniqueness)
    const participants = [session.user.email, hostEmail].sort()
    const roomId = `${participants[0]}_${participants[1]}`.replace(/[^a-zA-Z0-9_]/g, "_")

    console.log("Generated room ID:", roomId)

    // Check if chat room already exists between these two users
    const existingRoom = await db.collection("chatRooms").findOne({
      $or: [
        { roomId },
        {
          "participants.email": { $all: [session.user.email, hostEmail] },
        },
      ],
    })

    if (existingRoom) {
      console.log("Found existing chat room:", existingRoom.roomId)
      return NextResponse.json({
        roomId: existingRoom.roomId,
        isNew: false,
        message: "Chat esistente trovata",
      })
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
      participants: [
        {
          email: session.user.email,
          name: currentUser?.name || session.user.name || "Utente",
          image: currentUser?.image || session.user.image,
        },
        {
          email: hostEmail,
          name: hostUser.name || "Utente",
          image: hostUser.image,
        },
      ],
      // Store the event that initiated this chat (but chat is not limited to this event)
      initialEvent: {
        eventId,
        eventTitle,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
      archived: false,
    }

    const result = await db.collection("chatRooms").insertOne(chatRoom)
    console.log("New chat room created:", result.insertedId)

    return NextResponse.json({
      roomId,
      isNew: true,
      message: "Nuova chat creata",
    })
  } catch (error) {
    console.error("Error creating/finding chat room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
