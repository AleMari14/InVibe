import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  let interval = seconds / 31536000
  if (interval > 1) {
    return Math.floor(interval) + " anni fa"
  }
  interval = seconds / 2592000
  if (interval > 1) {
    return Math.floor(interval) + " mesi fa"
  }
  interval = seconds / 86400
  if (interval > 1) {
    return Math.floor(interval) + " giorni fa"
  }
  interval = seconds / 3600
  if (interval > 1) {
    return Math.floor(interval) + " ore fa"
  }
  interval = seconds / 60
  if (interval > 1) {
    return Math.floor(interval) + " minuti fa"
  }
  return "pochi secondi fa"
}
