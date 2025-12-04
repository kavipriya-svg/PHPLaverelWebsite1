import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  author: string;
  readTime: string;
  publishedAt: string;
  position: number;
  isVisible: boolean;
}

interface BlogSection {
  title: string;
  subtitle: string;
  isVisible: boolean;
  position: number;
  posts: BlogPost[];
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery<{ settings: BlogSection }>({
    queryKey: ["/api/settings/blog-section"],
  });

  const settings = data?.settings;
  const post = settings?.posts.find(p => p.slug === slug && p.isVisible);
  const otherPosts = settings?.posts
    .filter(p => p.isVisible && p.slug !== slug)
    .slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64 w-full mb-6 rounded-lg" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The blog post you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6" data-testid="button-back">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <article className="max-w-3xl mx-auto">
          {post.imageUrl && (
            <div className="aspect-video rounded-lg overflow-hidden mb-8 bg-muted">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
                data-testid="img-blog-cover"
              />
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-blog-title">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8" data-testid="text-blog-meta">
            {post.author && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
            )}
            {post.publishedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{post.publishedAt}</span>
              </div>
            )}
            {post.readTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{post.readTime}</span>
              </div>
            )}
          </div>

          {post.excerpt && (
            <p className="text-lg text-muted-foreground mb-8 border-l-4 border-primary pl-4 italic" data-testid="text-blog-excerpt">
              {post.excerpt}
            </p>
          )}

          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            data-testid="text-blog-content"
          >
            {post.content ? (
              post.content.split('\n').map((paragraph, index) => (
                paragraph.trim() && <p key={index}>{paragraph}</p>
              ))
            ) : (
              <p className="text-muted-foreground">No content available for this post.</p>
            )}
          </div>
        </article>

        {otherPosts.length > 0 && (
          <section className="mt-16 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">More from our Blog</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                  <Card className="overflow-hidden hover-elevate group h-full" data-testid={`card-related-${relatedPost.id}`}>
                    <div className="aspect-video bg-muted overflow-hidden">
                      {relatedPost.imageUrl ? (
                        <img
                          src={relatedPost.imageUrl}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        {relatedPost.publishedAt && <span>{relatedPost.publishedAt}</span>}
                        {relatedPost.publishedAt && relatedPost.readTime && <span>•</span>}
                        {relatedPost.readTime && <span>{relatedPost.readTime}</span>}
                      </div>
                      <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {relatedPost.title}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
