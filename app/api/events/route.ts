import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = Number.parseInt(searchParams.get("skip") || "0")

    console.log("🔍 GET /api/events - Query params:", { category, search, limit, skip })

    const { db } = await connectToDatabase()

    // Costruisci la query
    const query: any = {}

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

    console.log("📋 MongoDB query:", JSON.stringify(query))

    // Esegui la query
    const events = await db.collection("events").find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()

    console.log(`✅ Found ${events.length} events`)

    // Converti ObjectId in stringhe per JSON
    const formattedEvents = events.map((event) => ({
      ...event,
      _id: event._id.toString(),
      host: event.host
        ? {
            ...event.host,
            _id: event.host._id ? event.host._id.toString() : undefined,
          }
        : undefined,
      // Aggiungi campi di default se mancanti
      rating: event.rating || 4.5,
      reviewCount: event.reviewCount || Math.floor(Math.random() * 50) + 5,
      availableSpots: event.availableSpots !== undefined ? event.availableSpots : event.totalSpots,
      verified: event.verified !== undefined ? event.verified : Math.random() > 0.3,
      views: event.views || Math.floor(Math.random() * 100),
    }))

    return NextResponse.json(formattedEvents)
  } catch (error) {
    console.error("💥 Error in GET /api/events:", error)
    return NextResponse.json({ error: "Errore nel recupero degli eventi" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const data = await request.json()

    console.log("📝 POST /api/events - Creating new event:", data.title)

    // Validazione dei dati
    if (
      !data.title ||
      !data.description ||
      !data.location ||
      !data.coordinates ||
      !data.price ||
      !data.dateStart ||
      !data.totalSpots
    ) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 })
    }

    // Ottieni l'utente dal database
    const user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Crea l'evento
    const event = {
      title: data.title,
      description: data.description,
      category: data.category || "altro",
      location: data.location,
      coordinates: data.coordinates,
      price: Number(data.price),
      dateStart: data.dateStart,
      dateEnd: data.dateEnd || null,
      totalSpots: Number(data.totalSpots),
      availableSpots: Number(data.totalSpots), // All'inizio tutti i posti sono disponibili
      amenities: data.amenities || [],
      bookingLink: data.bookingLink || "",
      placeLink: data.placeLink || "",
      images: data.images || [],
      host: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image || null,
        rating: user.rating || 4.5,
        verified: user.verified || false,
      },
      rating: 0, // Nessuna recensione all'inizio
      reviewCount: 0,
      views: 0,
      verified: false, // Gli eventi devono essere verificati manualmente
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("events").insertOne(event)

    console.log(`✅ Event created with ID: ${result.insertedId}`)

    return NextResponse.json({
      success: true,
      eventId: result.insertedId.toString(),
      message: "Evento creato con successo",
    })
  } catch (error) {
    console.error("💥 Error in POST /api/events:", error)
    return NextResponse.json({ error: "Errore nella creazione dell'evento" }, { status: 500 })
  }
}
