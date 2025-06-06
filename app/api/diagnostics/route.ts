import { NextResponse } from "next/server"
import { testDatabaseConnection } from "@/lib/services/userService"

export async function GET() {
  try {
    const dbStatus = await testDatabaseConnection()

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: dbStatus,
      mongodb_uri_exists: !!process.env.MONGODB_URI,
      mongodb_uri_length: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
      mongodb_uri_prefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 10) + "..." : "not set",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
