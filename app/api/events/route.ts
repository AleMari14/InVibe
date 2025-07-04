import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { cleanupExpiredEvents } from "@/lib/cleanup"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching events...")

    // Cleanup expired events before fetching
    await cleanupExpiredEvents()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const location = searchParams.get("location")
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")

    console.log("📋 Search params:", { category, search, location, priceMin, priceMax })

    const { db } = await connectToDatabase()
    const eventsCollection = db.collection("events")
    const usersCollection = db.collection("users")

    // Build query
    const query: any = {
      verified: true,
      availableSpots: { $gt: 0 },
      dateStart: { $gte: new Date() }, // Only future events
    }

    if (category && category !== "all") {
      query.category = category
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    if (location) {
      query.location = { $regex: location, $options: "i" }
    }

    if (priceMin || priceMax) {
      query.price = {}
      if (priceMin) query.price.$gte = Number.parseInt(priceMin)
      if (priceMax) query.price.$lte = Number.parseInt(priceMax)
    }

    console.log("🔍 Final query:", JSON.stringify(query, null, 2))

    // Fetch events with host information
    const events = await eventsCollection
      .aggregate([
        { $match: query },
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
                  rating: { $arrayElemAt: ["$hostInfo.rating", 0] },
                  verified: { $arrayElemAt: ["$hostInfo.verified", 0] },
                },
                else: {
                  name: "Host sconosciuto",
                  email: "",
                  rating: 0,
                  verified: false,
                },
              },
            },
          },
        },
        { $project: { hostInfo: 0 } },
        { $sort: { createdAt: -1 } },
        { $limit: 50 },
      ])
      .toArray()

    console.log(`✅ Found ${events.length} events`)

    // Transform events for frontend
    const transformedEvents = events.map((event) => ({
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
        : undefined,
    }))

    return NextResponse.json(transformedEvents)
  } catch (error) {
    console.error("💥 Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json()
    console.log("📝 Creating new event:", eventData.title)

    const { db } = await connectToDatabase()
    const eventsCollection = db.collection("events")

    const newEvent = {
      ...eventData,
      verified: false,
      views: 0,
      rating: 0,
      reviewCount: 0,
      participants: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await eventsCollection.insertOne(newEvent)
    console.log("✅ Event created with ID:", result.insertedId)

    return NextResponse.json(
      {
        success: true,
        eventId: result.insertedId,
        message: "Event created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("💥 Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}
