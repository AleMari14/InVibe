/*"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Star, MessageSquare, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { OptimizedAvatar } from "@/components/ui/optimized-avatar"
import { toast } from "sonner"

interface Review {
  _id: string
  rating: number
  comment: string
  createdAt: string
  reviewer: {
    name: string
    image?: string
  }
  host: {
    name: string
    image?: string
  }
  event: {
    title: string
    _id: string
  }
}

interface ReviewSectionProps {
  eventId: string
}

export function ReviewSection({ eventId }: ReviewSectionProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [hoveredStar, setHoveredStar] = useState(0)

  useEffect(() => {
    fetchReviews()
    if (session) {
      checkReviewStatus()
    }
  }, [eventId, session])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reviews?eventId=${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkReviewStatus = async () => {
    try {
      const response = await fetch(`/api/reviews?eventId=${eventId}&checkUser=true`)
      if (response.ok) {
        const data = await response.json()
        setCanReview(data.canReview)
        setHasReviewed(data.hasReviewed)
      }
    } catch (error) {
      console.error("Error checking review status:", error)
    }
  }

  const handleSubmitReview = async () => {
    if (!rating || rating < 1 || rating > 5) {
      toast.error("Seleziona una valutazione da 1 a 5 stelle")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          rating,
          comment: comment.trim(),
        }),
      })

      if (response.ok) {
        toast.success("Recensione aggiunta con successo!")
        setShowReviewForm(false)
        setRating(0)
        setComment("")
        setHasReviewed(true)
        fetchReviews()
      } else {
        const error = await response.json()
        toast.error(error.error || "Errore nell'invio della recensione")
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error("Errore nell'invio della recensione")
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating === stars).length,
    percentage:
      reviews.length > 0 ? (reviews.filter((review) => review.rating === stars).length / reviews.length) * 100 : 0,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Recensioni
          {reviews.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {reviews.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {reviews.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{averageRating.toFixed(1)}</div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Basato su {reviews.length} recensioni</p>
                </div>

                <div className="space-y-2">
                  {ratingDistribution.map(({ stars, count, percentage }) => (
                    <div key={stars} className="flex items-center gap-2 text-sm">
                      <span className="w-8">{stars}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {session && canReview && !hasReviewed && (
              <div className="border rounded-lg p-4 bg-muted/20">
                {!showReviewForm ? (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Hai partecipato a questo evento? Lascia una recensione!
                    </p>
                    <Button onClick={() => setShowReviewForm(true)} variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Scrivi una recensione
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Valutazione *</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`h-8 w-8 transition-colors ${
                                star <= (hoveredStar || rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300 hover:text-yellow-400"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      {rating > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {rating === 1 && "Molto deludente"}
                          {rating === 2 && "Deludente"}
                          {rating === 3 && "Nella media"}
                          {rating === 4 && "Buono"}
                          {rating === 5 && "Eccellente"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Commento (opzionale)</label>
                      <Textarea
                        placeholder="Condividi la tua esperienza con questo evento..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        maxLength={500}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{comment.length}/500 caratteri</p>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSubmitReview} disabled={submitting || rating === 0} className="flex-1">
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Star className="h-4 w-4 mr-2" />
                        )}
                        Pubblica recensione
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowReviewForm(false)
                          setRating(0)
                          setComment("")
                          setHoveredStar(0)
                        }}
                      >
                        Annulla
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {hasReviewed && (
              <div className="text-center py-4 text-sm text-muted-foreground bg-muted/20 rounded-lg">
                ✅ Hai già recensito questo evento
              </div>
            )}

            {reviews.length > 0 ? (
              <div className="space-y-4">
                <Separator />
                <h4 className="font-semibold">Tutte le recensioni ({reviews.length})</h4>
                {reviews.map((review) => (
                  <div key={review._id} className="border rounded-lg p-4 space-y-3 bg-card/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <OptimizedAvatar src={review.reviewer.image} alt={review.reviewer.name} size={40} />
                        <div>
                          <p className="font-medium">{review.reviewer.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(review.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground pl-12 bg-muted/30 p-3 rounded-md italic">
                        "{review.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nessuna recensione ancora. Sii il primo a recensire questo evento!
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}*/
