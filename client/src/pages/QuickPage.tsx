import { useQuery } from "@tanstack/react-query";
import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface QuickPageData {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  status: string;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface QuickPageProps {
  slug: string;
}

export default function QuickPage({ slug }: QuickPageProps) {
  const { data, isLoading, error } = useQuery<{ page: QuickPageData }>({
    queryKey: ["/api/quick-pages", slug],
    queryFn: async () => {
      const res = await fetch(`/api/quick-pages/${slug}`);
      if (!res.ok) {
        throw new Error("Page not found");
      }
      return res.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 px-4">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-6 w-2/3 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !data?.page) {
    return (
      <div className="container max-w-4xl py-12 px-4">
        <Card className="text-center">
          <CardContent className="py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The page you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/">
              <Button data-testid="button-go-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const page = data.page;

  return (
    <>
      {/* SEO Meta Tags */}
      {page.metaTitle && (
        <title>{page.metaTitle}</title>
      )}
      
      <div className="container max-w-4xl py-8 px-4" data-testid="quick-page-container">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">{page.title}</span>
        </nav>

        {/* Page Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-page-title">
          {page.title}
        </h1>

        {/* Excerpt */}
        {page.excerpt && (
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {page.excerpt}
          </p>
        )}

        {/* Page Content */}
        {page.content ? (
          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
            data-testid="text-page-content"
          />
        ) : (
          <p className="text-muted-foreground italic">
            This page has no content yet.
          </p>
        )}

        {/* Published date */}
        {page.publishedAt && (
          <div className="mt-12 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(page.publishedAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
