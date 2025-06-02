import { NextResponse } from "next/server"
import { testDatabaseConnection } from "@/lib/services/userService"

export async function GET() {
  try {
    const result = await testDatabaseConnection()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
