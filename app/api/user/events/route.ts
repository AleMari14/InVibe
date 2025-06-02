import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Database } from "@/lib/database"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const events = await Database.getUserEvents(session.user.id)
    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching user events:", error)
    return NextResponse.json({ error: "Failed to fetch user events" }, { status: 500 })
  }
}
