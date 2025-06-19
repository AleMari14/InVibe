"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getProfileImageUrl, generatePlaceholder } from "@/lib/image-utils"
import { cn } from "@/lib/utils"

interface OptimizedAvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: number
  className?: string
  onError?: () => void
}

export function OptimizedAvatar({ src, alt = "", fallback, size = 96, className, onError }: OptimizedAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleImageError = () => {
    console.log("Avatar image failed to load:", src)
    setImageError(true)
    setIsLoading(false)
    onError?.()
  }

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  // Se c'è stato un errore o non c'è src, usa il placeholder
  const imageUrl = imageError || !src ? generatePlaceholder(size, size, alt || "user") : getProfileImageUrl(src, size)

  // Genera il fallback dalle iniziali del nome
  const getFallbackText = () => {
    if (fallback) return fallback
    if (alt) {
      return alt
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return "U"
  }

  return (
    <Avatar className={cn("relative", className)}>
      <AvatarImage
        src={imageUrl || "/placeholder.svg"}
        alt={alt}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className="object-cover"
      />
      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
        {getFallbackText()}
      </AvatarFallback>
      {isLoading && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </Avatar>
  )
}
