import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = params
    console.log("Archiving/Unarchiving chat room:", roomId)

    const { db } = await connectToDatabase()

    // Check if user is participant
    const chatRoom = await db.collection("chatRooms").findOne({ _id: roomId })
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 })
    }

    const userEmails = chatRoom.participants.map((p: any) => p.email.toLowerCase())
    if (!userEmails.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Toggle archived status
    const newArchivedStatus = !chatRoom.archived
    await db.collection("chatRooms").updateOne({ _id: roomId }, { $set: { archived: newArchivedStatus } })

    console.log("Chat room archived status updated:", roomId, newArchivedStatus)
    return NextResponse.json({ success: true, archived: newArchivedStatus })
  } catch (error) {
    console.error("Error archiving chat room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
