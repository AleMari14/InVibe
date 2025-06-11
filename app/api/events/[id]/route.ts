import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🔍 GET /api/events/[id] called with ID:", params.id)

    if (!params.id || !ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("invibe")
    const eventsCollection = db.collection("events")

    // Use aggregation to get event with host information
    const events = await eventsCollection
      .aggregate([
        { $match: { _id: new ObjectId(params.id) } },
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
                  _id: { $arrayElemAt: ["$hostInfo._id", 0] },
                  name: { $arrayElemAt: ["$hostInfo.name", 0] },
                  email: { $arrayElemAt: ["$hostInfo.email", 0] },
                  image: { $arrayElemAt: ["$hostInfo.image", 0] },
                  verified: { $arrayElemAt: ["$hostInfo.verified", 0] },
                  rating: { $arrayElemAt: ["$hostInfo.rating", 0] },
                  reviewCount: { $arrayElemAt: ["$hostInfo.reviewCount", 0] },
                },
                else: null,
              },
            },
          },
        },
        { $project: { hostInfo: 0 } },
      ])
      .toArray()

    if (events.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const event = events[0]

    // Increment view count
    await eventsCollection.updateOne({ _id: new ObjectId(params.id) }, { $inc: { views: 1 } })

    // Serialize the event data
    const serializedEvent = {
      ...event,
      _id: event._id.toString(),
      hostId: event.hostId?.toString(),
      dateStart: event.dateStart?.toISOString?.() || event.dateStart,
      dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd,
      createdAt: event.createdAt?.toISOString?.() || event.createdAt,
      updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt,
      host: event.host
        ? {
            ...event.host,
            _id: event.host._id?.toString(),
          }
        : null,
    }

    console.log("✅ Event found:", serializedEvent.title)
    console.log("📋 Host info:", serializedEvent.host)

    return NextResponse.json(serializedEvent)
  } catch (error) {
    console.error("💥 Error in GET /api/events/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
