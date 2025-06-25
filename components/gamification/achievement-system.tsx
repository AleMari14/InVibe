"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trophy, Star, Users, Calendar, MessageCircle, Award, Zap, Target, Crown } from "lucide-react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"

interface Stats {
  eventsCreated?: number
  eventsParticipated?: number
  totalReviews?: number
  totalMessages?: number
  rating?: number
  consecutiveDays?: number
  totalPoints?: number
  level?: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  category: "events" | "social" | "engagement" | "special"
  requirement: number
  currentProgress: number
  unlocked: boolean
  points: number
  rarity: "common" | "rare" | "epic" | "legendary"
}

interface AchievementSystemProps {
  stats?: Stats
  onAchievementUnlock?: (achievement: Achievement) => void
}

const ACHIEVEMENT_STORAGE_KEY = "invibe_achievements"
const SHOWN_ACHIEVEMENTS_KEY = "invibe_shown_achievements"

export function AchievementSystem({ stats = {}, onAchievementUnlock }: AchievementSystemProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)
  const [userLevel, setUserLevel] = useState(1)
  const [totalPoints, setTotalPoints] = useState(0)
  const [nextLevelProgress, setNextLevelProgress] = useState(0)

  // Safely extract stats with defaults
  const safeStats = {
    eventsCreated: stats.eventsCreated || 0,
    eventsParticipated: stats.eventsParticipated || 0,
    totalReviews: stats.totalReviews || 0,
    totalMessages: stats.totalMessages || 0,
    rating: stats.rating || 0,
    consecutiveDays: stats.consecutiveDays || 0,
    totalPoints: stats.totalPoints || 0,
    level: stats.level || 1,
  }

  const achievementDefinitions: Omit<Achievement, "currentProgress" | "unlocked">[] = [
    // Events Category
    {
      id: "first_event",
      title: "Primo Evento",
      description: "Crea il tuo primo evento",
      icon: Calendar,
      category: "events",
      requirement: 1,
      points: 50,
      rarity: "common",
    },
    {
      id: "event_creator",
      title: "Organizzatore",
      description: "Crea 5 eventi",
      icon: Trophy,
      category: "events",
      requirement: 5,
      points: 200,
      rarity: "rare",
    },
    {
      id: "event_master",
      title: "Maestro degli Eventi",
      description: "Crea 20 eventi",
      icon: Crown,
      category: "events",
      requirement: 20,
      points: 500,
      rarity: "epic",
    },

    // Social Category
    {
      id: "social_butterfly",
      title: "Farfalla Sociale",
      description: "Partecipa a 10 eventi",
      icon: Users,
      category: "social",
      requirement: 10,
      points: 150,
      rarity: "common",
    },
    {
      id: "party_animal",
      title: "Animale da Festa",
      description: "Partecipa a 50 eventi",
      icon: Zap,
      category: "social",
      requirement: 50,
      points: 400,
      rarity: "rare",
    },

    // Engagement Category
    {
      id: "reviewer",
      title: "Recensore",
      description: "Scrivi 10 recensioni",
      icon: Star,
      category: "engagement",
      requirement: 10,
      points: 100,
      rarity: "common",
    },
    {
      id: "communicator",
      title: "Comunicatore",
      description: "Invia 100 messaggi",
      icon: MessageCircle,
      category: "engagement",
      requirement: 100,
      points: 150,
      rarity: "common",
    },

    // Special Category
    {
      id: "perfect_rating",
      title: "Perfezione",
      description: "Raggiungi un rating di 5.0",
      icon: Award,
      category: "special",
      requirement: 5,
      points: 300,
      rarity: "legendary",
    },
    {
      id: "streak_master",
      title: "Maestro della Costanza",
      description: "Accedi per 30 giorni consecutivi",
      icon: Target,
      category: "special",
      requirement: 30,
      points: 250,
      rarity: "epic",
    },
  ]

  useEffect(() => {
    initializeAchievements()
  }, [safeStats])

  const initializeAchievements = () => {
    const savedAchievements = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY)
    const shownAchievements = JSON.parse(localStorage.getItem(SHOWN_ACHIEVEMENTS_KEY) || "[]")

    const updatedAchievements = achievementDefinitions.map((def) => {
      let currentProgress = 0

      switch (def.id) {
        case "first_event":
        case "event_creator":
        case "event_master":
          currentProgress = safeStats.eventsCreated
          break
        case "social_butterfly":
        case "party_animal":
          currentProgress = safeStats.eventsParticipated
          break
        case "reviewer":
          currentProgress = safeStats.totalReviews
          break
        case "communicator":
          currentProgress = safeStats.totalMessages
          break
        case "perfect_rating":
          currentProgress = safeStats.rating
          break
        case "streak_master":
          currentProgress = safeStats.consecutiveDays
          break
        default:
          currentProgress = 0
      }

      const wasUnlocked = savedAchievements
        ? JSON.parse(savedAchievements).find((a: Achievement) => a.id === def.id)?.unlocked || false
        : false

      const isUnlocked = currentProgress >= def.requirement
      const isNewlyUnlocked = isUnlocked && !wasUnlocked

      return {
        ...def,
        currentProgress: Math.min(currentProgress, def.requirement),
        unlocked: isUnlocked,
      }
    })

    setAchievements(updatedAchievements)

    // Check for newly unlocked achievements
    const newlyUnlocked = updatedAchievements.filter(
      (achievement) =>
        achievement.unlocked &&
        !JSON.parse(savedAchievements || "[]").find((a: Achievement) => a.id === achievement.id && a.unlocked),
    )

    // Show popup only for achievements not yet shown
    const achievementToShow = newlyUnlocked.find((achievement) => !shownAchievements.includes(achievement.id))

    if (achievementToShow) {
      setNewAchievement(achievementToShow)
      triggerConfetti()
      onAchievementUnlock?.(achievementToShow)
    }

    // Save updated achievements
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(updatedAchievements))

    // Calculate level and points
    const unlockedAchievements = updatedAchievements.filter((a) => a.unlocked)
    const points = unlockedAchievements.reduce((sum, a) => sum + a.points, 0)
    const level = Math.floor(points / 500) + 1
    const progressToNext = ((points % 500) / 500) * 100

    setTotalPoints(points)
    setUserLevel(level)
    setNextLevelProgress(progressToNext)
  }

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B"],
    })
  }

  const handleAchievementClose = () => {
    if (newAchievement) {
      const shownAchievements = JSON.parse(localStorage.getItem(SHOWN_ACHIEVEMENTS_KEY) || "[]")
      shownAchievements.push(newAchievement.id)
      localStorage.setItem(SHOWN_ACHIEVEMENTS_KEY, JSON.stringify(shownAchievements))
    }
    setNewAchievement(null)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "rare":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "epic":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "legendary":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "events":
        return Calendar
      case "social":
        return Users
      case "engagement":
        return MessageCircle
      case "special":
        return Award
      default:
        return Trophy
    }
  }

  const groupedAchievements = achievements.reduce(
    (groups, achievement) => {
      const category = achievement.category
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(achievement)
      return groups
    },
    {} as Record<string, Achievement[]>,
  )

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Achievement System
            </CardTitle>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">Livello {userLevel}</div>
              <div className="text-sm text-muted-foreground">{totalPoints} punti</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso al prossimo livello</span>
              <span>{Math.round(nextLevelProgress)}%</span>
            </div>
            <Progress value={nextLevelProgress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
            const CategoryIcon = getCategoryIcon(category)
            const categoryName =
              {
                events: "Eventi",
                social: "Sociale",
                engagement: "Coinvolgimento",
                special: "Speciali",
              }[category] || category

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <CategoryIcon className="h-5 w-5" />
                  {categoryName}
                </div>
                <div className="grid gap-3">
                  {categoryAchievements.map((achievement) => {
                    const IconComponent = achievement.icon
                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                          achievement.unlocked
                            ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                            : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              achievement.unlocked ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4
                                className={`font-semibold ${achievement.unlocked ? "text-green-800" : "text-gray-700"}`}
                              >
                                {achievement.title}
                              </h4>
                              <Badge className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                                {achievement.rarity}
                              </Badge>
                              {achievement.unlocked && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  +{achievement.points} punti
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={(achievement.currentProgress / achievement.requirement) * 100}
                                className="flex-1 h-2"
                              />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {achievement.currentProgress}/{achievement.requirement}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Achievement Unlock Dialog */}
      <Dialog open={!!newAchievement} onOpenChange={handleAchievementClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-green-600">
              🎉 Achievement Sbloccato!
            </DialogTitle>
          </DialogHeader>
          {newAchievement && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-4"
            >
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <newAchievement.icon className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{newAchievement.title}</h3>
                <p className="text-muted-foreground mb-4">{newAchievement.description}</p>
                <div className="flex justify-center gap-2">
                  <Badge className={getRarityColor(newAchievement.rarity)}>{newAchievement.rarity}</Badge>
                  <Badge className="bg-green-100 text-green-800">+{newAchievement.points} punti</Badge>
                </div>
              </div>
              <Button onClick={handleAchievementClose} className="w-full">
                Fantastico!
              </Button>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
