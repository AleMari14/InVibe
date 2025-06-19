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

    // Conta i messaggi non letti per l'utente corrente
    const unreadCount = await db.collection("messages").countDocuments({
      senderId: { $ne: userEmail },
      readBy: { $ne: userEmail },
    })

    return NextResponse.json({ count: unreadCount })
  } catch (error) {
    console.error("Error fetching unread count:", error)
    return NextResponse.json({ error: "Errore nel recupero dei messaggi non letti" }, { status: 500 })
  }
}
