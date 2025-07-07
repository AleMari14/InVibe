import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const searchQuery = searchParams.get("search")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const radius = searchParams.get("radius") // in km
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10)
    const skip = (page - 1) * limit

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    const { db } = await connectToDatabase()

    const query: any = {
      dateStart: { $gte: new Date() },
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

    if (userId) {
      try {
        query.hostId = { $ne: new ObjectId(userId) }
      } catch (e) {
        console.warn("Invalid ObjectId for userId, skipping user event filter:", userId)
      }
    }

    if (lat && lng && radius) {
      query.locationCoords = {
        $exists: true,
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number.parseFloat(lng), Number.parseFloat(lat)],
          },
          $maxDistance: Number.parseFloat(radius) * 1000, // Convert km to meters
        },
      }
    }

    const events = await db
      .collection("events")
      .find(query)
      .sort(lat && lng ? {} : { dateStart: 1 }) // Sort by distance if location is provided, otherwise by date
      .skip(skip)
      .limit(limit)
      .toArray()

    const totalEvents = await db.collection("events").countDocuments(query)

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total: totalEvents,
        pages: Math.ceil(totalEvents / limit),
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    const { db } = await connectToDatabase()

    const user = await db.collection("users").findOne({
      _id: new ObjectId(session.user.id),
    })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    const eventData = {
      ...body,
      price: Number(body.price) || 0,
      totalSpots: Number(body.totalSpots) || 10,
      availableSpots: Number(body.totalSpots) || 10,
      dateStart: new Date(body.dateStart),
      dateEnd: body.dateEnd ? new Date(body.dateEnd) : null,
      hostId: user._id,
      host: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        verified: user.verified || false,
      },
      participants: [],
      views: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("events").insertOne(eventData)

    return NextResponse.json(
      {
        message: "Evento creato con successo",
        eventId: result.insertedId.toString(),
      },
      { status: 201 },
    )
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
