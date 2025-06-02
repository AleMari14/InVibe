import { type NextRequest, NextResponse } from "next/server"
import { createUser, getUserByEmail, testDatabaseConnection } from "@/lib/services/userService"

export async function POST(request: NextRequest) {
  try {
    console.log("📝 Registration API called")

    // Test della connessione al database prima di procedere
    console.log("🧪 Testing database connection...")
    const dbTest = await testDatabaseConnection()
    if (!dbTest.success) {
      console.error("❌ Database connection failed:", dbTest.error)
      return NextResponse.json(
        {
          error: "Errore di connessione al database",
          success: false,
          details: process.env.NODE_ENV === "development" ? dbTest.error : undefined,
        },
        { status: 503 },
      )
    }
    console.log("✅ Database connection test passed")

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("✅ Request body parsed:", {
        name: body.name,
        email: body.email,
        password: body.password ? "***" : "missing",
      })
    } catch (parseError) {
      console.error("💥 Error parsing request body:", parseError)
      return NextResponse.json({ error: "Formato richiesta non valido", success: false }, { status: 400 })
    }

    const { name, email, password } = body

    // Validazione input
    if (!name || !email || !password) {
      console.log("❌ Missing required fields:", {
        name: !!name,
        email: !!email,
        password: !!password,
      })
      return NextResponse.json({ error: "Tutti i campi sono obbligatori", success: false }, { status: 400 })
    }

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      console.log("❌ Invalid field types")
      return NextResponse.json({ error: "Formato dati non valido", success: false }, { status: 400 })
    }

    const trimmedName = name.trim()
    const trimmedEmail = email.toLowerCase().trim()

    // Validazioni specifiche
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return NextResponse.json({ error: "Il nome deve essere tra 2 e 50 caratteri", success: false }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La password deve essere di almeno 6 caratteri", success: false },
        { status: 400 },
      )
    }

    // Validazione email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ error: "Formato email non valido", success: false }, { status: 400 })
    }

    console.log("🔍 Checking if user exists...")

    // Verifica se l'utente esiste già
    try {
      const existingUser = await getUserByEmail(trimmedEmail)
      if (existingUser) {
        console.log("⚠️ User already exists")
        return NextResponse.json({ error: "Un utente con questa email esiste già", success: false }, { status: 409 })
      }
      console.log("✅ User does not exist, proceeding with creation")
    } catch (error) {
      console.error("💥 Error checking existing user:", error)
      return NextResponse.json(
        {
          error: "Errore durante la verifica dell'utente",
          success: false,
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 },
      )
    }

    console.log("💾 Creating new user...")

    // Crea il nuovo utente
    try {
      const result = await createUser({
        name: trimmedName,
        email: trimmedEmail,
        password: password,
        provider: "credentials",
      })

      console.log("🎉 User created successfully:", result.insertedId)

      return NextResponse.json(
        {
          success: true,
          message: "Utente registrato con successo",
          userId: result.insertedId,
          user: {
            id: result.insertedId,
            name: trimmedName,
            email: trimmedEmail,
          },
        },
        { status: 201 },
      )
    } catch (createError) {
      console.error("💥 Error creating user:", createError)

      return NextResponse.json(
        {
          error: "Errore durante la creazione dell'utente",
          success: false,
          details: process.env.NODE_ENV === "development" ? createError.message : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("💥 Unexpected registration error:", error)
    return NextResponse.json(
      {
        error: "Errore interno del server",
        success: false,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
