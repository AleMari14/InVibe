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

    const settings = {
      notifications: user.settings?.notifications || {
        events: true,
        messages: true,
        reviews: false,
        marketing: false,
        push: true,
        email: true,
      },
      privacy: user.settings?.privacy || {
        profileVisible: true,
        showEmail: false,
        showPhone: false,
        allowMessages: true,
      },
      language: user.settings?.language || "it",
      theme: user.settings?.theme || "system",
    }

    return NextResponse.json(settings)
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
    const { notifications, privacy, language, theme } = body

    const { db } = await connectToDatabase()

    const updateData: any = {
      "settings.updatedAt": new Date(),
    }

    if (notifications) updateData["settings.notifications"] = notifications
    if (privacy) updateData["settings.privacy"] = privacy
    if (language) updateData["settings.language"] = language
    if (theme) updateData["settings.theme"] = theme

    const result = await db.collection("users").updateOne({ email: session.user.email }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Impostazioni aggiornate con successo" })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
