"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { ArrowLeft, Calendar, Clock, DollarSign, ImageIcon, Info, MapPin, Plus, Tag, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { LocationSearchInput } from "@/components/ui/location-search-input"
import Image from "next/image"

export const dynamic = "force-dynamic";

const eventSchema = z.object({
  title: z
    .string()
    .min(5, "Il titolo deve avere almeno 5 caratteri")
    .max(100, "Il titolo non può superare i 100 caratteri"),
  description: z
    .string()
    .min(20, "La descrizione deve avere almeno 20 caratteri")
    .max(1000, "La descrizione non può superare i 1000 caratteri"),
  category: z.string().min(1, "La categoria è richiesta"),
  location: z.string().min(5, "La località è richiesta"),
  locationCoords: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  dateStart: z.string().refine((date) => new Date(date) > new Date(), {
    message: "La data di inizio deve essere futura",
  }),
  timeStart: z.string().min(1, "L'orario di inizio è richiesto"),
  price: z.preprocess(
    (a) => typeof a === "string" ? Number.parseInt(a, 10) : a,
    z.number().min(0, "Il prezzo non può essere negativo"),
  ),
  totalSpots: z.preprocess(
    (a) => typeof a === "string" ? Number.parseInt(a, 10) : a,
    z.number().min(1, "Ci deve essere almeno un posto disponibile"),
  ),
  images: z.array(z.string()).optional(),
})

type EventFormData = z.infer<typeof eventSchema>

const categories = [
  { id: "casa", name: "Casa/Appartamento", icon: "🏠" },
  { id: "viaggio", name: "Viaggio", icon: "✈️" },
  { id: "evento", name: "Evento Speciale", icon: "🎉" },
  { id: "esperienza", name: "Esperienza Unica", icon: "🌟" },
  { id: "festa", name: "Festa", icon: "🥳" },
  { id: "musica", name: "Musica/Concerto", icon: "🎵" },
  { id: "sport", name: "Sport", icon: "⚽" },
  { id: "arte", name: "Arte/Cultura", icon: "🎨" },
  { id: "cibo", name: "Cibo/Degustazione", icon: "🍔" },
]

export default function CreateEventPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      location: "",
      locationCoords: { lat: 0, lng: 0 },
      dateStart: "",
      timeStart: "",
      price: 0,
      totalSpots: 10,
      images: [],
    },
  })

  // DEBUG: logga tutti i valori del form ad ogni cambiamento
  useEffect(() => {
    const subscription = watch((values) => {
      console.log("DEBUG form values:", values);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setImageFiles((prev) => [...prev, ...files])

      const newPreviews = files.map((file) => URL.createObjectURL(file))
      setImagePreviews((prev) => [...prev, ...newPreviews])
    }
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleLocationSelect = (address: string, coordinates: { lat: number; lng: number } | null) => {
    setValue("location", address, { shouldValidate: true });
    if (coordinates && typeof coordinates.lat === "number" && typeof coordinates.lng === "number") {
      setValue("locationCoords", coordinates, { shouldValidate: true });
    } else {
      setValue("locationCoords", { lat: 0, lng: 0 }, { shouldValidate: true }); // fallback o mostra errore custom
    }
  };

  const onSubmit = async (data: EventFormData) => {
    if (!session?.user?.id) {
      toast.error("Devi essere autenticato per creare un evento.")
      return
    }
    setIsSubmitting(true)
    toast.info("Creazione dell'evento in corso...")

    try {
      // 1. Upload images to Cloudinary
      let imageUrls: string[] = []
      if (imageFiles.length > 0) {
        toast.info(`Caricamento di ${imageFiles.length} immagini...`)
        const uploadPromises = imageFiles.map(async (file) => {
          const formData = new FormData()
          formData.append("file", file)
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })
          if (!response.ok) {
            throw new Error(`Caricamento immagine fallito per ${file.name}`)
          }
          const result = await response.json()
          return result.url
        })
        // Correzione: Promise.all restituisce direttamente l'array di risultati
        imageUrls = await Promise.all(uploadPromises)
      }

      // 2. Combine date and time
      const [year, month, day] = data.dateStart.split("-")
      const [hours, minutes] = data.timeStart.split(":")
      const combinedDateStart = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes))

      // 3. Create event in database
      console.log("DEBUG locationCoords:", data.locationCoords, typeof data.locationCoords);
      const eventPayload = {
        ...data,
        dateStart: combinedDateStart.toISOString(),
        images: imageUrls,
        host: {
          _id: session.user.id,
          name: session.user.name,
          image: session.user.image,
          email: session.user.email,
        },
      }
      console.log("DEBUG eventPayload:", eventPayload);

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore nella creazione dell'evento")
      }

      const { eventId } = await response.json()
      toast.success("Evento creato con successo!")
      router.push("/user/events")
    } catch (error: any) {
      toast.error(error.message || "Si è verificato un errore imprevisto.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto pb-24">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Crea un Nuovo Evento
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-gray-200">
                <Info className="h-5 w-5 text-blue-400" />
                Informazioni Principali
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-base font-medium text-gray-300">
                  Titolo dell'evento *
                </Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Es: Festa in spiaggia al tramonto"
                  className="mt-2 h-12 text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                />
                {errors.title && <p className="text-red-400 mt-2 text-sm">{errors.title.message}</p>}
              </div>
              <div>
                <Label htmlFor="description" className="text-base font-medium text-gray-300">
                  Descrizione *
                </Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Descrivi il tuo evento, cosa lo rende speciale?"
                  className="mt-2 min-h-[120px] text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                />
                {errors.description && <p className="text-red-400 mt-2 text-sm">{errors.description.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-gray-200">
                <Tag className="h-5 w-5 text-green-400" />
                Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <Controller
                    key={cat.id}
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(cat.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-center ${
                          field.value === cat.id
                            ? "border-blue-500 bg-blue-500/20"
                            : "border-gray-600 hover:border-blue-400"
                        }`}
                      >
                        <span className="text-3xl">{cat.icon}</span>
                        <p className="font-semibold mt-2 text-sm">{cat.name}</p>
                      </button>
                    )}
                  />
                ))}
              </div>
              {errors.category && <p className="text-red-400 mt-4 text-sm">{errors.category.message}</p>}
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-gray-200">
                <MapPin className="h-5 w-5 text-red-400" />
                Luogo e Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <LocationSearchInput onLocationSelect={handleLocationSelect} />
              {errors.location && <p className="text-red-400 mt-2 text-sm">{errors.location.message}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="dateStart" className="text-base font-medium text-gray-300">
                    Data di inizio *
                  </Label>
                  <div className="relative mt-2">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="dateStart"
                      type="date"
                      {...register("dateStart")}
                      className="pl-10 h-12 text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                    />
                  </div>
                  {errors.dateStart && <p className="text-red-400 mt-2 text-sm">{errors.dateStart.message}</p>}
                </div>
                <div>
                  <Label htmlFor="timeStart" className="text-base font-medium text-gray-300">
                    Orario di inizio *
                  </Label>
                  <div className="relative mt-2">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="timeStart"
                      type="time"
                      {...register("timeStart")}
                      className="pl-10 h-12 text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                    />
                  </div>
                  {errors.timeStart && <p className="text-red-400 mt-2 text-sm">{errors.timeStart.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-gray-200">
                <DollarSign className="h-5 w-5 text-yellow-400" />
                Dettagli Partecipazione
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="price" className="text-base font-medium text-gray-300">
                  Prezzo per persona (€) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  {...register("price")}
                  placeholder="0"
                  className="mt-2 h-12 text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                />
                {errors.price && <p className="text-red-400 mt-2 text-sm">{errors.price.message}</p>}
              </div>
              <div>
                <Label htmlFor="totalSpots" className="text-base font-medium text-gray-300">
                  Posti totali *
                </Label>
                <Input
                  id="totalSpots"
                  type="number"
                  {...register("totalSpots")}
                  placeholder="10"
                  className="mt-2 h-12 text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500"
                />
                {errors.totalSpots && <p className="text-red-400 mt-2 text-sm">{errors.totalSpots.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-gray-200">
                <ImageIcon className="h-5 w-5 text-purple-400" />
                Immagini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {imagePreviews.map((src, index) => (
                  <div key={index} className="relative aspect-square group">
                    <Image
                      src={src || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Label
                  htmlFor="image-upload"
                  className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-gray-700/50 transition-colors"
                >
                  <Plus className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-400">Aggiungi foto</span>
                </Label>
              </div>
              <Input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </CardContent>
          </Card>

          <div className="pt-6">
            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg h-14"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creazione in corso...
                </>
              ) : (
                "Crea Evento"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
