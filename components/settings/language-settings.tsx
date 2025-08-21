"use client"

import { useState } from "react"
import { Globe, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"

const languages = [
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
]

export function LanguageSettings() {
  const { language, setLanguage, t } = useLanguage()
  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (selectedLanguage === language) return

    try {
      setSaving(true)

      // Simula un salvataggio (potresti voler salvare la preferenza sul server)
      await new Promise((resolve) => setTimeout(resolve, 500))

      setLanguage(selectedLanguage as "it" | "en" | "es")

      const languageName = languages.find((lang) => lang.code === selectedLanguage)?.name
      toast.success(`Lingua cambiata in ${languageName}`)
    } catch (error) {
      console.error("Error saving language:", error)
      toast.error("Errore nel salvataggio della lingua")
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t("language")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={selectedLanguage} onValueChange={setSelectedLanguage} className="space-y-3">
            {languages.map((lang) => (
              <div key={lang.code} className="flex items-center space-x-3">
                <RadioGroupItem value={lang.code} id={lang.code} />
                <Label
                  htmlFor={lang.code}
                  className="flex items-center gap-3 cursor-pointer flex-1 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{lang.name}</div>
                  </div>
                  {language === lang.code && <Check className="h-4 w-4 text-primary" />}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedLanguage !== language && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 border-t">
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t("save_changes")}
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
