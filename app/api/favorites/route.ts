import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    console.log("💖 Fetching favorites for user:", session.user.email)

    const { db } = await connectToDatabase()
    const users = db.collection("users")
    const events = db.collection("events")

    // Get user
    const user = await users.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Get favorite events with host information
    const favoriteEvents = await events
      .aggregate([
        {
          $match: {
            _id: { $in: user.favorites || [] },
            dateStart: { $gte: new Date() }, // Only future events
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "hostId",
            foreignField: "_id",
            as: "hostInfo",
          },
        },
        {
          $addFields: {
            host: {
              $cond: {
                if: { $gt: [{ $size: "$hostInfo" }, 0] },
                then: {
                  name: { $arrayElemAt: ["$hostInfo.name", 0] },
                  email: { $arrayElemAt: ["$hostInfo.email", 0] },
                  image: { $arrayElemAt: ["$hostInfo.image", 0] },
                  verified: { $arrayElemAt: ["$hostInfo.verified", 0] },
                },
                else: {
                  name: "Host sconosciuto",
                  email: "",
                  verified: false,
                },
              },
            },
          },
        },
        { $project: { hostInfo: 0 } },
        { $sort: { createdAt: -1 } },
      ])
      .toArray()

    console.log(`✅ Found ${favoriteEvents.length} favorite events`)

    // Transform for frontend
    const transformedEvents = favoriteEvents.map((event) => ({
      ...event,
      _id: event._id.toString(),
      hostId: event.hostId?.toString(),
      dateStart: event.dateStart?.toISOString?.() || event.dateStart,
      dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd,
      createdAt: event.createdAt?.toISOString?.() || event.createdAt,
      updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt,
    }))

    return NextResponse.json(transformedEvents)
  } catch (error) {
    console.error("💥 Error fetching favorites:", error)
    return NextResponse.json({ error: "Errore nel caricamento dei preferiti" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { eventId } = await request.json()
    console.log("💖 Toggle favorite for event:", eventId)

    if (!eventId) {
      return NextResponse.json({ error: "Event ID richiesto" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const users = db.collection("users")

    // Get user
    const user = await users.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    const eventObjectId = new ObjectId(eventId)
    const favorites = user.favorites || []
    const isFavorited = favorites.some((fav: ObjectId) => fav.equals(eventObjectId))

    if (isFavorited) {
      // Remove from favorites
      await users.updateOne(
        { email: session.user.email },
        {
          $pull: { favorites: eventObjectId },
          $set: { updatedAt: new Date() },
        },
      )
      console.log("💔 Removed from favorites")
      return NextResponse.json({ isFavorited: false })
    } else {
      // Add to favorites
      await users.updateOne(
        { email: session.user.email },
        {
          $addToSet: { favorites: eventObjectId },
          $set: { updatedAt: new Date() },
        },
      )
      console.log("💖 Added to favorites")
      return NextResponse.json({ isFavorited: true })
    }
  } catch (error) {
    console.error("💥 Error toggling favorite:", error)
    return NextResponse.json({ error: "Errore nell'aggiornamento dei preferiti" }, { status: 500 })
  }
}
