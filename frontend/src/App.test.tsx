import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { App } from "./App"
import { formatExpiry } from "./formatExpiry"

const created = {
  longUrl: "https://example.com/notes",
  shortUrl: "http://localhost:8080/short/b9K2x1",
  shortCode: "b9K2x1",
  expiresAt: "2027-10-09T09:25:00Z",
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  window.history.pushState({}, "", "/")
})

afterEach(() => {
  cleanup()
})

async function submit(url: string, ttl?: string) {
  const user = userEvent.setup()
  render(<App />)
  if (url) {
    await user.type(screen.getByLabelText("Long URL"), url)
  }
  if (ttl !== undefined) {
    await user.type(screen.getByLabelText("Lifetime in days (optional)"), ttl)
  }
  await user.click(screen.getByRole("button", { name: "Create short link" }))
  return user
}

describe("create form", () => {
  it("omits ttlInDays when the lifetime is blank", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(201, created))
    await submit("https://example.com/notes")
    expect(fetchMock).toHaveBeenCalledOnce()
    const [, init] = fetchMock.mock.calls[0]
    expect(String(init?.body)).toBe(JSON.stringify({ longUrl: "https://example.com/notes" }))
    expect(JSON.parse(String(init?.body))).not.toHaveProperty("ttlInDays")
    expect(screen.getByText("Short link ready")).toBeInTheDocument()
    expect(screen.getByText(created.shortUrl)).toBeInTheDocument()
    expect(screen.getByText(created.shortCode)).toBeInTheDocument()
    expect(screen.getByText(formatExpiry(created.expiresAt))).toBeInTheDocument()
  })

  it("sends ttlInDays when the lifetime is 365", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(201, created))
    await submit("https://example.com/notes", "365")
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body).toEqual({ longUrl: "https://example.com/notes", ttlInDays: 365 })
  })

  it("rejects an empty URL, a missing scheme, an oversize URL, and TTL 0 without fetch", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
    const user = userEvent.setup()

    const empty = render(<App />)
    await user.click(screen.getByRole("button", { name: "Create short link" }))
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a long URL.")
    empty.unmount()

    const scheme = render(<App />)
    await user.type(screen.getByLabelText("Long URL"), "example.com/notes")
    await user.click(screen.getByRole("button", { name: "Create short link" }))
    expect(screen.getByRole("alert")).toHaveTextContent("Use an http or https URL.")
    scheme.unmount()

    const oversized = `https://example.com/${"a".repeat(2040)}`
    expect(oversized.length).toBeGreaterThan(2048)
    const long = render(<App />)
    await user.click(screen.getByLabelText("Long URL"))
    await user.paste(oversized)
    await user.click(screen.getByRole("button", { name: "Create short link" }))
    expect(screen.getByRole("alert")).toHaveTextContent("2048")
    long.unmount()

    const ttl = render(<App />)
    await user.type(screen.getByLabelText("Long URL"), "https://example.com/notes")
    await user.type(screen.getByLabelText("Lifetime in days (optional)"), "0")
    await user.click(screen.getByRole("button", { name: "Create short link" }))
    expect(screen.getByRole("alert")).toHaveTextContent("1 to 3650")
    ttl.unmount()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("keeps the same ready label on a second 201", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(201, created))
    const user = await submit("https://example.com/notes")
    await user.click(screen.getByRole("button", { name: "Create short link" }))
    expect(screen.getAllByText("Short link ready")).toHaveLength(1)
  })
})

describe("errors", () => {
  it("shows a 400 message and keeps the typed URL", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(400, { status: 400, error: "Bad Request", message: "longUrl contains disallowed HTML" }),
    )
    await submit("https://example.com/notes")
    expect(screen.getByRole("alert")).toHaveTextContent("longUrl contains disallowed HTML")
    expect(screen.getByLabelText("Long URL")).toHaveValue("https://example.com/notes")
    expect(screen.getByRole("form")).toHaveAttribute("aria-describedby", "form-error")
  })

  it("shows a 503 message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(503, { status: 503, error: "Service Unavailable", message: "Database unavailable" }),
    )
    await submit("https://example.com/notes")
    expect(screen.getByRole("alert")).toHaveTextContent("Database unavailable")
  })

  it("shows the network sentence when fetch rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"))
    await submit("https://example.com/notes")
    expect(screen.getByRole("alert")).toHaveTextContent("The link service could not be reached.")
  })
})

describe("pictures and actions", () => {
  it("shows the hero and the three step pictures", () => {
    render(<App />)
    expect(screen.getByAltText("Desk with a notebook, a brass pen, and a paper strip")).toBeInTheDocument()
    expect(screen.getByAltText("Hands placing a long letter into a tray")).toBeInTheDocument()
    expect(screen.getByAltText("Metal letterpress type on cream paper")).toBeInTheDocument()
    expect(screen.getByAltText("Open doorway leading into daylight")).toBeInTheDocument()
  })

  it("copies the short URL and opens it from the returned address", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(201, created))
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.spyOn(navigator.clipboard, "writeText").mockImplementation(writeText)
    const user = await submit("https://example.com/notes")
    await user.click(screen.getByRole("button", { name: "Copy short link" }))
    expect(writeText).toHaveBeenCalledWith(created.shortUrl)
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open short link" })).toHaveAttribute("href", created.shortUrl)
  })
})
