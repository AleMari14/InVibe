import { NextResponse } from "next/server"
import { cleanupExpiredEvents } from "@/lib/cleanup"

export async function POST() {
  try {
    console.log("🧹 Manual cleanup triggered")

    const result = await cleanupExpiredEvents()

    return NextResponse.json({
      success: true,
      message: "Cleanup completed successfully",
      result,
    })
  } catch (error) {
    console.error("💥 Cleanup API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cleanup expired events",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    console.log("🧹 Automatic cleanup triggered")

    const result = await cleanupExpiredEvents()

    return NextResponse.json({
      success: true,
      message: "Automatic cleanup completed",
      result,
    })
  } catch (error) {
    console.error("💥 Cleanup API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cleanup expired events",
      },
      { status: 500 },
    )
  }
}
