import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Event from "@/models/Event"

export const revalidate = 0 // evita cache lato Vercel

export async function GET() {
  await connectDB()
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ favorites: [] })
  }

  const user = await User.findById(session.user.id).select("favorites").lean()

  if (!user) {
    return NextResponse.json({ favorites: [] })
  }

  const events = await Event.find({ _id: { $in: user.favorites } }).lean()
  return NextResponse.json({ favorites: events })
}
