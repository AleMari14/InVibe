import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import clientPromise from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ count: 0 })
    }

    const client = await clientPromise
    const db = client.db("invibe")

    // Conta i messaggi non letti dall'utente corrente
    const unreadCount = await db.collection("messages").countDocuments({
      senderId: { $ne: session.user.email }, // Non i propri messaggi
      readBy: { $ne: session.user.email }, // Non ancora letti dall'utente
    })

    console.log(`Unread messages count for ${session.user.email}:`, unreadCount)
    return NextResponse.json({ count: unreadCount })
  } catch (error) {
    console.error("Error fetching unread count:", error)
    return NextResponse.json({ count: 0 })
  }
}
