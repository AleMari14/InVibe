import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Forza la route ad essere dinamica
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 GET /api/user/events called")

    // Verify user authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log("❌ Unauthorized request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("invibe")
    const eventsCollection = db.collection("events")

    console.log("📋 Fetching events for user:", session.user.id)

    // Get events created by the current user
    const events = await eventsCollection
      .aggregate([
        { $match: { hostId: new ObjectId(session.user.id) } },
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
                  rating: { $arrayElemAt: ["$hostInfo.rating", 0] },
                  reviewCount: { $arrayElemAt: ["$hostInfo.reviewCount", 0] },
                },
                else: {
                  name: session.user.name || "Host",
                  email: session.user.email,
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

    console.log(`📊 Found ${events.length} events for user`)

    // Serialize the events
    const serializedEvents = events.map((event) => ({
      ...event,
      _id: event._id.toString(),
      hostId: event.hostId?.toString(),
      dateStart: event.dateStart?.toISOString?.() || event.dateStart,
      dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd,
      createdAt: event.createdAt?.toISOString?.() || event.createdAt,
      updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt,
    }))

    console.log(`✅ Returning ${serializedEvents.length} user events`)
    return NextResponse.json(serializedEvents)
  } catch (error) {
    console.error("💥 Error in GET /api/user/events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
