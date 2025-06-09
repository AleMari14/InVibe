import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    console.log("Creating chat room with data:", data)

    // Validate required fields
    if (!data.hostId || !data.eventId || !data.eventTitle) {
      console.error("Missing required fields:", { data })
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("invibe")

    // Get current user
    const currentUser = await db.collection("users").findOne({ email: session.user.email })
    if (!currentUser) {
      console.error("Current user not found:", session.user.email)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get host user
    let hostId
    try {
      hostId = new ObjectId(data.hostId)
    } catch (error) {
      console.error("Invalid host ID format:", data.hostId)
      return NextResponse.json({ error: "Invalid host ID format" }, { status: 400 })
    }

    const host = await db.collection("users").findOne({ _id: hostId })
    if (!host) {
      console.error("Host not found:", data.hostId)
      return NextResponse.json({ error: "Host not found" }, { status: 404 })
    }

    // Check if chat room already exists
    const existingRoom = await db.collection("chatRooms").findOne({
      eventId: data.eventId,
      participants: {
        $all: [currentUser._id.toString(), host._id.toString()]
      }
    })

    if (existingRoom) {
      console.log("Found existing chat room:", existingRoom._id)
      return NextResponse.json({
        roomId: existingRoom._id.toString(),
        host: {
          name: host.name,
          email: host.email,
          image: host.image
        }
      })
    }

    // Create new chat room
    const chatRoom = {
      eventId: data.eventId,
      eventTitle: data.eventTitle,
      participants: [currentUser._id.toString(), host._id.toString()],
      lastMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("chatRooms").insertOne(chatRoom)
    console.log("Created new chat room:", result.insertedId)

    return NextResponse.json({
      roomId: result.insertedId.toString(),
      host: {
        name: host.name,
        email: host.email,
        image: host.image
      }
    })
  } catch (error) {
    console.error("Error creating chat room:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
