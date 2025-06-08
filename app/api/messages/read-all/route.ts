import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { connectToDatabase } from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Update all unread messages for the user
    await db.collection("messages").updateMany(
      {
        senderId: { $ne: session.user.email },
        readBy: { $ne: session.user.email }
      },
      {
        $addToSet: { readBy: session.user.email }
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking messages as read:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
