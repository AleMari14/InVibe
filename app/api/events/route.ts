import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const searchQuery = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)
    const skip = (page - 1) * limit

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    const query: any = {}

    if (category) {
      query.category = category
    }

    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
        { location: { $regex: searchQuery, $options: "i" } },
        { tags: { $regex: searchQuery, $options: "i" } },
      ]
    }

    // Escludi gli eventi dell'utente loggato
    if (userId) {
      try {
        const userObjectId = new ObjectId(userId)
        query.$nor = [{ hostId: userObjectId }, { "host._id": userObjectId }]
      } catch (e) {
        console.warn("Invalid ObjectId for userId, skipping user event filter:", userId)
      }
    }

    const { db } = await connectToDatabase()

    const events = await db.collection("events").find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()

    const totalEvents = await db.collection("events").countDocuments(query)

    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
