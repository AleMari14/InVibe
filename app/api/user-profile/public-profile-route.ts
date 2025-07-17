// Route pubblica per ottenere il profilo di un utente dato l'id
// GET /api/user-profile?id=<userId>

import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID utente non valido" }, { status: 400 })
  }

  try {
    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ _id: new ObjectId(id) })
    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Calcola rating e reviewCount come nella /api/profile
    const hostReviews = await db.collection("reviews").find({ hostId: user._id }).toArray()
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

    return NextResponse.json({ user: userProfile })
  } catch (error: any) {
    return NextResponse.json({ error: "Errore nel caricamento del profilo", details: error.message }, { status: 500 })
  }
}
