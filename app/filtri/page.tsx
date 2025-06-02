"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, MapPin, Calendar, Users, DollarSign, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"

export default function FiltriPage() {
  const [fasciaPrezzi, setFasciaPrezzi] = useState([30, 300])
  const [numeroPersone, setNumeroPersone] = useState([1, 8])
  const [serviziSelezionati, setServiziSelezionati] = useState<string[]>([])
  const [localita, setLocalita] = useState("")
  const [dataDa, setDataDa] = useState("")
  const [dataA, setDataA] = useState("")
  const [categoria, setCategoria] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Load filters from URL params
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const location = searchParams.get("location")
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")

    if (category) setCategoria(category)
    if (search) setSearchQuery(search)
    if (location) setLocalita(location)
    if (priceMin && priceMax) {
      setFasciaPrezzi([Number.parseInt(priceMin), Number.parseInt(priceMax)])
    }
  }, [searchParams])

  const servizi = [
    "Piscina",
    "WiFi",
    "Parcheggio",
    "Cucina",
    "Aria Condizionata",
    "Riscaldamento",
    "TV",
    "Lavatrice",
    "Terrazza",
    "Giardino",
    "Trasporti Inclusi",
    "Colazione Inclusa",
    "Animali Ammessi",
  ]

  const toggleServizio = (servizio: string) => {
    setServiziSelezionati((prev) =>
      prev.includes(servizio) ? prev.filter((s) => s !== servizio) : [...prev, servizio],
    )
  }

  const azzeraFiltri = () => {
    setFasciaPrezzi([30, 300])
    setNumeroPersone([1, 8])
    setServiziSelezionati([])
    setLocalita("")
    setDataDa("")
    setDataA("")
    setCategoria("")
    setSearchQuery("")
  }

  const applicaFiltri = () => {
    const params = new URLSearchParams()

    if (categoria && categoria !== "all") params.append("category", categoria)
    if (searchQuery) params.append("search", searchQuery)
    if (localita) params.append("location", localita)
    if (fasciaPrezzi[0] !== 30) params.append("priceMin", fasciaPrezzi[0].toString())
    if (fasciaPrezzi[1] !== 300) params.append("priceMax", fasciaPrezzi[1].toString())

    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Filtri
            </h1>
          </div>
          <Button variant="ghost" onClick={azzeraFiltri}>
            Azzera Tutto
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-20">
        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Ricerca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Cerca eventi, località, descrizioni..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Categoria */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le categorie</SelectItem>
                  <SelectItem value="casa">🏠 Case</SelectItem>
                  <SelectItem value="viaggio">✈️ Viaggi</SelectItem>
                  <SelectItem value="evento">🎉 Eventi</SelectItem>
                  <SelectItem value="esperienza">🌟 Esperienze</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>

        {/* Località */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Località
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Inserisci città, regione o paese"
                value={localita}
                onChange={(e) => setLocalita(e.target.value)}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Date */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataDa">Da</Label>
                  <Input id="dataDa" type="date" value={dataDa} onChange={(e) => setDataDa(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="dataA">A</Label>
                  <Input id="dataA" type="date" value={dataA} onChange={(e) => setDataA(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Fascia Prezzi */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fascia di Prezzo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="px-2">
                <Slider
                  value={fasciaPrezzi}
                  onValueChange={setFasciaPrezzi}
                  max={500}
                  min={0}
                  step={10}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>€{fasciaPrezzi[0]}</span>
                <span>€{fasciaPrezzi[1]}+</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Numero Persone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Numero di Persone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="px-2">
                <Slider
                  value={numeroPersone}
                  onValueChange={setNumeroPersone}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {numeroPersone[0]} {numeroPersone[0] === 1 ? "persona" : "persone"}
                </span>
                <span>{numeroPersone[1]}+ persone</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Servizi */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Servizi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {servizi.map((servizio) => (
                  <motion.div key={servizio} className="flex items-center space-x-2" whileHover={{ scale: 1.02 }}>
                    <Checkbox
                      id={servizio}
                      checked={serviziSelezionati.includes(servizio)}
                      onCheckedChange={() => toggleServizio(servizio)}
                    />
                    <Label htmlFor={servizio} className="text-sm cursor-pointer">
                      {servizio}
                    </Label>
                  </motion.div>
                ))}
              </div>

              {serviziSelezionati.length > 0 && (
                <motion.div className="mt-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="text-sm font-medium mb-2">Selezionati:</div>
                  <div className="flex flex-wrap gap-1">
                    {serviziSelezionati.map((servizio) => (
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

        {/* Applica Filtri */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Button
            onClick={applicaFiltri}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Applica Filtri
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
