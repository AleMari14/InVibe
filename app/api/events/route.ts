import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const location = searchParams.get("location")
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = Number.parseInt(searchParams.get("skip") || "0")

    const client = await clientPromise
    const db = client.db("invibe")

    // Build query - EXCLUDE EXPIRED EVENTS
    const query: any = {
      dateStart: { $gte: new Date() }, // Only show events that haven't started yet
    }

    if (category && category !== "all") {
      query.category = category
    }

    if (location) {
      query.location = { $regex: location, $options: "i" }
    }

    if (priceMin || priceMax) {
      query.price = {}
      if (priceMin) query.price.$gte = Number.parseFloat(priceMin)
      if (priceMax) query.price.$lte = Number.parseFloat(priceMax)
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    console.log("🔍 Events query:", JSON.stringify(query, null, 2))

    const events = await db.collection("events").find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()

    const totalCount = await db.collection("events").countDocuments(query)

    // Transform events for response
    const transformedEvents = events.map((event) => ({
      ...event,
      _id: event._id.toString(),
      hostId: event.hostId?.toString(),
      participants: event.participants?.map((p: ObjectId) => p.toString()) || [],
      dateStart: event.dateStart?.toISOString(),
      dateEnd: event.dateEnd?.toISOString(),
      createdAt: event.createdAt?.toISOString(),
      updatedAt: event.updatedAt?.toISOString(),
    }))

    return NextResponse.json({
      events: transformedEvents,
      totalCount,
      hasMore: skip + events.length < totalCount,
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      location,
      coordinates,
      price,
      dateStart,
      dateEnd,
      totalSpots,
      amenities,
      images,
      bookingLink,
    } = body

    // Validation
    if (!title || !description || !category || !location || !dateStart || !totalSpots) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if event date is in the future
    const eventDate = new Date(dateStart)
    const now = new Date()
    if (eventDate <= now) {
      return NextResponse.json({ error: "Event date must be in the future" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("invibe")

    // Get user info
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const newEvent = {
      title,
      description,
      category,
      location,
      coordinates: coordinates || null,
      price: Number.parseFloat(price) || 0,
      dateStart: new Date(dateStart),
      dateEnd: dateEnd ? new Date(dateEnd) : null,
      totalSpots: Number.parseInt(totalSpots),
      availableSpots: Number.parseInt(totalSpots),
      amenities: amenities || [],
      images: images || [],
      bookingLink: bookingLink || "",
      verified: false,
      hostId: new ObjectId(user._id),
      participants: [],
      views: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("events").insertOne(newEvent)

    return NextResponse.json({
      success: true,
      eventId: result.insertedId.toString(),
      message: "Event created successfully",
    })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
