"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "it" | "en" | "es"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  it: {
    // Navigation
    home: "Home",
    profile: "Profilo",
    messages: "Messaggi",
    favorites: "Preferiti",
    bookings: "Prenotazioni",
    notifications: "Notifiche",
    settings: "Impostazioni",

    // Profile
    edit_profile: "Modifica Profilo",
    my_events: "I Miei Eventi",
    verified_member: "Membro Verificato",
    events_created: "Eventi Creati",
    participations: "Partecipazioni",
    rating: "Rating",
    reviews: "Recensioni",
    achievement_system: "Sistema Achievement",
    language: "Lingua",
    theme: "Tema",
    privacy: "Privacy",
    payments: "Pagamenti",
    support: "Supporto",
    logout: "Disconnetti",

    // Events
    create_event: "Crea Evento",
    event_details: "Dettagli Evento",
    book_now: "Prenota Ora",
    available_spots: "Posti Disponibili",
    per_person: "per persona",
    event_not_found: "Evento non trovato",
    back_to_home: "Torna alla Home",

    // Bookings
    my_bookings: "Le Mie Prenotazioni",
    all: "Tutte",
    confirmed: "Confermate",
    pending: "In Attesa",
    completed: "Completate",
    cancelled: "Annullate",
    no_bookings: "Nessuna prenotazione",
    explore_events: "Esplora Eventi",

    // Common
    loading: "Caricamento...",
    save: "Salva",
    cancel: "Annulla",
    delete: "Elimina",
    edit: "Modifica",
    close: "Chiudi",
    confirm: "Conferma",
    success: "Successo",
    error: "Errore",
  },
  en: {
    // Navigation
    home: "Home",
    profile: "Profile",
    messages: "Messages",
    favorites: "Favorites",
    bookings: "Bookings",
    notifications: "Notifications",
    settings: "Settings",

    // Profile
    edit_profile: "Edit Profile",
    my_events: "My Events",
    verified_member: "Verified Member",
    events_created: "Events Created",
    participations: "Participations",
    rating: "Rating",
    reviews: "Reviews",
    achievement_system: "Achievement System",
    language: "Language",
    theme: "Theme",
    privacy: "Privacy",
    payments: "Payments",
    support: "Support",
    logout: "Logout",

    // Events
    create_event: "Create Event",
    event_details: "Event Details",
    book_now: "Book Now",
    available_spots: "Available Spots",
    per_person: "per person",
    event_not_found: "Event not found",
    back_to_home: "Back to Home",

    // Bookings
    my_bookings: "My Bookings",
    all: "All",
    confirmed: "Confirmed",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    no_bookings: "No bookings",
    explore_events: "Explore Events",

    // Common
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    confirm: "Confirm",
    success: "Success",
    error: "Error",
  },
  es: {
    // Navigation
    home: "Inicio",
    profile: "Perfil",
    messages: "Mensajes",
    favorites: "Favoritos",
    bookings: "Reservas",
    notifications: "Notificaciones",
    settings: "Configuración",

    // Profile
    edit_profile: "Editar Perfil",
    my_events: "Mis Eventos",
    verified_member: "Miembro Verificado",
    events_created: "Eventos Creados",
    participations: "Participaciones",
    rating: "Valoración",
    reviews: "Reseñas",
    achievement_system: "Sistema de Logros",
    language: "Idioma",
    theme: "Tema",
    privacy: "Privacidad",
    payments: "Pagos",
    support: "Soporte",
    logout: "Cerrar Sesión",

    // Events
    create_event: "Crear Evento",
    event_details: "Detalles del Evento",
    book_now: "Reservar Ahora",
    available_spots: "Plazas Disponibles",
    per_person: "por persona",
    event_not_found: "Evento no encontrado",
    back_to_home: "Volver al Inicio",

    // Bookings
    my_bookings: "Mis Reservas",
    all: "Todas",
    confirmed: "Confirmadas",
    pending: "Pendientes",
    completed: "Completadas",
    cancelled: "Canceladas",
    no_bookings: "Sin reservas",
    explore_events: "Explorar Eventos",

    // Common
    loading: "Cargando...",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    close: "Cerrar",
    confirm: "Confirmar",
    success: "Éxito",
    error: "Error",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("it")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferred-language") as Language
    if (savedLanguage && ["it", "en", "es"].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("preferred-language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
