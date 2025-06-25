"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Trophy,
  Star,
  Crown,
  Medal,
  Award,
  Zap,
  Target,
  Flame,
  Users,
  Calendar,
  MapPin,
  Heart,
  MessageCircle,
  Sparkles,
  Shield,
  Gem,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface UserStats {
  eventsCreated: number
  eventsParticipated: number
  totalReviews: number
  totalMessages: number
  rating: number
  consecutiveDays: number
  totalPoints: number
  level: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: any
  category: "beginner" | "social" | "creator" | "expert" | "legendary" | "special"
  rarity: "common" | "rare" | "epic" | "legendary"
  unlocked: boolean
  progress: number
  maxProgress: number
  points: number
  unlockedAt?: Date
  color: string
  requirements: string[]
}

interface AchievementSystemProps {
  stats: UserStats
  onAchievementUnlock?: (achievement: Achievement) => void
}

export function AchievementSystem({ stats, onAchievementUnlock }: AchievementSystemProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([])
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)

  // Calcola il livello basato sui punti
  const calculateLevel = (points: number) => {
    return Math.floor(points / 100) + 1
  }

  // Calcola i punti per il prossimo livello
  const getPointsForNextLevel = (currentLevel: number) => {
    return currentLevel * 100
  }

  // Definisce tutti gli achievements
  const defineAchievements = (): Achievement[] => {
    return [
      // BEGINNER ACHIEVEMENTS
      {
        id: "first_event",
        title: "Primo Passo",
        description: "Crea il tuo primo evento",
        icon: Trophy,
        category: "beginner",
        rarity: "common",
        unlocked: stats.eventsCreated >= 1,
        progress: Math.min(stats.eventsCreated, 1),
        maxProgress: 1,
        points: 50,
        color: "from-green-400 to-green-600",
        requirements: ["Crea 1 evento"],
      },
      {
        id: "first_participation",
        title: "Socializzatore",
        description: "Partecipa al tuo primo evento",
        icon: Users,
        category: "beginner",
        rarity: "common",
        unlocked: stats.eventsParticipated >= 1,
        progress: Math.min(stats.eventsParticipated, 1),
        maxProgress: 1,
        points: 30,
        color: "from-blue-400 to-blue-600",
        requirements: ["Partecipa a 1 evento"],
      },
      {
        id: "profile_complete",
        title: "Profilo Completo",
        description: "Completa il tuo profilo",
        icon: Star,
        category: "beginner",
        rarity: "common",
        unlocked: true, // Assumiamo sia completato
        progress: 1,
        maxProgress: 1,
        points: 25,
        color: "from-yellow-400 to-yellow-600",
        requirements: ["Aggiungi foto e bio"],
      },

      // SOCIAL ACHIEVEMENTS
      {
        id: "party_animal",
        title: "Party Animal",
        description: "Partecipa a 10 eventi",
        icon: Flame,
        category: "social",
        rarity: "rare",
        unlocked: stats.eventsParticipated >= 10,
        progress: Math.min(stats.eventsParticipated, 10),
        maxProgress: 10,
        points: 150,
        color: "from-orange-400 to-red-500",
        requirements: ["Partecipa a 10 eventi"],
      },
      {
        id: "social_butterfly",
        title: "Farfalla Sociale",
        description: "Partecipa a 25 eventi",
        icon: Sparkles,
        category: "social",
        rarity: "epic",
        unlocked: stats.eventsParticipated >= 25,
        progress: Math.min(stats.eventsParticipated, 25),
        maxProgress: 25,
        points: 300,
        color: "from-pink-400 to-purple-500",
        requirements: ["Partecipa a 25 eventi"],
      },
      {
        id: "reviewer",
        title: "Critico",
        description: "Ricevi 10 recensioni",
        icon: MessageCircle,
        category: "social",
        rarity: "rare",
        unlocked: stats.totalReviews >= 10,
        progress: Math.min(stats.totalReviews, 10),
        maxProgress: 10,
        points: 100,
        color: "from-purple-400 to-purple-600",
        requirements: ["Ricevi 10 recensioni"],
      },

      // CREATOR ACHIEVEMENTS
      {
        id: "event_organizer",
        title: "Organizzatore",
        description: "Crea 5 eventi",
        icon: Calendar,
        category: "creator",
        rarity: "rare",
        unlocked: stats.eventsCreated >= 5,
        progress: Math.min(stats.eventsCreated, 5),
        maxProgress: 5,
        points: 200,
        color: "from-blue-400 to-cyan-500",
        requirements: ["Crea 5 eventi"],
      },
      {
        id: "event_master",
        title: "Maestro Eventi",
        description: "Crea 15 eventi",
        icon: Crown,
        category: "creator",
        rarity: "epic",
        unlocked: stats.eventsCreated >= 15,
        progress: Math.min(stats.eventsCreated, 15),
        maxProgress: 15,
        points: 400,
        color: "from-yellow-400 to-orange-500",
        requirements: ["Crea 15 eventi"],
      },
      {
        id: "location_explorer",
        title: "Esploratore",
        description: "Crea eventi in 5 città diverse",
        icon: MapPin,
        category: "creator",
        rarity: "epic",
        unlocked: stats.eventsCreated >= 8, // Approssimazione
        progress: Math.min(Math.floor(stats.eventsCreated / 2), 5),
        maxProgress: 5,
        points: 250,
        color: "from-green-400 to-teal-500",
        requirements: ["Crea eventi in 5 città"],
      },

      // EXPERT ACHIEVEMENTS
      {
        id: "five_star_host",
        title: "Host 5 Stelle",
        description: "Mantieni un rating di 4.8+",
        icon: Award,
        category: "expert",
        rarity: "epic",
        unlocked: stats.rating >= 4.8,
        progress: Math.min(stats.rating * 20, 100),
        maxProgress: 100,
        points: 350,
        color: "from-yellow-300 to-yellow-500",
        requirements: ["Rating 4.8+ stelle"],
      },
      {
        id: "community_favorite",
        title: "Preferito della Community",
        description: "Ricevi 50 recensioni positive",
        icon: Heart,
        category: "expert",
        rarity: "legendary",
        unlocked: stats.totalReviews >= 50,
        progress: Math.min(stats.totalReviews, 50),
        maxProgress: 50,
        points: 500,
        color: "from-red-400 to-pink-500",
        requirements: ["50 recensioni positive"],
      },
      {
        id: "super_host",
        title: "Super Host",
        description: "Crea 30 eventi con rating 4.5+",
        icon: Shield,
        category: "expert",
        rarity: "legendary",
        unlocked: stats.eventsCreated >= 30 && stats.rating >= 4.5,
        progress: Math.min(stats.eventsCreated, 30),
        maxProgress: 30,
        points: 600,
        color: "from-indigo-400 to-purple-500",
        requirements: ["30 eventi", "Rating 4.5+"],
      },

      // LEGENDARY ACHIEVEMENTS
      {
        id: "event_legend",
        title: "Leggenda",
        description: "Crea 100 eventi",
        icon: Medal,
        category: "legendary",
        rarity: "legendary",
        unlocked: stats.eventsCreated >= 100,
        progress: Math.min(stats.eventsCreated, 100),
        maxProgress: 100,
        points: 1000,
        color: "from-purple-500 to-pink-500",
        requirements: ["Crea 100 eventi"],
      },
      {
        id: "community_pillar",
        title: "Pilastro della Community",
        description: "Partecipa a 100 eventi",
        icon: Gem,
        category: "legendary",
        rarity: "legendary",
        unlocked: stats.eventsParticipated >= 100,
        progress: Math.min(stats.eventsParticipated, 100),
        maxProgress: 100,
        points: 800,
        color: "from-cyan-400 to-blue-500",
        requirements: ["Partecipa a 100 eventi"],
      },

      // SPECIAL ACHIEVEMENTS
      {
        id: "early_adopter",
        title: "Early Adopter",
        description: "Uno dei primi 1000 utenti",
        icon: Zap,
        category: "special",
        rarity: "legendary",
        unlocked: true, // Tutti gli utenti attuali sono early adopters
        progress: 1,
        maxProgress: 1,
        points: 500,
        color: "from-yellow-400 to-orange-400",
        requirements: ["Registrato nei primi 1000"],
      },
      {
        id: "streak_master",
        title: "Streak Master",
        description: "Accedi per 30 giorni consecutivi",
        icon: Target,
        category: "special",
        rarity: "epic",
        unlocked: stats.consecutiveDays >= 30,
        progress: Math.min(stats.consecutiveDays, 30),
        maxProgress: 30,
        points: 300,
        color: "from-green-400 to-emerald-500",
        requirements: ["30 giorni consecutivi"],
      },
    ]
  }

  useEffect(() => {
    const newAchievements = defineAchievements()
    const previousAchievements = achievements

    // Controlla per nuovi unlock
    if (previousAchievements.length > 0) {
      const newlyUnlocked = newAchievements.filter((achievement) => {
        const previous = previousAchievements.find((prev) => prev.id === achievement.id)
        return achievement.unlocked && (!previous || !previous.unlocked)
      })

      if (newlyUnlocked.length > 0) {
        setNewUnlocks(newlyUnlocked)
        setShowUnlockDialog(true)
        newlyUnlocked.forEach((achievement) => {
          toast.success(`🏆 Achievement Sbloccato: ${achievement.title}!`)
          onAchievementUnlock?.(achievement)
        })
      }
    }

    setAchievements(newAchievements)
  }, [stats])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-600 bg-gray-100"
      case "rare":
        return "text-blue-600 bg-blue-100"
      case "epic":
        return "text-purple-600 bg-purple-100"
      case "legendary":
        return "text-yellow-600 bg-yellow-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "beginner":
        return Star
      case "social":
        return Users
      case "creator":
        return Calendar
      case "expert":
        return Award
      case "legendary":
        return Crown
      case "special":
        return Sparkles
      default:
        return Trophy
    }
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalPoints = achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.points, 0)
  const currentLevel = calculateLevel(totalPoints)
  const pointsForNextLevel = getPointsForNextLevel(currentLevel)
  const progressToNextLevel = ((totalPoints % 100) / 100) * 100

  const categories = [
    { id: "all", name: "Tutti", icon: Trophy },
    { id: "beginner", name: "Principiante", icon: Star },
    { id: "social", name: "Sociale", icon: Users },
    { id: "creator", name: "Creatore", icon: Calendar },
    { id: "expert", name: "Esperto", icon: Award },
    { id: "legendary", name: "Leggendario", icon: Crown },
    { id: "special", name: "Speciale", icon: Sparkles },
  ]

  const [selectedCategory, setSelectedCategory] = useState("all")
  const filteredAchievements =
    selectedCategory === "all" ? achievements : achievements.filter((a) => a.category === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Level and Progress */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Livello {currentLevel}</h3>
                <p className="text-muted-foreground">
                  {totalPoints} / {pointsForNextLevel} punti
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{totalPoints}</div>
              <div className="text-sm text-muted-foreground">Punti Totali</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso al Livello {currentLevel + 1}</span>
              <span>{Math.round(progressToNextLevel)}%</span>
            </div>
            <Progress value={progressToNextLevel} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{unlockedCount}</div>
            <div className="text-sm text-muted-foreground">Sbloccati</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{achievements.length}</div>
            <div className="text-sm text-muted-foreground">Totali</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((unlockedCount / achievements.length) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Completamento</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {achievements.filter((a) => a.rarity === "legendary" && a.unlocked).length}
            </div>
            <div className="text-sm text-muted-foreground">Leggendari</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => {
          const CategoryIcon = category.icon
          const count =
            category.id === "all" ? achievements.length : achievements.filter((a) => a.category === category.id).length
          const unlockedInCategory =
            category.id === "all"
              ? unlockedCount
              : achievements.filter((a) => a.category === category.id && a.unlocked).length

          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              <CategoryIcon className="h-4 w-4 mr-2" />
              {category.name}
              <Badge variant="secondary" className="ml-2">
                {unlockedInCategory}/{count}
              </Badge>
            </Button>
          )
        })}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredAchievements.map((achievement, index) => {
            const IconComponent = achievement.icon
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => setSelectedAchievement(achievement)}
              >
                <Card
                  className={`relative overflow-hidden transition-all duration-300 ${
                    achievement.unlocked
                      ? "border-transparent shadow-lg hover:shadow-xl"
                      : "border-dashed border-gray-300 dark:border-gray-600 opacity-75"
                  }`}
                >
                  {achievement.unlocked && (
                    <div className="absolute inset-0 opacity-10">
                      <div className={`w-full h-full bg-gradient-to-r ${achievement.color}`} />
                    </div>
                  )}

                  <CardContent className="p-4 relative">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-r ${achievement.color} ${
                          achievement.unlocked ? "shadow-lg" : "opacity-50 grayscale"
                        }`}
                      >
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3
                            className={`font-semibold ${
                              achievement.unlocked ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {achievement.title}
                          </h3>
                          <Badge className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                            {achievement.rarity}
                          </Badge>
                        </div>

                        <p
                          className={`text-sm mb-3 ${
                            achievement.unlocked ? "text-muted-foreground" : "text-muted-foreground/70"
                          }`}
                        >
                          {achievement.description}
                        </p>

                        {!achievement.unlocked && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Progresso</span>
                              <span>
                                {achievement.progress}/{achievement.maxProgress}
                              </span>
                            </div>
                            <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                          </div>
                        )}

                        {achievement.unlocked && (
                          <div className="flex items-center justify-between">
                            <Badge className="bg-green-100 text-green-700">
                              <Trophy className="h-3 w-3 mr-1" />+{achievement.points} punti
                            </Badge>
                            <div className="text-xs text-muted-foreground">Sbloccato!</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {achievement.unlocked && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Trophy className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Achievement Detail Dialog */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedAchievement && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${selectedAchievement.color}`}>
                    <selectedAchievement.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div>{selectedAchievement.title}</div>
                    <Badge className={`text-xs ${getRarityColor(selectedAchievement.rarity)}`}>
                      {selectedAchievement.rarity}
                    </Badge>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">{selectedAchievement.description}</p>

                <div className="space-y-2">
                  <h4 className="font-medium">Requisiti:</h4>
                  <ul className="space-y-1">
                    {selectedAchievement.requirements.map((req, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {!selectedAchievement.unlocked && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>
                        {selectedAchievement.progress}/{selectedAchievement.maxProgress}
                      </span>
                    </div>
                    <Progress value={(selectedAchievement.progress / selectedAchievement.maxProgress) * 100} />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">Ricompensa</span>
                  <Badge className="bg-yellow-100 text-yellow-700">
                    <Trophy className="h-3 w-3 mr-1" />
                    {selectedAchievement.points} punti
                  </Badge>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Achievement Unlock Dialog */}
      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto"
            >
              <Trophy className="h-10 w-10 text-white" />
            </motion.div>

            <div>
              <h2 className="text-2xl font-bold mb-2">🎉 Achievement Sbloccato!</h2>
              {newUnlocks.map((achievement) => (
                <div key={achievement.id} className="space-y-2">
                  <h3 className="text-lg font-semibold">{achievement.title}</h3>
                  <p className="text-muted-foreground">{achievement.description}</p>
                  <Badge className="bg-yellow-100 text-yellow-700">
                    <Trophy className="h-3 w-3 mr-1" />+{achievement.points} punti
                  </Badge>
                </div>
              ))}
            </div>

            <Button onClick={() => setShowUnlockDialog(false)} className="w-full">
              Fantastico!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
