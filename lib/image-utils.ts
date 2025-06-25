/**
 * Utility functions for image optimization and handling
 */

// Cloudinary base configuration
const CLOUDINARY_BASE_URL = "https://res.cloudinary.com"

export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: "auto" | "webp" | "jpg" | "png"
  crop?: "fill" | "fit" | "scale" | "crop"
  dpr?: number
}

/**
 * Ottimizza un URL di immagine Cloudinary con le trasformazioni specificate
 */
export function optimizeCloudinaryImage(
  imageUrl: string | null | undefined,
  options: ImageOptimizationOptions = {},
): string {
  const { width = 96, height = 96, quality = "auto", format = "auto", crop = "fill", dpr = 2 } = options

  // Se non c'è URL, restituisci placeholder
  if (!imageUrl) {
    return generatePlaceholder(width, height, "user")
  }

  // Se è un URL Cloudinary, ottimizzalo
  if (imageUrl.includes("cloudinary.com") && imageUrl.includes("/upload/")) {
    try {
      const parts = imageUrl.split("/upload/")
      if (parts.length === 2) {
        const transformations = [
          `w_${width}`,
          `h_${height}`,
          `c_${crop}`,
          `f_${format}`,
          `q_${quality}`,
          `dpr_${dpr}`,
        ].join(",")

        const optimizedUrl = `${parts[0]}/upload/${transformations}/${parts[1]}`
        console.log("Optimized Cloudinary URL:", optimizedUrl)
        return optimizedUrl
      }
    } catch (error) {
      console.error("Error optimizing Cloudinary URL:", error)
    }
  }

  // Se è un URL Google (da OAuth), restituiscilo così com'è
  if (imageUrl.includes("googleusercontent.com")) {
    return imageUrl
  }

  // Se è già un placeholder, restituiscilo così com'è
  if (imageUrl.includes("placeholder.svg")) {
    return imageUrl
  }

  // Per altri URL, restituiscili così come sono
  return imageUrl
}

/**
 * Generates a placeholder image URL
 */
export function generatePlaceholder(width: number, height: number, text = "image"): string {
  return `/placeholder.svg?height=${height}&width=${width}&query=${encodeURIComponent(text)}`
}

/**
 * Optimizes a Cloudinary image URL with transformations
 */
export function getCloudinaryImageUrl(imageUrl: string, width: number, height?: number): string {
  if (!imageUrl || !imageUrl.includes("cloudinary.com")) {
    return imageUrl
  }

  try {
    const parts = imageUrl.split("/upload/")
    if (parts.length !== 2) return imageUrl

    const h = height || width
    const transformations = [
      `w_${width * 2}`, // 2x for retina
      `h_${h * 2}`,
      "c_fill", // Crop to fill
      "f_auto", // Auto format
      "q_auto", // Auto quality
      "dpr_2.0", // Device pixel ratio
      "g_face", // Focus on face if present
    ].join(",")

    return `${parts[0]}/upload/${transformations}/${parts[1]}`
  } catch (error) {
    console.error("Error optimizing Cloudinary URL:", error)
    return imageUrl
  }
}

/**
 * Gets optimized profile image URL
 */
export function getProfileImageUrl(imageUrl: string | null | undefined, size = 96): string {
  if (!imageUrl) {
    return generatePlaceholder(size, size, "user")
  }

  // Handle Cloudinary URLs
  if (imageUrl.includes("cloudinary.com")) {
    return getCloudinaryImageUrl(imageUrl, size)
  }

  // Handle Google OAuth images
  if (imageUrl.includes("googleusercontent.com")) {
    // Google images support size parameter
    const url = new URL(imageUrl)
    url.searchParams.set("s", (size * 2).toString()) // 2x for retina
    return url.toString()
  }

  // Handle other URLs as-is
  return imageUrl
}

/**
 * Optimizes event image URL
 */
export function getEventImageUrl(imageUrl: string | null | undefined, width: number, height: number): string {
  if (!imageUrl) {
    return generatePlaceholder(width, height, "event")
  }

  if (imageUrl.includes("cloudinary.com")) {
    return getCloudinaryImageUrl(imageUrl, width, height)
  }

  return imageUrl
}

/**
 * Validates image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "Il file deve essere un'immagine" }
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: "L'immagine deve essere inferiore a 10MB" }
  }

  // Check image dimensions (optional)
  return { valid: true }
}

/**
 * Creates an optimized image URL with cache busting
 */
export function getOptimizedImageUrl(imageUrl: string | null | undefined, size = 96): string {
  if (!imageUrl) {
    return generatePlaceholder(size, size, "user")
  }

  const optimizedUrl = getProfileImageUrl(imageUrl, size)

  // Add cache busting parameter for immediate updates
  try {
    const url = new URL(optimizedUrl, window.location.origin)
    url.searchParams.set("t", Date.now().toString())
    return url.toString()
  } catch {
    // Fallback if URL construction fails
    return optimizedUrl
  }
}

/**
 * Verifica se un URL è valido
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false

  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
