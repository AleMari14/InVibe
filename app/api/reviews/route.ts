import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    const checkUser = searchParams.get("checkUser") === "true"

    if (!eventId) {
      return NextResponse.json({ error: "Event ID richiesto" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("invibe")

    // Se checkUser è true, verifica se l'utente può recensire
    if (checkUser) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
      }

      const currentUser = await db.collection("users").findOne({ email: session.user.email })
      if (!currentUser) {
        return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
      }

      // Controlla se ha già recensito
      const hasReviewed = await db.collection("reviews").findOne({
        eventId: new ObjectId(eventId),
        userId: currentUser._id,
      })

      // Controlla se ha una prenotazione confermata
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

    // Recupera tutte le recensioni per l'evento
    const reviews = await db
      .collection("reviews")
      .aggregate([
        { $match: { eventId: new ObjectId(eventId) } },
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
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$reviewer" },
        { $unwind: "$host" },
        { $unwind: "$event" },
        {
          $project: {
            rating: 1,
            comment: 1,
            createdAt: 1,
            "reviewer.name": 1,
            "reviewer.image": 1,
            "host.name": 1,
            "host.image": 1,
            "event.title": 1,
            "event._id": 1,
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
    const { eventId, rating, comment } = body

    if (!eventId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Dati mancanti o non validi" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("invibe")

    // Trova l'utente corrente
    const currentUser = await db.collection("users").findOne({ email: session.user.email })
    if (!currentUser) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Trova l'evento
    const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) })
    if (!event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    // Controlla se l'utente ha già recensito questo evento
    const existingReview = await db.collection("reviews").findOne({
      eventId: new ObjectId(eventId),
      userId: currentUser._id,
    })

    if (existingReview) {
      return NextResponse.json({ error: "Hai già recensito questo evento" }, { status: 400 })
    }

    // Controlla se l'utente ha partecipato all'evento
    const booking = await db.collection("bookings").findOne({
      eventId: new ObjectId(eventId),
      userId: currentUser._id,
      status: { $in: ["confirmed", "completed"] },
    })

    if (!booking) {
      return NextResponse.json({ error: "Puoi recensire solo eventi a cui hai partecipato" }, { status: 400 })
    }

    // Crea la recensione
    const review = {
      eventId: new ObjectId(eventId),
      userId: currentUser._id,
      hostId: event.hostId,
      rating: Number.parseInt(rating),
      comment: comment || "",
      createdAt: new Date(),
    }

    const result = await db.collection("reviews").insertOne(review)

    // Aggiorna il rating dell'host
    const hostReviews = await db.collection("reviews").find({ hostId: event.hostId }).toArray()

    const avgRating = hostReviews.reduce((sum, r) => sum + r.rating, 0) / hostReviews.length

    await db.collection("users").updateOne(
      { _id: event.hostId },
      {
        $set: {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: hostReviews.length,
        },
      },
    )

    // Aggiorna il rating dell'evento
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
