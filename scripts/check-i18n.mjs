import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import vm from "node:vm"

const root = process.cwd()
const dictionaryPath = path.join(root, "src", "i18n", "kora-i18n.jsx")
const sourceRoot = path.join(root, "src")

function extractObject(source, name) {
  const marker = `const ${name} = `
  const markerIndex = source.indexOf(marker)
  if (markerIndex < 0) throw new Error(`Dictionary "${name}" was not found.`)
  const start = markerIndex + marker.length
  let depth = 0
  let state = "code"
  let escaped = false

  for (let index = start; index < source.length; index += 1) {
    const current = source[index]
    const next = source[index + 1]

    if (state === "line-comment") {
      if (current === "\n") state = "code"
      continue
    }
    if (state === "block-comment") {
      if (current === "*" && next === "/") {
        state = "code"
        index += 1
      }
      continue
    }
    if (state !== "code") {
      if (escaped) {
        escaped = false
        continue
      }
      if (current === "\\") {
        escaped = true
        continue
      }
      if (
        (state === "double" && current === '"') ||
        (state === "single" && current === "'") ||
        (state === "template" && current === "`")
      ) state = "code"
      continue
    }

    if (current === "/" && next === "/") {
      state = "line-comment"
      index += 1
      continue
    }
    if (current === "/" && next === "*") {
      state = "block-comment"
      index += 1
      continue
    }
    if (current === '"') { state = "double"; continue }
    if (current === "'") { state = "single"; continue }
    if (current === "`") { state = "template"; continue }
    if (current === "{") depth += 1
    if (current === "}") {
      depth -= 1
      if (depth === 0) return source.slice(start, index + 1)
    }
  }

  throw new Error(`Dictionary object "${name}" has unbalanced braces.`)
}

function evaluateDictionary(source, name) {
  const objectSource = extractObject(source, name)
  return vm.runInNewContext(`(${objectSource})`, Object.create(null), { timeout: 1000 })
}

function flattenDictionary(dictionary, prefix = "", output = new Map()) {
  for (const [key, value] of Object.entries(dictionary)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenDictionary(value, fullKey, output)
    } else if (typeof value === "string") {
      output.set(fullKey, value)
    } else {
      throw new Error(`Translation value "${fullKey}" must be a string or nested object.`)
    }
  }
  return output
}

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectSourceFiles(fullPath))
    } else if (/\.(?:js|jsx|ts|tsx)$/.test(entry.name)) {
      files.push(fullPath)
    }
  }
  return files
}

const source = await readFile(dictionaryPath, "utf8")
const fr = flattenDictionary(evaluateDictionary(source, "fr"))
const en = flattenDictionary(evaluateDictionary(source, "en"))
const missingInEnglish = [...fr.keys()].filter((key) => !en.has(key))
const missingInFrench = [...en.keys()].filter((key) => !fr.has(key))

if (missingInEnglish.length || missingInFrench.length) {
  console.error("French/English dictionary parity failed.")
  if (missingInEnglish.length) console.error("Missing in en:\n" + missingInEnglish.join("\n"))
  if (missingInFrench.length) console.error("Missing in fr:\n" + missingInFrench.join("\n"))
  process.exitCode = 1
}

const files = await collectSourceFiles(sourceRoot)
const keyPattern = /\bt\s*\(\s*(["'`])([^"'`]+)\1/g
const missingUsage = []
let literalReferences = 0
let dynamicReferencesSkipped = 0

for (const file of files) {
  const contents = await readFile(file, "utf8")
  let match
  while ((match = keyPattern.exec(contents))) {
    const key = match[2]
    if (key.includes("${")) {
      dynamicReferencesSkipped += 1
      continue
    }
    literalReferences += 1
    if (!fr.has(key) || !en.has(key)) {
      missingUsage.push({
        file: path.relative(root, file).replaceAll(path.sep, "/"),
        key,
        missingFrench: !fr.has(key),
        missingEnglish: !en.has(key),
      })
    }
  }
}

if (missingUsage.length) {
  console.error("Static translation references missing from one or both dictionaries:")
  for (const item of missingUsage) {
    console.error(`- ${item.file}: "${item.key}" (fr missing: ${item.missingFrench}; en missing: ${item.missingEnglish})`)
  }
  process.exitCode = 1
}

if (!process.exitCode) {
  console.log(`i18n check passed: ${fr.size} keys in each dictionary, ${literalReferences} literal references checked, ${dynamicReferencesSkipped} dynamic references skipped.`)
}
