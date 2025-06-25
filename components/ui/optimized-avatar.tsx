"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface OptimizedAvatarProps {
  src?: string | null
  alt: string
  size?: number
  className?: string
  fallback?: string
}

export function OptimizedAvatar({ src, alt, size = 40, className, fallback, ...props }: OptimizedAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Reset states when src changes
  useEffect(() => {
    setImageError(false)
    setImageLoaded(false)
  }, [src])

  const handleImageError = () => {
    console.log("❌ Image error for:", src)
    setImageError(true)
    setImageLoaded(false)
  }

  const handleImageLoad = () => {
    console.log("✅ Image loaded successfully:", src)
    setImageError(false)
    setImageLoaded(true)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getOptimizedSrc = (url: string) => {
    if (!url) return null

    // Handle Google OAuth images
    if (url.includes("googleusercontent.com")) {
      // Remove existing size parameters and add new ones
      const baseUrl = url.split("=")[0]
      return `${baseUrl}=s${size * 2}-c` // 2x for retina, -c for crop
    }

    // Handle Cloudinary images
    if (url.includes("cloudinary.com") && url.includes("/upload/")) {
      try {
        const parts = url.split("/upload/")
        if (parts.length === 2) {
          const transformations = [`w_${size * 2}`, `h_${size * 2}`, "c_fill", "f_auto", "q_auto", "dpr_2.0"].join(",")
          return `${parts[0]}/upload/${transformations}/${parts[1]}`
        }
      } catch (error) {
        console.error("Error optimizing Cloudinary URL:", error)
      }
    }

    // Add cache busting for immediate updates
    const separator = url.includes("?") ? "&" : "?"
    return `${url}${separator}t=${Date.now()}`
  }

  const initials = fallback || (alt ? getInitials(alt) : "U")
  const optimizedSrc = src ? getOptimizedSrc(src) : null
  const shouldShowImage = optimizedSrc && !imageError

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
        <>
          <Image
            src={optimizedSrc || "/placeholder.svg"}
            alt={alt}
            width={size}
            height={size}
            className="object-cover w-full h-full"
            onError={handleImageError}
            onLoad={handleImageLoad}
            priority={size > 50}
            unoptimized={src?.includes("googleusercontent.com")}
          />
          {!imageLoaded && <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />}
        </>
      ) : (
        <span className="text-muted-foreground font-medium select-none" style={{ fontSize: size * 0.4 }}>
          {initials}
        </span>
      )}
    </div>
  )
}
