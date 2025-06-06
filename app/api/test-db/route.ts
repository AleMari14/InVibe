import { NextResponse } from "next/server"
import { testDatabaseConnection } from "@/lib/services/userService"

export async function GET() {
  try {
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
    }, { status: 500 })
  }
}
