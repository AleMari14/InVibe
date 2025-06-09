import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get chat room
    const chatRoom = await db.collection("chat_rooms").findOne({
      _id: new ObjectId(params.roomId),
      participants: session.user.email
    })

    if (!chatRoom) {
      return new NextResponse("Chat room not found", { status: 404 })
    }

    // Get other user's info
    const otherUserEmail = chatRoom.participants.find(
      (email: string) => email !== session.user.email
    )

    const otherUser = await db.collection("users").findOne(
      { email: otherUserEmail },
      { projection: { name: 1, email: 1, image: 1 } }
    )

    if (!otherUser) {
      return new NextResponse("Other user not found", { status: 404 })
    }

    return NextResponse.json({
      ...chatRoom,
      _id: chatRoom._id.toString(),
      otherUser: {
        name: otherUser.name,
        email: otherUser.email,
        image: otherUser.image || "/placeholder.svg"
      }
    })
  } catch (error) {
    console.error("Error fetching chat room:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
