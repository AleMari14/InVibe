import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const location = searchParams.get("location")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const page = Number.parseInt(searchParams.get("page") || "1")

    const { db } = await connectToDatabase()

    // Build filter query
    const filter: any = {}

    if (category && category !== "all") {
      filter.category = category
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ]
    }

    if (location) {
      filter.$or = [
        { "location.address": { $regex: location, $options: "i" } },
        { "location.city": { $regex: location, $options: "i" } },
        { location: { $regex: location, $options: "i" } },
      ]
    }

    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number.parseFloat(minPrice)
      if (maxPrice) filter.price.$lte = Number.parseFloat(maxPrice)
    }

    if (dateFrom || dateTo) {
      filter.dateStart = {}
      if (dateFrom) filter.dateStart.$gte = new Date(dateFrom)
      if (dateTo) filter.dateStart.$lte = new Date(dateTo)
    }

    // Get events with pagination
    const skip = (page - 1) * limit
    const events = await db.collection("events").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()

    const total = await db.collection("events").countDocuments(filter)

    // Safe date handling
    const safeDate = (dateValue: any): string => {
      if (!dateValue) return new Date().toISOString()

      try {
        if (dateValue instanceof Date) {
          return dateValue.toISOString()
        }
        if (typeof dateValue === "string") {
          const parsed = new Date(dateValue)
          if (isNaN(parsed.getTime())) {
            return new Date().toISOString()
          }
          return parsed.toISOString()
        }
        return new Date().toISOString()
      } catch (error) {
        return new Date().toISOString()
      }
    }

    // Transform events for frontend
    const transformedEvents = events.map((event) => ({
      _id: event._id.toString(),
      title: event.title || "Evento senza titolo",
      description: event.description || "",
      category: event.category || "evento",
      location: event.location || "Posizione non specificata",
      price: Number(event.price) || 0,
      rating: Number(event.rating) || 0,
      reviewCount: Number(event.reviewCount) || 0,
      images: Array.isArray(event.images) ? event.images : [],
      dateStart: safeDate(event.dateStart),
      dateEnd: event.dateEnd ? safeDate(event.dateEnd) : null,
      totalSpots: Number(event.totalSpots) || 10,
      availableSpots: Number(event.availableSpots) || Number(event.totalSpots) || 10,
      amenities: Array.isArray(event.amenities) ? event.amenities : [],
      verified: Boolean(event.verified),
      views: Number(event.views) || 0,
      createdAt: safeDate(event.createdAt),
      updatedAt: safeDate(event.updatedAt),
    }))

    return NextResponse.json({
      events: transformedEvents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("💥 Error fetching events:", error)
    return NextResponse.json(
      {
        error: "Errore nel caricamento degli eventi",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    const { db } = await connectToDatabase()

    // Find user
    const user = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    console.log("🎉 Creating event for user:", user._id.toString())

    // Create event data
    const eventData = {
      title: body.title || "Nuovo Evento",
      description: body.description || "",
      category: body.category || "evento",
      location: body.location || "",
      coordinates: body.coordinates || { lat: 0, lng: 0 },
      price: Number(body.price) || 0,
      dateStart: body.dateStart ? new Date(body.dateStart) : new Date(),
      dateEnd: body.dateEnd ? new Date(body.dateEnd) : null,
      totalSpots: Number(body.totalSpots) || 10,
      availableSpots: Number(body.availableSpots) || Number(body.totalSpots) || 10,
      images: Array.isArray(body.images) ? body.images : [],
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      requirements: Array.isArray(body.requirements) ? body.requirements : [],
      bookingLink: body.bookingLink || "",
      cancellationPolicy: body.cancellationPolicy || "",
      hostId: user._id, // This is crucial for linking the event to the user
      createdBy: user._id, // Additional field for backup
      host: {
        // Store host info for easier queries
        email: user.email,
        name: user.name || "Organizzatore",
        image: user.image || null,
      },
      verified: false,
      views: 0,
      likes: 0,
      rating: 0,
      reviewCount: 0,
      participants: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("📝 Event data to insert:", {
      title: eventData.title,
      hostId: eventData.hostId.toString(),
      createdBy: eventData.createdBy.toString(),
    })

    const result = await db.collection("events").insertOne(eventData)

    if (!result.insertedId) {
      throw new Error("Errore nella creazione dell'evento")
    }

    console.log("✅ Event created with ID:", result.insertedId.toString())

    return NextResponse.json({
      message: "Evento creato con successo",
      eventId: result.insertedId.toString(),
    })
  } catch (error: any) {
    console.error("💥 Error creating event:", error)
    return NextResponse.json(
      {
        error: "Errore nella creazione dell'evento",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
