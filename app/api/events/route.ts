import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { z } from "zod"

export const dynamic = "force-dynamic";

const eventSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  category: z.string().min(1),
  location: z.string().min(5),
  locationCoords: z.object({ lat: z.number(), lng: z.number() }),
  dateStart: z.string(),
  timeStart: z.string(),
  price: z.number(),
  totalSpots: z.number(),
  images: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const session = await getServerSession(authOptions)
    const userSession = session as any

    const category = searchParams.get("category")
    // RIMUOVO il filtro di ricerca testuale
    // const searchQuery = searchParams.get("search")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const radius = searchParams.get("radius") // in km
    // Nuovi filtri
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")
    const guestsMin = searchParams.get("guestsMin")
    const guestsMax = searchParams.get("guestsMax")
    const amenities = searchParams.get("amenities") // comma separated
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const query: any = {}

    if (userSession?.user?.id) {
      try {
        query.hostId = { $ne: new ObjectId(userSession.user.id) }
      } catch (error) {
        console.warn("Invalid user ID format for filtering:", userSession.user.id)
      }
    }

    if (category && category !== "all") {
      query.category = category
    }

    // RIMUOVO il filtro di ricerca testuale
    // if (searchQuery) {
    //   query.$or = [
    //     { title: { $regex: searchQuery, $options: "i" } },
    //     { description: { $regex: searchQuery, $options: "i" } },
    //     { location: { $regex: searchQuery, $options: "i" } },
    //   ]
    // }

    // Nuovi filtri avanzati
    if (priceMin || priceMax) {
      query.price = {}
      if (priceMin) query.price.$gte = Number(priceMin)
      if (priceMax) query.price.$lte = Number(priceMax)
    }
    if (guestsMin || guestsMax) {
      query.totalSpots = {}
      if (guestsMin) query.totalSpots.$gte = Number(guestsMin)
      if (guestsMax) query.totalSpots.$lte = Number(guestsMax)
    }
    if (amenities) {
      const amenitiesArr = amenities.split(",").map((a) => a.trim()).filter(Boolean)
      if (amenitiesArr.length > 0) {
        query.amenities = { $all: amenitiesArr }
      }
    }
    if (dateFrom || dateTo) {
      query.dateStart = {}
      if (dateFrom) query.dateStart.$gte = new Date(dateFrom)
      if (dateTo) query.dateStart.$lte = new Date(dateTo)
    }

    let sort: any = { createdAt: -1 }

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
        sort = {}
      }
    }

    const events = await db.collection("events").find(query).sort(sort).limit(50).toArray()

    return NextResponse.json({ events })
  } catch (error: any) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Errore nel caricamento degli eventi" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const session = await getServerSession(authOptions);
    const userSession = session as any
    if (!userSession?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }
    const body = await request.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dati non validi", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    // Conversione in GeoJSON Point
    const locationCoords = {
      type: "Point",
      coordinates: [data.locationCoords.lng, data.locationCoords.lat],
    };
    const event = {
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      locationCoords,
      dateStart: new Date(data.dateStart),
      timeStart: data.timeStart,
      price: data.price,
      totalSpots: data.totalSpots,
      availableSpots: data.totalSpots,
      images: data.images || [],
      hostId: new ObjectId(userSession.user.id),
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      rating: 0,
      reviewCount: 0,
      participants: [],
    };
    const result = await db.collection("events").insertOne(event);
    return NextResponse.json({ eventId: result.insertedId });
  } catch (error: any) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Errore nella creazione dell'evento" }, { status: 500 });
  }
}
