const BASE = "";

export async function fetchFeaturedProducts(limit = 4) {
  const res = await fetch(`${BASE}/api/products?featured=true&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch featured products");
  return res.json();
}

export async function fetchTrendingProducts(limit = 3) {
  const res = await fetch(`${BASE}/api/products?trending=true&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch trending products");
  return res.json();
}

export async function fetchTopCategories(limit = 4) {
  const res = await fetch(`${BASE}/api/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  const data = await res.json();
  const topLevel = (data.categories || []).filter((c: any) => !c.parentId);
  return { categories: topLevel.slice(0, limit) };
}

export async function fetchApprovedReviews(limit = 2) {
  const res = await fetch(`${BASE}/api/reviews?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}

export async function subscribeNewsletter(email: string) {
  const res = await fetch(`${BASE}/api/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Subscription failed");
  return res.json();
}
