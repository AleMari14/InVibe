import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const dynamic = "force-dynamic"

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

    const client = await clientPromise
    const db = client.db("invibe")
    const eventsCollection = db.collection("events")

    // Costruisci la query
    const query: any = {}

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

    console.log("📋 Database query:", JSON.stringify(query))

    // Esegui la query con lookup per l'host
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
                else: {
                  name: "Host Anonimo",
                  verified: false,
                  rating: 4.5,
                  reviewCount: 0,
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

    console.log(`📊 Found ${events.length} events in database`)

    // Converti ObjectId in stringhe per la serializzazione
    const serializedEvents = events.map((event) => ({
      ...event,
      _id: event._id.toString(),
      hostId: event.hostId?.toString(),
      dateStart: event.dateStart instanceof Date ? event.dateStart.toISOString() : event.dateStart,
      dateEnd: event.dateEnd instanceof Date ? event.dateEnd.toISOString() : event.dateEnd,
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
      updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt,
      // Aggiungi campi di default se mancanti
      rating: event.rating || 4.5,
      reviewCount: event.reviewCount || Math.floor(Math.random() * 50) + 5,
      availableSpots: event.availableSpots !== undefined ? event.availableSpots : event.totalSpots,
      verified: event.verified !== undefined ? event.verified : true,
      views: event.views || Math.floor(Math.random() * 100) + 10,
      images: event.images && event.images.length > 0 ? event.images : ["/placeholder.svg?height=400&width=600"],
    }))

    console.log(`✅ Returning ${serializedEvents.length} events`)
    return NextResponse.json(serializedEvents)
  } catch (error) {
    console.error("💥 Error in GET /api/events:", error)
    return NextResponse.json({ error: "Errore nel recupero degli eventi" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 POST /api/events - Starting event creation")

    // Verifica autenticazione
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log("❌ Unauthorized POST request")
      return NextResponse.json({ error: "Non autorizzato", success: false }, { status: 401 })
    }

    console.log("✅ User authenticated:", session.user.email)

    const data = await request.json()
    console.log("📋 Event data received:", {
      title: data.title,
      category: data.category,
      location: data.location,
      coordinates: data.coordinates,
      price: data.price,
      totalSpots: data.totalSpots,
      dateStart: data.dateStart,
      amenities: data.amenities,
    })

    // Validazione dei dati richiesti
    const requiredFields = ["title", "description", "location", "coordinates", "price", "dateStart", "totalSpots"]
    const missingFields = requiredFields.filter((field) => {
      if (field === "coordinates") {
        return !data[field] || !data[field].lat || !data[field].lng
      }
      return !data[field]
    })

    if (missingFields.length > 0) {
      console.log("❌ Missing required fields:", missingFields)
      return NextResponse.json(
        {
          error: `Campi obbligatori mancanti: ${missingFields.join(", ")}`,
          fields: missingFields,
          success: false,
        },
        { status: 400 },
      )
    }

    // Validazione tipi di dati
    const price = Number(data.price)
    if (isNaN(price) || price <= 0) {
      console.log("❌ Invalid price:", data.price)
      return NextResponse.json({ error: "Prezzo non valido", success: false }, { status: 400 })
    }

    const totalSpots = Number(data.totalSpots)
    if (isNaN(totalSpots) || totalSpots < 2) {
      console.log("❌ Invalid total spots:", data.totalSpots)
      return NextResponse.json({ error: "Numero di posti non valido (minimo 2)", success: false }, { status: 400 })
    }

    // Validazione coordinate
    const lat = Number(data.coordinates.lat)
    const lng = Number(data.coordinates.lng)
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.log("❌ Invalid coordinates:", data.coordinates)
      return NextResponse.json({ error: "Coordinate non valide", success: false }, { status: 400 })
    }

    // Validazione date
    const startDate = new Date(data.dateStart)
    if (isNaN(startDate.getTime())) {
      console.log("❌ Invalid start date:", data.dateStart)
      return NextResponse.json({ error: "Data di inizio non valida", success: false }, { status: 400 })
    }

    let endDate = null
    if (data.dateEnd) {
      endDate = new Date(data.dateEnd)
      if (isNaN(endDate.getTime()) || endDate < startDate) {
        console.log("❌ Invalid end date:", data.dateEnd)
        return NextResponse.json({ error: "Data di fine non valida", success: false }, { status: 400 })
      }
    }

    // Connessione al database
    console.log("🔌 Connecting to MongoDB...")
    const client = await clientPromise
    const db = client.db("invibe")
    console.log("✅ Connected to MongoDB")

    // Trova l'utente nel database
    console.log("👤 Looking for user:", session.user.email)
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      console.log("❌ User not found in database")
      return NextResponse.json({ error: "Utente non trovato nel database", success: false }, { status: 404 })
    }
    console.log("✅ User found:", user.name, user._id)

    // Crea l'evento con tutti i dati
    const event = {
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category || "evento",
      location: data.location.trim(),
      coordinates: {
        lat: lat,
        lng: lng,
      },
      price: price,
      dateStart: startDate,
      dateEnd: endDate,
      totalSpots: totalSpots,
      availableSpots: totalSpots,
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      bookingLink: data.bookingLink?.trim() || "",
      placeLink: data.placeLink?.trim() || "",
      images:
        Array.isArray(data.images) && data.images.length > 0
          ? data.images
          : ["/placeholder.svg?height=400&width=600&query=" + encodeURIComponent(data.title || "event")],
      hostId: new ObjectId(user._id),
      participants: [],
      views: 0,
      rating: 0,
      reviewCount: 0,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("💾 Inserting event into database...")
    console.log("Event object:", JSON.stringify(event, null, 2))

    const result = await db.collection("events").insertOne(event)
    console.log(`✅ Event inserted successfully with ID: ${result.insertedId}`)

    // Verifica che l'evento sia stato inserito
    const insertedEvent = await db.collection("events").findOne({ _id: result.insertedId })
    if (!insertedEvent) {
      console.log("❌ Event not found after insertion")
      return NextResponse.json({ error: "Errore nella verifica dell'inserimento", success: false }, { status: 500 })
    }

    console.log("✅ Event verified in database")

    return NextResponse.json({
      success: true,
      eventId: result.insertedId.toString(),
      message: "Evento creato con successo!",
      event: {
        _id: insertedEvent._id.toString(),
        title: insertedEvent.title,
        category: insertedEvent.category,
        location: insertedEvent.location,
      },
    })
  } catch (error: any) {
    console.error("💥 Error in POST /api/events:", error)
    console.error("Stack trace:", error.stack)
    return NextResponse.json(
      {
        error: "Errore interno del server durante la creazione dell'evento",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        success: false,
      },
      { status: 500 },
    )
  }
}
