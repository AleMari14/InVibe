import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    console.log("🔍 Starting database diagnostics...")

    // Check if MONGODB_URI is configured
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI environment variable is not set")
      return NextResponse.json(
        {
          status: "error",
          message: "MONGODB_URI environment variable is not configured",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    console.log("✅ MONGODB_URI is configured")

    // Test database connection
    const { db, client } = await connectToDatabase()
    console.log("✅ Database connection successful")

    // Test database operations
    const collections = await db.listCollections().toArray()
    console.log(
      "📊 Available collections:",
      collections.map((c) => c.name),
    )

    // Check users collection
    const usersCount = await db.collection("users").countDocuments()
    console.log("👥 Users count:", usersCount)

    // Check events collection
    const eventsCount = await db.collection("events").countDocuments()
    console.log("🎉 Events count:", eventsCount)

    return NextResponse.json({
      status: "success",
      message: "Database diagnostics completed successfully",
      data: {
        mongodbUri: process.env.MONGODB_URI ? "Configured" : "Not configured",
        connectionStatus: "Connected",
        collections: collections.map((c) => c.name),
        counts: {
          users: usersCount,
          events: eventsCount,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Diagnostics error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Database diagnostics failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
