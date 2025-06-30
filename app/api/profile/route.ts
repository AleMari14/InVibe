import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/database"

export async function GET() {
  try {
    console.log("🔍 GET /api/profile called")

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log("❌ Unauthorized profile request")
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get user profile
    let user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      console.log("👤 User not found, creating profile...")
      // Create user profile if it doesn't exist
      const newUser = {
        email: session.user.email,
        name: session.user.name || "",
        image: session.user.image || "",
        bio: "",
        location: "",
        phone: "",
        dateOfBirth: null,
        interests: [],
        rating: 0,
        reviewCount: 0,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await db.collection("users").insertOne(newUser)
      user = { ...newUser, _id: result.insertedId }
      console.log("✅ User profile created:", user._id)
    }

    // Get user statistics
    const [eventsCreated, bookingsMade, reviewsReceived, reviewsGiven] = await Promise.all([
      db.collection("events").countDocuments({ hostEmail: session.user.email }),
      db.collection("bookings").countDocuments({ userId: user._id }),
      db.collection("reviews").countDocuments({ hostId: user._id }),
      db.collection("reviews").countDocuments({ userId: user._id }),
    ])

    // Get recent activities
    const recentBookings = await db
      .collection("bookings")
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
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 1,
            status: 1,
            createdAt: 1,
            "event.title": 1,
            "event._id": 1,
          },
        },
      ])
      .toArray()

    const profile = {
      _id: user._id,
      email: user.email,
      name: user.name || "",
      image: user.image || "",
      bio: user.bio || "",
      location: user.location || "",
      phone: user.phone || "",
      dateOfBirth: user.dateOfBirth,
      interests: user.interests || [],
      rating: user.rating || 0,
      reviewCount: user.reviewCount || 0,
      verified: user.verified || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        eventsCreated: eventsCreated || 0,
        bookingsMade: bookingsMade || 0,
        reviewsReceived: reviewsReceived || 0,
        reviewsGiven: reviewsGiven || 0,
      },
      recentBookings: recentBookings || [],
    }

    console.log("✅ Profile loaded successfully")
    return NextResponse.json(profile)
  } catch (error) {
    console.error("💥 Error in GET /api/profile:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    console.log("📝 PUT /api/profile called")

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log("❌ Unauthorized profile update")
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const data = await request.json()
    console.log("📋 Profile update data:", data)

    const { db } = await connectToDatabase()

    const updateData = {
      name: data.name || "",
      bio: data.bio || "",
      location: data.location || "",
      phone: data.phone || "",
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      interests: Array.isArray(data.interests) ? data.interests : [],
      updatedAt: new Date(),
    }

    // If image is provided, update it
    if (data.image) {
      updateData.image = data.image
    }

    const result = await db
      .collection("users")
      .updateOne({ email: session.user.email }, { $set: updateData }, { upsert: true })

    if (result.matchedCount === 0 && result.upsertedCount === 0) {
      console.log("❌ Failed to update profile")
      return NextResponse.json({ error: "Errore nell'aggiornamento del profilo" }, { status: 500 })
    }

    console.log("✅ Profile updated successfully")
    return NextResponse.json({ success: true, message: "Profilo aggiornato con successo" })
  } catch (error) {
    console.error("💥 Error in PUT /api/profile:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
