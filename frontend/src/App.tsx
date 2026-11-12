import { FormEvent, useState } from "react"
import { createShortLink, ShortenError, ShortenResult } from "./api/shorten"
import { formatExpiry } from "./formatExpiry"
import heroDesk from "./assets/hero-desk.webp"
import stepPaste from "./assets/step-paste.webp"
import stepCode from "./assets/step-code.webp"
import stepOpen from "./assets/step-open.webp"

const ERROR_ID = "form-error"

type FieldError = "validation" | "client" | null

export function App() {
  if (!isHome(window.location.pathname)) {
    return <NotFound />
  }
  return <Home />
}

function isHome(pathname: string): boolean {
  return pathname === "/" || pathname === ""
}

function NotFound() {
  return (
    <main className="shell missing">
      <p className="wordmark">Short</p>
      <p>
        This page is not part of the client. <a href="/">Return to the form</a>.
      </p>
    </main>
  )
}

function Home() {
  const [longUrl, setLongUrl] = useState("")
  const [ttl, setTtl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<FieldError>(null)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<ShortenResult | null>(null)
  const [copied, setCopied] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const urlError = validateLongUrl(longUrl)
    if (urlError) {
      setError(urlError)
      setErrorKind("validation")
      return
    }
    const parsedTtl = parseTtl(ttl)
    if (parsedTtl === "invalid") {
      setError("Lifetime must be a whole number of days from 1 to 3650.")
      setErrorKind("validation")
      return
    }

    setPending(true)
    setError(null)
    setErrorKind(null)
    try {
      const created = await createShortLink(longUrl.trim(), parsedTtl)
      setResult(created)
      setCopied(false)
    } catch (caught) {
      const failure = caught instanceof ShortenError ? caught : new ShortenError("The link service could not be reached.")
      setError(failure.message)
      setErrorKind(failure.status === 400 ? "validation" : "client")
    } finally {
      setPending(false)
    }
  }

  async function onCopy() {
    if (!result) return
    await navigator.clipboard.writeText(result.shortUrl)
    setCopied(true)
  }

  const describeForm = errorKind === "validation" && error !== null

  return (
    <div className="shell">
      <header className="mast">
        <p className="wordmark">Short</p>
        <p className="tagline">Create a link. Open it later.</p>
      </header>

      <section className="hero">
        <figure className="hero-photo">
          <img src={heroDesk} alt="Desk with a notebook, a brass pen, and a paper strip" />
        </figure>
        <div className="hero-copy">
          <h1>A short code for a long address.</h1>
          <p>Paste an http or https URL. Leave the lifetime blank and the service keeps it for two years.</p>
          <form
            className="card"
            onSubmit={onSubmit}
            aria-label="Create short link"
            aria-describedby={describeForm ? ERROR_ID : undefined}
            noValidate
          >
            <label htmlFor="long-url">Long URL</label>
            <input
              id="long-url"
              name="longUrl"
              type="url"
              inputMode="url"
              autoComplete="off"
              value={longUrl}
              onChange={(event) => setLongUrl(event.target.value)}
              aria-invalid={describeForm || undefined}
            />

            <label htmlFor="ttl">Lifetime in days (optional)</label>
            <input
              id="ttl"
              name="ttlInDays"
              type="text"
              inputMode="numeric"
              placeholder="365"
              value={ttl}
              onChange={(event) => setTtl(event.target.value)}
            />
            <p className="helper">Leave blank for 2 years. Whole days from 1 to 3650.</p>

            {error ? (
              <p id={ERROR_ID} className="error" role="alert">
                {error}
              </p>
            ) : null}

            <button className="primary" type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create short link"}
            </button>
          </form>

          {result ? (
            <section className="card result" aria-live="polite">
              <h2>Short link ready</h2>
              <p className="short-url">{result.shortUrl}</p>
              <p>
                <span className="label">Short code</span> {result.shortCode}
              </p>
              <p>
                <span className="label">Expires</span> {formatExpiry(result.expiresAt)}
              </p>
              <p className="long-url">{result.longUrl}</p>
              <div className="actions">
                <button type="button" className={copied ? "copied" : "text-action"} onClick={onCopy}>
                  {copied ? "Copied" : "Copy short link"}
                </button>
                <a className="text-action open" href={result.shortUrl} target="_blank" rel="noreferrer">
                  Open short link
                </a>
              </div>
            </section>
          ) : null}
        </div>
      </section>

      <section className="steps" aria-label="How the API is used">
        <Step
          number="1"
          title="Paste"
          src={stepPaste}
          alt="Hands placing a long letter into a tray"
          text="The long URL is the request body."
        />
        <Step
          number="2"
          title="Code"
          src={stepCode}
          alt="Metal letterpress type on cream paper"
          text="The service stores a mapping and returns a Base62 short code."
        />
        <Step
          number="3"
          title="Open"
          src={stepOpen}
          alt="Open doorway leading into daylight"
          text="The short URL hits GET /short/{shortCode} and the browser is sent to the long URL with 302."
        />
      </section>
      <p className="note">Codes are plain Base62. Lifetime defaults to two years when omitted.</p>
      <footer>
        <p>Short links are served by the API. Opening one leaves this page.</p>
      </footer>
    </div>
  )
}

function Step({ number, title, src, alt, text }: { number: string; title: string; src: string; alt: string; text: string }) {
  const [hidden, setHidden] = useState(false)
  return (
    <article className="step">
      {hidden ? null : (
        <img src={src} alt={alt} onError={() => setHidden(true)} />
      )}
      <h3>
        <span className="step-num">{number}</span> {title}
      </h3>
      <p>{text}</p>
    </article>
  )
}

export function validateLongUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value) return "Enter a long URL."
  if (value.length > 2048) return "Long URL must be 2048 characters or fewer."
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return "Use an http or https URL."
  }
  if (url.protocol !== "http:" && url.protocol !== "https:" || !url.hostname) {
    return "Use an http or https URL."
  }
  return null
}

export function parseTtl(raw: string): number | undefined | "invalid" {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  if (!/^\d+$/.test(trimmed)) return "invalid"
  const value = Number(trimmed)
  if (!Number.isInteger(value) || value < 1 || value > 3650) return "invalid"
  return value
}
