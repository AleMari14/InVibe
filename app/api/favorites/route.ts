import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    console.log("🔍 GET /api/favorites called")

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log("❌ Unauthorized favorites request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      const client = await clientPromise
      const db = client.db("invibe")
      const users = db.collection("users")
      const events = db.collection("events")

      const user = await users.findOne({ _id: new ObjectId(session.user.id) })
      if (!user || !user.favorites || user.favorites.length === 0) {
        console.log("📦 No favorites found, returning empty array")
        return NextResponse.json([])
      }

      // Ottieni gli eventi preferiti con informazioni dell'host
      const favorites = await events
        .aggregate([
          { $match: { _id: { $in: user.favorites } } },
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
                    image: { $arrayElemAt: ["$hostInfo.image", 0] },
                    verified: { $arrayElemAt: ["$hostInfo.verified", 0] },
                    rating: { $arrayElemAt: ["$hostInfo.rating", 0] },
                    reviewCount: { $arrayElemAt: ["$hostInfo.reviewCount", 0] },
                  },
                  else: {
                    name: "Host",
                    verified: false,
                    rating: 0,
                    reviewCount: 0,
                  },
                },
              },
            },
          },
          { $project: { hostInfo: 0 } },
          { $sort: { createdAt: -1 } },
        ])
        .toArray()

      // Serializza i dati
      const serializedFavorites = favorites.map((event) => ({
        ...event,
        _id: event._id.toString(),
        hostId: event.hostId?.toString(),
        dateStart: event.dateStart?.toISOString?.() || event.dateStart,
        dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd,
        createdAt: event.createdAt?.toISOString?.() || event.createdAt,
        updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt,
      }))

      console.log(`✅ Returning ${serializedFavorites.length} favorites`)
      return NextResponse.json(serializedFavorites)
    } catch (dbError) {
      console.error("💥 Database error in favorites:", dbError)
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("💥 Error in GET /api/favorites:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 POST /api/favorites called")

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log("❌ Unauthorized favorites toggle")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await request.json()
    console.log("💖 Toggling favorite for event:", eventId)

    if (!ObjectId.isValid(eventId)) {
      console.log("❌ Invalid eventId for favorites")
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    try {
      const client = await clientPromise
      const db = client.db("invibe")
      const users = db.collection("users")

      const user = await users.findOne({ _id: new ObjectId(session.user.id) })
      const favorites = user?.favorites || []
      const eventObjectId = new ObjectId(eventId)

      const isFavorite = favorites.some((fav: ObjectId) => fav.equals(eventObjectId))

      if (isFavorite) {
        await users.updateOne({ _id: new ObjectId(session.user.id) }, { $pull: { favorites: eventObjectId } })
        console.log("💔 Removed from favorites")
        return NextResponse.json({ isFavorite: false, message: "Rimosso dai preferiti" })
      } else {
        await users.updateOne({ _id: new ObjectId(session.user.id) }, { $addToSet: { favorites: eventObjectId } })
        console.log("💖 Added to favorites")
        return NextResponse.json({ isFavorite: true, message: "Aggiunto ai preferiti" })
      }
    } catch (dbError) {
      console.error("💥 Database error toggling favorite:", dbError)
      return NextResponse.json({ error: "Failed to toggle favorite" }, { status: 500 })
    }
  } catch (error) {
    console.error("💥 Error in POST /api/favorites:", error)
    return NextResponse.json({ error: "Failed to toggle favorite" }, { status: 500 })
  }
}
