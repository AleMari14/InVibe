import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const user = await db.collection("users").findOne({ _id: new ObjectId(session.user.id) })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    const favoriteEventIds = user.favorites || []

    if (favoriteEventIds.length === 0) {
      return NextResponse.json({ favorites: [] })
    }

    const favorites = await db
      .collection("events")
      .find({
        _id: { $in: favoriteEventIds.map((id: string | ObjectId) => new ObjectId(id)) },
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ favorites })
  } catch (error: any) {
    console.error("💥 Error fetching favorites:", error)
    return NextResponse.json({ error: "Errore nel caricamento dei preferiti" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { eventId } = await request.json()
    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "ID evento mancante o non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const userObjectId = new ObjectId(session.user.id)
    const eventObjectId = new ObjectId(eventId)

    const user = await db.collection("users").findOne({ _id: userObjectId })
    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    const isFavorite = (user.favorites || []).some((favId: ObjectId) => favId.equals(eventObjectId))

    if (isFavorite) {
      await db.collection("users").updateOne({ _id: userObjectId }, { $pull: { favorites: eventObjectId } })
      return NextResponse.json({ success: true, isFavorite: false })
    } else {
      await db.collection("users").updateOne({ _id: userObjectId }, { $addToSet: { favorites: eventObjectId } })
      return NextResponse.json({ success: true, isFavorite: true })
    }
  } catch (error: any) {
    console.error("💥 Error updating favorites:", error)
    return NextResponse.json({ error: "Errore nell'aggiornamento dei preferiti" }, { status: 500 })
  }
}
