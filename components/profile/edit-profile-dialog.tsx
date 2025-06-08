"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Upload, Edit } from "lucide-react"
import { toast } from "sonner"

const profileFormSchema = z.object({
  name: z.string().min(2, "Il nome deve contenere almeno 2 caratteri"),
  bio: z.string().max(160, "La bio non può superare i 160 caratteri").optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Numero di telefono non valido").optional(),
  location: z.string().min(2, "La località deve contenere almeno 2 caratteri").optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function EditProfileDialog() {
  const { data: session, update } = useSession()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: session?.user?.name || "",
      bio: "",
      phone: "",
      location: "",
    },
  })

  // Update form values when session changes
  useEffect(() => {
    if (session?.user) {
      form.reset({
        name: session.user.name || "",
        bio: "",
        phone: "",
        location: "",
      })
    }
  }, [session, form])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)
    try {
      // Upload avatar if changed
      let imageUrl = session?.user?.image
      if (avatarFile) {
        const formData = new FormData()
        formData.append("file", avatarFile)
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        if (!uploadResponse.ok) throw new Error("Errore nel caricamento dell'avatar")
        const { url } = await uploadResponse.json()
        imageUrl = url
      }

      // Update profile
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          image: imageUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Errore nell'aggiornamento del profilo")
      }

      // Update session with new data
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          image: imageUrl,
        },
      })

      // Reset form and preview
      setAvatarFile(null)
      setAvatarPreview(null)
      
      toast.success("Profilo aggiornato con successo")
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore nell'aggiornamento del profilo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-border hover:bg-accent">
          <Edit className="h-4 w-4 mr-2" />
          Modifica
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Profilo</DialogTitle>
          <DialogDescription>
            Aggiorna le informazioni del tuo profilo. Clicca salva quando hai finito.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || session?.user?.image || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl">
                  {session?.user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Cambia Avatar
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Il tuo nome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Racconta qualcosa di te"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Breve descrizione che apparirà nel tuo profilo.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefono</FormLabel>
                  <FormControl>
                    <Input placeholder="+39 XXX XXX XXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Località</FormLabel>
                  <FormControl>
                    <Input placeholder="La tua città" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salva Modifiche
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
