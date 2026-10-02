import { useEffect } from "react"

const STORAGE_PREFIX = "kora:form-draft:"
const TTL_MS = 30 * 60 * 1000

function isPersistableField(field) {
  if (!(field instanceof HTMLInputElement) &&
      !(field instanceof HTMLTextAreaElement) &&
      !(field instanceof HTMLSelectElement)) {
    return false
  }

  if (field.disabled || field.readOnly) return false
  if (field instanceof HTMLInputElement) {
    if (["password", "file", "hidden"].includes(field.type)) return false
  }

  return true
}

function fieldKey(field, index) {
  return field.name || field.id || `${field.tagName.toLowerCase()}-${index}`
}

function formKey(form) {
  const identifier =
    form.getAttribute("data-kora-draft-key") ||
    form.getAttribute("id") ||
    form.getAttribute("name") ||
    "default"

  return `${STORAGE_PREFIX}${window.location.pathname}:${identifier}`
}

function readFields(form) {
  const fields = Array.from(
    form.querySelectorAll("input, textarea, select")
  ).filter(isPersistableField)

  const values = {}

  fields.forEach((field, index) => {
    const key = fieldKey(field, index)

    if (field instanceof HTMLInputElement &&
        (field.type === "checkbox" || field.type === "radio")) {
      values[key] = { type: field.type, checked: field.checked }
      return
    }

    values[key] = { type: "value", value: field.value }
  })

  return values
}

function restoreField(field, saved) {
  if (!saved) return

  if (
    field instanceof HTMLInputElement &&
    (field.type === "checkbox" || field.type === "radio")
  ) {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "checked"
    )?.set

    setter?.call(field, Boolean(saved.checked))
    field.dispatchEvent(new Event("change", { bubbles: true }))
    return
  }

  if (typeof saved.value !== "string") return

  const prototype =
    field instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : field instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype

  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set

  setter?.call(field, saved.value)
  field.dispatchEvent(new Event("input", { bubbles: true }))
  field.dispatchEvent(new Event("change", { bubbles: true }))
}

export default function FormDraftPersistence() {
  useEffect(() => {
    const save = (form) => {
      if (!(form instanceof HTMLFormElement)) return

      const payload = {
        savedAt: Date.now(),
        values: readFields(form),
      }

      try {
        sessionStorage.setItem(formKey(form), JSON.stringify(payload))
      } catch {
        // Storage can be unavailable in privacy-restricted browsers.
      }
    }

    const restore = (form) => {
      if (!(form instanceof HTMLFormElement)) return

      const key = formKey(form)

      try {
        const raw = sessionStorage.getItem(key)
        if (!raw) return

        const payload = JSON.parse(raw)

        if (
          !payload?.savedAt ||
          Date.now() - payload.savedAt > TTL_MS ||
          !payload.values
        ) {
          sessionStorage.removeItem(key)
          return
        }

        const fields = Array.from(
          form.querySelectorAll("input, textarea, select")
        ).filter(isPersistableField)

        fields.forEach((field, index) => {
          const saved = payload.values[fieldKey(field, index)]
          if (!saved) return

          // Never replace an existing value loaded by KORA (important for edit pages).
          const hasValue =
            field instanceof HTMLInputElement &&
            (field.type === "checkbox" || field.type === "radio")
              ? field.checked
              : Boolean(field.value)

          if (!hasValue) restoreField(field, saved)
        })
      } catch {
        // Ignore malformed/blocked draft storage.
      }
    }

    const restoreAll = () => {
      document.querySelectorAll("form").forEach(restore)
    }

    const handleInput = (event) => {
      const field = event.target
      if (!isPersistableField(field)) return

      const form = field.closest("form")
      if (form) save(form)
    }

    const handleSubmit = (event) => {
      const form = event.target
      if (!(form instanceof HTMLFormElement)) return

      // Keep the latest draft until the form's own successful workflow
      // navigates away. This protects data if the request fails or the page reloads.
      save(form)
    }

    document.addEventListener("input", handleInput, true)
    document.addEventListener("change", handleInput, true)
    document.addEventListener("submit", handleSubmit, true)
    window.addEventListener("pageshow", restoreAll)

    // React forms may mount after the first paint.
    const timer = window.setTimeout(restoreAll, 150)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("input", handleInput, true)
      document.removeEventListener("change", handleInput, true)
      document.removeEventListener("submit", handleSubmit, true)
      window.removeEventListener("pageshow", restoreAll)
    }
  }, [])

  return null
}
