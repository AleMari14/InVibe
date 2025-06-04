import clientPromise from "../mongodb"
import { ObjectId } from "mongodb"
import { hash } from "bcryptjs"

export interface User {
  _id?: string | ObjectId
  name: string
  email: string
  password?: string
  image?: string | null
  emailVerified?: Date | null
  verified?: boolean
  rating?: number
  reviewCount?: number
  joinDate?: Date
  favorites?: string[]
  createdAt?: Date
  updatedAt?: Date
  provider?: string
  googleId?: string
}

/**
 * Trova un utente tramite email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    console.log("🔍 getUserByEmail called with:", email)

    // Test della connessione
    const client = await clientPromise
    console.log("✅ MongoDB client connected successfully")

    const db = client.db("invibe")
    console.log("✅ Database 'invibe' selected")

    const collection = db.collection("users")
    console.log("✅ Users collection selected")

    const user = await collection.findOne({ email: email.toLowerCase() })
    console.log("✅ Query executed, user found:", !!user)

    return user as User | null
  } catch (error) {
    console.error("❌ Error in getUserByEmail:", error)
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    throw new Error(`Database error: ${error.message}`)
  }
}

/**
 * Crea un nuovo utente
 */
export async function createUser(userData: {
  name: string
  email: string
  password: string
  image?: string | null
  provider?: string
  googleId?: string
}) {
  try {
    console.log("💾 createUser called with:", {
      name: userData.name,
      email: userData.email,
      provider: userData.provider || "credentials",
    })

    const client = await clientPromise
    console.log("✅ MongoDB client connected for user creation")

    const db = client.db("invibe")
    const collection = db.collection("users")

    // Hash della password se presente
    let hashedPassword: string | undefined
    if (userData.password) {
      console.log("🔐 Hashing password...")
      hashedPassword = await hash(userData.password, 12)
      console.log("✅ Password hashed successfully")
    }

    // Crea l'oggetto utente
    const newUser: User = {
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      image: userData.image || null,
      emailVerified: userData.provider === "google" ? new Date() : null,
      verified: userData.provider === "google",
      rating: 0,
      reviewCount: 0,
      joinDate: new Date(),
      favorites: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      provider: userData.provider || "credentials",
      googleId: userData.googleId,
    }

    console.log("💾 Inserting user into database...")
    const result = await collection.insertOne(newUser)
    console.log("✅ User inserted successfully with ID:", result.insertedId)

    return {
      insertedId: result.insertedId,
      user: { ...newUser, _id: result.insertedId },
    }
  } catch (error) {
    console.error("❌ Error in createUser:", error)
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    throw new Error(`Database error during user creation: ${error.message}`)
  }
}

/**
 * Trova un utente tramite ID
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    console.log("🔍 getUserById called with:", id)

    const client = await clientPromise
    const db = client.db("invibe")
    const collection = db.collection("users")

    let objectId: ObjectId
    try {
      objectId = new ObjectId(id)
    } catch (error) {
      console.error("❌ Invalid ObjectId:", id)
      return null
    }

    const user = await collection.findOne({ _id: objectId })
    console.log("✅ User found by ID:", !!user)

    return user as User | null
  } catch (error) {
    console.error("❌ Error in getUserById:", error)
    return null
  }
}

/**
 * Test della connessione al database
 */
export async function testDatabaseConnection() {
  try {
    const client = await clientPromise
    const db = client.db()
    
    // Test the connection by running a simple command
    await db.command({ ping: 1 })
    
    return {
      success: true,
      message: "Successfully connected to MongoDB",
      database: db.databaseName
    }
  } catch (error: any) {
    throw new Error(`Failed to connect to MongoDB: ${error.message}`)
  }
}
