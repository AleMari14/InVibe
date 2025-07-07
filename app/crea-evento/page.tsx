"use client"

import type React from "react"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Wifi,
  Car,
  Utensils,
  Sparkles,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

// Remove this dynamic import
// const LocationPicker = dynamic(
//  () => import("@/components/ui/location-picker").then((mod) => ({ default: mod.LocationPicker })),
//  {
//    ssr: false,
//    loading: () => (
//      <div className="space-y-2">
//        <Label>Località *</Label>
//        <div className="h-10 bg-muted animate-pulse rounded-md"></div>
//        <div className="h-48 bg-muted animate-pulse rounded-md"></div>
//      </div>
//    ),
//  },
// )

// Add this new dynamic import
const LocationSearchInput = dynamic(
  () => import("@/components/ui/location-search-input").then((mod) => mod.LocationSearchInput),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-2">
        <Label>Località *</Label>
        <div className="h-10 bg-muted animate-pulse rounded-md"></div>
      </div>
    ),
  },
)

export default function CreaEventoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(1)
  const [categoria, setCategoria] = useState("")
  const [titolo, setTitolo] = useState("")
  const [descrizione, setDescrizione] = useState("")
  const [location, setLocation] = useState("")
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [dataInizio, setDataInizio] = useState("")
  const [dataFine, setDataFine] = useState("")
  const [postiTotali, setPostiTotali] = useState("")
  const [prezzo, setPrezzo] = useState("")
  const [bookingLink, setBookingLink] = useState("")
  const [placeLink, setPlaceLink] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [servizi, setServizi] = useState<string[]>([])
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [autoAdvancing, setAutoAdvancing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [locationError, setLocationError] = useState("")
  const [placePreview, setPlacePreview] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/login")
    }
  }, [session, status, router])

  useEffect(() => {
    if (categoria && currentStep === 1) {
      setAutoAdvancing(true)
      const timer = setTimeout(() => {
        setCurrentStep(2)
        setAutoAdvancing(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [categoria, currentStep])

  useEffect(() => {
    const errors: Record<string, string> = {}
    if (currentStep >= 2) {
      if (!titolo.trim()) errors.titolo = "Il titolo è obbligatorio"
      else if (titolo.length < 10) errors.titolo = "Il titolo deve essere di almeno 10 caratteri"
      if (!descrizione.trim()) errors.descrizione = "La descrizione è obbligatoria"
      else if (descrizione.length < 50) errors.descrizione = "La descrizione deve essere di almeno 50 caratteri"
      if (!location) errors.location = "La località è obbligatoria"
    }
    if (currentStep >= 3) {
      if (!dataInizio) errors.dataInizio = "La data di inizio è obbligatoria"
      else if (new Date(dataInizio) < new Date()) errors.dataInizio = "La data deve essere futura"
      if (dataFine && new Date(dataFine) <= new Date(dataInizio))
        errors.dataFine = "La data di fine deve essere successiva all'inizio"
      if (!postiTotali) errors.postiTotali = "Il numero di posti è obbligatorio"
      else if (Number.parseInt(postiTotali) < 2) errors.postiTotali = "Minimo 2 posti"
      else if (Number.parseInt(postiTotali) > 50) errors.postiTotali = "Massimo 50 posti"
      if (!prezzo) errors.prezzo = "Il prezzo è obbligatorio"
      else if (Number.parseFloat(prezzo) <= 0) errors.prezzo = "Il prezzo deve essere maggiore di 0"
      else if (Number.parseFloat(prezzo) > 10000) errors.prezzo = "Prezzo massimo €10.000"
    }
    setFieldErrors(errors)
  }, [titolo, descrizione, location, dataInizio, dataFine, postiTotali, prezzo, currentStep])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingImage(true)
    try {
      const file = files[0]
      if (!file.type.startsWith("image/")) {
        toast.error("Seleziona un file immagine valido")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("L'immagine deve essere inferiore a 10MB")
        return
      }
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "event")
      const response = await fetch("/api/upload", { method: "POST", body: formData })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Errore nel caricamento dell'immagine")
      }
      const data = await response.json()
      if (data.success && data.url) {
        setImages((prev) => [...prev, data.url])
        toast.success("Immagine caricata con successo!")
      } else {
        throw new Error(data.error || "Errore nel caricamento dell'immagine")
      }
    } catch (error: any) {
      toast.error(error.message || "Errore nel caricamento dell'immagine")
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Replace this function
  // const handleLocationChange = (newLocation: string, newCoordinates: { lat: number; lng: number }) => {
  //  setLocation(newLocation)
  //  setCoordinates(newCoordinates)
  //  setLocationError("")
  // }

  // With this one
  const handleLocationSelect = (address: string, coords: { lat: number; lng: number }) => {
    setLocation(address)
    setCoordinates(coords)
    setLocationError("")
  }

  const toggleServizio = (servizio: string) => {
    setServizi((prev) => (prev.includes(servizio) ? prev.filter((s) => s !== servizio) : [...prev, servizio]))
  }

  const getProgress = () => (currentStep / 4) * 100

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return categoria !== ""
      case 2:
        return (
          titolo.trim() !== "" &&
          descrizione.trim() !== "" &&
          location !== "" &&
          coordinates !== null &&
          !fieldErrors.titolo &&
          !fieldErrors.descrizione &&
          !fieldErrors.location
        )
      case 3:
        return (
          dataInizio !== "" &&
          postiTotali !== "" &&
          prezzo !== "" &&
          !fieldErrors.dataInizio &&
          !fieldErrors.dataFine &&
          !fieldErrors.postiTotali &&
          !fieldErrors.prezzo
        )
      case 4:
        return true
      default:
        return false
    }
  }

  const validateForm = () => {
    if (!coordinates) {
      setLocationError("Seleziona una località valida sulla mappa")
      toast.error("Seleziona una località valida sulla mappa")
      return false
    }
    if (Object.keys(fieldErrors).length > 0) {
      toast.error("Correggi gli errori nel form prima di continuare")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      const eventData = {
        title: titolo.trim(),
        description: descrizione.trim(),
        category: categoria,
        location: location,
        coordinates: coordinates,
        price: Number.parseFloat(prezzo),
        dateStart: dataInizio,
        dateEnd: dataFine || null,
        totalSpots: Number.parseInt(postiTotali),
        amenities: servizi,
        bookingLink: bookingLink.trim(),
        placeLink: placeLink.trim(),
        images: images,
      }
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || `Errore HTTP: ${response.status}`)
      if (result.eventId) {
        setSuccess(true)
        toast.success("Evento creato con successo!")
        setTimeout(() => router.push(`/evento/${result.eventId}`), 2000)
      } else {
        throw new Error(result.error || "Errore nella creazione dell'evento")
      }
    } catch (error: any) {
      setError(error.message || "Errore nella creazione dell'evento. Riprova.")
      toast.error(error.message || "Errore nella creazione dell'evento")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextStep = () => {
    if (canProceedToNextStep()) setCurrentStep(currentStep + 1)
  }

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleCategoriaSelect = (categoriaId: string) => {
    setCategoria(categoriaId)
  }

  if (!isMounted || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    )
  }

  if (!session) return null

  const categorieDisponibili = [
    {
      id: "casa",
      name: "Casa/Appartamento",
      description: "Condividi una casa, villa o appartamento",
      icon: "🏠",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      id: "viaggio",
      name: "Viaggio di Gruppo",
      description: "Organizza un viaggio con altre persone",
      icon: "✈️",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      id: "evento",
      name: "Evento Privato",
      description: "Crea un evento speciale",
      icon: "🎉",
      gradient: "from-purple-500 to-pink-600",
    },
    {
      id: "esperienza",
      name: "Esperienza",
      description: "Condividi un'esperienza unica",
      icon: "🌟",
      gradient: "from-orange-500 to-red-600",
    },
  ]

  const serviziDisponibili = [
    { id: "WiFi", name: "WiFi", icon: <Wifi className="h-4 w-4" /> },
    { id: "Parcheggio", name: "Parcheggio", icon: <Car className="h-4 w-4" /> },
    { id: "Cucina", name: "Cucina", icon: <Utensils className="h-4 w-4" /> },
  ]

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="relative z-10"
        >
          <Card className="border-gray-700 bg-gray-800/50 w-full max-w-md text-center">
            <CardContent className="p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="h-10 w-10 text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Evento Creato!</h2>
              <p className="text-gray-400 mb-6">Il tuo evento è ora live. Sarai reindirizzato a breve.</p>
              <Loader2 className="h-6 w-6 animate-spin text-blue-400 mx-auto" />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <div className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-400" />
              Crea Nuovo Evento
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Progress value={getProgress()} className="flex-1 h-2 bg-gray-700" />
              <span className="text-sm text-gray-400 font-medium">{currentStep}/4</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 pb-32">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="border-gray-700 bg-gray-800/50">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-3 text-white">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        1
                      </div>
                      Che tipo di evento vuoi creare?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categorieDisponibili.map((cat) => (
                      <motion.div key={cat.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card
                          className={`cursor-pointer transition-all duration-300 border-2 h-full ${
                            categoria === cat.id
                              ? `border-transparent bg-gradient-to-r ${cat.gradient} text-white shadow-lg`
                              : "border-gray-700 hover:border-blue-500 bg-gray-800"
                          }`}
                          onClick={() => handleCategoriaSelect(cat.id)}
                        >
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="text-3xl">{cat.icon}</div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{cat.name}</h3>
                              <p className={`text-sm ${categoria === cat.id ? "text-white/90" : "text-gray-400"}`}>
                                {cat.description}
                              </p>
                            </div>
                            {categoria === cat.id && <CheckCircle className="h-6 w-6 text-white" />}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="border-gray-700 bg-gray-800/50">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-3 text-white">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        2
                      </div>
                      Descrivi il tuo evento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="titolo" className="text-base font-medium text-gray-300">
                        Titolo dell'evento *
                      </Label>
                      <Input
                        id="titolo"
                        value={titolo}
                        onChange={(e) => setTitolo(e.target.value)}
                        placeholder="Es: Weekend in villa con piscina"
                        className={`h-12 text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500 ${
                          fieldErrors.titolo ? "border-red-500" : ""
                        }`}
                        required
                      />
                      {fieldErrors.titolo && <p className="text-sm text-red-500">{fieldErrors.titolo}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descrizione" className="text-base font-medium text-gray-300">
                        Descrizione *
                      </Label>
                      <Textarea
                        id="descrizione"
                        value={descrizione}
                        onChange={(e) => setDescrizione(e.target.value)}
                        placeholder="Descrivi nel dettaglio cosa include l'evento..."
                        className={`min-h-[120px] text-base bg-gray-800 border-gray-600 text-white focus:border-blue-500 resize-none ${
                          fieldErrors.descrizione ? "border-red-500" : ""
                        }`}
                        required
                      />
                      {fieldErrors.descrizione && <p className="text-sm text-red-500">{fieldErrors.descrizione}</p>}
                    </div>
                    {/* Replace this
                    <div className="space-y-2">
                      <LocationPicker value={location} onChange={handleLocationChange} error={locationError} />
                      {fieldErrors.location && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {fieldErrors.location}
                        </p>
                      )}
                    </div> */}

                    {/* With this */}
                    <div className="space-y-2">
                      <LocationSearchInput onLocationSelect={handleLocationSelect} />
                      {location && (
                        <div className="text-sm text-green-400 p-2 bg-green-900/50 rounded-md">
                          <p className="font-bold">Località selezionata:</p>
                          <p>{location}</p>
                        </div>
                      )}
                      {fieldErrors.location && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {fieldErrors.location}
                        </p>
                      )}
                      {locationError && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {locationError}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="border-gray-700 bg-gray-800/50">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-3 text-white">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        3
                      </div>
                      Date e dettagli
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date, posti, prezzo inputs */}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="border-gray-700 bg-gray-800/50">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-3 text-white">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        4
                      </div>
                      Servizi e Immagini
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">{/* Servizi e upload immagini */}</CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center pt-6 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="border-gray-600 hover:bg-gray-800 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!canProceedToNextStep()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Avanti
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Crea Evento
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
