import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"
import { normalizeLanguage, persistLanguage, resolveInitialLanguage, STORAGE_KEY } from "../src/i18n/language.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const i18nPath = path.join(root, "src/i18n/kora-i18n.jsx")
const i18nSource = fs.readFileSync(i18nPath, "utf8")

function extractObject(source, declaration) {
  const declarationIndex = source.indexOf(declaration)
  assert.notEqual(declarationIndex, -1, `Missing dictionary declaration: ${declaration}`)
  const start = source.indexOf("{", declarationIndex)
  let depth = 0
  let quote = null
  let escaped = false
  let lineComment = false
  let blockComment = false

  for (let index = start; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]

    if (lineComment) {
      if (char === "\n") lineComment = false
      continue
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false
        index += 1
      }
      continue
    }
    if (quote) {
      if (escaped) {
        escaped = false
        continue
      }
      if (char === "\\") {
        escaped = true
        continue
      }
      if (char === quote) quote = null
      continue
    }
    if (char === "/" && next === "/") {
      lineComment = true
      index += 1
      continue
    }
    if (char === "/" && next === "*") {
      blockComment = true
      index += 1
      continue
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char
      continue
    }
    if (char === "{") depth += 1
    if (char === "}") {
      depth -= 1
      if (depth === 0) return source.slice(start, index + 1)
    }
  }

  throw new Error(`Unclosed dictionary object: ${declaration}`)
}

function flatten(value, prefix = "", result = {}) {
  for (const [key, child] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === "object" && !Array.isArray(child)) {
      flatten(child, fullKey, result)
    } else {
      result[fullKey] = child
    }
  }
  return result
}

const fr = flatten(vm.runInNewContext(`(${extractObject(i18nSource, "const fr =")})`))
const en = flatten(vm.runInNewContext(`(${extractObject(i18nSource, "const en =")})`))
const frKeys = Object.keys(fr).sort()
const enKeys = Object.keys(en).sort()
const missingInEnglish = frKeys.filter((key) => !Object.hasOwn(en, key))
const missingInFrench = enKeys.filter((key) => !Object.hasOwn(fr, key))
const nonStringValues = [...frKeys, ...enKeys].filter((key) => {
  const value = Object.hasOwn(fr, key) ? fr[key] : en[key]
  return typeof value !== "string" || value.trim() === ""
})
const placeholderMismatches = frKeys
  .filter((key) => Object.hasOwn(en, key))
  .filter((key) => {
    const variables = (value) => [...value.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((match) => match[1]).sort()
    return JSON.stringify(variables(fr[key])) !== JSON.stringify(variables(en[key]))
  })

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(fullPath)
    return /\.(?:js|jsx|ts|tsx)$/.test(entry.name) ? [fullPath] : []
  })
}

const missingStaticReferences = []
for (const file of sourceFiles(path.join(root, "src"))) {
  const source = fs.readFileSync(file, "utf8")
  // Interpolated template keys are dynamic and cannot be checked as literal keys.
  const expression = /\bt\s*\(\s*(["\'])([^"\']+)\1/g
  for (const match of source.matchAll(expression)) {
    const key = match[2]
    if (!Object.hasOwn(fr, key) || !Object.hasOwn(en, key)) {
      const line = source.slice(0, match.index).split("\n").length
      missingStaticReferences.push(`${path.relative(root, file)}:${line} → ${key}`)
    }
  }
}

assert.deepEqual(missingInEnglish, [], `Missing English keys:\n${missingInEnglish.join("\n")}`)
assert.deepEqual(missingInFrench, [], `Missing French keys:\n${missingInFrench.join("\n")}`)
assert.deepEqual(nonStringValues, [], `Empty or non-string translation values:\n${nonStringValues.join("\n")}`)
assert.deepEqual(placeholderMismatches, [], `Placeholder mismatch between FR and EN:\n${placeholderMismatches.join("\n")}`)
assert.deepEqual(missingStaticReferences, [], `Static t() references missing from a dictionary:\n${missingStaticReferences.join("\n")}`)

// Exercise the language normalization and persistence contract without requiring a browser.
assert.equal(normalizeLanguage("en"), "en")
assert.equal(normalizeLanguage("fr"), "fr")
assert.equal(normalizeLanguage("invalid"), "fr")
assert.equal(resolveInitialLanguage("en"), "en")
assert.equal(resolveInitialLanguage("fr"), "fr")
assert.equal(resolveInitialLanguage(null), "fr")
assert.equal(resolveInitialLanguage("invalid"), "fr")
let savedKey = null
let savedValue = null
const fakeStorage = { setItem(key, value) { savedKey = key; savedValue = value } }
assert.equal(persistLanguage("en", fakeStorage), "en")
assert.equal(savedKey, STORAGE_KEY)
assert.equal(savedValue, "en")
assert.equal(persistLanguage("invalid", fakeStorage), "fr")
assert.equal(savedValue, "fr")
assert.equal(persistLanguage("en", { setItem() { throw new Error("storage unavailable") } }), "en")

console.log(`i18n OK: ${frKeys.length} FR/EN keys in parity; ${frKeys.length} keys with matching placeholders; static references verified; language fallback and persistence tested.`)
