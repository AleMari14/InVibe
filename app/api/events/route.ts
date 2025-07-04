import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const location = searchParams.get("location")
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")
    const search = searchParams.get("search")

    const { db } = await connectToDatabase()

    // Build query
    const query: any = {
      dateStart: { $gte: new Date() }, // Only future events
    }

    if (category && category !== "all") {
      query.category = category
    }

    if (location) {
      query.location = { $regex: location, $options: "i" }
    }

    if (priceMin || priceMax) {
      query.price = {}
      if (priceMin) query.price.$gte = Number(priceMin)
      if (priceMax) query.price.$lte = Number(priceMax)
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    console.log("🔍 Events query:", JSON.stringify(query, null, 2))

    const events = await db.collection("events").find(query).sort({ createdAt: -1 }).toArray()

    console.log(`📊 Found ${events.length} events`)

    // Transform events for frontend
    const transformedEvents = events.map((event) => ({
      _id: event._id.toString(),
      title: event.title || "Evento senza titolo",
      description: event.description || "",
      location: event.location || "",
      price: Number(event.price) || 0,
      rating: Number(event.rating) || 0,
      reviewCount: Number(event.reviewCount) || 0,
      images: Array.isArray(event.images) ? event.images : [],
      category: event.category || "evento",
      dateStart: event.dateStart ? new Date(event.dateStart).toISOString() : new Date().toISOString(),
      dateEnd: event.dateEnd ? new Date(event.dateEnd).toISOString() : null,
      totalSpots: Number(event.totalSpots) || 10,
      availableSpots: Number(event.availableSpots) || Number(event.totalSpots) || 10,
      amenities: Array.isArray(event.amenities) ? event.amenities : [],
      bookingLink: event.bookingLink || "",
      verified: Boolean(event.verified),
      views: Number(event.views) || 0,
      hostId: event.hostId?.toString(),
      participants: Array.isArray(event.participants) ? event.participants.map((p: any) => p.toString()) : [],
      coordinates: event.coordinates || { lat: 0, lng: 0 },
      createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : new Date().toISOString(),
    }))

    return NextResponse.json(transformedEvents)
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
    console.log("📝 Creating event with data:", body)

    const { db } = await connectToDatabase()

    // Find user
    const user = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Validate required fields
    if (!body.title || !body.description || !body.location || !body.dateStart) {
      return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 })
    }

    // Create event object
    const eventData = {
      title: body.title,
      description: body.description,
      category: body.category || "evento",
      location: body.location,
      coordinates: body.coordinates || { lat: 0, lng: 0 },
      price: Number(body.price) || 0,
      dateStart: new Date(body.dateStart),
      dateEnd: body.dateEnd ? new Date(body.dateEnd) : null,
      totalSpots: Number(body.totalSpots) || 10,
      availableSpots: Number(body.totalSpots) || 10,
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      images: Array.isArray(body.images) ? body.images : [],
      bookingLink: body.bookingLink || "",
      verified: false,
      hostId: user._id,
      participants: [],
      views: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("💾 Saving event:", eventData)

    const result = await db.collection("events").insertOne(eventData)

    console.log("✅ Event created with ID:", result.insertedId)

    return NextResponse.json({
      message: "Evento creato con successo!",
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
