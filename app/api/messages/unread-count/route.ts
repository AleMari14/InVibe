import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const userEmail = session.user.email
    const client = await clientPromise
    const db = client.db("invibe")

    // Trova l'utente per ottenere l'ObjectId
    const user = await db.collection("users").findOne({ email: userEmail })
    if (!user) {
      return NextResponse.json({ count: 0 })
    }

    const userId = user._id

    // Conta i messaggi non letti nelle chat rooms dove l'utente è partecipante
    const chatRooms = await db
      .collection("chatRooms")
      .find({
        participants: userId,
      })
      .toArray()

    let totalUnreadCount = 0

    for (const room of chatRooms) {
      // Conta i messaggi nella room che non sono stati inviati dall'utente corrente
      // e che non sono stati letti dall'utente corrente
      const unreadInRoom = await db.collection("messages").countDocuments({
        roomId: room._id,
        senderId: { $ne: userId },
        $or: [{ readBy: { $exists: false } }, { readBy: { $ne: userId } }],
      })

      totalUnreadCount += unreadInRoom
    }

    return NextResponse.json({ count: totalUnreadCount })
  } catch (error) {
    console.error("Error fetching unread count:", error)
    return NextResponse.json({ error: "Errore nel recupero dei messaggi non letti" }, { status: 500 })
  }
}
