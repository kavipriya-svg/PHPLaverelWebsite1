import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, ThumbsUp, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ReviewWithUser } from "@shared/schema";

interface ReviewSectionProps {
  productId: string;
  averageRating: string | null;
  reviewCount: number;
}

export function ReviewSection({ productId, averageRating, reviewCount }: ReviewSectionProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery<{ reviews: ReviewWithUser[] }>({
    queryKey: ["/api/products", productId, "reviews"],
  });

  const { data: canReviewData } = useQuery<{ canReview: boolean; hasPurchased: boolean; hasReviewed: boolean }>({
    queryKey: ["/api/products", productId, "can-review"],
    enabled: isAuthenticated,
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; title: string; content: string }) => {
      return apiRequest("POST", `/api/products/${productId}/reviews`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "can-review"] });
      toast({
        title: "Review submitted",
        description: "Your review has been submitted and is pending moderation.",
      });
      setShowForm(false);
      setRating(5);
      setTitle("");
      setContent("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const voteReviewMutation = useMutation({
    mutationFn: async ({ reviewId, isHelpful }: { reviewId: string; isHelpful: boolean }) => {
      return apiRequest("POST", `/api/reviews/${reviewId}/vote`, { isHelpful });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "reviews"] });
      toast({
        title: "Thank you",
        description: "Your vote has been recorded.",
      });
    },
  });

  const reviews = reviewsData?.reviews || [];
  const avgRating = parseFloat(averageRating || "0");

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { star, count, percentage };
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Review required",
        description: "Please write a review before submitting.",
        variant: "destructive",
      });
      return;
    }
    submitReviewMutation.mutate({ rating, title, content });
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">{avgRating.toFixed(1)}</div>
              <div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(avgRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm w-8">{star} star</span>
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Write a Review</CardTitle>
          </CardHeader>
          <CardContent>
            {!isAuthenticated ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Please sign in to write a review.
                </p>
                <Button asChild>
                  <a href="/api/login" data-testid="link-login-review">Sign In</a>
                </Button>
              </div>
            ) : canReviewData?.hasReviewed ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p className="text-muted-foreground">
                  You have already reviewed this product.
                </p>
              </div>
            ) : !canReviewData?.hasPurchased ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  Only customers who have purchased this product can leave a review.
                </p>
              </div>
            ) : showForm ? (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1"
                        data-testid={`button-rating-${star}`}
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            star <= (hoverRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="review-title" className="text-sm font-medium mb-2 block">
                    Review Title (Optional)
                  </label>
                  <Input
                    id="review-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Summarize your experience"
                    data-testid="input-review-title"
                  />
                </div>

                <div>
                  <label htmlFor="review-content" className="text-sm font-medium mb-2 block">
                    Your Review
                  </label>
                  <Textarea
                    id="review-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    data-testid="input-review-content"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={submitReviewMutation.isPending}
                    data-testid="button-submit-review"
                  >
                    {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    data-testid="button-cancel-review"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Share your thoughts about this product.
                </p>
                <Button onClick={() => setShowForm(true)} data-testid="button-write-review">
                  Write a Review
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>

        {reviewsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-20 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-3/4 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No reviews yet. Be the first to review this product!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} data-testid={`card-review-${review.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={review.user?.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {review.user?.firstName?.[0] || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {review.user
                            ? `${review.user.firstName || ""} ${review.user.lastName || ""}`.trim() || "Anonymous"
                            : "Anonymous"}
                        </span>
                        {review.isVerifiedPurchase && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.createdAt!).toLocaleDateString()}
                        </span>
                      </div>

                      {review.title && (
                        <h4 className="font-medium mt-3">{review.title}</h4>
                      )}
                      <p className="mt-2 text-muted-foreground">{review.content}</p>

                      <div className="flex items-center gap-4 mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => voteReviewMutation.mutate({ reviewId: review.id, isHelpful: true })}
                          disabled={voteReviewMutation.isPending}
                          data-testid={`button-helpful-${review.id}`}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Helpful ({review.helpfulCount || 0})
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
