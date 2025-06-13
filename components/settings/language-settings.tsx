"use client"

import { useState } from "react"
import { Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface Language {
  code: string
  name: string
  flag: string
}

export function LanguageSettings() {
  const [selectedLanguage, setSelectedLanguage] = useState("it")
  const [isLoading, setIsLoading] = useState(false)

  const languages: Language[] = [
    { code: "it", name: "Italiano", flag: "🇮🇹" },
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "es", name: "Español", flag: "🇪🇸" },
  ]

  const handleLanguageChange = async (value: string) => {
    setIsLoading(true)
    try {
      setSelectedLanguage(value)
      // Simuliamo una chiamata API
      await new Promise((resolve) => setTimeout(resolve, 600))

      // Salviamo la preferenza nel localStorage
      localStorage.setItem("preferred-language", value)

      toast.success("Lingua aggiornata con successo", {
        description: `La lingua è stata impostata su ${languages.find((l) => l.code === value)?.name}`,
        icon: languages.find((l) => l.code === value)?.flag,
      })
    } catch (error) {
      toast.error("Errore durante l'aggiornamento della lingua")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="border-border bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Lingua</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedLanguage} onValueChange={handleLanguageChange} className="grid grid-cols-3 gap-4">
            {languages.map((language) => (
              <div key={language.code}>
                <RadioGroupItem
                  value={language.code}
                  id={`lang-${language.code}`}
                  className="peer sr-only"
                  disabled={isLoading}
                />
                <Label
                  htmlFor={`lang-${language.code}`}
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 [&:has([data-state=checked])]:border-blue-500 transition-all duration-200 cursor-pointer"
                >
                  <span className="text-2xl mb-2">{language.flag}</span>
                  {language.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </motion.div>
  )
}
