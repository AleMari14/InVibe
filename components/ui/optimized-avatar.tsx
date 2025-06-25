"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { getOptimizedImageUrl } from "@/lib/image-utils"

interface OptimizedAvatarProps {
  src?: string | null
  alt: string
  size?: number
  className?: string
  fallback?: string
  forceRefresh?: boolean
  key?: string
}

export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className,
  fallback,
  forceRefresh = false,
  ...props
}: OptimizedAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [imageKey, setImageKey] = useState(0)

  // Force refresh quando forceRefresh cambia
  useEffect(() => {
    if (forceRefresh) {
      setImageError(false)
      setImageKey((prev) => prev + 1)
    }
  }, [forceRefresh, src])

  // Reset error quando src cambia
  useEffect(() => {
    setImageError(false)
    setImageKey((prev) => prev + 1)
  }, [src])

  const optimizedSrc = src ? getOptimizedImageUrl(src, size) : null
  const shouldShowImage = optimizedSrc && !imageError

  const handleImageError = () => {
    console.log("Image error for:", optimizedSrc)
    setImageError(true)
  }

  const handleImageLoad = () => {
    console.log("Image loaded successfully:", optimizedSrc)
    setImageError(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const initials = fallback || (alt ? getInitials(alt) : "U")

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-muted overflow-hidden",
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      {shouldShowImage ? (
        <Image
          key={`avatar-${imageKey}`}
          src={optimizedSrc || "/placeholder.svg"}
          alt={alt}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          onError={handleImageError}
          onLoad={handleImageLoad}
          priority={size > 50}
          unoptimized={optimizedSrc.includes("googleusercontent.com")}
        />
      ) : (
        <span className="text-muted-foreground font-medium select-none" style={{ fontSize: size * 0.4 }}>
          {initials}
        </span>
      )}
    </div>
  )
}
