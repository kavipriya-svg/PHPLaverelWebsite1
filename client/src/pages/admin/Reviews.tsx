import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, Check, X, Trash2, Eye, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ReviewWithUser } from "@shared/schema";

export default function AdminReviews() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [selectedReview, setSelectedReview] = useState<ReviewWithUser | null>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ reviews: ReviewWithUser[]; total: number }>({
    queryKey: ["/api/admin/reviews", { approved: filter === "all" ? undefined : filter }],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) => {
      return apiRequest("PATCH", `/api/admin/reviews/${id}`, { isApproved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({
        title: "Success",
        description: "Review status updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update review status.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      setDeleteReviewId(null);
      toast({
        title: "Success",
        description: "Review deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete review.",
        variant: "destructive",
      });
    },
  });

  const reviews = data?.reviews || [];
  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Review Moderation</h1>
          <p className="text-muted-foreground">
            Approve, reject, or delete customer reviews
          </p>
        </div>
        <div className="flex items-center gap-4">
          {pendingCount > 0 && (
            <Badge variant="destructive">{pendingCount} pending</Badge>
          )}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40" data-testid="select-review-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="false">Pending</SelectItem>
              <SelectItem value="true">Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reviews ({data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No reviews found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="hidden md:table-cell">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id} data-testid={`row-review-${review.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {review.user
                            ? `${review.user.firstName || ""} ${review.user.lastName || ""}`.trim() || "Anonymous"
                            : "Anonymous"}
                        </p>
                        {review.isVerifiedPurchase && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">
                      {review.title || review.content?.substring(0, 50) + "..."}
                    </TableCell>
                    <TableCell>
                      <Badge variant={review.isApproved ? "default" : "secondary"}>
                        {review.isApproved ? "Approved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {new Date(review.createdAt!).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedReview(review)}
                          data-testid={`button-view-review-${review.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!review.isApproved ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => approveMutation.mutate({ id: review.id, isApproved: true })}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-review-${review.id}`}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => approveMutation.mutate({ id: review.id, isApproved: false })}
                            disabled={approveMutation.isPending}
                            data-testid={`button-reject-review-${review.id}`}
                          >
                            <X className="h-4 w-4 text-orange-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteReviewId(review.id)}
                          data-testid={`button-delete-review-${review.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {selectedReview.user
                    ? `${selectedReview.user.firstName || ""} ${selectedReview.user.lastName || ""}`.trim() || "Anonymous"
                    : "Anonymous"}
                </p>
                {selectedReview.isVerifiedPurchase && (
                  <Badge variant="secondary">Verified Purchase</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= selectedReview.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedReview.createdAt!).toLocaleDateString()}
                </span>
              </div>

              {selectedReview.title && (
                <h4 className="font-medium">{selectedReview.title}</h4>
              )}

              <p className="text-muted-foreground">{selectedReview.content}</p>

              <div className="flex items-center gap-2">
                <Badge variant={selectedReview.isApproved ? "default" : "secondary"}>
                  {selectedReview.isApproved ? "Approved" : "Pending"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedReview.helpfulCount || 0} people found this helpful
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedReview && !selectedReview.isApproved && (
              <Button
                onClick={() => {
                  approveMutation.mutate({ id: selectedReview.id, isApproved: true });
                  setSelectedReview(null);
                }}
                data-testid="button-approve-review-modal"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedReview(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteReviewId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteReviewId && deleteMutation.mutate(deleteReviewId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-review"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
