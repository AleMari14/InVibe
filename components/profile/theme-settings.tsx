"use client"

import { useState } from "react"
import { Sun, Moon, Monitor } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { toast } from "sonner"

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)

  const handleThemeChange = async (value: string) => {
    setIsLoading(true)
    try {
      setTheme(value)
      // TODO: Implement actual theme preference update logic
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulated API call
      toast.success("Tema aggiornato")
    } catch (error) {
      toast.error("Errore durante l'aggiornamento del tema")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sun className="h-5 w-5" />
          Tema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={theme}
          onValueChange={handleThemeChange}
          className="grid grid-cols-3 gap-4"
        >
          <div>
            <RadioGroupItem
              value="light"
              id="light"
              className="peer sr-only"
              disabled={isLoading}
            />
            <Label
              htmlFor="light"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Sun className="mb-3 h-6 w-6" />
              Chiaro
            </Label>
          </div>
          <div>
            <RadioGroupItem
              value="dark"
              id="dark"
              className="peer sr-only"
              disabled={isLoading}
            />
            <Label
              htmlFor="dark"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Moon className="mb-3 h-6 w-6" />
              Scuro
            </Label>
          </div>
          <div>
            <RadioGroupItem
              value="system"
              id="system"
              className="peer sr-only"
              disabled={isLoading}
            />
            <Label
              htmlFor="system"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Monitor className="mb-3 h-6 w-6" />
              Sistema
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
}
