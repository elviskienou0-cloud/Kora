import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const CINETPAY_INIT_URL =
  "https://api-checkout.cinetpay.com/v2/payment"

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

function getSecretKey(): string | null {
  // Nouveau format Supabase
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS")

  if (secretKeysRaw) {
    try {
      const secretKeys = JSON.parse(secretKeysRaw)

      if (secretKeys?.default) {
        return secretKeys.default
      }
    } catch {
      // On continue avec les anciennes variables
    }
  }

  // Compatibilité avec les anciennes clés Supabase
  return (
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_SECRET_KEY") ||
    null
  )
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    })
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        error: "Méthode non autorisée",
      },
      405,
    )
  }

  try {
    /* =========================================================
       1. VARIABLES SUPABASE
    ========================================================= */

    const supabaseUrl = Deno.env.get("SUPABASE_URL")

    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")

    if (!supabaseUrl || !anonKey) {
      throw new Error(
        "Configuration Supabase manquante.",
      )
    }

    /* =========================================================
       2. AUTHENTIFICATION UTILISATEUR
    ========================================================= */

    const authorization =
      req.headers.get("Authorization")

    if (!authorization) {
      return jsonResponse(
        {
          error: "Authorization requise.",
        },
        401,
      )
    }

    const userClient = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      },
    )

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse(
        {
          error: "Session utilisateur invalide.",
        },
        401,
      )
    }

    /* =========================================================
       3. RÉCUPÉRATION DU BODY
    ========================================================= */

    const body = await req.json().catch(() => ({}))

    const planId = body?.plan_id

    const billingCycle =
      body?.billing_cycle || "monthly"

    if (!planId) {
      return jsonResponse(
        {
          error: "plan_id est obligatoire.",
        },
        400,
      )
    }

    if (
      billingCycle !== "monthly" &&
      billingCycle !== "annual"
    ) {
      return jsonResponse(
        {
          error:
            "billing_cycle doit être monthly ou annual.",
        },
        400,
      )
    }

    /* =========================================================
       4. VÉRIFICATION CINETPAY
    ========================================================= */

    const cinetpayApiKey =
      Deno.env.get("CINETPAY_API_KEY")

    const cinetpaySiteId =
      Deno.env.get("CINETPAY_SITE_ID")

    if (!cinetpayApiKey) {
      return jsonResponse(
        {
          error:
            "CINETPAY_API_KEY n'est pas configurée dans les secrets Supabase.",
        },
        503,
      )
    }

    /*
     * Tu n'as actuellement pas encore le Site ID.
     *
     * Le code est donc prêt mais refuse volontairement
     * de créer une transaction tant que le Site ID n'est
     * pas configuré.
     */
    if (!cinetpaySiteId) {
      return jsonResponse(
        {
          error:
            "CINETPAY_SITE_ID n'est pas encore configuré.",
          message:
            "Ajoute le Site ID CinetPay dans les secrets Supabase lorsque CinetPay te le fournira.",
        },
        503,
      )
    }

    /* =========================================================
       5. CRÉATION DU PAYMENT KORA
    ========================================================= */

    const {
      data: payment,
      error: paymentError,
    } = await userClient.rpc(
      "create_subscription_payment",
      {
        p_plan_id: String(planId),
        p_billing_cycle: billingCycle,
        p_provider: "cinetpay",
      },
    )

    if (paymentError) {
      console.error(
        "create_subscription_payment error:",
        paymentError,
      )

      return jsonResponse(
        {
          error:
            paymentError.message ||
            "Impossible de créer le paiement KORA.",
        },
        400,
      )
    }

    if (!payment) {
      return jsonResponse(
        {
          error:
            "Le paiement KORA n'a pas été créé.",
        },
        500,
      )
    }

    const paymentId = payment.id
    const reference =
      payment.reference ||
      `KORA-${crypto.randomUUID()}`

    const amount = Number(payment.amount)

    const currency =
      payment.currency || "XOF"

    if (!Number.isFinite(amount) || amount <= 0) {
      return jsonResponse(
        {
          error:
            "Montant du paiement invalide.",
        },
        400,
      )
    }

    if (amount % 5 !== 0) {
      return jsonResponse(
        {
          error:
            "Le montant doit être un multiple de 5 selon les règles CinetPay.",
          amount,
        },
        400,
      )
    }

    /* =========================================================
       6. RÉCUPÉRATION DU PROFIL CLIENT
    ========================================================= */

    const {
      data: profile,
    } = await userClient
      .from("profiles")
      .select("id, name")
      .eq("id", user.id)
      .maybeSingle()

    const fullName =
      profile?.name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Client KORA"

    const nameParts =
      fullName.trim().split(/\s+/)

    const customerSurname =
      nameParts.length > 1
        ? nameParts.slice(1).join(" ")
        : ""

    const customerName =
      nameParts[0] || "Client"

    /* =========================================================
       7. URLS
    ========================================================= */

    const appUrl =
      Deno.env.get("KORA_APP_URL") ||
      Deno.env.get("APP_URL") ||
      "http://localhost:5173"

    const notifyUrl =
      `${supabaseUrl}/functions/v1/payment-webhook`

    const returnUrl =
      `${appUrl}/dashboard/subscription?payment=return&reference=${encodeURIComponent(reference)}`

    /* =========================================================
       8. DESCRIPTION CINETPAY
    ========================================================= */

    const description =
      `Abonnement KORA ${billingCycle === "annual" ? "annuel" : "mensuel"}`

    /* =========================================================
       9. INITIALISATION CINETPAY
    ========================================================= */

    const cinetpayPayload = {
      apikey: cinetpayApiKey,
      site_id: cinetpaySiteId,

      transaction_id: reference,

      amount,
      currency,

      description,

      notify_url: notifyUrl,
      return_url: returnUrl,

      channels: "ALL",

      lang: "fr",

      metadata: JSON.stringify({
        payment_id: paymentId,
        user_id: user.id,
        plan_id: String(planId),
        billing_cycle: billingCycle,
        reference,
      }),

      customer_id: user.id,

      customer_name: customerName,

      customer_surname: customerSurname,

      customer_email: user.email || "",

      invoice_data: {
        Plan: String(planId),
        Periode:
          billingCycle === "annual"
            ? "Annuel"
            : "Mensuel",
        Reference: reference,
      },
    }

    console.log(
      "Initialisation CinetPay:",
      {
        reference,
        amount,
        currency,
        paymentId,
        userId: user.id,
      },
    )

    const cinetpayResponse =
      await fetch(CINETPAY_INIT_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "User-Agent": "KORA/1.0",
        },

        body: JSON.stringify(
          cinetpayPayload,
        ),
      })

    const cinetpayData =
      await cinetpayResponse
        .json()
        .catch(() => null)

    console.log(
      "Réponse CinetPay:",
      cinetpayData,
    )

    /* =========================================================
       10. ERREUR CINETPAY
    ========================================================= */

    if (
      !cinetpayResponse.ok ||
      !cinetpayData ||
      cinetpayData.code !== "201"
    ) {
      console.error(
        "CinetPay initialization failed:",
        cinetpayData,
      )

      return jsonResponse(
        {
          error:
            cinetpayData?.description ||
            cinetpayData?.message ||
            "CinetPay a refusé l'initialisation du paiement.",

          cinetpay_code:
            cinetpayData?.code || null,

          payment_id: paymentId,

          reference,
        },
        502,
      )
    }

    const paymentUrl =
      cinetpayData?.data?.payment_url

    const paymentToken =
      cinetpayData?.data?.payment_token

    if (!paymentUrl) {
      return jsonResponse(
        {
          error:
            "CinetPay n'a pas retourné de lien de paiement.",

          payment_id: paymentId,

          reference,
        },
        502,
      )
    }

    /* =========================================================
       11. ENREGISTRER LE LIEN DANS PAYMENTS
    ========================================================= */

    /*
     * Utilisation de la clé secrète côté serveur.
     * Elle n'est jamais envoyée au navigateur.
     */

    const secretKey =
      getSecretKey()

    if (!secretKey) {
      console.error(
        "Aucune clé secrète Supabase disponible.",
      )

      return jsonResponse(
        {
          error:
            "Configuration serveur Supabase incomplète.",
        },
        500,
      )
    }

    const adminClient =
      createClient(
        supabaseUrl,
        secretKey,
      )

    const { error: updateError } =
      await adminClient
        .from("payments")
        .update({
          provider: "cinetpay",
          provider_payment_id:
            paymentToken || reference,
          transaction_reference:
            reference,
          checkout_url:
            paymentUrl,
          metadata: {
            source:
              "kora_subscription",
            cinetpay: {
              api_response_id:
                cinetpayData?.api_response_id ||
                null,
              payment_token:
                paymentToken || null,
            },
          },
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", paymentId)

    if (updateError) {
      console.error(
        "Payment update error:",
        updateError,
      )

      /*
       * Le paiement CinetPay existe déjà.
       * On ne le recrée surtout pas.
       */
      return jsonResponse(
        {
          error:
            "Paiement CinetPay créé mais impossible d'enregistrer son lien dans KORA.",
          payment_id: paymentId,
          reference,
        },
        500,
      )
    }

    /* =========================================================
       12. RÉPONSE AU FRONTEND KORA
    ========================================================= */

    return jsonResponse({
      success: true,

      payment_id: paymentId,

      reference,

      provider: "cinetpay",

      status: "pending",

      checkout_url: paymentUrl,

      payment_token:
        paymentToken || null,

      amount,

      currency,

      plan_id: String(planId),

      billing_cycle: billingCycle,
    })
  } catch (error) {
    console.error(
      "create-payment fatal error:",
      error,
    )

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur inattendue lors de la création du paiement.",
      },
      500,
    )
  }
})