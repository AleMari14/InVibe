import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const session = await getServerSession(authOptions)

    const category = searchParams.get("category")
    const searchQuery = searchParams.get("search")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const radius = searchParams.get("radius") // in km

    const query: any = {
      dateStart: { $gte: new Date().toISOString() },
      verified: true, // Mostra solo eventi verificati
    }

    // Escludi gli eventi dell'utente loggato
    if (session?.user?.id) {
      query.hostId = { $ne: new ObjectId(session.user.id) }
    }

    if (category) {
      query.category = category
    }

    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
        { location: { $regex: searchQuery, $options: "i" } },
      ]
    }

    if (lat && lng && radius) {
      const latitude = Number.parseFloat(lat)
      const longitude = Number.parseFloat(lng)
      const radiusInMeters = Number.parseInt(radius, 10) * 1000 // Convert km to meters

      if (!Number.isNaN(latitude) && !Number.isNaN(longitude) && !Number.isNaN(radiusInMeters)) {
        query.locationCoords = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusInMeters,
          },
        }
      }
    }

    const events = await db.collection("events").find(query).limit(20).sort({ dateStart: 1 }).toArray()

    return NextResponse.json({ events })
  } catch (error: any) {
    console.error("Error fetching events:", error)
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const body = await request.json()

    const { title, description, category, location, locationCoords, dateStart, price, totalSpots, images } = body

    // Basic validation
    if (!title || !description || !location || !dateStart) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 })
    }

    const newEvent = {
      title,
      description,
      category,
      location,
      locationCoords, // GeoJSON point
      dateStart: new Date(dateStart),
      price: Number(price) || 0,
      totalSpots: Number(totalSpots) || 1,
      availableSpots: Number(totalSpots) || 1,
      images: images || [],
      hostId: new ObjectId(session.user.id),
      participants: [],
      verified: true, // O false se vuoi un processo di approvazione
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("events").insertOne(newEvent)

    return NextResponse.json({ message: "Evento creato", eventId: result.insertedId }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Errore nella creazione dell'evento", details: error.message }, { status: 500 })
  }
}
