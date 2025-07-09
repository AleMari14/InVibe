import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { z } from "zod";

export const dynamic = "force-dynamic";

const eventSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  category: z.string().min(1),
  location: z.string().min(5),
  locationCoords: z.object({ lat: z.number(), lng: z.number() }),
  dateStart: z.string(),
  price: z.number(),
  totalSpots: z.number(),
  images: z.array(z.string()).optional(),
});

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

    const query: any = {}

    if (session?.user?.id) {
      try {
        query.hostId = { $ne: new ObjectId(session.user.id) }
      } catch (error) {
        console.warn("Invalid user ID format for filtering:", session.user.id)
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
    if (!session?.user?.id) {
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
      price: data.price,
      totalSpots: data.totalSpots,
      availableSpots: data.totalSpots,
      images: data.images || [],
      hostId: new ObjectId(session.user.id),
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
