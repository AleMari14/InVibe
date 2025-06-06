import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

// Funzione per gestire gli errori in modo consistente
function handleError(error: unknown, message: string) {
  console.error(`${message}:`, error)
  return NextResponse.json(
    {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500 },
  )
}

// Funzione per verificare la sessione utente
async function checkSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return { authorized: false, response: NextResponse.json({ error: "Non autorizzato" }, { status: 401 }) }
  }
  return { authorized: true, session }
}

export async function GET() {
  try {
    // Verifica sessione
    const sessionCheck = await checkSession()
    if (!sessionCheck.authorized) return sessionCheck.response

    const { session } = sessionCheck

    // Connessione al database
    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Restituisci i dati dell'utente
    return NextResponse.json({
      status: "success",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        bio: user.bio,
        phone: user.phone,
        location: user.location,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    return handleError(error, "Errore nel recupero del profilo")
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verifica sessione
    const sessionCheck = await checkSession()
    if (!sessionCheck.authorized) return sessionCheck.response

    const { session } = sessionCheck

    // Estrai i dati dalla richiesta
    const body = await request.json()
    const { name, bio, phone, location, preferences } = body

    // Connessione al database
    const { db } = await connectToDatabase()

    // Prepara i dati da aggiornare
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (phone !== undefined) updateData.phone = phone
    if (location !== undefined) updateData.location = location
    if (preferences !== undefined) updateData.preferences = preferences
    updateData.updatedAt = new Date()

    // Aggiorna l'utente
    const result = await db.collection("users").updateOne({ email: session.user.email }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Recupera l'utente aggiornato
    const updatedUser = await db.collection("users").findOne({ email: session.user.email })

    // Restituisci i dati aggiornati
    return NextResponse.json({
      status: "success",
      message: "Profilo aggiornato con successo",
      user: {
        id: updatedUser?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        image: updatedUser?.image,
        bio: updatedUser?.bio,
        phone: updatedUser?.phone,
        location: updatedUser?.location,
        preferences: updatedUser?.preferences,
        updatedAt: updatedUser?.updatedAt,
      },
    })
  } catch (error) {
    return handleError(error, "Errore nell'aggiornamento del profilo")
  }
}

// Supporto per PUT (mantiene compatibilità con client esistenti)
export async function PUT(request: NextRequest) {
  return PATCH(request)
}
