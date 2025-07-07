import { type NextRequest, NextResponse } from "next/server"
import { cleanupExpiredEvents } from "@/lib/cleanup"

export async function POST(request: NextRequest) {
  try {
    console.log("🧹 Manual cleanup requested")

    const result = await cleanupExpiredEvents()

    return NextResponse.json({
      success: true,
      message: "Cleanup completed successfully",
      result,
    })
  } catch (error: any) {
    console.error("💥 Cleanup API error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Errore durante la pulizia degli eventi scaduti",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST method to trigger cleanup",
    endpoint: "/api/cleanup",
  })
}
