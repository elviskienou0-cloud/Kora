import { useEffect, useRef } from "react"
import { useI18n, translations } from "@/i18n/kora-i18n.jsx"

const SKIP_TAGS = new Set(["SCRIPT","STYLE","NOSCRIPT","INPUT","TEXTAREA","SELECT","OPTION","CODE","PRE"])
const ATTRIBUTES = ["placeholder","title","aria-label","aria-description"]

function flattenDictionary(source, prefix = "", result = {}) {
  if (!source || typeof source !== "object") return result
  for (const [key, value] of Object.entries(source)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === "string") result[path] = value
    else if (value && typeof value === "object") flattenDictionary(value, path, result)
  }
  return result
}

function buildLanguageMaps() {
  const fr = flattenDictionary(translations.fr)
  const en = flattenDictionary(translations.en)
  const frToEn = new Map(), enToFr = new Map()
  for (const key of Object.keys(fr)) {
    const french = String(fr[key] || "").trim(), english = String(en[key] || "").trim()
    if (!french || !english || french === english) continue
    frToEn.set(french, english); enToFr.set(english, french)
  }
  return { frToEn, enToFr }
}
const LANGUAGE_MAPS = buildLanguageMaps()
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") }
function replaceKnownPhrases(value, map) {
  if (!value || !map.size) return value
  let result = value
  const entries = [...map.entries()].sort((a,b) => b[0].length - a[0].length)
  for (const [from, to] of entries) {
    if (!from || from.length < 2) continue
    const pattern = new RegExp("(^|\\s|[([{—–:;,!?])" + escapeRegExp(from) + "(?=$|\\s|[)\\]}—–:;,!?])", "g")
    result = result.replace(pattern, (_, prefix) => prefix + to)
  }
  return result
}
function replaceWholeWords(value, map) {
  if (!value || !map.size) return value
  let result = value
  const entries = [...map.entries()].filter(([from]) => /^[A-Za-zÀ-ÿ -]+$/.test(from) && from.trim().split(/\s+/).length <= 3).sort((a,b) => b[0].length - a[0].length)
  for (const [from, to] of entries) {
    if (from.trim().length < 3) continue
    const pattern = new RegExp("(^|\\s|[([{—–:;,!?])" + escapeRegExp(from) + "(?=$|\\s|[)\\]}—–:;,!?])", "gi")
    result = result.replace(pattern, (_, prefix) => prefix + to)
  }
  return result
}
function translateValue(value, language) {
  if (!value || typeof value !== "string") return value
  const map = language === "en" ? LANGUAGE_MAPS.frToEn : LANGUAGE_MAPS.enToFr
  const phraseTranslated = replaceKnownPhrases(value, map)
  return phraseTranslated !== value ? phraseTranslated : replaceWholeWords(value, map)
}
function shouldSkipNode(node) {
  const parent = node.parentElement
  if (!parent || SKIP_TAGS.has(parent.tagName)) return true
  return Boolean(parent.closest("[data-i18n-ignore], .notranslate, [contenteditable=\"true\"]"))
}
function translateDom(language) {
  if (typeof document === "undefined") return
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const textNodes = []; let node
  while ((node = walker.nextNode())) if (!shouldSkipNode(node)) textNodes.push(node)
  for (const textNode of textNodes) {
    const original = textNode.nodeValue
    if (!original || !original.trim()) continue
    const translated = translateValue(original, language)
    if (translated !== original) textNode.nodeValue = translated
  }
  const elements = document.body.querySelectorAll("input, textarea, [title], [aria-label], [aria-description]")
  for (const element of elements) {
    if (element.closest("[data-i18n-ignore], .notranslate")) continue
    for (const attribute of ATTRIBUTES) {
      if (!element.hasAttribute(attribute)) continue
      const current = element.getAttribute(attribute)
      const translated = translateValue(current, language)
      if (translated !== current) element.setAttribute(attribute, translated)
    }
  }
}
export default function GlobalI18nBridge() {
  const { language } = useI18n()
  const observerRef = useRef(null)
  const translatingRef = useRef(false)
  useEffect(() => {
    const run = () => {
      if (translatingRef.current) return
      translatingRef.current = true
      try { translateDom(language) } finally { translatingRef.current = false }
    }
    run()
    observerRef.current?.disconnect()
    const observer = new MutationObserver(run)
    observer.observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:ATTRIBUTES })
    observerRef.current = observer
    return () => { observer.disconnect(); observerRef.current = null }
  }, [language])
  return null
}