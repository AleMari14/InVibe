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
    }

    if (session?.user?.id) {
      try {
        query.hostId = { $ne: new ObjectId(session.user.id) }
      } catch (error) {
        console.warn("Invalid user ID format, cannot filter user's own events:", session.user.id)
      }
    }

    if (category && category !== "all") {
      query.category = category
    }

    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
        { location: { $regex: searchQuery, $options: "i" } },
      ]
    }

    let sort: any = { dateStart: 1 }

    if (lat && lng && radius) {
      const latitude = Number.parseFloat(lat)
      const longitude = Number.parseFloat(lng)
      const radiusInMeters = Number.parseInt(radius, 10) * 1000

      if (!Number.isNaN(latitude) && !Number.isNaN(longitude) && radiusInMeters > 0) {
        query.locationCoords = {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusInMeters,
          },
        }
        // MongoDB automatically sorts by distance when using $nearSphere
        sort = {}
      }
    }

    const events = await db.collection("events").find(query).sort(sort).limit(20).toArray()

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

    if (!title || !description || !location || !dateStart) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 })
    }

    const user = await db.collection("users").findOne({ _id: new ObjectId(session.user.id) })
    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    const newEvent = {
      title,
      description,
      category,
      location,
      locationCoords,
      dateStart: new Date(dateStart),
      price: Number(price) || 0,
      totalSpots: Number(totalSpots) || 1,
      availableSpots: Number(totalSpots) || 1,
      images: images || [],
      hostId: user._id,
      host: {
        _id: user._id,
        name: user.name,
        image: user.image,
      },
      participants: [],
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("events").insertOne(newEvent)

    return NextResponse.json({ message: "Evento creato", eventId: result.insertedId.toString() }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Errore nella creazione dell'evento", details: error.message }, { status: 500 })
  }
}
