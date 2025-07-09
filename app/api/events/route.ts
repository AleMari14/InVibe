import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
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
