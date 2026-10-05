// KORA — ancien webhook CinetPay désactivé.
// Le flux de paiement actuellement déclaré par KORA est SasPay avec
// validation manuelle par un administrateur. Cette fonction reste présente
// pour éviter une suppression brutale d'une URL déjà déployée, mais elle ne
// doit plus accepter ni traiter d'événements CinetPay.

function jsonResponse(body: Record<string, unknown>, status = 410) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "GET") {
    return jsonResponse({
      ok: false,
      service: "KORA payment webhook",
      provider: "saspay",
      status: "disabled_legacy_cinetpay_webhook",
    }, 410)
  }

  return jsonResponse({
    ok: false,
    error: "Cet ancien webhook CinetPay est désactivé. KORA utilise SasPay avec validation manuelle.",
  }, 410)
})
