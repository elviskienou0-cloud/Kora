const ALLOWED_ORIGINS = new Set([
  "https://www.koratalent.online",
  "https://koratalent.online",
  "https://kora-one-black.vercel.app",
  "https://localhost",
  "capacitor://localhost",
  "http://localhost",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
])

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.has(origin)) return true

  // Allow only KORA project preview deployments in the linked Vercel team.
  return /^https:\/\/kora-[a-z0-9-]+-elviskienou0-2186s-projects\.vercel\.app$/.test(origin)
}

export function isAllowedCorsOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin")
  // Native clients and server-to-server calls may not send Origin.
  return !origin || isAllowedOrigin(origin)
}

export function corsHeadersForRequest(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin")
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  }

  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin
  }

  return headers
}

export function corsPreflightResponse(request: Request): Response {
  if (!isAllowedCorsOrigin(request)) {
    return new Response("Origin not allowed", {
      status: 403,
      headers: { "Vary": "Origin" },
    })
  }

  return new Response(null, {
    status: 204,
    headers: corsHeadersForRequest(request),
  })
}
