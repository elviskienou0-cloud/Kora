import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type EventType = "expiry_7_days" | "expiry_3_days" | "expired"

type SubscriptionRow = {
  id: string
  user_id: string
  plan_id: string | null
  plan: string | null
  status: string
  trial_end: string | null
  current_period_end: string | null
  ends_at: string | null
  updated_at: string
}

type ProfileRow = {
  id: string
  name: string | null
  role: string
  preferences: Record<string, unknown> | null
}

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_EMAIL_ATTEMPTS = 5
const APP_URL = "https://www.koratalent.online"
const EMAIL_FROM = Deno.env.get("KORA_EMAIL_FROM") || "KORA <no-reply@auth.koratalent.online>"

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  })
}

function getServiceKey(): string | null {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS")
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed?.default === "string" && parsed.default.trim()) return parsed.default
    } catch {
      console.error("SUPABASE_SECRET_KEYS is not valid JSON")
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_SECRET_KEY") ||
    null
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character)
}

function getExpiry(subscription: SubscriptionRow): number | null {
  const value = subscription.status === "trialing"
    ? subscription.trial_end || subscription.current_period_end || subscription.ends_at
    : subscription.current_period_end || subscription.ends_at
  if (!value) return null
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

function getDueEvent(subscription: SubscriptionRow, now: number): { type: EventType; expiresAt: string } | null {
  const expiryMs = getExpiry(subscription)
  if (expiryMs === null) return null
  const expiresAt = new Date(expiryMs).toISOString()

  if (subscription.status === "expired") {
    const recentlyExpired = expiryMs <= now && expiryMs > now - 48 * 60 * 60 * 1000
    const recentlyUpdated = new Date(subscription.updated_at).getTime() > now - 72 * 60 * 60 * 1000
    return recentlyExpired && recentlyUpdated ? { type: "expired", expiresAt } : null
  }

  if (!["active", "trialing"].includes(subscription.status) || expiryMs <= now) return null
  if (expiryMs > now + 6 * DAY_MS && expiryMs <= now + 7 * DAY_MS) {
    return { type: "expiry_7_days", expiresAt }
  }
  if (expiryMs > now + 2 * DAY_MS && expiryMs <= now + 3 * DAY_MS) {
    return { type: "expiry_3_days", expiresAt }
  }
  return null
}

function emailContent(eventType: EventType, name: string, date: string, language: string) {
  const safeName = escapeHtml(name || (language === "en" ? "there" : ""))
  const greeting = language === "en" ? `Hello ${safeName},` : `Bonjour ${safeName},`
  const details = {
    expiry_7_days: language === "en"
      ? "Your KORA subscription expires in 7 days. Renew it in advance to keep access to your Manager tools."
      : "Votre abonnement KORA expire dans 7 jours. Renouvelez-le à l'avance pour conserver l'accès à vos outils Manager.",
    expiry_3_days: language === "en"
      ? "Your KORA subscription expires in 3 days. Please renew it before the end date."
      : "Votre abonnement KORA expire dans 3 jours. Pensez à le renouveler avant la date d'échéance.",
    expired: language === "en"
      ? "Your KORA subscription has expired. Your Manager space is read-only until a renewal is validated. Your data and talents remain saved."
      : "Votre abonnement KORA est arrivé à expiration. Votre espace Manager est en lecture seule jusqu'à la validation d'un renouvellement. Vos données et vos talents sont conservés.",
  }[eventType]
  const subject = {
    expiry_7_days: language === "en" ? "Your KORA subscription expires in 7 days" : "Votre abonnement KORA expire dans 7 jours",
    expiry_3_days: language === "en" ? "Your KORA subscription expires in 3 days" : "Votre abonnement KORA expire dans 3 jours",
    expired: language === "en" ? "Your KORA subscription has expired" : "Votre abonnement KORA a expiré",
  }[eventType]
  const dateLabel = language === "en" ? "Expiration date" : "Date d'expiration"
  const action = language === "en" ? "Renew my subscription" : "Renouveler mon abonnement"
  const html = `<!doctype html><html><body style="margin:0;padding:32px;background:#f5f5f5;font-family:Arial,sans-serif;color:#171717"><main style="max-width:600px;margin:auto;padding:32px;background:#fff;border:1px solid #e5e5e5;border-radius:16px"><p style="font-size:22px;font-weight:700;letter-spacing:2px">KORA</p><p>${greeting}</p><h1 style="font-size:22px">${escapeHtml(subject)}</h1><p style="line-height:1.6">${escapeHtml(details)}</p><p style="padding:14px;background:#f8f8f8;border-radius:8px"><strong>${dateLabel} :</strong> ${escapeHtml(date)}</p><p style="margin:28px 0"><a href="${APP_URL}/manager/subscription" style="display:inline-block;padding:13px 20px;background:#171717;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">${action}</a></p><p style="font-size:12px;color:#737373">KORA · ${APP_URL}</p></main></body></html>`
  return { subject, html }
}

async function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL")
  const key = getServiceKey()
  if (!url || !key) throw new Error("Configuration serveur Supabase incomplète.")
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405)

  const expectedSecret = Deno.env.get("KORA_SUBSCRIPTION_CRON_SECRET")
  const receivedSecret = req.headers.get("x-kora-cron-secret")
  if (!expectedSecret || !receivedSecret || receivedSecret !== expectedSecret) {
    return json({ error: "Accès non autorisé." }, 401)
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY")
  const admin = await createAdminClient()
  const now = Date.now()

  try {
    const { error: expireError } = await admin.rpc("expire_due_subscriptions")
    if (expireError) throw expireError

    const subscriptions: SubscriptionRow[] = []
    const pageSize = 1000
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await admin
        .from("subscriptions")
        .select("id,user_id,plan_id,plan,status,trial_end,current_period_end,ends_at,updated_at")
        .in("status", ["active", "trialing", "expired"])
        .range(from, from + pageSize - 1)
      if (error) throw error
      subscriptions.push(...((data || []) as SubscriptionRow[]))
      if (!data || data.length < pageSize) break
    }

    const profileIds = [...new Set(subscriptions.map((item) => item.user_id).filter(Boolean))]
    const profilesById = new Map<string, ProfileRow>()
    for (let from = 0; from < profileIds.length; from += pageSize) {
      const ids = profileIds.slice(from, from + pageSize)
      const { data, error } = await admin
        .from("profiles")
        .select("id,name,role,preferences")
        .in("id", ids)
      if (error) throw error
      for (const profile of (data || []) as ProfileRow[]) profilesById.set(profile.id, profile)
    }

    let eventsCreated = 0
    for (const subscription of subscriptions) {
      const profile = profilesById.get(subscription.user_id)
      if (profile?.role !== "manager") continue
      const due = getDueEvent(subscription, now)
      if (!due) continue

      const { data, error } = await admin
        .from("subscription_notification_events")
        .insert({
          subscription_id: subscription.id,
          user_id: subscription.user_id,
          event_type: due.type,
          expires_at: due.expiresAt,
        })
        .select("id")
        .maybeSingle()

      if (error?.code === "23505") continue
      if (error) throw error
      if (data?.id) eventsCreated += 1
    }

    const { data: notificationEvents, error: notificationQueryError } = await admin
      .from("subscription_notification_events")
      .select("id,user_id,event_type,expires_at")
      .is("notification_created_at", null)
      .order("created_at", { ascending: true })
      .limit(500)
    if (notificationQueryError) throw notificationQueryError

    let notificationsCreated = 0
    for (const event of notificationEvents || []) {
      const date = new Date(event.expires_at).toLocaleDateString("fr-FR", { dateStyle: "long", timeZone: "Africa/Ouagadougou" })
      const title = event.event_type === "expiry_7_days"
        ? "Votre abonnement expire dans 7 jours"
        : event.event_type === "expiry_3_days"
          ? "Votre abonnement expire dans 3 jours"
          : "Votre abonnement KORA a expiré"
      const message = event.event_type === "expiry_7_days"
        ? `Votre abonnement KORA arrive à échéance le ${date}. Renouvelez-le pour conserver l'accès à vos outils Manager.`
        : event.event_type === "expiry_3_days"
          ? `Votre abonnement KORA arrive à échéance le ${date}. Pensez à le renouveler avant son expiration.`
          : `Votre abonnement est arrivé à expiration le ${date}. Votre espace Manager est en lecture seule jusqu'à la validation d'un renouvellement.`

      const { error: insertNotificationError } = await admin.from("notifications").insert({
        user_id: event.user_id,
        type: "subscription",
        title,
        message,
        link: "/manager/subscription",
        data: {
          kora_subscription_event: event.event_type,
          expires_at: event.expires_at,
          subscription_notification_event_id: event.id,
        },
        is_read: false,
      })

      if (insertNotificationError) {
        await admin.from("subscription_notification_events")
          .update({ last_error: `Notification interne: ${insertNotificationError.message}` })
          .eq("id", event.id)
        continue
      }

      const { error: markNotificationError } = await admin
        .from("subscription_notification_events")
        .update({ notification_created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", event.id)
      if (!markNotificationError) notificationsCreated += 1
    }

    if (!resendApiKey) {
      return json({
        success: true,
        events_created: eventsCreated,
        notifications_created: notificationsCreated,
        emails_sent: 0,
        email_configured: false,
        warning: "RESEND_API_KEY is not configured; email events remain pending.",
      })
    }

    const retryBefore = new Date(now - 30 * 60 * 1000).toISOString()
    const { data: emailEvents, error: emailQueryError } = await admin
      .from("subscription_notification_events")
      .select("id,user_id,event_type,expires_at,email_attempts,email_status,updated_at")
      .in("email_status", ["pending", "failed", "sending"])
      .lt("email_attempts", MAX_EMAIL_ATTEMPTS)
      .order("created_at", { ascending: true })
      .limit(100)
    if (emailQueryError) throw emailQueryError

    let emailsSent = 0
    let emailsFailed = 0
    for (const event of emailEvents || []) {
      if (event.email_status === "sending" && event.updated_at > retryBefore) continue

      const nextAttempt = Number(event.email_attempts || 0) + 1
      const { data: lockData, error: lockError } = await admin
        .from("subscription_notification_events")
        .update({ email_status: "sending", email_attempts: nextAttempt, updated_at: new Date().toISOString() })
        .eq("id", event.id)
        .eq("email_status", event.email_status)
        .eq("email_attempts", event.email_attempts)
        .select("id")
        .maybeSingle()
      if (lockError || !lockData?.id) {
        if (lockError) emailsFailed += 1
        continue
      }

      try {
        const [{ data: authResult, error: authError }, { data: profile }] = await Promise.all([
          admin.auth.admin.getUserById(event.user_id),
          admin.from("profiles").select("name,preferences").eq("id", event.user_id).maybeSingle(),
        ])
        if (authError) throw authError
        const email = authResult?.user?.email
        if (!email) throw new Error("Aucune adresse e-mail disponible pour ce compte.")

        const language = profile?.preferences?.language === "en" ? "en" : "fr"
        const date = new Date(event.expires_at).toLocaleDateString(language === "en" ? "en-GB" : "fr-FR", {
          dateStyle: "long",
          timeZone: "Africa/Ouagadougou",
        })
        const content = emailContent(event.event_type as EventType, profile?.name || "", date, language)
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: [email],
            subject: content.subject,
            html: content.html,
          }),
        })
        const responseBody = await response.json().catch(() => ({}))
        if (!response.ok) {
          const detail = typeof responseBody?.message === "string"
            ? responseBody.message
            : `Resend HTTP ${response.status}`
          throw new Error(detail)
        }

        const { error: sentUpdateError } = await admin
          .from("subscription_notification_events")
          .update({
            email_status: "sent",
            email_sent_at: new Date().toISOString(),
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", event.id)
        if (sentUpdateError) throw sentUpdateError
        emailsSent += 1
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur d'envoi e-mail inconnue."
        await admin
          .from("subscription_notification_events")
          .update({
            email_status: "failed",
            last_error: message.slice(0, 1000),
            updated_at: new Date().toISOString(),
          })
          .eq("id", event.id)
        emailsFailed += 1
        console.error("KORA subscription email failed", { eventId: event.id, message })
      }
    }

    return json({
      success: true,
      events_created: eventsCreated,
      notifications_created: notificationsCreated,
      emails_sent: emailsSent,
      emails_failed: emailsFailed,
      email_configured: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue."
    console.error("KORA subscription notifications failed:", message)
    return json({ success: false, error: message }, 500)
  }
})
