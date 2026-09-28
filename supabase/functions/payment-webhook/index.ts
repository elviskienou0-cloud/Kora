import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CINETPAY_CHECK_URL =
  "https://api-checkout.cinetpay.com/v2/payment/check"

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

function getSecretKey(): string | null {
  /*
   * Nouveau format Supabase
   */
  const secretKeysRaw =
    Deno.env.get("SUPABASE_SECRET_KEYS")

  if (secretKeysRaw) {
    try {
      const secretKeys =
        JSON.parse(secretKeysRaw)

      if (secretKeys?.default) {
        return secretKeys.default
      }
    } catch {
      // fallback legacy
    }
  }

  /*
   * Compatibilité anciennes clés Supabase
   */
  return (
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_SECRET_KEY") ||
    null
  )
}

/* =========================================================
   COMPARAISON HMAC SÉCURISÉE
========================================================= */

function timingSafeEqual(
  a: string,
  b: string,
): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0

  for (let i = 0; i < a.length; i++) {
    result |=
      a.charCodeAt(i) ^
      b.charCodeAt(i)
  }

  return result === 0
}

/* =========================================================
   HMAC SHA256
========================================================= */

async function generateHmacSha256(
  message: string,
  secret: string,
): Promise<string> {
  const encoder =
    new TextEncoder()

  const keyData =
    encoder.encode(secret)

  const messageData =
    encoder.encode(message)

  const cryptoKey =
    await crypto.subtle.importKey(
      "raw",
      keyData,
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    )

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      messageData,
    )

  const bytes =
    new Uint8Array(signature)

  return Array.from(bytes)
    .map((byte) =>
      byte.toString(16).padStart(2, "0"),
    )
    .join("")
}

/* =========================================================
   VÉRIFICATION HMAC CINETPAY
========================================================= */

async function verifyCinetPayToken(
  formData: FormData,
  receivedToken: string,
  secretKey: string,
): Promise<boolean> {
  const fields = [
    "cpm_site_id",
    "cpm_trans_id",
    "cpm_trans_date",
    "cpm_amount",
    "cpm_currency",
    "signature",
    "payment_method",
    "cel_phone_num",
    "cpm_phone_prefixe",
    "cpm_language",
    "cpm_version",
    "cpm_payment_config",
    "cpm_page_action",
    "cpm_custom",
    "cpm_designation",
    "cpm_error_message",
  ]

  const data = fields
    .map(
      (field) =>
        formData.get(field)?.toString() || "",
    )
    .join("")

  const generatedToken =
    await generateHmacSha256(
      data,
      secretKey,
    )

  return timingSafeEqual(
    receivedToken.toLowerCase(),
    generatedToken.toLowerCase(),
  )
}

/* =========================================================
   HANDLER
========================================================= */

Deno.serve(async (req) => {
  /*
   * CinetPay recommande que le notify_url soit accessible
   * en GET et POST.
   */

  if (req.method === "GET") {
    return jsonResponse({
      ok: true,
      service: "KORA payment webhook",
      provider: "cinetpay",
    })
  }

  if (req.method !== "POST") {
    return new Response(
      "Method Not Allowed",
      {
        status: 405,
      },
    )
  }

  try {
    /* =====================================================
       1. CONFIGURATION
    ===================================================== */

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL")

    const secretKey =
      getSecretKey()

    const cinetpayApiKey =
      Deno.env.get("CINETPAY_API_KEY")

    const cinetpaySiteId =
      Deno.env.get("CINETPAY_SITE_ID")

    const cinetpaySecretKey =
      Deno.env.get(
        "CINETPAY_SECRET_KEY",
      )

    if (!supabaseUrl) {
      throw new Error(
        "SUPABASE_URL manquante.",
      )
    }

    if (!secretKey) {
      throw new Error(
        "Clé secrète Supabase manquante.",
      )
    }

    if (!cinetpayApiKey) {
      throw new Error(
        "CINETPAY_API_KEY manquante.",
      )
    }

    if (!cinetpaySiteId) {
      throw new Error(
        "CINETPAY_SITE_ID manquante.",
      )
    }

    /* =====================================================
       2. LIRE LE FORMULAIRE CINETPAY
    ===================================================== */

    const contentType =
      req.headers.get("content-type") || ""

    let formData: FormData

    if (
      contentType.includes(
        "application/x-www-form-urlencoded",
      ) ||
      contentType.includes(
        "multipart/form-data",
      )
    ) {
      formData =
        await req.formData()
    } else {
      /*
       * Certains tests peuvent envoyer du JSON.
       * On le supporte sans l'utiliser comme source
       * de vérité pour le statut.
       */

      const raw =
        await req.text()

      const json =
        JSON.parse(raw || "{}")

      formData =
        new FormData()

      for (const [
        key,
        value,
      ] of Object.entries(json)) {
        if (
          value !== null &&
          value !== undefined
        ) {
          formData.append(
            key,
            String(value),
          )
        }
      }
    }

    /* =====================================================
       3. RÉCUPÉRER LA TRANSACTION
    ===================================================== */

    const transactionId =
      formData
        .get("cpm_trans_id")
        ?.toString()
        .trim()

    const receivedSiteId =
      formData
        .get("cpm_site_id")
        ?.toString()
        .trim()

    if (!transactionId) {
      return jsonResponse(
        {
          error:
            "cpm_trans_id manquant.",
        },
        400,
      )
    }

    /*
     * Vérification du Site ID envoyé par CinetPay.
     */

    if (
      receivedSiteId &&
      receivedSiteId !== cinetpaySiteId
    ) {
      console.error(
        "Site ID CinetPay incorrect.",
      )

      return jsonResponse(
        {
          error:
            "Site ID CinetPay invalide.",
        },
        403,
      )
    }

    /* =====================================================
       4. VÉRIFICATION HMAC
    ===================================================== */

    /*
     * CinetPay recommande le x-token HMAC.
     *
     * Le secret correspondant doit être placé dans :
     *
     * CINETPAY_SECRET_KEY
     */

    const receivedToken =
      req.headers.get("x-token")

    if (
      cinetpaySecretKey &&
      receivedToken
    ) {
      const valid =
        await verifyCinetPayToken(
          formData,
          receivedToken,
          cinetpaySecretKey,
        )

      if (!valid) {
        console.error(
          "Token HMAC CinetPay invalide.",
        )

        return jsonResponse(
          {
            error:
              "Signature CinetPay invalide.",
          },
          403,
        )
      }
    }

    /*
     * Si CinetPay_SECRET_KEY n'est pas encore disponible,
     * on continue vers la vérification API.
     *
     * La vérification API reste obligatoire.
     */

    /* =====================================================
       5. CLIENT SUPABASE ADMIN
    ===================================================== */

    const adminClient =
      createClient(
        supabaseUrl,
        secretKey,
      )

    /* =====================================================
       6. RETROUVER LE PAYMENT KORA
    ===================================================== */

    const {
      data: payment,
      error: paymentLookupError,
    } = await adminClient
      .from("payments")
      .select("*")
      .eq(
        "reference",
        transactionId,
      )
      .maybeSingle()

    if (paymentLookupError) {
      console.error(
        "Payment lookup error:",
        paymentLookupError,
      )

      throw paymentLookupError
    }

    if (!payment) {
      /*
       * On ne modifie jamais un paiement inconnu.
       */

      console.error(
        "Payment KORA introuvable:",
        transactionId,
      )

      return jsonResponse(
        {
          error:
            "Paiement KORA introuvable.",
          transaction_id:
            transactionId,
        },
        404,
      )
    }

    /* =====================================================
       7. SI DÉJÀ PAYÉ
    ===================================================== */

    if (payment.status === "paid") {
      return jsonResponse({
        ok: true,
        already_processed: true,
        payment_id: payment.id,
        reference: transactionId,
        status: "paid",
      })
    }

    /* =====================================================
       8. VÉRIFICATION DIRECTE AUPRÈS DE CINETPAY
    ===================================================== */

    const verifyResponse =
      await fetch(
        CINETPAY_CHECK_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
            "User-Agent":
              "KORA/1.0",
          },

          body: JSON.stringify({
            apikey:
              cinetpayApiKey,

            site_id:
              cinetpaySiteId,

            transaction_id:
              transactionId,
          }),
        },
      )

    const verification =
      await verifyResponse
        .json()
        .catch(() => null)

    console.log(
      "CinetPay verification:",
      verification,
    )

    if (
      !verifyResponse.ok ||
      !verification
    ) {
      throw new Error(
        "Impossible de vérifier la transaction auprès de CinetPay.",
      )
    }

    /* =====================================================
       9. RÉCUPÉRER LES DONNÉES VÉRIFIÉES
    ===================================================== */

    const verifiedData =
      verification?.data || {}

    const cinetpayStatus =
      String(
        verifiedData?.cpm_trans_status ||
        verification?.status ||
        "",
      ).toUpperCase()

    const verifiedAmount =
      Number(
        verifiedData?.cpm_amount ??
        formData.get("cpm_amount") ??
        0,
      )

    const verifiedCurrency =
      String(
        verifiedData?.cpm_currency ||
        formData.get("cpm_currency") ||
        "",
      ).toUpperCase()

    /* =====================================================
       10. VÉRIFIER MONTANT
    ===================================================== */

    const expectedAmount =
      Number(payment.amount)

    if (
      !Number.isFinite(
        verifiedAmount,
      ) ||
      verifiedAmount !==
        expectedAmount
    ) {
      console.error(
        "Montant différent:",
        {
          expected:
            expectedAmount,
          received:
            verifiedAmount,
        },
      )

      return jsonResponse(
        {
          error:
            "Le montant CinetPay ne correspond pas au montant KORA.",
          expected:
            expectedAmount,
          received:
            verifiedAmount,
        },
        400,
      )
    }

    /* =====================================================
       11. VÉRIFIER DEVISE
    ===================================================== */

    const expectedCurrency =
      String(
        payment.currency ||
          "XOF",
      ).toUpperCase()

    if (
      verifiedCurrency &&
      verifiedCurrency !==
        expectedCurrency
    ) {
      console.error(
        "Devise différente:",
        {
          expected:
            expectedCurrency,
          received:
            verifiedCurrency,
        },
      )

      return jsonResponse(
        {
          error:
            "La devise CinetPay ne correspond pas à la devise KORA.",
          expected:
            expectedCurrency,
          received:
            verifiedCurrency,
        },
        400,
      )
    }

    /* =====================================================
       12. DÉTERMINER LE STATUT KORA
    ===================================================== */

    let koraStatus:
      | "paid"
      | "failed"
      | "cancelled"
      | "refunded"
      | "pending"

    switch (
      cinetpayStatus
    ) {
      case "ACCEPTED":
      case "VALIDATED":
      case "SUCCESS":
      case "SUCCES":
        koraStatus = "paid"
        break

      case "REFUSED":
      case "FAILED":
      case "FAILURE":
        koraStatus = "failed"
        break

      case "CANCELLED":
      case "CANCELED":
        koraStatus = "cancelled"
        break

      case "REFUNDED":
        koraStatus = "refunded"
        break

      case "WAITING_FOR_CUSTOMER":
      case "PENDING":
      case "PENDING_PAYMENT":
      case "WAITING":
      default:
        /*
         * IMPORTANT :
         * WAITING_FOR_CUSTOMER ne doit surtout pas
         * être considéré comme un échec.
         */

        koraStatus = "pending"
        break
    }

    /* =====================================================
       13. ÉVÉNEMENT CINETPAY
    ===================================================== */

    /*
     * CinetPay peut appeler plusieurs fois le webhook.
     *
     * On crée un ID d'événement déterministe.
     */

    const eventId =
      `${transactionId}:${cinetpayStatus || "UNKNOWN"}:${verifiedData?.cpm_trans_date || formData.get("cpm_trans_date") || ""}`

    /* =====================================================
       14. APPLIQUER LE WEBHOOK VIA LA FONCTION SQL
    ===================================================== */

    const {
      data: appliedPayment,
      error: applyError,
    } = await adminClient.rpc(
      "apply_payment_webhook",
      {
        p_provider:
          "cinetpay",

        p_provider_event_id:
          eventId,

        p_payment_id:
          payment.id,

        p_provider_payment_id:
          transactionId,

        p_amount:
          verifiedAmount,

        p_currency:
          verifiedCurrency ||
          expectedCurrency,

        p_status:
          koraStatus,

        p_payload: {
          source:
            "cinetpay_webhook",

          webhook: Object.fromEntries(
            formData.entries(),
          ),

          verification,
        },

        p_period_start:
          null,

        p_period_end:
          null,
      },
    )

    if (applyError) {
      console.error(
        "apply_payment_webhook error:",
        applyError,
      )

      throw applyError
    }

    /* =====================================================
       15. RÉPONSE
    ===================================================== */

    return jsonResponse({
      ok: true,

      provider:
        "cinetpay",

      payment_id:
        payment.id,

      reference:
        transactionId,

      status:
        koraStatus,

      cinetpay_status:
        cinetpayStatus,

      amount:
        verifiedAmount,

      currency:
        verifiedCurrency ||
        expectedCurrency,

      payment:
        appliedPayment || null,
    })
  } catch (error) {
    console.error(
      "payment-webhook fatal error:",
      error,
    )

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur webhook paiement.",
      },
      500,
    )
  }
})