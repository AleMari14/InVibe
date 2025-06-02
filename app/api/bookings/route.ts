import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    console.log("🔍 GET /api/bookings called")

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log("❌ Unauthorized bookings request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      const client = await Promise.race([
        clientPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Database timeout")), 5000)),
      ])

      const db = client.db()
      const bookings = db.collection("bookings")

      const userBookings = await bookings
        .aggregate([
          { $match: { userId: new ObjectId(session.user.id) } },
          {
            $lookup: {
              from: "events",
              localField: "eventId",
              foreignField: "_id",
              as: "event",
            },
          },
          { $unwind: "$event" },
          { $sort: { createdAt: -1 } },
        ])
        .toArray()

      console.log(`✅ Returning ${userBookings.length} bookings`)
      return NextResponse.json(userBookings)
    } catch (dbError) {
      console.error("💥 Database error in bookings:", dbError)
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("💥 Error in GET /api/bookings:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 POST /api/bookings called")

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log("❌ Unauthorized booking creation")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    console.log("📋 Booking data received:", { ...data, userId: session.user.id })

    if (!ObjectId.isValid(data.eventId)) {
      console.log("❌ Invalid eventId for booking")
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    const bookingData = {
      eventId: new ObjectId(data.eventId),
      userId: new ObjectId(session.user.id),
      guests: Number.parseInt(data.guests),
      status: "confirmed" as const,
      totalPrice: Number.parseFloat(data.totalPrice),
      specialRequests: data.specialRequests,
      contactInfo: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    try {
      const client = await clientPromise
      const db = client.db()
      const bookings = db.collection("bookings")
      const events = db.collection("events")

      const result = await bookings.insertOne(bookingData)

      // Update event available spots
      await events.updateOne(
        { _id: new ObjectId(data.eventId) },
        {
          $inc: { availableSpots: -bookingData.guests },
          $addToSet: { participants: new ObjectId(session.user.id) },
        },
      )

      console.log("✅ Booking created successfully:", result.insertedId)
      return NextResponse.json({ success: true, bookingId: result.insertedId })
    } catch (dbError) {
      console.error("💥 Database error creating booking:", dbError)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }
  } catch (error) {
    console.error("💥 Error in POST /api/bookings:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}
