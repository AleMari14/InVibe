import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("invibe")
    
    // Test the connection by listing collections
    const collections = await db.listCollections().toArray()
    
    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      collections: collections.map((c: any) => c.name)
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json({
      status: "error",
      message: "Failed to connect to database",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
