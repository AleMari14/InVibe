import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { hostId, eventId, eventTitle } = await request.json()
    console.log("Creating chat room with:", { hostId, eventId, eventTitle, userEmail: session.user.email })

    if (!hostId || !eventId || !eventTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Don't allow users to message themselves
    if (hostId === session.user.email) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("invibe")
    const roomsCollection = db.collection("chatRooms")

    // Create a consistent room ID based on the two users and event
    const participants = [session.user.email, hostId].sort()
    const roomId = `${participants[0]}_${participants[1]}_${eventId}`

    console.log("Generated room ID:", roomId)

    // Check if room already exists
    const existingRoom = await roomsCollection.findOne({ roomId })

    if (existingRoom) {
      console.log("Room already exists:", roomId)
      return NextResponse.json({ roomId, exists: true })
    }

    // Get user information
    const usersCollection = db.collection("users")
    const hostUser = await usersCollection.findOne({ email: hostId })
    const currentUser = await usersCollection.findOne({ email: session.user.email })

    if (!hostUser) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 })
    }

    if (!currentUser) {
      return NextResponse.json({ error: "Current user not found" }, { status: 404 })
    }

    // Create new room
    const roomData = {
      roomId,
      eventId,
      eventTitle,
      participants: [
        {
          email: session.user.email,
          name: currentUser.name || session.user.name,
          image: currentUser.image || session.user.image,
        },
        {
          email: hostId,
          name: hostUser.name,
          image: hostUser.image,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
      unreadCount: {
        [session.user.email]: 0,
        [hostId]: 0,
      },
    }

    await roomsCollection.insertOne(roomData)
    console.log("✅ Chat room created successfully:", roomId)

    return NextResponse.json({ roomId, exists: false })
  } catch (error) {
    console.error("Error creating chat room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
