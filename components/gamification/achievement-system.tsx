"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Trophy,
  Users,
  MapPin,
  Crown,
  Camera,
  Medal,
  Star,
  Heart,
  Zap,
  Target,
  Sparkles,
  Gift,
  Shield,
  Flame,
  CheckCircle,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import confetti from "canvas-confetti"

interface AchievementSystemProps {
  stats: {
    eventsCreated: number
    eventsParticipated: number
    totalReviews: number
    totalMessages: number
    rating: number
    consecutiveDays: number
    totalPoints: number
    level: number
  }
  onAchievementUnlock?: (achievement: Achievement) => void
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: any
  unlocked: boolean
  progress: number
  points: number
  rarity: "common" | "rare" | "epic" | "legendary"
  category: "beginner" | "social" | "creator" | "expert" | "legendary" | "special"
  requirement: number
  statKey: keyof AchievementSystemProps["stats"]
}

const ACHIEVEMENT_STORAGE_KEY = "invibe_unlocked_achievements"
const SHOWN_ACHIEVEMENTS_KEY = "invibe_shown_achievements"

export function AchievementSystem({ stats, onAchievementUnlock }: AchievementSystemProps) {
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [shownAchievements, setShownAchievements] = useState<string[]>([])
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  // Load unlocked and shown achievements from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY)
      const shown = localStorage.getItem(SHOWN_ACHIEVEMENTS_KEY)

      if (stored) {
        setUnlockedAchievements(JSON.parse(stored))
      }

      if (shown) {
        setShownAchievements(JSON.parse(shown))
      }
    }
  }, [])

  // Save to localStorage when achievements change
  useEffect(() => {
    if (typeof window !== "undefined" && unlockedAchievements.length > 0) {
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(unlockedAchievements))
    }
  }, [unlockedAchievements])

  useEffect(() => {
    if (typeof window !== "undefined" && shownAchievements.length > 0) {
      localStorage.setItem(SHOWN_ACHIEVEMENTS_KEY, JSON.stringify(shownAchievements))
    }
  }, [shownAchievements])

  const achievements: Achievement[] = [
    // Beginner
    {
      id: "first_event",
      title: "Primo Evento",
      description: "Hai creato il tuo primo evento!",
      icon: Trophy,
      unlocked: stats.eventsCreated >= 1,
      progress: Math.min(100, (stats.eventsCreated / 1) * 100),
      points: 100,
      rarity: "common",
      category: "beginner",
      requirement: 1,
      statKey: "eventsCreated",
    },
    {
      id: "first_join",
      title: "Prima Partecipazione",
      description: "Hai partecipato al tuo primo evento!",
      icon: Users,
      unlocked: stats.eventsParticipated >= 1,
      progress: Math.min(100, (stats.eventsParticipated / 1) * 100),
      points: 50,
      rarity: "common",
      category: "beginner",
      requirement: 1,
      statKey: "eventsParticipated",
    },

    // Social
    {
      id: "socializer",
      title: "Socializzatore",
      description: "Partecipa a 5 eventi",
      icon: Users,
      unlocked: stats.eventsParticipated >= 5,
      progress: Math.min(100, (stats.eventsParticipated / 5) * 100),
      points: 250,
      rarity: "common",
      category: "social",
      requirement: 5,
      statKey: "eventsParticipated",
    },
    {
      id: "party_animal",
      title: "Party Animal",
      description: "Partecipa a 15 eventi",
      icon: Zap,
      unlocked: stats.eventsParticipated >= 15,
      progress: Math.min(100, (stats.eventsParticipated / 15) * 100),
      points: 500,
      rarity: "rare",
      category: "social",
      requirement: 15,
      statKey: "eventsParticipated",
    },
    {
      id: "social_butterfly",
      title: "Farfalla Sociale",
      description: "Partecipa a 30 eventi",
      icon: Heart,
      unlocked: stats.eventsParticipated >= 30,
      progress: Math.min(100, (stats.eventsParticipated / 30) * 100),
      points: 1000,
      rarity: "epic",
      category: "social",
      requirement: 30,
      statKey: "eventsParticipated",
    },

    // Creator
    {
      id: "organizer",
      title: "Organizzatore",
      description: "Crea 3 eventi",
      icon: MapPin,
      unlocked: stats.eventsCreated >= 3,
      progress: Math.min(100, (stats.eventsCreated / 3) * 100),
      points: 300,
      rarity: "common",
      category: "creator",
      requirement: 3,
      statKey: "eventsCreated",
    },
    {
      id: "event_master",
      title: "Event Master",
      description: "Crea 10 eventi",
      icon: Crown,
      unlocked: stats.eventsCreated >= 10,
      progress: Math.min(100, (stats.eventsCreated / 10) * 100),
      points: 750,
      rarity: "rare",
      category: "creator",
      requirement: 10,
      statKey: "eventsCreated",
    },
    {
      id: "super_host",
      title: "Super Host",
      description: "Crea 25 eventi",
      icon: Star,
      unlocked: stats.eventsCreated >= 25,
      progress: Math.min(100, (stats.eventsCreated / 25) * 100),
      points: 1500,
      rarity: "epic",
      category: "creator",
      requirement: 25,
      statKey: "eventsCreated",
    },

    // Expert
    {
      id: "reviewer",
      title: "Recensore",
      description: "Ricevi 10 recensioni",
      icon: Camera,
      unlocked: stats.totalReviews >= 10,
      progress: Math.min(100, (stats.totalReviews / 10) * 100),
      points: 400,
      rarity: "rare",
      category: "expert",
      requirement: 10,
      statKey: "totalReviews",
    },
    {
      id: "five_star",
      title: "Cinque Stelle",
      description: "Raggiungi rating 4.8+",
      icon: Star,
      unlocked: stats.rating >= 4.8,
      progress: Math.min(100, (stats.rating / 4.8) * 100),
      points: 800,
      rarity: "epic",
      category: "expert",
      requirement: 4.8,
      statKey: "rating",
    },

    // Legendary
    {
      id: "influencer",
      title: "Influencer",
      description: "Partecipa a 50 eventi",
      icon: Crown,
      unlocked: stats.eventsParticipated >= 50,
      progress: Math.min(100, (stats.eventsParticipated / 50) * 100),
      points: 2000,
      rarity: "legendary",
      category: "legendary",
      requirement: 50,
      statKey: "eventsParticipated",
    },
    {
      id: "legend",
      title: "Leggenda",
      description: "Crea 50 eventi",
      icon: Medal,
      unlocked: stats.eventsCreated >= 50,
      progress: Math.min(100, (stats.eventsCreated / 50) * 100),
      points: 3000,
      rarity: "legendary",
      category: "legendary",
      requirement: 50,
      statKey: "eventsCreated",
    },

    // Special
    {
      id: "streak_master",
      title: "Streak Master",
      description: "7 giorni consecutivi di attività",
      icon: Flame,
      unlocked: stats.consecutiveDays >= 7,
      progress: Math.min(100, (stats.consecutiveDays / 7) * 100),
      points: 500,
      rarity: "rare",
      category: "special",
      requirement: 7,
      statKey: "consecutiveDays",
    },
    {
      id: "community_pillar",
      title: "Pilastro della Community",
      description: "Raggiungi 5000 punti totali",
      icon: Shield,
      unlocked: stats.totalPoints >= 5000,
      progress: Math.min(100, (stats.totalPoints / 5000) * 100),
      points: 1000,
      rarity: "legendary",
      category: "special",
      requirement: 5000,
      statKey: "totalPoints",
    },
  ]

  // Check for new achievements
  useEffect(() => {
    const newlyUnlocked = achievements.filter(
      (achievement) =>
        achievement.unlocked &&
        !unlockedAchievements.includes(achievement.id) &&
        !shownAchievements.includes(achievement.id),
    )

    if (newlyUnlocked.length > 0) {
      const achievement = newlyUnlocked[0] // Show one at a time

      // Update unlocked achievements
      setUnlockedAchievements((prev) => {
        const updated = [...prev, achievement.id]
        return updated
      })

      // Show the achievement popup
      setNewAchievement(achievement)
      setShowDialog(true)

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      // Call the callback
      onAchievementUnlock?.(achievement)
    }
  }, [stats, unlockedAchievements, shownAchievements, onAchievementUnlock])

  const handleCloseDialog = () => {
    if (newAchievement) {
      // Mark this achievement as shown
      setShownAchievements((prev) => {
        const updated = [...prev, newAchievement.id]
        return updated
      })
    }
    setShowDialog(false)
    setNewAchievement(null)
  }

  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common":
        return "from-gray-400 to-gray-600"
      case "rare":
        return "from-blue-400 to-blue-600"
      case "epic":
        return "from-purple-400 to-purple-600"
      case "legendary":
        return "from-yellow-400 to-orange-600"
      default:
        return "from-gray-400 to-gray-600"
    }
  }

  const getCategoryColor = (category: Achievement["category"]) => {
    switch (category) {
      case "beginner":
        return "from-green-400 to-green-600"
      case "social":
        return "from-pink-400 to-pink-600"
      case "creator":
        return "from-blue-400 to-blue-600"
      case "expert":
        return "from-purple-400 to-purple-600"
      case "legendary":
        return "from-yellow-400 to-orange-600"
      case "special":
        return "from-red-400 to-red-600"
      default:
        return "from-gray-400 to-gray-600"
    }
  }

  const totalPoints = achievements
    .filter((a) => unlockedAchievements.includes(a.id))
    .reduce((sum, a) => sum + a.points, 0)

  const level = Math.floor(totalPoints / 1000) + 1
  const nextLevelPoints = level * 1000
  const levelProgress = ((totalPoints % 1000) / 1000) * 100

  const unlockedCount = unlockedAchievements.length

  const categories = [
    { id: "beginner", name: "Principiante", icon: Target, color: "from-green-400 to-green-600" },
    { id: "social", name: "Sociale", icon: Users, color: "from-pink-400 to-pink-600" },
    { id: "creator", name: "Creatore", icon: MapPin, color: "from-blue-400 to-blue-600" },
    { id: "expert", name: "Esperto", icon: Star, color: "from-purple-400 to-purple-600" },
    { id: "legendary", name: "Leggendario", icon: Crown, color: "from-yellow-400 to-orange-600" },
    { id: "special", name: "Speciale", icon: Gift, color: "from-red-400 to-red-600" },
  ]

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Sistema Achievement
            <Badge variant="secondary" className="ml-auto">
              {unlockedCount}/{achievements.length} Completati
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Level and Points */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Livello {level}</h3>
                  <p className="text-sm text-muted-foreground">{totalPoints} punti totali</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Prossimo livello</p>
                <p className="font-semibold">{nextLevelPoints - totalPoints} punti</p>
              </div>
            </div>
            <Progress value={levelProgress} className="h-3" />
          </div>

          {/* Categories */}
          {categories.map((category) => {
            const categoryAchievements = achievements.filter((a) => a.category === category.id)
            const unlockedInCategory = categoryAchievements.filter((a) => unlockedAchievements.includes(a.id)).length

            return (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color}`}>
                    <category.icon className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold">{category.name}</h4>
                  <Badge variant="outline" className="ml-auto">
                    {unlockedInCategory}/{categoryAchievements.length}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryAchievements.map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        unlockedAchievements.includes(achievement.id)
                          ? "border-transparent bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg"
                          : "border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-r ${getRarityColor(achievement.rarity)} ${
                            unlockedAchievements.includes(achievement.id) ? "shadow-lg" : "opacity-50"
                          }`}
                        >
                          <achievement.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`font-semibold text-sm ${
                                unlockedAchievements.includes(achievement.id)
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-500"
                              }`}
                            >
                              {achievement.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`text-xs px-1 py-0 bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white border-0`}
                            >
                              {achievement.rarity}
                            </Badge>
                          </div>
                          <p
                            className={`text-xs mt-1 ${
                              unlockedAchievements.includes(achievement.id)
                                ? "text-gray-600 dark:text-gray-300"
                                : "text-gray-400"
                            }`}
                          >
                            {achievement.description}
                          </p>
                          {!unlockedAchievements.includes(achievement.id) && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progresso</span>
                                <span>{Math.round(achievement.progress)}%</span>
                              </div>
                              <Progress value={achievement.progress} className="h-1" />
                            </div>
                          )}
                          {unlockedAchievements.includes(achievement.id) && (
                            <div className="flex items-center gap-1 mt-2">
                              <Sparkles className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs font-medium text-yellow-600">+{achievement.points} punti</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {unlockedAchievements.includes(achievement.id) && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Achievement Unlock Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <AnimatePresence>
            {newAchievement && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 50 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="text-center p-6"
              >
                <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={handleCloseDialog}>
                  <X className="h-4 w-4" />
                </Button>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${getRarityColor(
                    newAchievement.rarity,
                  )} flex items-center justify-center shadow-xl`}
                >
                  <newAchievement.icon className="h-10 w-10 text-white" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold mb-2"
                >
                  Achievement Sbloccato! 🎉
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-4"
                >
                  <h3 className="text-lg font-semibold mb-1">{newAchievement.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{newAchievement.description}</p>
                  <div className="flex items-center justify-center gap-2">
                    <Badge className={`bg-gradient-to-r ${getRarityColor(newAchievement.rarity)} text-white border-0`}>
                      {newAchievement.rarity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <Sparkles className="h-3 w-3 mr-1" />+{newAchievement.points} punti
                    </Badge>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button onClick={handleCloseDialog} className="w-full">
                    Fantastico!
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  )
}
