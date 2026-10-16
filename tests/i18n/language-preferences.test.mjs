import test from "node:test"
import assert from "node:assert/strict"
import {
  getLanguageStorageKey,
  isSupportedLanguage,
  normalizeLanguage,
  readStoredLanguage,
} from "../../src/i18n/language-preferences.js"

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, String(value)) },
  }
}

test("language normalization always falls back to French", () => {
  assert.equal(normalizeLanguage("en"), "en")
  assert.equal(normalizeLanguage("fr"), "fr")
  assert.equal(normalizeLanguage("EN"), "fr")
  assert.equal(normalizeLanguage("invalid"), "fr")
  assert.equal(normalizeLanguage(null), "fr")
})

test("only French and English are supported", () => {
  assert.equal(isSupportedLanguage("fr"), true)
  assert.equal(isSupportedLanguage("en"), true)
  assert.equal(isSupportedLanguage("es"), false)
  assert.equal(isSupportedLanguage(undefined), false)
})

test("each account has an isolated language storage key", () => {
  const a = getLanguageStorageKey("account-a")
  const b = getLanguageStorageKey("account-b")
  const anonymous = getLanguageStorageKey(null)
  assert.notEqual(a, b)
  assert.notEqual(a, anonymous)
  assert.notEqual(b, anonymous)
})

test("a user's saved language does not leak to a different account", () => {
  const storage = makeStorage({
    [getLanguageStorageKey("account-a")]: "en",
    "kora-language": "en",
  })
  assert.equal(readStoredLanguage(storage, "account-a"), "en")
  assert.equal(readStoredLanguage(storage, "account-b"), null)
  assert.equal(readStoredLanguage(storage, null), "en")
})

test("invalid stored values are ignored", () => {
  const storage = makeStorage({
    [getLanguageStorageKey("account-a")]: "es",
    "kora-language": "es",
  })
  assert.equal(readStoredLanguage(storage, "account-a"), null)
  assert.equal(readStoredLanguage(storage, null), null)
})
