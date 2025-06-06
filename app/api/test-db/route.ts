import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
<<<<<<< HEAD
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
=======
    console.log("🧪 Testing database connection...")
    console.log("🔌 MongoDB URI:", process.env.MONGODB_URI ? "URI is set" : "URI is missing")
    
    const result = await testDatabaseConnection()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("💥 Database connection error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === "development" ? {
        stack: error.stack,
        name: error.name,
        code: error.code
      } : undefined
>>>>>>> 8b57a171fce65d1fd75ac0a9ec262c0d7ac34f66
    }, { status: 500 })
  }
}
