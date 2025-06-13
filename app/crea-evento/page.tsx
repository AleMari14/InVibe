"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, Calendar, Users, DollarSign, LinkIcon, CheckCircle, Loader2, ImageIcon, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LocationPicker } from "@/components/ui/location-picker"
import { toast } from "sonner"

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
  const [placeImagePreview, setPlaceImagePreview] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [servizi, setServizi] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [locationError, setLocationError] = useState("")

  const { data: session, status } = useSession()
  const router = useRouter()

  // Funzione per estrarre l'ID del luogo da un link di Google Maps
  const extractPlaceIdFromLink = (link: string) => {
    try {
      // Supporta diversi formati di URL di Google Maps
      const url = new URL(link)

      // Formato 1: https://maps.app.goo.gl/xxx
      if (url.hostname === "maps.app.goo.gl") {
        return { placeId: url.pathname.substring(1), isShortUrl: true }
      }

      // Formato 2: https://www.google.com/maps/place/...
      if (url.pathname.includes("/place/")) {
        const placeId = url.searchParams.get("place_id")
        if (placeId) return { placeId, isShortUrl: false }

        // Se non c'è un place_id esplicito, proviamo a estrarre dal percorso
        const pathParts = url.pathname.split("/")
        const placeIndex = pathParts.indexOf("place")
        if (placeIndex !== -1 && placeIndex < pathParts.length - 1) {
          return { placeId: pathParts[placeIndex + 1].split("/")[0], isShortUrl: false }
        }
      }

      // Formato 3: https://goo.gl/maps/xxx
      if (url.hostname === "goo.gl" && url.pathname.startsWith("/maps/")) {
        return { placeId: url.pathname.substring(6), isShortUrl: true }
      }

      return null
    } catch (e) {
      console.error("Errore nell'analisi del link:", e)
      return null
    }
  }

  // Funzione per generare un'immagine dal link del posto
  const generateImageFromPlaceLink = async () => {
    if (!placeLink) return

    setIsLoadingImage(true)
    setError("")

    try {
      const placeInfo = extractPlaceIdFromLink(placeLink)

      if (!placeInfo) {
        setError("Link non valido. Inserisci un link di Google Maps valido.")
        setIsLoadingImage(false)
        return
      }

      // Generiamo un'immagine basata sul link
      // Nota: in un'implementazione reale, dovresti avere un endpoint server che fa questo
      // per non esporre chiavi API sul client

      // Per ora, utilizziamo un placeholder con il placeId come query
      const imageUrl = `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(placeInfo.placeId)}`
      setPlaceImagePreview(imageUrl)

      toast.success("Anteprima immagine generata")
    } catch (error) {
      console.error("Errore nella generazione dell'immagine:", error)
      setError("Errore nella generazione dell'immagine. Riprova.")
    } finally {
      setIsLoadingImage(false)
    }
  }

  useEffect(() => {
    // Pulisci l'anteprima quando il link cambia
    if (placeLink) {
      setPlaceImagePreview(null)
    }
  }, [placeLink])

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

  const handleLocationChange = (newLocation: string, newCoordinates: { lat: number; lng: number }) => {
    setLocation(newLocation)
    setCoordinates(newCoordinates)
    setLocationError("")
  }

  const validateForm = () => {
    if (!coordinates) {
      setLocationError("Seleziona una località valida sulla mappa")
      return false
    }
    if (!titolo.trim()) {
      setError("Il titolo è obbligatorio")
      return false
    }
    if (!descrizione.trim()) {
      setError("La descrizione è obbligatoria")
      return false
    }
    if (!dataInizio) {
      setError("La data di inizio è obbligatoria")
      return false
    }
    if (dataFine && new Date(dataFine) < new Date(dataInizio)) {
      setError("La data di fine deve essere successiva alla data di inizio")
      return false
    }
    if (!postiTotali || Number.parseInt(postiTotali) < 2) {
      setError("Il numero di posti deve essere almeno 2")
      return false
    }
    if (!prezzo || Number.parseFloat(prezzo) <= 0) {
      setError("Il prezzo deve essere maggiore di 0")
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
        images: placeImagePreview ? [placeImagePreview] : [],
      }

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(true)
        toast.success("Evento creato con successo!")
        setTimeout(() => {
          router.push("/")
        }, 2000)
      } else {
        throw new Error(result.error || "Errore nella creazione dell'evento")
      }
    } catch (error) {
      console.error("Error creating event:", error)
      setError(error instanceof Error ? error.message : "Errore nella creazione dell'evento")
      toast.error("Errore nella creazione dell'evento")
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
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Crea Nuovo Evento
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={getProgress()} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground">{currentStep}/4</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4 pb-20">
        {error && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

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
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
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
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        categoria === cat.id
                          ? `border-transparent bg-gradient-to-r ${cat.gradient} text-white shadow-lg`
                          : "border-border hover:border-gray-300 hover:shadow-md"
                      }`}
                      onClick={() => setCategoria(cat.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon}</span>
                        <div>
                          <div className="font-medium">{cat.name}</div>
                          <div
                            className={`text-sm ${categoria === cat.id ? "text-white/80" : "text-muted-foreground"}`}
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

          {/* Step 2: Informazioni Base */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">2</span>
                    </div>
                    Informazioni Base
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="titolo">Titolo dell'Evento *</Label>
                    <Input
                      id="titolo"
                      placeholder="es. Villa con Piscina - Weekend in Toscana"
                      value={titolo}
                      onChange={(e) => setTitolo(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descrizione">Descrizione *</Label>
                    <Textarea
                      id="descrizione"
                      placeholder="Descrivi il tuo evento, cosa include, cosa aspettarsi..."
                      value={descrizione}
                      onChange={(e) => setDescrizione(e.target.value)}
                      rows={4}
                      className="mt-1"
                      required
                    />
                  </div>
                  <LocationPicker value={location} onChange={handleLocationChange} error={locationError} />

                  {categoria === "casa" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="placeLink" className="flex items-center gap-1">
                          Link Google Maps (opzionale)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-xs">
                                  Inserisci un link di Google Maps per generare automaticamente un'immagine del luogo
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateImageFromPlaceLink}
                          disabled={!placeLink || isLoadingImage}
                          className="text-xs"
                        >
                          {isLoadingImage ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Caricamento...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Genera Immagine
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="placeLink"
                          type="url"
                          placeholder="https://maps.google.com/..."
                          value={placeLink}
                          onChange={(e) => setPlaceLink(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {placeImagePreview && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">Anteprima immagine:</p>
                          <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border">
                            <img
                              src={placeImagePreview || "/placeholder.svg"}
                              alt="Anteprima luogo"
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Questa immagine verrà utilizzata come copertina dell'evento
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Date, Partecipanti e Prezzo */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">3</span>
                    </div>
                    Date, Partecipanti e Prezzo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dataInizio">Data Inizio *</Label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="dataInizio"
                          type="date"
                          value={dataInizio}
                          onChange={(e) => setDataInizio(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="dataFine">Data Fine</Label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="dataFine"
                          type="date"
                          value={dataFine}
                          onChange={(e) => setDataFine(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="postiTotali">Numero Totale di Posti *</Label>
                    <div className="relative mt-1">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="postiTotali"
                        type="number"
                        placeholder="es. 8"
                        value={postiTotali}
                        onChange={(e) => setPostiTotali(e.target.value)}
                        className="pl-10"
                        min="2"
                        max="50"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="prezzo">Prezzo per Persona (€) *</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="prezzo"
                        type="number"
                        placeholder="es. 85"
                        value={prezzo}
                        onChange={(e) => setPrezzo(e.target.value)}
                        className="pl-10"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bookingLink">Link di Prenotazione (opzionale)</Label>
                    <div className="relative mt-1">
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="bookingLink"
                        type="url"
                        placeholder="https://..."
                        value={bookingLink}
                        onChange={(e) => setBookingLink(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
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
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">4</span>
                    </div>
                    Servizi Inclusi (Opzionale)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
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
                            className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            {servizio}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4">
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="flex-1">
              Indietro
            </Button>
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceedToNextStep()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Avanti
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting || !canProceedToNextStep()}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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
      </form>
    </div>
  )
}
