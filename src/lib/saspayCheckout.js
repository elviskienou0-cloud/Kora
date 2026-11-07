const CHECKOUT_ERROR = "SasPay n'a pas fourni de lien de paiement valide. Aucun paiement n'a été confirmé. Réessayez ou contactez KORA."

export function getSasPayCheckoutUrl(payload) {
  if (
    !payload ||
    payload.success !== true ||
    payload.provider !== "saspay" ||
    payload.status !== "pending"
  ) {
    throw new Error(payload?.error || CHECKOUT_ERROR)
  }

  if (typeof payload.checkout_url !== "string" || !payload.checkout_url.trim()) {
    throw new Error(CHECKOUT_ERROR)
  }

  let checkout
  try {
    checkout = new URL(payload.checkout_url)
  } catch {
    throw new Error(CHECKOUT_ERROR)
  }

  if (
    checkout.protocol !== "https:" ||
    checkout.hostname !== "link.saspay.me" ||
    checkout.username ||
    checkout.password
  ) {
    throw new Error(CHECKOUT_ERROR)
  }

  return checkout.toString()
}
