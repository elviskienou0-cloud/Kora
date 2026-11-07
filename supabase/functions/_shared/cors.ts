const ALLOWED_ORIGINS = new Set([
  "https://www.koratalent.online",
  "https://koratalent.online",
  "https://kora-one-black.vercel.app",
  "https://localhost",
  "capacitor://localhost",
  "http://localhost",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
])

export function isAllowedCorsOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin")
  // Native clients and server-to-server calls may not send Origin.
  return !origin || ALLOWED_ORIGINS.has(origin)
}

export function corsHeadersForRequest(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin")
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  }

  if (origin && ALLOWED_ORIGINS.has(origin)) {
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
