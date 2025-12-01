import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build URL from queryKey segments
    // - String segments are joined with "/" as path parts
    // - Object segment (if last) is converted to query params
    const pathParts: string[] = [];
    let queryParams: URLSearchParams | null = null;
    
    for (let i = 0; i < queryKey.length; i++) {
      const part = queryKey[i];
      
      if (typeof part === "string") {
        // String: add as path segment
        pathParts.push(part);
      } else if (typeof part === "number") {
        // Number: convert to string and add as path segment
        pathParts.push(String(part));
      } else if (typeof part === "object" && part !== null) {
        // Object: convert to query params
        queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(part)) {
          if (value !== undefined && value !== null) {
            queryParams.set(key, String(value));
          }
        }
      }
    }
    
    // Join path parts - first part is base URL, rest are path segments
    let url = pathParts[0] || "";
    for (let i = 1; i < pathParts.length; i++) {
      // If it looks like a query string (contains =), append with ?
      if (pathParts[i].includes("=")) {
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}${pathParts[i]}`;
      } else {
        // Otherwise append as path segment
        url = url.endsWith("/") ? `${url}${pathParts[i]}` : `${url}/${pathParts[i]}`;
      }
    }
    
    // Append query params from object
    if (queryParams) {
      const queryString = queryParams.toString();
      if (queryString) {
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}${queryString}`;
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
