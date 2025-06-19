import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ count: 0 })
    }

    const userEmail = session.user.email
    const client = await clientPromise
    const db = client.db("invibe")

    // Trova l'utente per ottenere l'ObjectId
    const user = await db.collection("users").findOne({ email: userEmail })
    if (!user) {
      return NextResponse.json({ count: 0 })
    }

    const userId = user._id.toString()

    // Trova tutte le chat rooms dove l'utente è partecipante
    const chatRooms = await db
      .collection("chatRooms")
      .find({
        $or: [{ hostId: userId }, { guestId: userId }, { participants: { $in: [userId] } }],
      })
      .toArray()

    let totalUnreadCount = 0

    for (const room of chatRooms) {
      // Conta i messaggi nella room che:
      // 1. NON sono stati inviati dall'utente corrente (senderId !== userEmail)
      // 2. NON sono stati letti dall'utente corrente (readBy non contiene userEmail)
      const unreadInRoom = await db.collection("messages").countDocuments({
        roomId: room._id.toString(),
        senderId: { $ne: userEmail }, // Non i propri messaggi
        $or: [
          { readBy: { $exists: false } }, // Campo readBy non esiste
          { readBy: { $ne: userEmail } }, // Non letto dall'utente corrente
          { readBy: { $not: { $in: [userEmail] } } }, // Se readBy è un array, non contiene userEmail
        ],
      })

      totalUnreadCount += unreadInRoom
    }

    console.log(`Unread messages count for ${userEmail}:`, totalUnreadCount)
    return NextResponse.json({ count: totalUnreadCount })
  } catch (error) {
    console.error("Error fetching unread count:", error)
    return NextResponse.json({ count: 0 })
  }
}
