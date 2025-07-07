import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ email: session.user.email.toLowerCase() })

    if (!user) {
      return NextResponse.json({ success: false, error: "Utente non trovato" }, { status: 404 })
    }

    const userObjectId = user._id

    const [eventsCreated, eventsParticipated, totalBookings, totalReviews, userEvents] = await Promise.all([
      db.collection("events").countDocuments({ hostId: userObjectId }),
      db.collection("bookings").countDocuments({ userId: userObjectId, status: "confirmed" }),
      db.collection("bookings").countDocuments({ userId: userObjectId }),
      db.collection("reviews").countDocuments({ userId: userObjectId }),
      db.collection("events").find({ hostId: userObjectId }).toArray(),
    ])

    const totalViews = userEvents.reduce((sum, event) => sum + (event.views || 0), 0)
    const totalParticipants = userEvents.reduce(
      (sum, event) => sum + ((event.totalSpots || 0) - (event.availableSpots || 0)),
      0,
    )

    const hostReviews = await db.collection("reviews").find({ hostId: userObjectId }).toArray()
    const averageRating =
      hostReviews.length > 0 ? hostReviews.reduce((sum, review) => sum + review.rating, 0) / hostReviews.length : 0

    const userProfile = {
      _id: user._id.toString(),
      name: user.name || "",
      email: user.email || "",
      image: user.image || "",
      bio: user.bio || "",
      phone: user.phone || "",
      location: user.location || "",
      verified: user.verified || false,
      rating: averageRating,
      reviewCount: hostReviews.length,
      joinDate: user.createdAt || new Date(),
      favorites: user.favorites || [],
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
    }

    const stats = {
      totalEvents: eventsCreated,
      totalBookings,
      totalViews,
      totalParticipants,
      averageRating,
      completionRate: 100,
      eventsOrganized: eventsCreated,
      eventsParticipated,
      totalReviews,
    }

    return NextResponse.json({
      success: true,
      user: userProfile,
      stats: stats,
    })
  } catch (error: any) {
    console.error("💥 Error fetching profile:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Errore nel caricamento del profilo",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    const { db } = await connectToDatabase()

    const user = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    const updateData: any = {
      updatedAt: new Date(),
    }
    if (body.name) updateData.name = body.name
    if (body.bio) updateData.bio = body.bio
    if (body.phone) updateData.phone = body.phone
    if (body.location) updateData.location = body.location
    if (body.image) updateData.image = body.image

    const result = await db.collection("users").updateOne({ _id: user._id }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Errore nell'aggiornamento" }, { status: 400 })
    }

    return NextResponse.json({ message: "Profilo aggiornato con successo" })
  } catch (error: any) {
    console.error("💥 Error updating profile:", error)
    return NextResponse.json(
      {
        error: "Errore nell'aggiornamento del profilo",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
