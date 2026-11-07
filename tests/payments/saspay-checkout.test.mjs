import test from "node:test"
import assert from "node:assert/strict"

import { getSasPayCheckoutUrl } from "../../src/lib/saspayCheckout.js"

const validPayload = {
  success: true,
  provider: "saspay",
  status: "pending",
  checkout_url: "https://link.saspay.me/ozk-dberun4",
}

test("accepts a valid pending SasPay checkout URL", () => {
  assert.equal(
    getSasPayCheckoutUrl(validPayload),
    "https://link.saspay.me/ozk-dberun4"
  )
})

test("rejects a successful response without a checkout URL", () => {
  assert.throws(
    () => getSasPayCheckoutUrl({ ...validPayload, checkout_url: "" }),
    /lien de paiement valide/
  )
})

test("rejects a checkout URL outside the SasPay domain", () => {
  assert.throws(
    () => getSasPayCheckoutUrl({
      ...validPayload,
      checkout_url: "https://example.com/pay",
    }),
    /lien de paiement valide/
  )
})

test("rejects insecure checkout URLs", () => {
  assert.throws(
    () => getSasPayCheckoutUrl({
      ...validPayload,
      checkout_url: "http://link.saspay.me/ozk-dberun4",
    }),
    /lien de paiement valide/
  )
})

test("rejects responses that do not confirm a pending SasPay payment", () => {
  assert.throws(
    () => getSasPayCheckoutUrl({ ...validPayload, status: "paid" }),
    /lien de paiement valide/
  )
})
