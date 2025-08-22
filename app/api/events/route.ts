import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("invibe")

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const location = searchParams.get("location")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const skip = (page - 1) * limit

    // Get current user session to exclude their events from home page
    const session = await getServerSession(authOptions)
    let currentUserId = null
    if (session?.user?.email) {
      const user = await db.collection("users").findOne({ email: session.user.email })
      currentUserId = user?._id
    }

    // Build query
    const query: any = {}

    // Exclude current user's events from home page
    if (currentUserId) {
      query.hostId = { $ne: new ObjectId(currentUserId) }
    }

    if (category && category !== "all") {
      query.category = category
    }

    if (location) {
      query.location = { $regex: location, $options: "i" }
    }

    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number.parseInt(minPrice)
      if (maxPrice) query.price.$lte = Number.parseInt(maxPrice)
    }

    if (dateFrom || dateTo) {
      query.dateStart = {}
      if (dateFrom) query.dateStart.$gte = new Date(dateFrom)
      if (dateTo) query.dateStart.$lte = new Date(dateTo)
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    // Only show events that haven't ended and have available spots
    query.dateStart = { ...query.dateStart, $gte: new Date() }
    query.availableSpots = { $gt: 0 }

    console.log("📊 Events query:", JSON.stringify(query, null, 2))

    // Get events with host information
    const events = await db
      .collection("events")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "users",
            localField: "hostId",
            foreignField: "_id",
            as: "host",
          },
        },
        {
          $unwind: {
            path: "$host",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            location: 1,
            coordinates: 1,
            price: 1,
            category: 1,
            dateStart: 1,
            dateEnd: 1,
            totalSpots: 1,
            availableSpots: 1,
            images: 1,
            hostId: 1,
            createdAt: 1,
            "host._id": 1,
            "host.name": 1,
            "host.email": 1,
            "host.image": 1,
            "host.rating": 1,
            "host.totalReviews": 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ])
      .toArray()

    // Get total count for pagination
    const totalEvents = await db.collection("events").countDocuments(query)

    console.log(`📊 Found ${events.length} events (total: ${totalEvents})`)

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total: totalEvents,
        pages: Math.ceil(totalEvents / limit),
      },
    })
  } catch (error) {
    console.error("💥 Error fetching events:", error)
    return NextResponse.json({ error: "Errore nel caricamento degli eventi" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("invibe")

    // Get user info
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, location, coordinates, price, category, dateStart, dateEnd, totalSpots, images } = body

    // Validation
    if (!title || !description || !location || !price || !category || !dateStart || !totalSpots) {
      return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 })
    }

    if (price <= 0) {
      return NextResponse.json({ error: "Il prezzo deve essere maggiore di 0" }, { status: 400 })
    }

    if (totalSpots <= 0) {
      return NextResponse.json({ error: "Il numero di posti deve essere maggiore di 0" }, { status: 400 })
    }

    if (new Date(dateStart) <= new Date()) {
      return NextResponse.json({ error: "La data di inizio deve essere futura" }, { status: 400 })
    }

    if (dateEnd && new Date(dateEnd) <= new Date(dateStart)) {
      return NextResponse.json({ error: "La data di fine deve essere successiva alla data di inizio" }, { status: 400 })
    }

    // Create event
    const event = {
      title,
      description,
      location,
      coordinates: coordinates || { lat: 0, lng: 0 },
      price: Number.parseInt(price),
      category,
      dateStart: new Date(dateStart),
      dateEnd: dateEnd ? new Date(dateEnd) : null,
      totalSpots: Number.parseInt(totalSpots),
      availableSpots: Number.parseInt(totalSpots),
      images: images || [],
      hostId: user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("events").insertOne(event)

    console.log("✅ Event created:", result.insertedId)

    return NextResponse.json({
      message: "Evento creato con successo!",
      eventId: result.insertedId,
    })
  } catch (error) {
    console.error("💥 Error creating event:", error)
    return NextResponse.json({ error: "Errore nella creazione dell'evento" }, { status: 500 })
  }
}
