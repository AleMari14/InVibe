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
    create_event: "Crea Evento",

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
    loading_profile: "Caricamento profilo...",

    // Events
    event_details: "Dettagli Evento",
    book_now: "Prenota Ora",
    available_spots: "Posti Disponibili",
    per_person: "per persona",
    event_not_found: "Evento non trovato",
    back_to_home: "Torna alla Home",
    description: "Descrizione",
    included_services: "Servizi Inclusi",
    views: "visualizzazioni",
    verified: "Verificato",
    this_is_your_event: "Questo è il tuo evento. Puoi modificarlo o eliminarlo usando il menu in alto a destra.",
    booking_link_unavailable: "Link di prenotazione non disponibile",
    no_image_available: "Nessuna immagine disponibile",

    // Bookings
    my_bookings: "Le Mie Prenotazioni",
    all: "Tutte",
    confirmed: "Confermate",
    pending: "In Attesa",
    completed: "Completate",
    cancelled: "Annullate",
    no_bookings: "Nessuna prenotazione",
    explore_events: "Esplora Eventi",

    // Reviews
    write_review: "Scrivi Recensione",
    your_rating: "La tua valutazione",
    your_comment: "Il tuo commento",
    comment_placeholder: "Condividi la tua esperienza...",
    submit_review: "Invia Recensione",
    review_success: "Recensione inviata con successo!",
    already_reviewed: "Hai già recensito questo evento",
    must_participate: "Puoi recensire solo eventi a cui hai partecipato",
    reviews_received: "Recensioni Ricevute",
    reviews_given: "Recensioni Date",
    no_reviews_found: "Nessuna recensione trovata",
    no_reviews_given: "Nessuna recensione data",

    // Achievements
    first_event: "Primo Evento",
    first_event_desc: "Crea il tuo primo evento",
    event_creator: "Organizzatore",
    event_creator_desc: "Crea 5 eventi",
    event_master: "Maestro degli Eventi",
    event_master_desc: "Crea 20 eventi",
    social_butterfly: "Farfalla Sociale",
    social_butterfly_desc: "Partecipa a 10 eventi",
    party_animal: "Animale da Festa",
    party_animal_desc: "Partecipa a 50 eventi",
    reviewer: "Recensore",
    reviewer_desc: "Scrivi 10 recensioni",
    communicator: "Comunicatore",
    communicator_desc: "Invia 100 messaggi",
    perfect_rating: "Perfezione",
    perfect_rating_desc: "Raggiungi un rating di 5.0",
    streak_master: "Maestro della Costanza",
    streak_master_desc: "Accedi per 30 giorni consecutivi",
    progress: "Progresso",
    level: "Livello",
    points: "punti",
    next_level_progress: "Progresso al prossimo livello",

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
    name: "Nome",
    email: "Email",
    bio: "Bio",
    location: "Località",
    phone: "Telefono",
    change_photo: "Cambia Foto",
    saving: "Salvando...",
    your_name: "Il tuo nome",
    tell_about_yourself: "Raccontaci qualcosa di te...",
    your_city: "La tua città",
    save_changes: "Salva Modifiche",

    // Settings
    general: "Generale",
    notifications_settings: "Notifiche",
    privacy_settings: "Privacy",
    events_updates: "Eventi e Aggiornamenti",
    messages_chat: "Messaggi e Chat",
    reviews_feedback: "Recensioni e Feedback",
    offers_promotions: "Offerte e Promozioni",
    push_notifications: "Notifiche Push",
    email_notifications: "Notifiche Email",
    profile_visible: "Profilo Visibile",
    show_email: "Mostra Email",
    show_phone: "Mostra Telefono",
    allow_messages: "Consenti Messaggi",
    light_theme: "Chiaro",
    dark_theme: "Scuro",
    system_theme: "Sistema",
    customize_app: "Personalizza l'app",
    your_reviews: "Le tue recensioni",

    // Rarity
    common: "Comune",
    rare: "Raro",
    epic: "Epico",
    legendary: "Leggendario",
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
    create_event: "Create Event",

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
    loading_profile: "Loading profile...",

    // Events
    event_details: "Event Details",
    book_now: "Book Now",
    available_spots: "Available Spots",
    per_person: "per person",
    event_not_found: "Event not found",
    back_to_home: "Back to Home",
    description: "Description",
    included_services: "Included Services",
    views: "views",
    verified: "Verified",
    this_is_your_event: "This is your event. You can edit or delete it using the menu in the top right.",
    booking_link_unavailable: "Booking link not available",
    no_image_available: "No image available",

    // Bookings
    my_bookings: "My Bookings",
    all: "All",
    confirmed: "Confirmed",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    no_bookings: "No bookings",
    explore_events: "Explore Events",

    // Reviews
    write_review: "Write Review",
    your_rating: "Your rating",
    your_comment: "Your comment",
    comment_placeholder: "Share your experience...",
    submit_review: "Submit Review",
    review_success: "Review submitted successfully!",
    already_reviewed: "You have already reviewed this event",
    must_participate: "You can only review events you participated in",
    reviews_received: "Reviews Received",
    reviews_given: "Reviews Given",
    no_reviews_found: "No reviews found",
    no_reviews_given: "No reviews given",

    // Achievements
    first_event: "First Event",
    first_event_desc: "Create your first event",
    event_creator: "Event Creator",
    event_creator_desc: "Create 5 events",
    event_master: "Event Master",
    event_master_desc: "Create 20 events",
    social_butterfly: "Social Butterfly",
    social_butterfly_desc: "Participate in 10 events",
    party_animal: "Party Animal",
    party_animal_desc: "Participate in 50 events",
    reviewer: "Reviewer",
    reviewer_desc: "Write 10 reviews",
    communicator: "Communicator",
    communicator_desc: "Send 100 messages",
    perfect_rating: "Perfection",
    perfect_rating_desc: "Achieve a 5.0 rating",
    streak_master: "Streak Master",
    streak_master_desc: "Login for 30 consecutive days",
    progress: "Progress",
    level: "Level",
    points: "points",
    next_level_progress: "Progress to next level",

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
    name: "Name",
    email: "Email",
    bio: "Bio",
    location: "Location",
    phone: "Phone",
    change_photo: "Change Photo",
    saving: "Saving...",
    your_name: "Your name",
    tell_about_yourself: "Tell us about yourself...",
    your_city: "Your city",
    save_changes: "Save Changes",

    // Settings
    general: "General",
    notifications_settings: "Notifications",
    privacy_settings: "Privacy",
    events_updates: "Events & Updates",
    messages_chat: "Messages & Chat",
    reviews_feedback: "Reviews & Feedback",
    offers_promotions: "Offers & Promotions",
    push_notifications: "Push Notifications",
    email_notifications: "Email Notifications",
    profile_visible: "Profile Visible",
    show_email: "Show Email",
    show_phone: "Show Phone",
    allow_messages: "Allow Messages",
    light_theme: "Light",
    dark_theme: "Dark",
    system_theme: "System",
    customize_app: "Customize app",
    your_reviews: "Your reviews",

    // Rarity
    common: "Common",
    rare: "Rare",
    epic: "Epic",
    legendary: "Legendary",
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
    create_event: "Crear Evento",

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
    loading_profile: "Cargando perfil...",

    // Events
    event_details: "Detalles del Evento",
    book_now: "Reservar Ahora",
    available_spots: "Plazas Disponibles",
    per_person: "por persona",
    event_not_found: "Evento no encontrado",
    back_to_home: "Volver al Inicio",
    description: "Descripción",
    included_services: "Servicios Incluidos",
    views: "visualizaciones",
    verified: "Verificado",
    this_is_your_event:
      "Este es tu evento. Puedes editarlo o eliminarlo usando el menú en la esquina superior derecha.",
    booking_link_unavailable: "Enlace de reserva no disponible",
    no_image_available: "No hay imagen disponible",

    // Bookings
    my_bookings: "Mis Reservas",
    all: "Todas",
    confirmed: "Confirmadas",
    pending: "Pendientes",
    completed: "Completadas",
    cancelled: "Canceladas",
    no_bookings: "Sin reservas",
    explore_events: "Explorar Eventos",

    // Reviews
    write_review: "Escribir Reseña",
    your_rating: "Tu valoración",
    your_comment: "Tu comentario",
    comment_placeholder: "Comparte tu experiencia...",
    submit_review: "Enviar Reseña",
    review_success: "¡Reseña enviada con éxito!",
    already_reviewed: "Ya has reseñado este evento",
    must_participate: "Solo puedes reseñar eventos en los que participaste",
    reviews_received: "Reseñas Recibidas",
    reviews_given: "Reseñas Dadas",
    no_reviews_found: "No se encontraron reseñas",
    no_reviews_given: "No hay reseñas dadas",

    // Achievements
    first_event: "Primer Evento",
    first_event_desc: "Crea tu primer evento",
    event_creator: "Creador de Eventos",
    event_creator_desc: "Crea 5 eventos",
    event_master: "Maestro de Eventos",
    event_master_desc: "Crea 20 eventos",
    social_butterfly: "Mariposa Social",
    social_butterfly_desc: "Participa en 10 eventos",
    party_animal: "Animal de Fiesta",
    party_animal_desc: "Participa en 50 eventos",
    reviewer: "Reseñador",
    reviewer_desc: "Escribe 10 reseñas",
    communicator: "Comunicador",
    communicator_desc: "Envía 100 mensajes",
    perfect_rating: "Perfección",
    perfect_rating_desc: "Alcanza una valoración de 5.0",
    streak_master: "Maestro de la Constancia",
    streak_master_desc: "Inicia sesión durante 30 días consecutivos",
    progress: "Progreso",
    level: "Nivel",
    points: "puntos",
    next_level_progress: "Progreso al siguiente nivel",

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
    name: "Nombre",
    email: "Email",
    bio: "Biografía",
    location: "Ubicación",
    phone: "Teléfono",
    change_photo: "Cambiar Foto",
    saving: "Guardando...",
    your_name: "Tu nombre",
    tell_about_yourself: "Cuéntanos sobre ti...",
    your_city: "Tu ciudad",
    save_changes: "Guardar Cambios",

    // Settings
    general: "General",
    notifications_settings: "Notificaciones",
    privacy_settings: "Privacidad",
    events_updates: "Eventos y Actualizaciones",
    messages_chat: "Mensajes y Chat",
    reviews_feedback: "Reseñas y Comentarios",
    offers_promotions: "Ofertas y Promociones",
    push_notifications: "Notificaciones Push",
    email_notifications: "Notificaciones por Email",
    profile_visible: "Perfil Visible",
    show_email: "Mostrar Email",
    show_phone: "Mostrar Teléfono",
    allow_messages: "Permitir Mensajes",
    light_theme: "Claro",
    dark_theme: "Oscuro",
    system_theme: "Sistema",
    customize_app: "Personalizar app",
    your_reviews: "Tus reseñas",

    // Rarity
    common: "Común",
    rare: "Raro",
    epic: "Épico",
    legendary: "Legendario",
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
