"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useTheme as useNextTheme } from "next-themes"
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  ImageIcon,
  Info,
  ChevronRight,
  ChevronLeft,
  Wifi,
  Car,
  Utensils,
  Calendar,
  Users,
  DollarSign,
  LinkIcon,
  MapPin,
  Camera,
  X,
  Globe,
  Sparkles,
  Target,
  Clock,
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
  const { theme } = useNextTheme()
  const { data: session, status } = useSession()
  const router = useRouter()

  // Stati del form
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

  // Stati di caricamento
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [autoAdvancing, setAutoAdvancing] = useState(false)

  // Stati di errore e successo
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [locationError, setLocationError] = useState("")
  const [placePreview, setPlacePreview] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Imposta isMounted a true solo dopo il montaggio del componente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Verifica autenticazione
  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/login")
    }
  }, [session, status, router])

  // Auto-avanzamento quando si seleziona una categoria
  useEffect(() => {
    if (categoria && currentStep === 1) {
      setAutoAdvancing(true)
      const timer = setTimeout(() => {
        setCurrentStep(2)
        setAutoAdvancing(false)
      }, 1500) // 1.5 secondi per dare feedback visivo

      return () => clearTimeout(timer)
    }
  }, [categoria, currentStep])

  // Validazione real-time
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

  // Funzioni di utilità
  const extractInfoFromMapLink = (link: string) => {
    if (!isMounted || typeof window === "undefined") {
      return { placeName: "", coordinates: null }
    }

    try {
      const url = new URL(link)
      let lat = 0,
        lng = 0,
        placeName = ""

      if (url.hostname.includes("openstreetmap.org")) {
        const params = new URLSearchParams(url.search)
        const mlat = params.get("mlat")
        const mlon = params.get("mlon")

        if (mlat && mlon) {
          lat = Number.parseFloat(mlat)
          lng = Number.parseFloat(mlon)
        } else {
          const match = url.pathname.match(/map\/(\d+)\/(-?\d+\.\d+)\/(-?\d+\.\d+)/)
          if (match) {
            lat = Number.parseFloat(match[2])
            lng = Number.parseFloat(match[3])
          }
        }

        placeName = params.get("query") || "Luogo su OpenStreetMap"
      } else if (url.hostname.includes("google") && url.pathname.includes("/maps")) {
        const coordsMatch = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
        if (coordsMatch) {
          lat = Number.parseFloat(coordsMatch[1])
          lng = Number.parseFloat(coordsMatch[2])
        }

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

  const generateImageFromPlaceLink = async () => {
    if (!placeLink) {
      toast.error("Inserisci un link di una mappa valido")
      return
    }

    setIsLoadingImage(true)
    setError("")

    try {
      const { placeName, coordinates } = isMounted
        ? extractInfoFromMapLink(placeLink)
        : { placeName: "Luogo", coordinates: null }

      if (!placeName && !coordinates) {
        toast.error("Non è stato possibile estrarre informazioni dal link fornito")
        setIsLoadingImage(false)
        return
      }

      setPlacePreview(placeName || "Luogo sconosciuto")

      if (coordinates) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&zoom=18&addressdetails=1&accept-language=it`,
            {
              headers: {
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

      // Genera immagine tramite API
      const response = await fetch("/api/place-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          placeName: placeName || "location",
          coordinates,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.url) {
          setImages((prev) => [...prev, data.url])
          toast.success("Immagine generata con successo!")
        }
      } else {
        throw new Error("Errore nella generazione dell'immagine")
      }
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
      const file = files[0]

      // Verifica il tipo di file
      if (!file.type.startsWith("image/")) {
        toast.error("Seleziona un file immagine valido")
        return
      }

      // Verifica la dimensione del file (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("L'immagine deve essere inferiore a 10MB")
        return
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "event")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

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
      console.error("Errore nel caricamento dell'immagine:", error)
      toast.error(error.message || "Errore nel caricamento dell'immagine")
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
        return true // Servizi opzionali, sempre possibile procedere
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

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      const result = await response.json()
      console.log("API Response:", result)

      if (!response.ok) {
        throw new Error(result.error || `Errore HTTP: ${response.status}`)
      }

      if (result.success) {
        setSuccess(true)
        toast.success("Evento creato con successo!")

        setTimeout(() => {
          router.push("/")
        }, 3000)
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

  const handleNextStep = () => {
    if (canProceedToNextStep()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCategoriaSelect = (categoriaId: string) => {
    setCategoria(categoriaId)
    // L'auto-avanzamento è gestito dall'useEffect
  }

  useEffect(() => {
    if (placeLink && isMounted) {
      const { placeName } = extractInfoFromMapLink(placeLink)
      setPlacePreview(placeName || null)
      setError("")
    } else {
      setPlacePreview(null)
    }
  }, [placeLink, isMounted])

  // Loading states
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Configurazioni
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
    { id: "Piscina", name: "Piscina", icon: "🏊" },
    { id: "Parcheggio", name: "Parcheggio", icon: <Car className="h-4 w-4" /> },
    { id: "Cucina", name: "Cucina", icon: <Utensils className="h-4 w-4" /> },
    { id: "Aria Condizionata", name: "A/C", icon: "❄️" },
    { id: "Riscaldamento", name: "Riscaldamento", icon: "🔥" },
    { id: "TV", name: "TV", icon: "📺" },
    { id: "Lavatrice", name: "Lavatrice", icon: "🧺" },
    { id: "Asciugacapelli", name: "Asciugacapelli", icon: "💨" },
    { id: "Ferro da Stiro", name: "Ferro da Stiro", icon: "👔" },
    { id: "Terrazza", name: "Terrazza", icon: "🌅" },
    { id: "Giardino", name: "Giardino", icon: "🌳" },
    { id: "Trasporti Inclusi", name: "Trasporti", icon: "🚌" },
    { id: "Colazione Inclusa", name: "Colazione", icon: "🥐" },
    { id: "Pranzi Inclusi", name: "Pranzi", icon: "🍽️" },
    { id: "Guida Turistica", name: "Guida", icon: "🗺️" },
    { id: "Attrezzature Sportive", name: "Sport", icon: "⚽" },
    { id: "Animali Ammessi", name: "Pet-friendly", icon: "🐕" },
  ]

  // Pagina di successo
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <motion.div
            className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute top-40 right-20 w-24 h-24 bg-secondary rounded-full"
            animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute bottom-20 left-20 w-28 h-28 bg-accent rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute bottom-40 right-10 w-20 h-20 bg-primary/80 rounded-full"
            animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.8,
            type: "spring",
            stiffness: 100,
            damping: 15,
          }}
          className="relative z-10"
        >
          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-xl w-full max-w-md overflow-hidden">
            <div className="relative p-6 bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="w-20 h-20 bg-primary-foreground/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 1 }}>
                  <CheckCircle className="h-10 w-10 text-primary-foreground" />
                </motion.div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="text-2xl font-bold text-center mb-2"
              >
                Evento Creato! 🎉
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="text-primary-foreground/90 text-center text-sm"
              >
                Il tuo evento è ora live su InVibe
              </motion.p>
            </div>

            <CardContent className="p-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                className="mb-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-2">"{titolo}"</h3>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{location.split(",")[0]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(dataInizio).toLocaleDateString("it-IT")}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Users className="h-3 w-3 mr-1" />
                    {postiTotali} posti
                  </Badge>
                  <Badge className="bg-secondary/10 text-secondary border-secondary/20">€{prezzo} / persona</Badge>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.8 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground mb-4">
                  Il tuo evento è ora visibile a tutti gli utenti InVibe. Riceverai notifiche per ogni nuova
                  prenotazione.
                </p>

                <div className="flex gap-2">
                  <Link href="/" className="flex-1">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="sm">
                      Torna alla Home
                    </Button>
                  </Link>
                  <Link href="/profile" className="flex-1">
                    <Button variant="outline" className="w-full border-border hover:bg-accent" size="sm">
                      I Miei Eventi
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-md border-b border-border px-4 py-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-accent">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Crea Nuovo Evento
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Progress value={getProgress()} className="flex-1 h-2 bg-muted" />
              <span className="text-sm text-muted-foreground font-medium">{currentStep}/4</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 pb-32">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Alert className="border-destructive/50 bg-destructive/10 mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Categoria */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border">
                    <CardTitle className="text-xl flex items-center gap-3 text-foreground">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-bold">1</span>
                      </div>
                      Che tipo di evento vuoi creare?
                      <Target className="h-5 w-5 text-primary ml-auto" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {categorieDisponibili.map((cat) => (
                      <motion.div key={cat.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card
                          className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-lg ${
                            categoria === cat.id
                              ? `border-transparent bg-gradient-to-r ${cat.gradient} text-white shadow-lg`
                              : "border-border hover:border-primary/30 bg-card"
                          }`}
                          onClick={() => handleCategoriaSelect(cat.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className={`text-3xl ${categoria === cat.id ? "" : "grayscale"}`}>{cat.icon}</div>
                              <div className="flex-1">
                                <h3
                                  className={`font-semibold text-lg ${categoria === cat.id ? "text-white" : "text-foreground"}`}
                                >
                                  {cat.name}
                                </h3>
                                <p
                                  className={`text-sm ${categoria === cat.id ? "text-white/90" : "text-muted-foreground"}`}
                                >
                                  {cat.description}
                                </p>
                              </div>
                              {categoria === cat.id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <CheckCircle className="h-6 w-6 text-white" />
                                </motion.div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}

                    {/* Messaggio di auto-avanzamento */}
                    {categoria && autoAdvancing && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20"
                      >
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm font-medium">Passaggio al prossimo step...</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Bottone manuale per andare avanti */}
                    {categoria && !autoAdvancing && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center pt-4"
                      >
                        <Button
                          type="button"
                          onClick={handleNextStep}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-base font-semibold"
                          size="lg"
                        >
                          Continua con {categorieDisponibili.find((c) => c.id === categoria)?.name}
                          <ChevronRight className="h-5 w-5 ml-2" />
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">Oppure attendi l'avanzamento automatico</p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Dettagli */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-secondary/5 to-secondary/10 border-b border-border">
                    <CardTitle className="text-xl flex items-center gap-3 text-foreground">
                      <div className="w-8 h-8 bg-gradient-to-r from-secondary to-secondary/80 rounded-full flex items-center justify-center">
                        <span className="text-secondary-foreground font-bold">2</span>
                      </div>
                      Descrivi il tuo evento
                      <Clock className="h-5 w-5 text-secondary ml-auto" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="titolo" className="text-base font-medium text-foreground">
                        Titolo dell'evento *
                      </Label>
                      <Input
                        id="titolo"
                        value={titolo}
                        onChange={(e) => setTitolo(e.target.value)}
                        placeholder="Es: Weekend in villa con piscina a Toscana"
                        className={`h-12 text-base border-2 focus:border-primary bg-background text-foreground ${
                          fieldErrors.titolo ? "border-destructive" : ""
                        }`}
                        required
                      />
                      {fieldErrors.titolo && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {fieldErrors.titolo}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{titolo.length}/100 caratteri</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descrizione" className="text-base font-medium text-foreground">
                        Descrizione *
                      </Label>
                      <Textarea
                        id="descrizione"
                        value={descrizione}
                        onChange={(e) => setDescrizione(e.target.value)}
                        placeholder="Descrivi nel dettaglio cosa include l'evento, cosa farete, cosa è incluso nel prezzo..."
                        className={`min-h-[120px] text-base border-2 focus:border-primary resize-none bg-background text-foreground ${
                          fieldErrors.descrizione ? "border-destructive" : ""
                        }`}
                        required
                      />
                      {fieldErrors.descrizione && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {fieldErrors.descrizione}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{descrizione.length}/500 caratteri</p>
                    </div>

                    <div className="space-y-2">
                      <LocationPicker value={location} onChange={handleLocationChange} error={locationError} />
                      {fieldErrors.location && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {fieldErrors.location}
                        </p>
                      )}
                    </div>

                    {/* Bottone per continuare inline */}
                    {canProceedToNextStep() && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center pt-4"
                      >
                        <Button
                          type="button"
                          onClick={handleNextStep}
                          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-3 text-base font-semibold"
                          size="lg"
                        >
                          Continua
                          <ChevronRight className="h-5 w-5 ml-2" />
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                {/* Sezione Immagini */}
                <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 border-b border-border">
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                      <Camera className="h-5 w-5" />
                      Immagini dell'evento (opzionale)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="placeLink" className="text-sm font-medium text-foreground">
                          Link della mappa (opzionale)
                        </Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="placeLink"
                              value={placeLink}
                              onChange={(e) => setPlaceLink(e.target.value)}
                              placeholder="https://openstreetmap.org/..."
                              className="pl-10 bg-background text-foreground"
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={generateImageFromPlaceLink}
                            disabled={isLoadingImage || !placeLink}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            {isLoadingImage ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <LinkIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {placePreview && (
                          <p className="text-xs text-primary flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Rilevato: {placePreview}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="imageUpload" className="text-sm font-medium text-foreground">
                          Carica immagini
                        </Label>
                        <div className="relative">
                          <Input
                            id="imageUpload"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            onClick={() => document.getElementById("imageUpload")?.click()}
                            disabled={uploadingImage}
                            variant="outline"
                            className="w-full border-2 border-dashed border-border hover:border-primary bg-background"
                          >
                            {uploadingImage ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <ImageIcon className="h-4 w-4 mr-2" />
                            )}
                            Carica Foto
                          </Button>
                        </div>
                      </div>
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`Immagine ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-border"
                            />
                            <Button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                              size="icon"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Date e Prezzi */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 border-b border-border">
                    <CardTitle className="text-xl flex items-center gap-3 text-foreground">
                      <div className="w-8 h-8 bg-gradient-to-r from-accent to-accent/80 rounded-full flex items-center justify-center">
                        <span className="text-accent-foreground font-bold">3</span>
                      </div>
                      Date e dettagli pratici
                      <DollarSign className="h-5 w-5 text-accent ml-auto" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="dataInizio"
                          className="text-base font-medium flex items-center gap-2 text-foreground"
                        >
                          <Calendar className="h-4 w-4" />
                          Data di inizio *
                        </Label>
                        <Input
                          id="dataInizio"
                          type="datetime-local"
                          value={dataInizio}
                          onChange={(e) => setDataInizio(e.target.value)}
                          className={`h-12 text-base border-2 focus:border-accent bg-background text-foreground ${
                            fieldErrors.dataInizio ? "border-destructive" : ""
                          }`}
                          required
                        />
                        {fieldErrors.dataInizio && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {fieldErrors.dataInizio}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dataFine" className="text-base font-medium text-foreground">
                          Data di fine (opzionale)
                        </Label>
                        <Input
                          id="dataFine"
                          type="datetime-local"
                          value={dataFine}
                          onChange={(e) => setDataFine(e.target.value)}
                          className={`h-12 text-base border-2 focus:border-accent bg-background text-foreground ${
                            fieldErrors.dataFine ? "border-destructive" : ""
                          }`}
                        />
                        {fieldErrors.dataFine && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {fieldErrors.dataFine}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="postiTotali"
                          className="text-base font-medium flex items-center gap-2 text-foreground"
                        >
                          <Users className="h-4 w-4" />
                          Numero di posti *
                        </Label>
                        <Input
                          id="postiTotali"
                          type="number"
                          min="2"
                          max="50"
                          value={postiTotali}
                          onChange={(e) => setPostiTotali(e.target.value)}
                          placeholder="Es: 6"
                          className={`h-12 text-base border-2 focus:border-accent bg-background text-foreground ${
                            fieldErrors.postiTotali ? "border-destructive" : ""
                          }`}
                          required
                        />
                        {fieldErrors.postiTotali && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {fieldErrors.postiTotali}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="prezzo"
                          className="text-base font-medium flex items-center gap-2 text-foreground"
                        >
                          <DollarSign className="h-4 w-4" />
                          Prezzo per persona (€) *
                        </Label>
                        <Input
                          id="prezzo"
                          type="number"
                          min="0"
                          max="10000"
                          step="0.01"
                          value={prezzo}
                          onChange={(e) => setPrezzo(e.target.value)}
                          placeholder="Es: 150.00"
                          className={`h-12 text-base border-2 focus:border-accent bg-background text-foreground ${
                            fieldErrors.prezzo ? "border-destructive" : ""
                          }`}
                          required
                        />
                        {fieldErrors.prezzo && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {fieldErrors.prezzo}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bookingLink" className="text-base font-medium text-foreground">
                        Link per prenotazioni esterne (opzionale)
                      </Label>
                      <Input
                        id="bookingLink"
                        value={bookingLink}
                        onChange={(e) => setBookingLink(e.target.value)}
                        placeholder="https://..."
                        className="h-12 text-base border-2 focus:border-accent bg-background text-foreground"
                      />
                      <p className="text-sm text-muted-foreground">
                        Se hai già un sistema di prenotazione, inserisci il link qui
                      </p>
                    </div>

                    {/* Bottone per continuare inline */}
                    {canProceedToNextStep() && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center pt-4"
                      >
                        <Button
                          type="button"
                          onClick={handleNextStep}
                          className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-base font-semibold"
                          size="lg"
                        >
                          Continua ai Servizi
                          <ChevronRight className="h-5 w-5 ml-2" />
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Servizi */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border">
                    <CardTitle className="text-xl flex items-center gap-3 text-foreground">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-bold">4</span>
                      </div>
                      Servizi e comfort inclusi
                      <Sparkles className="h-5 w-5 text-primary ml-auto" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <Alert className="border-info/50 bg-info/10">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-info-foreground">
                          Seleziona tutti i servizi e comfort che sono inclusi nel prezzo del tuo evento
                        </AlertDescription>
                      </Alert>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {serviziDisponibili.map((servizio) => (
                        <motion.div key={servizio.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Card
                            className={`cursor-pointer transition-all duration-200 border-2 ${
                              servizi.includes(servizio.id)
                                ? "border-primary bg-primary/10 shadow-md"
                                : "border-border hover:border-primary/50 bg-card"
                            }`}
                            onClick={() => toggleServizio(servizio.id)}
                          >
                            <CardContent className="p-3 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <div
                                  className={`text-2xl ${servizi.includes(servizio.id) ? "" : "grayscale opacity-70"}`}
                                >
                                  {typeof servizio.icon === "string" ? servizio.icon : servizio.icon}
                                </div>
                                <span
                                  className={`text-xs font-medium ${
                                    servizi.includes(servizio.id) ? "text-primary" : "text-muted-foreground"
                                  }`}
                                >
                                  {servizio.name}
                                </span>
                                {servizi.includes(servizio.id) && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                  </motion.div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {servizi.length > 0 && (
                      <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <h4 className="font-medium text-foreground mb-2">Servizi selezionati:</h4>
                        <div className="flex flex-wrap gap-2">
                          {servizi.map((servizio) => (
                            <Badge key={servizio} className="bg-primary/10 text-primary border-primary/20">
                              {servizio}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottone per creare evento inline */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center pt-6"
                    >
                      <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold px-12 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Creazione in corso...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Crea il Mio Evento
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Il tuo evento sarà subito visibile a tutti gli utenti
                      </p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Navigation Buttons - SEMPRE VISIBILI */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/98 backdrop-blur-lg border-t border-border p-4 z-50 shadow-lg">
          <div className="max-w-3xl mx-auto flex justify-between items-center gap-4">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex items-center gap-2 border-border hover:bg-accent min-w-[100px]"
              >
                <ChevronLeft className="h-4 w-4" />
                Indietro
              </Button>
            ) : (
              <div className="min-w-[100px]"></div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Passo {currentStep} di 4</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      step <= currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!canProceedToNextStep()}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
              >
                Avanti
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceedToNextStep()}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold px-6 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creazione...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Crea Evento
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
