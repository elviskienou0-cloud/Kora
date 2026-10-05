import { useEffect } from "react"
import { useI18n } from "@/i18n/kora-i18n.jsx"
const SITE_URL = "https://kora.africa"
const DEFAULT_IMAGE = `${SITE_URL}/favicon.svg`

function upsertMeta({
  name,
  property,
  content,
}) {
  if (!content) return null

  const attribute = property ? "property" : "name"
  const value = property || name

  let node = document.head.querySelector(
    `meta[${attribute}="${value}"]`
  )

  const created = !node

  if (!node) {
    node = document.createElement("meta")
    node.setAttribute(attribute, value)
    document.head.appendChild(node)
  }

  node.setAttribute("content", content)

  return {
    node,
    created,
  }
}

function upsertLink(rel, href) {
  let node = document.head.querySelector(
    `link[rel="${rel}"]`
  )

  const created = !node

  if (!node) {
    node = document.createElement("link")
    node.setAttribute("rel", rel)
    document.head.appendChild(node)
  }

  node.setAttribute("href", href)

  return {
    node,
    created,
  }
}

function upsertJsonLd(id, data) {
  let node = document.head.querySelector(
    `script[data-kora-schema="${id}"]`
  )

  if (!node) {
    node = document.createElement("script")
    node.type = "application/ld+json"
    node.setAttribute("data-kora-schema", id)
    document.head.appendChild(node)
  }

  node.textContent = JSON.stringify(data)

  return node
}

function removeIfCreated(items = []) {
  for (const item of items) {
    if (item?.created && item.node?.parentNode) {
      item.node.parentNode.removeChild(item.node)
    }
  }
}

export default function SEOHead({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  locale,
  talent = null,
}) {
  const { language, t } = useI18n()

  const currentLanguage = locale || language

  useEffect(() => {
    const cleanTitle =
      title ||
      t("seo.siteTitle")

    const cleanDescription =
      description ||
      t("seo.siteDescription")

    const canonicalUrl = path.startsWith("http")
      ? path
      : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`

    const absoluteImage = image.startsWith("http")
      ? image
      : `${SITE_URL}${
          image.startsWith("/") ? image : `/${image}`
        }`

    document.title = cleanTitle
    document.documentElement.lang = currentLanguage

    const createdNodes = []

    const descriptionMeta = upsertMeta({
      name: "description",
      content: cleanDescription,
    })

    if (descriptionMeta?.created) {
      createdNodes.push(descriptionMeta)
    }

    const robotsMeta = upsertMeta({
      name: "robots",
      content: noindex
        ? "noindex,nofollow"
        : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    })

    if (robotsMeta?.created) {
      createdNodes.push(robotsMeta)
    }

    const ogTitle = upsertMeta({
      property: "og:title",
      content: cleanTitle,
    })

    const ogDescription = upsertMeta({
      property: "og:description",
      content: cleanDescription,
    })

    const ogType = upsertMeta({
      property: "og:type",
      content: type,
    })

    const ogUrl = upsertMeta({
      property: "og:url",
      content: canonicalUrl,
    })

    const ogImage = upsertMeta({
      property: "og:image",
      content: absoluteImage,
    })

    const ogSiteName = upsertMeta({
      property: "og:site_name",
      content: "KORA",
    })

    const ogLocale = upsertMeta({
      property: "og:locale",
      content:
        currentLanguage === "en"
          ? "en_GB"
          : "fr_FR",
    })

    const twitterCard = upsertMeta({
      name: "twitter:card",
      content: "summary_large_image",
    })

    const twitterTitle = upsertMeta({
      name: "twitter:title",
      content: cleanTitle,
    })

    const twitterDescription = upsertMeta({
      name: "twitter:description",
      content: cleanDescription,
    })

    const twitterImage = upsertMeta({
      name: "twitter:image",
      content: absoluteImage,
    })

    const twitterSite = upsertMeta({
      name: "twitter:site",
      content: "@KORA",
    })

    const allMeta = [
      descriptionMeta,
      robotsMeta,
      ogTitle,
      ogDescription,
      ogType,
      ogUrl,
      ogImage,
      ogSiteName,
      ogLocale,
      twitterCard,
      twitterTitle,
      twitterDescription,
      twitterImage,
      twitterSite,
    ]

    for (const item of allMeta) {
      if (item?.created) {
        createdNodes.push(item)
      }
    }

    const canonical = upsertLink(
      "canonical",
      canonicalUrl
    )

    if (canonical?.created) {
      createdNodes.push(canonical)
    }

    // --------------------------------------------------
    // JSON-LD
    // --------------------------------------------------

    const schemas = []

    schemas.push(
      upsertJsonLd("website", {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "KORA",
        url: SITE_URL,
        description: t("seo.siteDescription"),
        inLanguage: currentLanguage,
      })
    )

    schemas.push(
      upsertJsonLd("organization", {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "KORA",
        url: SITE_URL,
        logo: DEFAULT_IMAGE,
        email: "kora.contact1@gmail.com",
      })
    )

    if (talent) {
      const talentName =
        `${talent.first_name || ""} ${
          talent.last_name || ""
        }`
          .replace(/\s+/g, " ")
          .trim() ||
        t("seo.talentFallbackTitle")

      const talentDescription =
        (
          talent.bio ||
          talent.title ||
          t("seo.talentFallbackDescription")
        )
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 160)

      const talentUrl = `${SITE_URL}/talent/${talent.id}`

      schemas.push(
        upsertJsonLd(
          "talent-profile",
          {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            url: talentUrl,
            name:
              currentLanguage === "en"
                ? `${talentName} — ${talent.title || t("seo.talentSuffix")} | KORA`
                : `${talentName} — ${talent.title || t("seo.talentSuffix")} | KORA`,
            description: talentDescription,
            inLanguage: currentLanguage,
            mainEntity: {
              "@type": "Person",
              name: talentName,
              description: talentDescription,
              jobTitle: talent.title || undefined,
              address: {
                "@type": "PostalAddress",
                addressLocality: talent.city || undefined,
                addressCountry:
                  talent.countries?.code ||
                  talent.countries?.name ||
                  undefined,
              },
              url: talentUrl,
            },
          }
        )
      )
    }

    return () => {
      removeIfCreated(createdNodes)

      for (const schema of schemas) {
        if (
          schema?.parentNode &&
          schema.getAttribute("data-kora-schema")
        ) {
          schema.parentNode.removeChild(schema)
        }
      }
    }
  }, [
    title,
    description,
    path,
    image,
    type,
    noindex,
    currentLanguage,
    talent,
    t,
  ])

  return null
}

export { SITE_URL, DEFAULT_IMAGE }