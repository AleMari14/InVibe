import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log("Unauthorized: No session or email found")
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    console.log("Received request body:", body)

    const { hostId, eventId, eventTitle } = body

    // Validate required fields
    if (!hostId) {
      console.log("Missing hostId in request")
      return new NextResponse("Missing hostId", { status: 400 })
    }
    if (!eventId) {
      console.log("Missing eventId in request")
      return new NextResponse("Missing eventId", { status: 400 })
    }
    if (!eventTitle) {
      console.log("Missing eventTitle in request")
      return new NextResponse("Missing eventTitle", { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Check if a room already exists for this event and users
    const existingRoom = await db.collection("chat_rooms").findOne({
      eventId,
      participants: {
        $all: [session.user.email, hostId]
      }
    })

    if (existingRoom) {
      console.log("Found existing room:", existingRoom._id.toString())
      return NextResponse.json({ roomId: existingRoom._id.toString() })
    }

    // Create new room
    const newRoom = {
      eventId,
      eventTitle,
      participants: [session.user.email, hostId],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
      messages: []
    }

    console.log("Creating new room with data:", newRoom)
    const result = await db.collection("chat_rooms").insertOne(newRoom)
    console.log("Created new room with ID:", result.insertedId.toString())

    return NextResponse.json({ roomId: result.insertedId.toString() })
  } catch (error) {
    console.error("Error creating chat room:", error)
    return new NextResponse(
      `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      { status: 500 }
    )
  }
}
