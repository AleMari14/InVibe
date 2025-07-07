import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Database } from "@/lib/database"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    console.log("💖 Fetching user favorites...")

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    console.log("👤 User email:", session.user.email)

    // Get user from database
    const user = await Database.getUserByEmail(session.user.email)

    if (!user) {
      console.log("❌ User not found")
      return NextResponse.json([])
    }

    console.log("✅ User found:", user._id.toString())
    console.log("💖 User favorites:", user.favorites?.length || 0)

    if (!user.favorites || user.favorites.length === 0) {
      console.log("📭 No favorites found")
      return NextResponse.json([])
    }

    // Get favorite events with host information
    const client = await clientPromise
    const db = client.db("invibe")

    const favoriteEvents = await db
      .collection("events")
      .aggregate([
        {
          $match: {
            _id: { $in: user.favorites },
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
                  image: null,
                  verified: false,
                },
              },
            },
          },
        },
        {
          $project: {
            hostInfo: 0, // Remove the temporary hostInfo field
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray()

    console.log(`📊 Found ${favoriteEvents.length} favorite events`)

    // Transform events for frontend
    const transformedEvents = favoriteEvents.map((event: any) => ({
      ...event,
      _id: event._id.toString(),
      hostId: event.hostId?.toString(),
      dateStart: event.dateStart?.toISOString?.() || event.dateStart,
      dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd,
      createdAt: event.createdAt?.toISOString?.() || event.createdAt,
      updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt,
    }))

    console.log("✅ Returning transformed favorite events")

    return NextResponse.json(transformedEvents)
  } catch (error: any) {
    console.error("💥 Error fetching favorites:", error)

    return NextResponse.json(
      {
        error: "Errore nel caricamento dei preferiti",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("💖 Toggle favorite request...")

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: "Event ID richiesto" }, { status: 400 })
    }

    console.log("👤 User email:", session.user.email)
    console.log("🎉 Event ID:", eventId)

    // Get user from database
    const user = await Database.getUserByEmail(session.user.email)

    if (!user) {
      console.log("❌ User not found")
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    console.log("✅ User found:", user._id.toString())

    // Toggle favorite
    const isFavorited = await Database.toggleFavorite(user._id.toString(), eventId)

    console.log("💖 Favorite toggled:", isFavorited ? "Added" : "Removed")

    return NextResponse.json({
      success: true,
      isFavorited,
      message: isFavorited ? "Aggiunto ai preferiti" : "Rimosso dai preferiti",
    })
  } catch (error: any) {
    console.error("💥 Error toggling favorite:", error)

    return NextResponse.json(
      {
        error: "Errore nell'aggiornamento dei preferiti",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
