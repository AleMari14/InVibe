import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get user profile
    const user = await db.collection("users").findOne({
      email: session.user.email,
    })

    if (!user) {
      // Create a basic user profile if it doesn't exist
      const newUser = {
        name: session.user.name || "Utente",
        email: session.user.email,
        image: session.user.image || "",
        bio: "",
        phone: "",
        location: "",
        verified: false,
        rating: 0,
        reviewCount: 0,
        joinDate: new Date().toISOString(),
        favorites: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await db.collection("users").insertOne(newUser)

      const createdUser = {
        ...newUser,
        _id: result.insertedId.toString(),
      }

      return NextResponse.json({
        user: createdUser,
        stats: {
          totalEvents: 0,
          totalBookings: 0,
          totalViews: 0,
          totalParticipants: 0,
          averageRating: 0,
          completionRate: 0,
          eventsOrganized: 0,
          eventsParticipated: 0,
          totalReviews: 0,
        },
      })
    }

    // Get user statistics
    const userId = user._id.toString()

    // Count events created by user
    const eventsCreated = await db.collection("events").countDocuments({
      "host.email": session.user.email,
    })

    // Count bookings made by user
    const bookingsMade = await db.collection("bookings").countDocuments({
      userEmail: session.user.email,
    })

    // Count total views for user's events
    const userEvents = await db
      .collection("events")
      .find({
        "host.email": session.user.email,
      })
      .toArray()

    const totalViews = userEvents.reduce((sum, event) => sum + (event.views || 0), 0)
    const totalParticipants = userEvents.reduce(
      (sum, event) => sum + ((event.totalSpots || 0) - (event.availableSpots || 0)),
      0,
    )

    // Count reviews received
    const reviewsReceived = await db.collection("reviews").countDocuments({
      hostId: userId,
    })

    // Count reviews given
    const reviewsGiven = await db.collection("reviews").countDocuments({
      reviewerId: userId,
    })

    // Calculate average rating
    const reviewsForRating = await db
      .collection("reviews")
      .find({
        hostId: userId,
      })
      .toArray()

    const averageRating =
      reviewsForRating.length > 0
        ? reviewsForRating.reduce((sum, review) => sum + review.rating, 0) / reviewsForRating.length
        : 0

    // Count events participated in
    const eventsParticipated = await db.collection("events").countDocuments({
      participants: session.user.email,
    })

    const stats = {
      totalEvents: eventsCreated,
      totalBookings: bookingsMade,
      totalViews,
      totalParticipants,
      averageRating: Math.round(averageRating * 10) / 10,
      completionRate: 100, // Default completion rate
      eventsOrganized: eventsCreated,
      eventsParticipated,
      totalReviews: reviewsReceived + reviewsGiven,
    }

    // Update user rating if needed
    if (user.rating !== averageRating || user.reviewCount !== reviewsReceived) {
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            rating: averageRating,
            reviewCount: reviewsReceived,
            updatedAt: new Date(),
          },
        },
      )
    }

    // Format user data
    const userProfile = {
      _id: user._id.toString(),
      name: user.name || session.user.name || "Utente",
      email: user.email,
      image: user.image || session.user.image || "",
      bio: user.bio || "",
      phone: user.phone || "",
      location: user.location || "",
      verified: user.verified || false,
      rating: averageRating,
      reviewCount: reviewsReceived,
      joinDate: user.joinDate || user.createdAt?.toISOString() || new Date().toISOString(),
      favorites: user.favorites || [],
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    }

    return NextResponse.json({
      user: userProfile,
      stats,
    })
  } catch (error) {
    console.error("Error in profile API:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    const { name, bio, phone, location, image } = body

    const { db } = await connectToDatabase()

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (phone !== undefined) updateData.phone = phone
    if (location !== undefined) updateData.location = location
    if (image !== undefined) updateData.image = image

    const result = await db
      .collection("users")
      .updateOne({ email: session.user.email }, { $set: updateData }, { upsert: true })

    if (result.matchedCount === 0 && result.upsertedCount === 0) {
      return NextResponse.json({ error: "Errore durante l'aggiornamento del profilo" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Profilo aggiornato con successo",
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
