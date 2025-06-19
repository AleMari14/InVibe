/**
 * Utility functions for image optimization and handling
 */

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
    return `/placeholder.svg?height=${height}&width=${width}&query=user`
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
 * Genera un URL placeholder con query personalizzata
 */
export function generatePlaceholder(width: number, height: number, query = "user"): string {
  return `/placeholder.svg?height=${height}&width=${width}&query=${query}`
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

/**
 * Ottiene l'URL dell'immagine del profilo ottimizzato
 */
export function getProfileImageUrl(imageUrl: string | null | undefined, size = 96): string {
  return optimizeCloudinaryImage(imageUrl, {
    width: size,
    height: size,
    crop: "fill",
    format: "auto",
    quality: "auto",
    dpr: 2,
  })
}
