import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

const CONSENT_COOKIE = "kora_cookie_consent"
const CONSENT_VERSION = "2026-10-05"
const MAX_AGE = 60 * 60 * 24 * 180

function readConsent() {
  if (typeof document === "undefined") return null

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`))

  if (!match) return null

  try {
    return JSON.parse(decodeURIComponent(match.split("=")[1]))
  } catch {
    return null
  }
}

function saveConsent(choice) {
  const payload = {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: choice === "all",
    marketing: choice === "all",
    choice,
    decided_at: new Date().toISOString(),
  }

  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(
    JSON.stringify(payload)
  )}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax`

  window.dispatchEvent(new CustomEvent("kora-cookie-consent", {
    detail: payload,
  }))
}

export default function CookieConsent() {
  const [consent, setConsent] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const existing = readConsent()
    setConsent(existing)

    const handleChange = (event) => {
      setConsent(event.detail)
      setShowSettings(false)
    }

    window.addEventListener("kora-cookie-consent", handleChange)
    return () => window.removeEventListener("kora-cookie-consent", handleChange)
  }, [])

  const choose = (choice) => {
    saveConsent(choice)
    setConsent(readConsent())
  }

  const saveCustom = () => {
    const payload = {
      version: CONSENT_VERSION,
      necessary: true,
      analytics,
      marketing,
      choice: "custom",
      decided_at: new Date().toISOString(),
    }

    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(
      JSON.stringify(payload)
    )}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax`

    window.dispatchEvent(new CustomEvent("kora-cookie-consent", {
      detail: payload,
    }))
    setConsent(payload)
    setShowSettings(false)
  }

  if (consent) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kora-cookie-title"
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
    >
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-background p-5 shadow-2xl sm:p-7">
        {!showSettings ? (
          <>
            <div className="mb-4 flex items-start gap-3">
              <div className="text-2xl" aria-hidden="true">🍪</div>
              <div>
                <h2 id="kora-cookie-title" className="text-lg font-semibold">
                  Votre confidentialité compte
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  KORA utilise des cookies et technologies similaires nécessaires
                  au fonctionnement de la plateforme. Avec votre accord, nous
                  pouvons aussi utiliser des technologies facultatives pour
                  améliorer l’expérience et mesurer l’utilisation du service.
                </p>
              </div>
            </div>

            <p className="mb-5 text-xs leading-5 text-muted-foreground">
              Les cookies non essentiels ne sont activés qu’après votre choix.
              Vous pouvez modifier votre décision ultérieurement depuis la
              page Cookies.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => choose("necessary")}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
              >
                Refuser les non essentiels
              </button>

              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
              >
                Personnaliser
              </button>

              <button
                type="button"
                onClick={() => choose("all")}
                className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90"
              >
                Tout accepter
              </button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              <Link className="underline underline-offset-2" to="/cookies">
                Consulter la politique Cookies
              </Link>
              {" · "}
              <Link className="underline underline-offset-2" to="/confidentialite">
                Politique de confidentialité
              </Link>
            </p>
          </>
        ) : (
          <>
            <h2 id="kora-cookie-title" className="text-lg font-semibold">
              Personnaliser vos cookies
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Les cookies nécessaires sont toujours actifs. Les autres catégories
              restent désactivées tant que vous ne les avez pas acceptées.
            </p>

            <div className="mt-5 space-y-3">
              <label className="flex items-center justify-between rounded-xl border border-border p-4">
                <span>
                  <span className="block text-sm font-medium">Nécessaires</span>
                  <span className="block text-xs text-muted-foreground">
                    Connexion, sécurité et fonctionnement essentiel de KORA.
                  </span>
                </span>
                <input type="checkbox" checked readOnly aria-label="Cookies nécessaires" />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-border p-4">
                <span>
                  <span className="block text-sm font-medium">Mesure d’audience</span>
                  <span className="block text-xs text-muted-foreground">
                    Mesurer l’utilisation de KORA et améliorer le service.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(event) => setAnalytics(event.target.checked)}
                  aria-label="Cookies de mesure d’audience"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-border p-4">
                <span>
                  <span className="block text-sm font-medium">Marketing</span>
                  <span className="block text-xs text-muted-foreground">
                    Technologies facultatives destinées à la communication et à la promotion.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(event) => setMarketing(event.target.checked)}
                  aria-label="Cookies marketing"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={saveCustom}
                className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90"
              >
                Enregistrer mes choix
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
