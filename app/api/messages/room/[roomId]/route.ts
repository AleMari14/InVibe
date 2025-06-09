import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("invibe")

    // Get current user
    const currentUser = await db.collection("users").findOne({ email: session.user.email })
    if (!currentUser) {
      console.error("Current user not found:", session.user.email)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get chat room
    const chatRoom = await db.collection("chatRooms").findOne({
      _id: new ObjectId(params.roomId),
      participants: currentUser._id.toString()
    })

    if (!chatRoom) {
      console.error("Chat room not found:", params.roomId)
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 })
    }

    // Get other user's info
    const otherUserId = chatRoom.participants.find(
      (id: string) => id !== currentUser._id.toString()
    )

    const otherUser = await db.collection("users").findOne(
      { _id: new ObjectId(otherUserId) },
      { projection: { name: 1, email: 1, image: 1 } }
    )

    if (!otherUser) {
      console.error("Other user not found:", otherUserId)
      return NextResponse.json({ error: "Other user not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...chatRoom,
      _id: chatRoom._id.toString(),
      otherUser: {
        name: otherUser.name,
        email: otherUser.email,
        image: otherUser.image
      }
    })
  } catch (error) {
    console.error("Error fetching chat room:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
