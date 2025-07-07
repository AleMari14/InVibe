import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get("eventId")

    const client = await clientPromise
    const db = client.db("invibe")

    // Get user
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    // If eventId is provided, check if that specific event is favorited
    if (eventId) {
      try {
        const eventObjectId = new ObjectId(eventId)
        const favorite = await db.collection("favorites").findOne({
          userId: user._id,
          eventId: eventObjectId,
        })
        return NextResponse.json({ isFavorited: !!favorite })
      } catch (error) {
        return new NextResponse("Invalid event ID", { status: 400 })
      }
    }

    // If no eventId, return all favorites with event details
    const favorites = await db
      .collection("favorites")
      .aggregate([
        { $match: { userId: user._id } },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
        { $replaceRoot: { newRoot: "$event" } },
      ])
      .toArray()

    return NextResponse.json(favorites)
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { eventId } = await req.json()
    if (!eventId) {
      return new NextResponse("Event ID is required", { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("invibe")

    // Get user
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    try {
      const eventObjectId = new ObjectId(eventId)

      // Check if already favorited
      const existingFavorite = await db.collection("favorites").findOne({
        userId: user._id,
        eventId: eventObjectId,
      })

      if (existingFavorite) {
        // Remove from favorites
        await db.collection("favorites").deleteOne({
          userId: user._id,
          eventId: eventObjectId,
        })
        return NextResponse.json({ isFavorited: false, message: "Rimosso dai preferiti" })
      } else {
        // Add to favorites
        await db.collection("favorites").insertOne({
          userId: user._id,
          eventId: eventObjectId,
          createdAt: new Date(),
        })
        return NextResponse.json({ isFavorited: true, message: "Aggiunto ai preferiti" })
      }
    } catch (error) {
      return new NextResponse("Invalid event ID", { status: 400 })
    }
  } catch (error) {
    console.error("Error toggling favorite:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get("eventId")
    if (!eventId) {
      return new NextResponse("Event ID is required", { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("invibe")

    // Get user
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    try {
      const eventObjectId = new ObjectId(eventId)
      await db.collection("favorites").deleteOne({
        userId: user._id,
        eventId: eventObjectId,
      })

      return NextResponse.json({ message: "Rimosso dai preferiti" })
    } catch (error) {
      return new NextResponse("Invalid event ID", { status: 400 })
    }
  } catch (error) {
    console.error("Error removing favorite:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
