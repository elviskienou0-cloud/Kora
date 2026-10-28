import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import * as ts from "typescript"
import { fileURLToPath } from "node:url"
import { normalizeLanguage, persistLanguage, resolveInitialLanguage, STORAGE_KEY } from "../src/i18n/language.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const i18nPath = path.join(root, "src/i18n/kora-i18n.jsx")
const i18nSource = fs.readFileSync(i18nPath, "utf8")
const i18nAst = ts.createSourceFile(i18nPath, i18nSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

assert.equal(
  i18nAst.parseDiagnostics.length,
  0,
  `Invalid syntax in i18n source: ${i18nAst.parseDiagnostics.map((diagnostic) => {
    const position = diagnostic.start ?? 0
    const location = i18nAst.getLineAndCharacterOfPosition(position)
    return `${location.line + 1}:${location.character + 1} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`
  }).join("\n")}`,
)

function extractObject(sourceFile, variableName) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const item of statement.declarationList.declarations) {
      if (ts.isIdentifier(item.name) && item.name.text === variableName && item.initializer) {
        assert.ok(ts.isObjectLiteralExpression(item.initializer), `Dictionary must be an object literal: ${variableName}`)
        return item.initializer
      }
    }
  }
  assert.fail(`Missing dictionary declaration: ${variableName}`)
}

function findDuplicateKeys(node, path, duplicates = []) {
  if (!ts.isObjectLiteralExpression(node)) return duplicates

  const seen = new Set()
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue

    const keyNode = property.name
    const key = ts.isIdentifier(keyNode) || ts.isStringLiteral(keyNode) || ts.isNumericLiteral(keyNode)
      ? keyNode.text
      : null
    if (key === null) continue

    if (seen.has(key)) duplicates.push(`${path}.${key}`)
    seen.add(key)

    if (ts.isObjectLiteralExpression(property.initializer)) {
      findDuplicateKeys(property.initializer, `${path}.${key}`, duplicates)
    }
  }

  return duplicates
}

const duplicateDictionaryKeys = [
  ...findDuplicateKeys(extractObject(i18nAst, "fr"), "fr"),
  ...findDuplicateKeys(extractObject(i18nAst, "en"), "en"),
]
assert.deepEqual(
  duplicateDictionaryKeys,
  [],
  `Duplicate translation keys in dictionary source:\n${duplicateDictionaryKeys.join("\n")}`,
)

// Read translation values from the TypeScript AST rather than evaluating source code.
// This avoids VM parser failures and never executes the application module.
function objectLiteralToValue(node, variableName) {
  assert.ok(ts.isObjectLiteralExpression(node), `Expected an object literal in dictionary ${variableName}`)
  const result = {}

  for (const property of node.properties) {
    assert.ok(ts.isPropertyAssignment(property), `Unsupported property syntax in dictionary ${variableName}`)
    const keyNode = property.name
    const key = ts.isIdentifier(keyNode) || ts.isStringLiteral(keyNode) || ts.isNumericLiteral(keyNode)
      ? keyNode.text
      : null
    assert.ok(key !== null, `Unsupported dictionary key in ${variableName}`)

    const initializer = property.initializer
    if (ts.isObjectLiteralExpression(initializer)) {
      result[key] = objectLiteralToValue(initializer, variableName)
    } else if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
      result[key] = initializer.text
    } else {
      assert.fail(`Translation value must be a string or nested object: ${variableName}.${key}`)
    }
  }

  return result
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

const fr = flatten(objectLiteralToValue(extractObject(i18nAst, "fr"), "fr"))
const en = flatten(objectLiteralToValue(extractObject(i18nAst, "en"), "en"))
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
  const expression = /\bt\s*\(\s*(?:(["'])((?:\\.|[^\\])*?)\1|\x60([^\x60]*)\x60)/g

  for (const match of source.matchAll(expression)) {
    const key = match[2] ?? match[3] ?? ""

    // Interpolated template keys are dynamic and cannot be checked as literal keys.
    if (key.includes("${")) continue

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
