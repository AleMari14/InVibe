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
  coordinates: {
    lat: number
    lng: number
  }
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

export interface ChatRoom {
  _id?: ObjectId
  participants: ObjectId[]
  eventId?: ObjectId
  eventTitle?: string
  lastMessage?: string
  lastMessageAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Export della funzione connectToDatabase richiesta
export async function connectToDatabase() {
  try {
    const client = await clientPromise
    const db = client.db("invibe")
    return { client, db }
  } catch (error) {
    console.error("Database connection error:", error)
    throw error
  }
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
    try {
      const client = await clientPromise
      const db = client.db("invibe")
      const eventsCollection = db.collection("events")

      const events = await eventsCollection
        .find({ hostId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray()

      return events.map((event) => ({
        ...event,
        _id: event._id.toString(),
        hostId: event.hostId?.toString(),
        dateStart: event.dateStart?.toISOString?.() || event.dateStart,
        dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd,
        createdAt: event.createdAt?.toISOString?.() || event.createdAt,
        updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt,
      }))
    } catch (error) {
      console.error("Error fetching user events:", error)
      throw error
    }
  }

  static async getEventById(eventId: string) {
    try {
      const client = await clientPromise
      const db = client.db("invibe")
      const eventsCollection = db.collection("events")

      if (!ObjectId.isValid(eventId)) {
        throw new Error("Invalid event ID")
      }

      const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) })

      if (!event) {
        return null
      }

      return {
        ...event,
        _id: event._id.toString(),
        hostId: event.hostId?.toString(),
        dateStart: event.dateStart?.toISOString?.() || event.dateStart,
        dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd,
        createdAt: event.createdAt?.toISOString?.() || event.createdAt,
        updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt,
      }
    } catch (error) {
      console.error("Error fetching event:", error)
      throw error
    }
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

  static async updateUser(userId: string, updateData: Partial<User>) {
    const client = await clientPromise
    const users = client.db().collection("users")

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    )

    return result
  }

  static async createChatRoom(roomData: Omit<ChatRoom, "_id" | "createdAt" | "updatedAt">) {
    const client = await clientPromise
    const chatRooms = client.db().collection("chatRooms")

    const room = {
      ...roomData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return await chatRooms.insertOne(room)
  }

  static async getChatRoom(participants: string[], eventId?: string) {
    const client = await clientPromise
    const chatRooms = client.db().collection("chatRooms")

    const participantIds = participants.map((id) => new ObjectId(id))

    const query: any = {
      participants: { $all: participantIds, $size: participantIds.length },
    }

    if (eventId) {
      query.eventId = new ObjectId(eventId)
    }

    return await chatRooms.findOne(query)
  }

  static async getChatRoomById(roomId: string) {
    const client = await clientPromise
    const chatRooms = client.db().collection("chatRooms")

    return await chatRooms.findOne({ _id: new ObjectId(roomId) })
  }

  static async updateChatRoom(roomId: string, updateData: Partial<ChatRoom>) {
    const client = await clientPromise
    const chatRooms = client.db().collection("chatRooms")

    return await chatRooms.updateOne(
      { _id: new ObjectId(roomId) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    )
  }

  static async createMessage(messageData: Omit<Message, "_id" | "createdAt">) {
    const client = await clientPromise
    const messages = client.db().collection("messages")

    const message = {
      ...messageData,
      createdAt: new Date(),
    }

    return await messages.insertOne(message)
  }

  static async getMessages(roomId: string, limit = 50) {
    const client = await clientPromise
    const messages = client.db().collection("messages")

    return await messages
      .find({ roomId: new ObjectId(roomId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
  }
}
