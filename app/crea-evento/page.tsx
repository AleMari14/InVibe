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
  Calendar,
  Users,
  DollarSign,
  LinkIcon,
  CheckCircle,
  Loader2,
  ImageIcon,
  Info,
  Camera,
  X,
  ChevronRight,
  ChevronLeft,
  Globe,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

// Carica dinamicamente il LocationPicker per evitare problemi SSR
const LocationPicker = dynamic(
  () => import("@/components/ui/location-picker").then((mod) => ({ default: mod.LocationPicker })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-2">
        <Label>Località *</Label>
        <div className="h-10 bg-muted animate-pulse rounded-md"></div>
        <div className="h-48 bg-muted animate-pulse rounded-md"></div>
      </div>
    ),
  },
)

export default function CreaEventoPage() {
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
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [servizi, setServizi] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [locationError, setLocationError] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [placePreview, setPlacePreview] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const { data: session, status } = useSession()
  const router = useRouter()

  // Imposta isMounted a true solo dopo il montaggio del componente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Funzione per estrarre informazioni da un link di OpenStreetMap - solo client-side
  const extractInfoFromMapLink = (link: string) => {
    if (!isMounted || typeof window === "undefined") {
      return { placeName: "", coordinates: null }
    }

    try {
      const url = new URL(link)
      let lat = 0,
        lng = 0,
        placeName = ""

      // Estrai le coordinate da OpenStreetMap
      if (url.hostname.includes("openstreetmap.org")) {
        const params = new URLSearchParams(url.search)
        const mlat = params.get("mlat")
        const mlon = params.get("mlon")

        if (mlat && mlon) {
          lat = Number.parseFloat(mlat)
          lng = Number.parseFloat(mlon)
        } else {
          // Prova a estrarre dalle parti del percorso
          const match = url.pathname.match(/map\/(\d+)\/(-?\d+\.\d+)\/(-?\d+\.\d+)/)
          if (match) {
            lat = Number.parseFloat(match[2])
            lng = Number.parseFloat(match[3])
          }
        }

        // Estrai il nome del luogo se presente
        placeName = params.get("query") || "Luogo su OpenStreetMap"
      }
      // Supporto per Google Maps (per retrocompatibilità)
      else if (url.hostname.includes("google") && url.pathname.includes("/maps")) {
        const coordsMatch = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
        if (coordsMatch) {
          lat = Number.parseFloat(coordsMatch[1])
          lng = Number.parseFloat(coordsMatch[2])
        }

        // Estrai il nome del luogo se presente
        if (url.pathname.includes("/place/")) {
          const pathParts = url.pathname.split("/")
          const placeIndex = pathParts.indexOf("place")
          if (placeIndex !== -1 && placeIndex < pathParts.length - 1) {
            placeName = decodeURIComponent(pathParts[placeIndex + 1].split("/")[0])
            placeName = placeName.replace(/\+/g, " ")
          }
        } else {
          placeName = "Luogo su Google Maps"
        }
      }

      return {
        placeName,
        coordinates: lat !== 0 && lng !== 0 ? { lat, lng } : null,
      }
    } catch (e) {
      console.error("Errore nell'analisi del link:", e)
      return { placeName: "", coordinates: null }
    }
  }

  // Funzione per generare un'immagine dal link del posto
  const generateImageFromPlaceLink = async () => {
    if (!placeLink) {
      toast.error("Inserisci un link di una mappa valido")
      return
    }

    setIsLoadingImage(true)
    setError("")

    try {
      // Estrai informazioni dal link solo se siamo nel browser
      const { placeName, coordinates } = isMounted
        ? extractInfoFromMapLink(placeLink)
        : { placeName: "Luogo", coordinates: null }

      if (!placeName && !coordinates) {
        toast.error("Non è stato possibile estrarre informazioni dal link fornito")
        setIsLoadingImage(false)
        return
      }

      // Genera un'anteprima del luogo
      setPlacePreview(placeName || "Luogo sconosciuto")

      // Se abbiamo le coordinate, aggiorniamo anche la posizione sulla mappa
      if (coordinates) {
        // Esegui reverse geocoding per ottenere l'indirizzo completo
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "it",
                "User-Agent": "InVibe/1.0",
              },
            },
          )

          if (response.ok) {
            const data = await response.json()
            if (data.display_name) {
              setLocation(data.display_name)
              setCoordinates(coordinates)
            }
          }
        } catch (error) {
          console.error("Errore nel reverse geocoding:", error)
        }
      }

      // Genera un'immagine basata sul nome del luogo
      const imageUrl = `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(placeName || "location")}`

      // Simula un ritardo per mostrare il caricamento
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setImages((prev) => [...prev, imageUrl])
      toast.success("Immagine generata con successo!")
    } catch (error) {
      console.error("Errore nella generazione dell'immagine:", error)
      toast.error("Errore nella generazione dell'immagine. Riprova.")
    } finally {
      setIsLoadingImage(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      // Per questa demo, utilizziamo un placeholder invece di caricare realmente l'immagine
      const file = files[0]
      const imageUrl = `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(file.name)}`

      // Simula un ritardo per mostrare il caricamento
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setImages((prev) => [...prev, imageUrl])
      toast.success("Immagine caricata con successo!")
    } catch (error) {
      console.error("Errore nel caricamento dell'immagine:", error)
      toast.error("Errore nel caricamento dell'immagine")
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleLocationChange = (newLocation: string, newCoordinates: { lat: number; lng: number }) => {
    setLocation(newLocation)
    setCoordinates(newCoordinates)
    setLocationError("")
  }

  useEffect(() => {
    // Pulisci l'anteprima quando il link cambia - solo client-side
    if (placeLink && isMounted) {
      const { placeName } = extractInfoFromMapLink(placeLink)
      setPlacePreview(placeName || null)
      setError("")
    } else {
      setPlacePreview(null)
    }
  }, [placeLink, isMounted])

  // Loading state durante l'hydration
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    router.push("/auth/login")
    return null
  }

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
    "WiFi",
    "Piscina",
    "Parcheggio",
    "Cucina",
    "Aria Condizionata",
    "Riscaldamento",
    "TV",
    "Lavatrice",
    "Asciugacapelli",
    "Ferro da Stiro",
    "Terrazza",
    "Giardino",
    "Trasporti Inclusi",
    "Colazione Inclusa",
    "Pranzi Inclusi",
    "Guida Turistica",
    "Attrezzature Sportive",
    "Animali Ammessi",
  ]

  const toggleServizio = (servizio: string) => {
    setServizi((prev) => (prev.includes(servizio) ? prev.filter((s) => s !== servizio) : [...prev, servizio]))
  }

  const getProgress = () => {
    const totalSteps = 4
    return (currentStep / totalSteps) * 100
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return categoria !== ""
      case 2:
        return titolo && descrizione && location
      case 3:
        return dataInizio && postiTotali && prezzo
      case 4:
        return true // Servizi opzionali
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
    if (!titolo.trim()) {
      setError("Il titolo è obbligatorio")
      toast.error("Il titolo è obbligatorio")
      return false
    }
    if (!descrizione.trim()) {
      setError("La descrizione è obbligatoria")
      toast.error("La descrizione è obbligatoria")
      return false
    }
    if (!dataInizio) {
      setError("La data di inizio è obbligatoria")
      toast.error("La data di inizio è obbligatoria")
      return false
    }
    if (dataFine && new Date(dataFine) < new Date(dataInizio)) {
      setError("La data di fine deve essere successiva alla data di inizio")
      toast.error("La data di fine deve essere successiva alla data di inizio")
      return false
    }
    if (!postiTotali || Number.parseInt(postiTotali) < 2) {
      setError("Il numero di posti deve essere almeno 2")
      toast.error("Il numero di posti deve essere almeno 2")
      return false
    }
    if (!prezzo || Number.parseFloat(prezzo) <= 0) {
      setError("Il prezzo deve essere maggiore di 0")
      toast.error("Il prezzo deve essere maggiore di 0")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

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

      console.log("Submitting event data:", eventData)

      // Effettua la chiamata API reale
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Errore nella creazione dell'evento")
      }

      if (result.success) {
        setSuccess(true)
        toast.success("Evento creato con successo!")

        setTimeout(() => {
          router.push("/")
        }, 2000)
      } else {
        throw new Error(result.error || "Errore nella creazione dell'evento")
      }
    } catch (error: any) {
      console.error("Error creating event:", error)
      setError(error.message || "Errore nella creazione dell'evento. Riprova.")
      toast.error(error.message || "Errore nella creazione dell'evento")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Evento Creato!</h2>
              <p className="text-muted-foreground mb-4">
                Il tuo evento è stato pubblicato con successo. Verrai reindirizzato alla home.
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Mobile-Optimized */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-3 sm:px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
              Crea Nuovo Evento
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={getProgress()} className="flex-1 h-1.5 sm:h-2" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">{currentStep}/4</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-3 sm:px-4 py-4 space-y-4 pb-24 sm:pb-20 max-w-3xl mx-auto">
        {error && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertDescription className="text-red-400 text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Categoria - Mobile Optimized */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">1</span>
                    </div>
                    Tipo di Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categorieDisponibili.map((cat) => (
                    <motion.div
                      key={cat.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        categoria === cat.id
                          ? `border-transparent bg-gradient-to-r ${cat.gradient} text-white shadow-lg`
                          : "border-border hover:border-gray-300 hover:shadow-md"
                      }`}
                      onClick={() => setCategoria(cat.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl sm:text-2xl">{cat.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm sm:text-base">{cat.name}</div>
                          <div
                            className={`text-xs sm:text-sm ${categoria === cat.id ? "text-white/80" : "text-muted-foreground"}`}
                          >
                            {cat.description}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Informazioni Base - Mobile Optimized */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">2</span>
                    </div>
                    Informazioni Base
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="titolo" className="text-sm font-medium">
                      Titolo dell'Evento *
                    </Label>
                    <Input
                      id="titolo"
                      placeholder="es. Villa con Piscina - Weekend in Toscana"
                      value={titolo}
                      onChange={(e) => setTitolo(e.target.value)}
                      className="mt-1 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descrizione" className="text-sm font-medium">
                      Descrizione *
                    </Label>
                    <Textarea
                      id="descrizione"
                      placeholder="Descrivi il tuo evento, cosa include, cosa aspettarsi..."
                      value={descrizione}
                      onChange={(e) => setDescrizione(e.target.value)}
                      rows={4}
                      className="mt-1 text-sm resize-none"
                      required
                    />
                  </div>

                  <LocationPicker value={location} onChange={handleLocationChange} error={locationError} />

                  {categoria === "casa" && (
                    <div className="space-y-2 p-3 border border-blue-200 bg-blue-50/50 rounded-md">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="placeLink" className="flex items-center gap-1 text-sm">
                          Link OpenStreetMap o Google Maps (opzionale)
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </Label>
                      </div>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="placeLink"
                          type="url"
                          placeholder="https://www.openstreetmap.org/..."
                          value={placeLink}
                          onChange={(e) => setPlaceLink(e.target.value)}
                          className="pl-10 text-sm"
                        />
                      </div>

                      {placePreview && (
                        <div className="text-sm p-2 bg-blue-50 rounded border border-blue-100 mt-2">
                          <p className="font-medium text-xs">Luogo rilevato:</p>
                          <p className="text-muted-foreground text-xs truncate">{placePreview}</p>
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={generateImageFromPlaceLink}
                        disabled={!placeLink || isLoadingImage}
                        className="w-full mt-2 text-sm"
                        variant="secondary"
                        size="sm"
                      >
                        {isLoadingImage ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Generazione immagine...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-3 w-3 mr-2" />
                            Genera Immagine dal Link
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Inserisci un link di OpenStreetMap o Google Maps per generare automaticamente un'immagine del
                        luogo
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Date, Partecipanti e Prezzo - Mobile Optimized */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">3</span>
                    </div>
                    Date, Partecipanti e Prezzo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dataInizio" className="text-sm font-medium">
                        Data Inizio *
                      </Label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="dataInizio"
                          type="date"
                          value={dataInizio}
                          onChange={(e) => setDataInizio(e.target.value)}
                          className="pl-10 text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="dataFine" className="text-sm font-medium">
                        Data Fine
                      </Label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="dataFine"
                          type="date"
                          value={dataFine}
                          onChange={(e) => setDataFine(e.target.value)}
                          className="pl-10 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="postiTotali" className="text-sm font-medium">
                      Numero Totale di Posti *
                    </Label>
                    <div className="relative mt-1">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="postiTotali"
                        type="number"
                        placeholder="es. 8"
                        value={postiTotali}
                        onChange={(e) => setPostiTotali(e.target.value)}
                        className="pl-10 text-sm"
                        min="2"
                        max="50"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="prezzo" className="text-sm font-medium">
                      Prezzo per Persona (€) *
                    </Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="prezzo"
                        type="number"
                        placeholder="es. 85"
                        value={prezzo}
                        onChange={(e) => setPrezzo(e.target.value)}
                        className="pl-10 text-sm"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bookingLink" className="text-sm font-medium">
                      Link di Prenotazione (opzionale)
                    </Label>
                    <div className="relative mt-1">
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="bookingLink"
                        type="url"
                        placeholder="https://..."
                        value={bookingLink}
                        onChange={(e) => setBookingLink(e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mt-4">
                <CardHeader className="pb-4">
                  <CardTitle className="text-md">Immagini dell'Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-video rounded-md overflow-hidden border border-border"
                      >
                        <img
                          src={image || "/placeholder.svg?height=200&width=300&query=event%20image"}
                          alt={`Immagine ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5 sm:h-6 sm:w-6"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-2 w-2 sm:h-3 sm:w-3" />
                        </Button>
                      </div>
                    ))}
                    <label className="aspect-video rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Camera className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground text-center px-1">Carica immagine</span>
                        </>
                      )}
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Aggiungi immagini per rendere il tuo evento più attraente. Formato consigliato: 16:9
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Servizi - Mobile Optimized */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">4</span>
                    </div>
                    Servizi Inclusi (Opzionale)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {serviziDisponibili.map((servizio) => (
                      <motion.div key={servizio} className="flex items-center space-x-2" whileHover={{ scale: 1.02 }}>
                        <Checkbox
                          id={servizio}
                          checked={servizi.includes(servizio)}
                          onCheckedChange={() => toggleServizio(servizio)}
                        />
                        <Label htmlFor={servizio} className="text-sm cursor-pointer">
                          {servizio}
                        </Label>
                      </motion.div>
                    ))}
                  </div>

                  {servizi.length > 0 && (
                    <motion.div className="mt-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="text-sm font-medium mb-2">Servizi selezionati:</div>
                      <div className="flex flex-wrap gap-1">
                        {servizi.map((servizio) => (
                          <Badge
                            key={servizio}
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs"
                          >
                            {servizio}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mt-4">
                <CardHeader className="pb-4">
                  <CardTitle className="text-md">Riepilogo Evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <span className="text-sm font-medium">Categoria:</span>
                      <p className="text-sm text-muted-foreground">
                        {categorieDisponibili.find((c) => c.id === categoria)?.name || categoria}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Località:</span>
                      <p className="text-sm text-muted-foreground truncate">{location}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Data:</span>
                      <p className="text-sm text-muted-foreground">
                        {dataInizio} {dataFine ? `- ${dataFine}` : ""}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Prezzo:</span>
                      <p className="text-sm text-muted-foreground">{prezzo}€ per persona</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Posti disponibili:</span>
                      <p className="text-sm text-muted-foreground">{postiTotali}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Immagini:</span>
                      <p className="text-sm text-muted-foreground">{images.length} caricate</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <span className="text-sm font-medium">Titolo:</span>
                    <p className="text-sm">{titolo}</p>
                  </div>

                  <div>
                    <span className="text-sm font-medium">Descrizione:</span>
                    <p className="text-sm text-muted-foreground line-clamp-3">{descrizione}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons - Mobile Optimized */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-3 sm:p-4 safe-area-pb">
          <div className="flex gap-2 sm:gap-3 max-w-3xl mx-auto">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 text-sm"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Indietro
              </Button>
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNextStep()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm"
                size="sm"
              >
                Avanti
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-sm"
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Pubblicazione...
                  </>
                ) : (
                  "Pubblica Evento"
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
