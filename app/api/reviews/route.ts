import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/database"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // "received" or "given"
    const userId = searchParams.get("userId")
    const eventId = searchParams.get("eventId")
    const checkUser = searchParams.get("checkUser") === "true"

    const { db } = await connectToDatabase()

    // Get current user
    const currentUser = await db.collection("users").findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Check if user can review specific event
    if (checkUser && eventId) {
      const hasReviewed = await db.collection("reviews").findOne({
        eventId: new ObjectId(eventId),
        userId: currentUser._id,
      })

      const hasBooking = await db.collection("bookings").findOne({
        eventId: new ObjectId(eventId),
        userId: currentUser._id,
        status: { $in: ["confirmed", "completed"] },
      })

      return NextResponse.json({
        hasReviewed: !!hasReviewed,
        canReview: !!hasBooking,
      })
    }

    const targetUserId = userId || currentUser._id.toString()

    let query: any = {}

    if (type === "received") {
      // Reviews received by the user (as host)
      query = { hostId: new ObjectId(targetUserId) }
    } else if (type === "given") {
      // Reviews given by the user
      query = { userId: new ObjectId(targetUserId) }
    } else {
      // All reviews related to the user
      query = {
        $or: [{ hostId: new ObjectId(targetUserId) }, { userId: new ObjectId(targetUserId) }],
      }
    }

    const reviews = await db
      .collection("reviews")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "reviewer",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "hostId",
            foreignField: "_id",
            as: "host",
          },
        },
        { $unwind: "$event" },
        { $unwind: "$reviewer" },
        { $unwind: "$host" },
        {
          $project: {
            rating: 1,
            comment: 1,
            createdAt: 1,
            "event.title": 1,
            "event._id": 1,
            "reviewer.name": 1,
            "reviewer.image": 1,
            "host.name": 1,
            "host.image": 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .toArray()

    return NextResponse.json(reviews)
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    const { eventId, hostId, rating, comment } = body

    if (!eventId || !hostId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Dati mancanti o non validi" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get current user
    const currentUser = await db.collection("users").findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Check if user has already reviewed this event
    const existingReview = await db.collection("reviews").findOne({
      eventId: new ObjectId(eventId),
      userId: currentUser._id,
    })

    if (existingReview) {
      return NextResponse.json({ error: "Hai già recensito questo evento" }, { status: 400 })
    }

    // Check if user participated in the event
    const booking = await db.collection("bookings").findOne({
      eventId: new ObjectId(eventId),
      userId: currentUser._id,
      status: { $in: ["confirmed", "completed"] },
    })

    if (!booking) {
      return NextResponse.json({ error: "Puoi recensire solo eventi a cui hai partecipato" }, { status: 400 })
    }

    // Create review
    const review = {
      eventId: new ObjectId(eventId),
      userId: currentUser._id,
      hostId: new ObjectId(hostId),
      rating: Number.parseInt(rating),
      comment: comment || "",
      createdAt: new Date(),
    }

    const result = await db.collection("reviews").insertOne(review)

    // Update host rating
    const hostReviews = await db
      .collection("reviews")
      .find({ hostId: new ObjectId(hostId) })
      .toArray()

    const avgRating = hostReviews.reduce((sum, r) => sum + r.rating, 0) / hostReviews.length

    await db.collection("users").updateOne(
      { _id: new ObjectId(hostId) },
      {
        $set: {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: hostReviews.length,
        },
      },
    )

    // Update event rating
    const eventReviews = await db
      .collection("reviews")
      .find({ eventId: new ObjectId(eventId) })
      .toArray()

    const eventAvgRating = eventReviews.reduce((sum, r) => sum + r.rating, 0) / eventReviews.length

    await db.collection("events").updateOne(
      { _id: new ObjectId(eventId) },
      {
        $set: {
          rating: Math.round(eventAvgRating * 10) / 10,
          reviewCount: eventReviews.length,
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Recensione aggiunta con successo",
      reviewId: result.insertedId,
    })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
