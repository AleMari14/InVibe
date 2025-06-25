import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/events called")

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const sort = searchParams.get("sort") || "newest"
    const location = searchParams.get("location")
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")
    const includeOwn = searchParams.get("includeOwn") === "true" // Per includere i propri eventi

    console.log("📋 Query params:", { category, search, sort, location, priceMin, priceMax, includeOwn })

    const client = await clientPromise
    const db = client.db("invibe")
    const eventsCollection = db.collection("events")

    // Get current user session
    const session = await getServerSession(authOptions)
    const currentUserEmail = session?.user?.email

    // Build query
    const query: any = {
      verified: true,
      availableSpots: { $gt: 0 },
    }

    // Exclude current user's events from home feed (unless explicitly requested)
    if (!includeOwn && currentUserEmail) {
      const usersCollection = db.collection("users")
      const currentUser = await usersCollection.findOne({ email: currentUserEmail })
      if (currentUser) {
        query.$and = [
          {
            $nor: [
              { hostId: currentUser._id },
              { hostId: currentUser._id.toString() },
              { createdBy: currentUser._id },
              { createdBy: currentUser._id.toString() },
            ],
          },
        ]
      }
    }

    if (category && category !== "all") {
      query.category = category
    }

    if (location) {
      query.location = { $regex: location, $options: "i" }
    }

    if (priceMin || priceMax) {
      query.price = {}
      if (priceMin) query.price.$gte = Number.parseInt(priceMin)
      if (priceMax) query.price.$lte = Number.parseInt(priceMax)
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    // Build sort
    let sortQuery: any = { createdAt: -1 }
    switch (sort) {
      case "price-low":
        sortQuery = { price: 1 }
        break
      case "price-high":
        sortQuery = { price: -1 }
        break
      case "rating":
        sortQuery = { rating: -1, reviewCount: -1 }
        break
      case "popular":
        sortQuery = { views: -1, rating: -1 }
        break
      default:
        sortQuery = { createdAt: -1 }
    }

    console.log("🔍 Final query:", JSON.stringify(query, null, 2))

    // Use aggregation to get events with host information
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
        { $sort: sortQuery },
        { $limit: 50 },
      ])
      .toArray()

    console.log(`✅ Found ${events.length} events`)

    // Serialize the events data
    const serializedEvents = events.map((event) => ({
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
    }))

    return NextResponse.json(serializedEvents)
  } catch (error) {
    console.error("💥 Error in GET /api/events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 POST /api/events called")

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📋 Event data received:", body)

    const client = await clientPromise
    const db = client.db("invibe")
    const eventsCollection = db.collection("events")
    const usersCollection = db.collection("users")

    // Get user info
    const user = await usersCollection.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create event with proper hostId
    const eventData = {
      ...body,
      hostId: user._id, // Use ObjectId for consistency
      createdBy: user._id, // Also set createdBy for backup
      verified: false, // Events need verification
      views: 0,
      rating: 0,
      reviewCount: 0,
      participants: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await eventsCollection.insertOne(eventData)
    console.log("✅ Event created with ID:", result.insertedId)

    return NextResponse.json({
      success: true,
      eventId: result.insertedId.toString(),
      message: "Evento creato con successo!",
    })
  } catch (error) {
    console.error("💥 Error in POST /api/events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
