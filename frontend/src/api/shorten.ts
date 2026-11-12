export type ShortenResult = {
  longUrl: string
  shortUrl: string
  shortCode: string
  expiresAt: string
}

export class ShortenError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = "ShortenError"
    this.status = status
  }
}

type ErrorBody = {
  message?: string
}

function apiOrigin(): string {
  return (import.meta.env.VITE_API_ORIGIN ?? "").replace(/\/$/, "")
}

function unreachable(): ShortenError {
  return new ShortenError("The link service could not be reached.")
}

export async function createShortLink(longUrl: string, ttlInDays?: number): Promise<ShortenResult> {
  const body: { longUrl: string; ttlInDays?: number } = { longUrl }
  if (ttlInDays !== undefined) {
    body.ttlInDays = ttlInDays
  }

  let response: Response
  try {
    response = await fetch(`${apiOrigin()}/api/v1/shorten`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    throw unreachable()
  }

  const type = response.headers.get("content-type") ?? ""
  if (!type.includes("application/json")) {
    throw unreachable()
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw unreachable()
  }

  if (response.status === 201) {
    return payload as ShortenResult
  }

  const message = isErrorBody(payload) ? payload.message?.trim() : undefined
  if (response.status === 400) {
    throw new ShortenError(message || "The long URL was rejected.", 400)
  }
  if (response.status === 503) {
    throw new ShortenError(message || "The link service is unavailable. Try again in a moment.", 503)
  }
  throw unreachable()
}

function isErrorBody(value: unknown): value is ErrorBody {
  return typeof value === "object" && value !== null
}
