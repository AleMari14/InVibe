import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"
import { cleanupExpiredEvents } from "@/lib/cleanup"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching events...")

    // Cleanup expired events before fetching
    await cleanupExpiredEvents()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const location = searchParams.get("location")
    const search = searchParams.get("search")
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")

    console.log("📋 Search params:", {
      category,
      location,
      search,
      priceMin,
      priceMax,
    })

    const filters: any = {}

    if (category && category !== "all") {
      filters.category = category
    }

    if (location) {
      filters.location = location
    }

    if (search) {
      filters.search = search
    }

    if (priceMin) {
      filters.priceMin = Number.parseInt(priceMin)
    }

    if (priceMax) {
      filters.priceMax = Number.parseInt(priceMax)
    }

    // Only show future events
    filters.dateStart = new Date()

    const events = await Database.getEvents(filters)
    console.log(`📊 Found ${events.length} events`)

    // Transform events for frontend
    const transformedEvents = events.map((event: any) => ({
      ...event,
      _id: event._id.toString(),
      hostId: event.hostId?.toString(),
      dateStart: event.dateStart?.toISOString?.() || event.dateStart,
      dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd,
      createdAt: event.createdAt?.toISOString?.() || event.createdAt,
      updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt,
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
    const body = await request.json()
    console.log("📝 Creating new event:", body.title)

    const result = await Database.createEvent(body)
    console.log("✅ Event created with ID:", result.insertedId)

    return NextResponse.json({
      success: true,
      eventId: result.insertedId.toString(),
      message: "Evento creato con successo",
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
