import clientPromise from "./mongodb"
import { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password?: string
  image?: string
  bio?: string
  phone?: string
  verified: boolean
  rating: number
  reviewCount: number
  joinDate: Date
  favorites: ObjectId[]
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  _id?: ObjectId
  title: string
  description: string
  category: "casa" | "viaggio" | "evento" | "esperienza"
  location: string
  price: number
  dateStart: Date
  dateEnd?: Date
  totalSpots: number
  availableSpots: number
  amenities: string[]
  images: string[]
  bookingLink: string
  verified: boolean
  hostId: ObjectId
  participants: ObjectId[]
  createdAt: Date
  updatedAt: Date
  views: number
  rating: number
  reviewCount: number
}

export interface Booking {
  _id?: ObjectId
  eventId: ObjectId
  userId: ObjectId
  guests: number
  status: "pending" | "confirmed" | "cancelled" | "completed"
  totalPrice: number
  specialRequests?: string
  contactInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Review {
  _id?: ObjectId
  eventId: ObjectId
  userId: ObjectId
  hostId: ObjectId
  rating: number
  comment: string
  createdAt: Date
}

export interface Message {
  _id?: ObjectId
  senderId: ObjectId
  receiverId: ObjectId
  eventId?: ObjectId
  content: string
  read: boolean
  createdAt: Date
}

export class Database {
  static async getEvents(filters?: {
    category?: string
    location?: string
    priceMin?: number
    priceMax?: number
    dateStart?: Date
    dateEnd?: Date
    search?: string
  }) {
    const client = await clientPromise
    const events = client.db().collection("events")

    const query: any = { verified: true, availableSpots: { $gt: 0 } }

    if (filters) {
      if (filters.category && filters.category !== "all") {
        query.category = filters.category
      }
      if (filters.location) {
        query.location = { $regex: filters.location, $options: "i" }
      }
      if (filters.priceMin || filters.priceMax) {
        query.price = {}
        if (filters.priceMin) query.price.$gte = filters.priceMin
        if (filters.priceMax) query.price.$lte = filters.priceMax
      }
      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: "i" } },
          { description: { $regex: filters.search, $options: "i" } },
          { location: { $regex: filters.search, $options: "i" } },
        ]
      }
    }

    return await events.find(query).sort({ createdAt: -1 }).toArray()
  }

  static async createEvent(
    eventData: Omit<Event, "_id" | "createdAt" | "updatedAt" | "views" | "rating" | "reviewCount">,
  ) {
    const client = await clientPromise
    const events = client.db().collection("events")

    const event = {
      ...eventData,
      views: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return await events.insertOne(event)
  }

  static async getUserFavorites(userId: string) {
    const client = await clientPromise
    const users = client.db().collection("users")

    const user = await users.findOne({ _id: new ObjectId(userId) })
    if (!user || !user.favorites) return []

    const events = client.db().collection("events")
    return await events.find({ _id: { $in: user.favorites } }).toArray()
  }

  static async toggleFavorite(userId: string, eventId: string) {
    const client = await clientPromise
    const users = client.db().collection("users")

    const user = await users.findOne({ _id: new ObjectId(userId) })
    const favorites = user?.favorites || []
    const eventObjectId = new ObjectId(eventId)

    const isFavorite = favorites.some((fav: ObjectId) => fav.equals(eventObjectId))

    if (isFavorite) {
      await users.updateOne({ _id: new ObjectId(userId) }, { $pull: { favorites: eventObjectId } })
      return false
    } else {
      await users.updateOne({ _id: new ObjectId(userId) }, { $addToSet: { favorites: eventObjectId } })
      return true
    }
  }

  static async createBooking(bookingData: Omit<Booking, "_id" | "createdAt" | "updatedAt">) {
    const client = await clientPromise
    const bookings = client.db().collection("bookings")
    const events = client.db().collection("events")

    const booking = {
      ...bookingData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await bookings.insertOne(booking)

    // Update event available spots
    await events.updateOne(
      { _id: new ObjectId(bookingData.eventId) },
      {
        $inc: { availableSpots: -bookingData.guests },
        $addToSet: { participants: new ObjectId(bookingData.userId) },
      },
    )

    return result
  }

  static async getUserBookings(userId: string) {
    const client = await clientPromise
    const bookings = client.db().collection("bookings")

    return await bookings
      .aggregate([
        { $match: { userId: new ObjectId(userId) } },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
        { $sort: { createdAt: -1 } },
      ])
      .toArray()
  }

  static async getUserEvents(userId: string) {
    const client = await clientPromise
    const events = client.db().collection("events")

    return await events
      .find({ hostId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray()
  }

  static async incrementEventViews(eventId: string) {
    const client = await clientPromise
    const events = client.db().collection("events")

    await events.updateOne({ _id: new ObjectId(eventId) }, { $inc: { views: 1 } })
  }

  static async createUser(userData: Omit<User, "_id" | "createdAt" | "updatedAt">) {
    const client = await clientPromise
    const users = client.db().collection("users")

    const user = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return await users.insertOne(user)
  }

  static async getUserByEmail(email: string) {
    const client = await clientPromise
    const users = client.db().collection("users")

    return await users.findOne({ email: email.toLowerCase() })
  }

  static async getUserById(userId: string) {
    const client = await clientPromise
    const users = client.db().collection("users")

    return await users.findOne({ _id: new ObjectId(userId) })
  }
}
