import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { hostId, eventId, eventTitle } = await req.json()
    if (!hostId || !eventId) {
      return new NextResponse("Missing required fields", { status: 400 })
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
      return NextResponse.json({ roomId: existingRoom._id.toString() })
    }

    // Create new room
    const result = await db.collection("chat_rooms").insertOne({
      eventId,
      eventTitle,
      participants: [session.user.email, hostId],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null
    })

    return NextResponse.json({ roomId: result.insertedId.toString() })
  } catch (error) {
    console.error("Error creating chat room:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
