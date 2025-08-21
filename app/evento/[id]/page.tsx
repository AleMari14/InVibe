import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { BookingModal } from "@/components/booking-modal"
import { MessageHostButton } from "@/components/event/message-host-button"
// import { ReviewSection } from "@/components/event/review-section"
import { CalendarDays, Clock, MapPin, Users, Heart, Share2, Star, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

interface Event {
  _id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  price: number
  maxParticipants: number
  currentParticipants: number
  images: string[]
  hostId: string
  hostName: string
  hostImage?: string
  category: string
  amenities: string[]
  createdAt: string
  rating?: number
  reviewCount?: number
}

async function getEvent(id: string): Promise<Event | null> {
  try {
    const { db } = await connectToDatabase()
    const event = await db.collection("events").findOne({ _id: new ObjectId(id) })

    if (!event) return null

    return {
      _id: event._id.toString(),
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      price: event.price,
      maxParticipants: event.maxParticipants,
      currentParticipants: event.currentParticipants || 0,
      images: event.images || [],
      hostId: event.hostId,
      hostName: event.hostName,
      hostImage: event.hostImage,
      category: event.category,
      amenities: event.amenities || [],
      createdAt: event.createdAt,
      rating: event.rating || 0,
      reviewCount: event.reviewCount || 0,
    }
  } catch (error) {
    console.error("Error fetching event:", error)
    return null
  }
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const event = await getEvent(params.id)

  if (!event) {
    notFound()
  }

  const isHost = session?.user?.id === event.hostId
  const eventDate = new Date(event.date)
  const isEventPassed = eventDate < new Date()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header con immagini */}
        <div className="relative mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-96">
            {event.images.length > 0 ? (
              <>
                <div className="md:col-span-1 lg:col-span-2 relative rounded-xl overflow-hidden">
                  <Image
                    src={event.images[0] || "/placeholder.svg"}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {event.images.slice(1, 3).map((image, index) => (
                  <div key={index} className="relative rounded-xl overflow-hidden">
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${event.title} ${index + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </>
            ) : (
              <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <CalendarDays className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Nessuna immagine disponibile</p>
                </div>
              </div>
            )}
          </div>

          {/* Azioni rapide */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
              <Heart className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
              <Share2 className="h-4 w-4" />
            </Button>
            {isHost && (
              <>
                <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white" asChild>
                  <Link href={`/evento/${event._id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="sm" variant="destructive" className="bg-red-500/90 hover:bg-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenuto principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informazioni evento */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Badge variant="secondary" className="w-fit">
                      {event.category}
                    </Badge>
                    <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                      {event.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(event.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {event.rating?.toFixed(1) || "0.0"} ({event.reviewCount || 0} recensioni)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">€{event.price}</div>
                    <div className="text-sm text-gray-500">per persona</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dettagli evento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <CalendarDays className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Data</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(event.date).toLocaleDateString("it-IT", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Clock className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">Orario</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{event.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <MapPin className="h-5 w-5 text-red-500" />
                    <div>
                      <div className="font-medium">Luogo</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{event.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Users className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="font-medium">Partecipanti</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {event.currentParticipants}/{event.maxParticipants}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Descrizione */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Descrizione</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>

                {/* Servizi inclusi */}
                {event.amenities.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Servizi Inclusi</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {event.amenities.map((amenity, index) => (
                          <Badge key={index} variant="outline" className="justify-center py-2">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Sezione recensioni - COMMENTATA */}
            {/* <ReviewSection eventId={event._id} /> */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Card prenotazione */}
            <Card className="border-0 shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle className="text-center">{isEventPassed ? "Evento Terminato" : "Prenota Ora"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">€{event.price}</div>
                  <div className="text-sm text-gray-500">per persona</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Posti disponibili:</span>
                    <span className="font-medium">{event.maxParticipants - event.currentParticipants}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(event.currentParticipants / event.maxParticipants) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {!isEventPassed && !isHost && (
                  <BookingModal
                    eventId={event._id}
                    eventTitle={event.title}
                    eventPrice={event.price}
                    eventDate={event.date}
                    eventTime={event.time}
                    availableSpots={event.maxParticipants - event.currentParticipants}
                  />
                )}

                {!isHost && (
                  <MessageHostButton hostId={event.hostId} hostName={event.hostName} eventTitle={event.title} />
                )}
              </CardContent>
            </Card>

            {/* Card host */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Organizzatore</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={event.hostImage || "/placeholder.svg"} alt={event.hostName} />
                    <AvatarFallback>
                      {event.hostName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{event.hostName}</div>
                    <div className="text-sm text-gray-500">Organizzatore</div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/user/${event.hostId}`}>Profilo</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
