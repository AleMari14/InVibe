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

    console.log("Creating/finding chat room:", { hostEmail, eventId, eventTitle, currentUser: session.user.email })

    const client = await clientPromise
    const db = client.db("invibe")

    // Get user details
    const currentUser = await db.collection("users").findOne({ email: session.user.email })
    const hostUser = await db.collection("users").findOne({ email: hostEmail })

    if (!currentUser || !hostUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create room ID based on participants and event
    const participants = [session.user.email, hostEmail].sort()
    const roomId = `${eventId}_${participants.join("_").replace(/[^a-zA-Z0-9]/g, "")}`

    console.log("Generated roomId:", roomId)

    // Check if chat room already exists
    const chatRoom = await db.collection("chatRooms").findOne({ roomId })

    if (!chatRoom) {
      // Create new chat room
      const newChatRoom = {
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
            email: hostEmail,
            name: hostUser.name,
            image: hostUser.image,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.collection("chatRooms").insertOne(newChatRoom)
      console.log("Created new chat room:", roomId)

      return NextResponse.json({ roomId, isNew: true })
    } else {
      console.log("Found existing chat room:", roomId)
      return NextResponse.json({ roomId, isNew: false })
    }
  } catch (error) {
    console.error("Error creating/finding chat room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
