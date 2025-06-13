import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/events called")

    const { searchParams } = new URL(request.url)
    const filters = {
      category: searchParams.get("category") || undefined,
      location: searchParams.get("location") || undefined,
      priceMin: searchParams.get("priceMin") ? Number.parseInt(searchParams.get("priceMin")!) : undefined,
      priceMax: searchParams.get("priceMax") ? Number.parseInt(searchParams.get("priceMax")!) : undefined,
      search: searchParams.get("search") || undefined,
    }

    console.log("🔍 Applied filters:", filters)

    try {
      const client = await clientPromise
      const db = client.db("invibe")
      const eventsCollection = db.collection("events")

      // Costruisci la query
      const query: any = { availableSpots: { $gt: 0 } }

      if (filters.category && filters.category !== "all") {
        query.category = filters.category
      }
      if (filters.location) {
        query.location = { $regex: filters.location, $options: "i" }
      }
      if (filters.priceMin || filters.priceMax) {
        query.price = {}
        if (filters.priceMin) query.price.$gte = filters.priceMin
        if (filters.priceMax) query.price.$lte = filters.priceMax
      }
      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: "i" } },
          { description: { $regex: filters.search, $options: "i" } },
          { location: { $regex: filters.search, $options: "i" } },
        ]
      }

      console.log("📋 Database query:", query)

      // Aggiungi lookup per ottenere informazioni dell'host
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
          { $limit: 20 },
        ])
        .toArray()

      console.log(`📊 Found ${events.length} events in database`)

      // Converti ObjectId in stringhe per la serializzazione
      const serializedEvents = events.map((event) => ({
        ...event,
        _id: event._id.toString(),
        hostId: event.hostId?.toString(),
        dateStart: event.dateStart?.toISOString?.() || event.dateStart,
        dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd,
        createdAt: event.createdAt?.toISOString?.() || event.createdAt,
        updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt,
      }))

      console.log(`✅ Returning ${serializedEvents.length} events`)
      return NextResponse.json(serializedEvents)
    } catch (dbError) {
      console.error("💥 Database error:", dbError)
      return NextResponse.json([], { status: 200 })
    }
  } catch (error) {
    console.error("💥 Error in GET /api/events:", error)
    return NextResponse.json([], { status: 200 })
  }
}

/**
 * Creates a new event
 * @param request NextRequest object containing event data
 * @returns JSON response with success status and event ID
 */
export async function POST(request: NextRequest) {
  try {
    console.log("📝 POST /api/events called")

    // Verify user authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log("❌ Unauthorized POST request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request data
    const data = await request.json()
    console.log("📋 Event data received:", data)

    // Required fields validation
    const requiredFields = ["title", "description", "location", "coordinates", "price", "dateStart", "totalSpots"]
    const missingFields = requiredFields.filter((field) => !data[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          fields: missingFields,
        },
        { status: 400 },
      )
    }

    // Data type validation
    if (isNaN(Number(data.price)) || isNaN(Number(data.totalSpots))) {
      return NextResponse.json(
        {
          error: "Invalid numeric values for price or total spots",
        },
        { status: 400 },
      )
    }

    // Location validation
    if (!data.coordinates?.lat || !data.coordinates?.lng) {
      return NextResponse.json(
        {
          error: "Invalid location coordinates",
        },
        { status: 400 },
      )
    }

    // Date validation
    const startDate = new Date(data.dateStart)
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid start date format",
        },
        { status: 400 },
      )
    }

    // Validate that start date is not in the past
    if (startDate < new Date()) {
      return NextResponse.json(
        {
          error: "Start date cannot be in the past",
        },
        { status: 400 },
      )
    }

    const endDate = data.dateEnd ? new Date(data.dateEnd) : null
    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid end date format",
        },
        { status: 400 },
      )
    }

    if (endDate && endDate < startDate) {
      return NextResponse.json(
        {
          error: "End date must be after start date",
        },
        { status: 400 },
      )
    }

    // Price validation
    if (Number(data.price) <= 0) {
      return NextResponse.json(
        {
          error: "Price must be greater than 0",
        },
        { status: 400 },
      )
    }

    // Total spots validation
    if (Number(data.totalSpots) < 2) {
      return NextResponse.json(
        {
          error: "Total spots must be at least 2",
        },
        { status: 400 },
      )
    }

    // Prepare event data
    const eventData = {
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category || "evento",
      location: data.location.trim(),
      coordinates: {
        lat: Number(data.coordinates.lat),
        lng: Number(data.coordinates.lng),
      },
      price: Number(data.price),
      dateStart: startDate,
      dateEnd: endDate,
      totalSpots: Number(data.totalSpots),
      availableSpots: Number(data.totalSpots),
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      images: Array.isArray(data.images) ? data.images : [],
      bookingLink: data.bookingLink?.trim() || "",
      placeLink: data.placeLink?.trim() || "", // Nuovo campo per il link del posto
      verified: false, // Events need to be verified by admin
      hostId: new ObjectId(session.user.id),
      participants: [],
      views: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    try {
      // Save event to database
      const client = await clientPromise
      const db = client.db("invibe")
      const events = db.collection("events")

      const result = await events.insertOne(eventData)
      console.log("✅ Event created successfully:", result.insertedId)

      return NextResponse.json({
        success: true,
        eventId: result.insertedId.toString(),
        message: "Evento creato con successo! In attesa di verifica.",
      })
    } catch (dbError: any) {
      console.error("Database error creating event:", dbError)
      return NextResponse.json(
        {
          error: "Errore nel salvataggio dell'evento",
          details: process.env.NODE_ENV === "development" ? dbError.message : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error in POST /api/events:", error)
    return NextResponse.json(
      {
        error: "Errore interno del server",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
