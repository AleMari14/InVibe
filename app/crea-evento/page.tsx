"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, Loader2, Info, ImagePlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { LocationPicker } from "@/components/ui/location-picker"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Il titolo deve essere di almeno 5 caratteri",
  }),
  description: z.string().min(20, {
    message: "La descrizione deve essere di almeno 20 caratteri",
  }),
  date: z.date({
    required_error: "Seleziona una data per l'evento",
  }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Inserisci un orario valido (HH:MM)",
  }),
  location: z.object({
    address: z.string().min(1, "L'indirizzo è obbligatorio"),
    lat: z.number(),
    lng: z.number(),
  }),
  category: z.string().min(1, "Seleziona una categoria"),
  maxParticipants: z.string().transform((val) => Number.parseInt(val, 10)),
  price: z.string().transform((val) => Number.parseFloat(val)),
  placeLink: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function CreateEventPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      time: "20:00",
      location: {
        address: "",
        lat: 0,
        lng: 0,
      },
      category: "",
      maxParticipants: "10",
      price: "0",
      placeLink: "",
    },
  })

  const selectedCategory = form.watch("category")

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      const eventData = {
        ...data,
        images,
        datetime: new Date(`${format(data.date, "yyyy-MM-dd")}T${data.time}:00`).toISOString(),
      }

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        throw new Error("Errore durante la creazione dell'evento")
      }

      const result = await response.json()
      toast.success("Evento creato con successo!")
      router.push(`/evento/${result.id}`)
    } catch (error) {
      console.error("Error creating event:", error)
      toast.error("Errore durante la creazione dell'evento")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const formData = new FormData()
    formData.append("file", files[0])

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Errore durante il caricamento dell'immagine")
      }

      const data = await response.json()
      setImages((prev) => [...prev, data.url])
      toast.success("Immagine caricata con successo!")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Errore durante il caricamento dell'immagine")
    }
  }

  const generateImageFromLink = async () => {
    const placeLink = form.getValues("placeLink")
    if (!placeLink) {
      toast.error("Inserisci un link valido di Google Maps")
      return
    }

    setIsGeneratingImage(true)
    try {
      const response = await fetch("/api/place-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ placeLink }),
      })

      if (!response.ok) {
        throw new Error("Errore durante la generazione dell'immagine")
      }

      const data = await response.json()
      if (data.imageUrl) {
        setImages((prev) => [...prev, data.imageUrl])
        toast.success("Immagine generata con successo!")
      } else {
        toast.error("Impossibile generare l'immagine dal link fornito")
      }
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error("Errore durante la generazione dell'immagine")
    } finally {
      setIsGeneratingImage(false)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <h1 className="mb-8 text-3xl font-bold">Crea un nuovo evento</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titolo</FormLabel>
                <FormControl>
                  <Input placeholder="Festa di compleanno, Aperitivo, ecc." {...field} />
                </FormControl>
                <FormDescription>Un titolo accattivante per il tuo evento</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrizione</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrivi il tuo evento..." className="min-h-32" {...field} />
                </FormControl>
                <FormDescription>Fornisci dettagli sul tuo evento, cosa farete, cosa portare, ecc.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP", { locale: it }) : <span>Seleziona una data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>La data in cui si terrà l'evento</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orario</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormDescription>L'orario di inizio dell'evento</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Luogo</FormLabel>
                <FormControl>
                  <LocationPicker
                    onLocationSelect={(location) => {
                      field.onChange(location)
                    }}
                    defaultValue={field.value.address}
                  />
                </FormControl>
                <FormDescription>L'indirizzo dove si terrà l'evento</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona una categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="festa">Festa</SelectItem>
                    <SelectItem value="aperitivo">Aperitivo</SelectItem>
                    <SelectItem value="cena">Cena</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>La categoria dell'evento aiuta gli utenti a trovarlo</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedCategory === "casa" && (
            <FormField
              control={form.control}
              name="placeLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Link Google Maps
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Inserisci un link di Google Maps per generare automaticamente un'immagine del luogo</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="https://maps.google.com/..." {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateImageFromLink}
                      disabled={isGeneratingImage || !field.value}
                    >
                      {isGeneratingImage ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="mr-2 h-4 w-4" />
                      )}
                      Genera Immagine
                    </Button>
                  </div>
                  <FormDescription>
                    Opzionale: inserisci un link di Google Maps per generare un'immagine del luogo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="maxParticipants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numero massimo di partecipanti</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormDescription>Quante persone possono partecipare</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prezzo (€)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" {...field} />
                  </FormControl>
                  <FormDescription>Quanto costa partecipare (0 per eventi gratuiti)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormLabel>Immagini</FormLabel>
            <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
              {images.map((image, index) => (
                <div key={index} className="relative aspect-video overflow-hidden rounded-md">
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`Immagine evento ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => {
                      setImages((prev) => prev.filter((_, i) => i !== index))
                    }}
                  >
                    Rimuovi
                  </Button>
                </div>
              ))}
              <div className="flex aspect-video items-center justify-center rounded-md border-2 border-dashed">
                <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center">
                  <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Carica un'immagine</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
            <FormDescription className="mt-2">Aggiungi immagini per il tuo evento (consigliato)</FormDescription>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creazione in corso...
              </>
            ) : (
              "Crea Evento"
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
