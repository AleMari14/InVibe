import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Starting user registration process")

    const { name, email, password } = await request.json()
    console.log("📝 Registration data received:", { name, email, passwordLength: password?.length })

    // Validate input
    if (!name || !email || !password) {
      console.log("❌ Missing required fields")
      return NextResponse.json({ error: "Nome, email e password sono obbligatori", success: false }, { status: 400 })
    }

    if (password.length < 6) {
      console.log("❌ Password too short")
      return NextResponse.json(
        { error: "La password deve essere di almeno 6 caratteri", success: false },
        { status: 400 },
      )
    }

    console.log("🔗 Connecting to database...")
    const { db } = await connectToDatabase()
    console.log("✅ Database connected successfully")

    // Check if user already exists
    console.log("🔍 Checking if user already exists...")
    const existingUser = await db.collection("users").findOne({ email })

    if (existingUser) {
      console.log("❌ User already exists with email:", email)
      return NextResponse.json({ error: "Un utente con questa email esiste già", success: false }, { status: 400 })
    }

    console.log("🔐 Hashing password...")
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log("✅ Password hashed successfully")

    // Create new user
    console.log("👤 Creating new user...")
    const newUser = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      verified: false,
    }

    const result = await db.collection("users").insertOne(newUser)
    console.log("✅ User created successfully with ID:", result.insertedId)

    return NextResponse.json(
      {
        message: "Utente registrato con successo",
        success: true,
        userId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("💥 Registration error:", error)
    return NextResponse.json({ error: "Errore interno del server", success: false }, { status: 500 })
  }
}
