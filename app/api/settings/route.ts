import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/database"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Default settings if not found
    const defaultSettings = {
      notifications: {
        events: true,
        messages: true,
        reviews: false,
        marketing: false,
        push: true,
        email: true,
      },
      privacy: {
        profileVisible: true,
        showEmail: false,
        showPhone: false,
        allowMessages: true,
      },
      language: "it",
      theme: "system",
    }

    return NextResponse.json(user.settings || defaultSettings)
  } catch (error) {
    console.error("Error fetching settings:", error)
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
    const { db } = await connectToDatabase()

    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Merge with existing settings
    const currentSettings = user.settings || {}
    const updatedSettings = {
      ...currentSettings,
      ...body,
      updatedAt: new Date(),
    }

    await db.collection("users").updateOne(
      { email: session.user.email },
      {
        $set: {
          settings: updatedSettings,
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Impostazioni aggiornate con successo",
      settings: updatedSettings,
    })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
