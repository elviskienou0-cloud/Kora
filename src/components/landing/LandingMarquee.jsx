import { useEffect, useMemo, useRef, useState } from "react"
import { APP_PARAMS } from "@/lib/app-params"
import { useI18n } from "@/i18n/kora-i18n.jsx"

const CATEGORY_KEYS = {
  music:"landing.categoryMusic", fashion:"landing.categoryFashion", influence:"landing.categoryInfluence",
  sport:"landing.categorySport", events:"landing.categoryEvents", culture:"landing.categoryCulture",
  cinema:"landing.categoryCinema", voice:"landing.categoryVoice", comedy:"landing.categoryComedy",
  beauty:"landing.categoryBeauty", gastronomy:"landing.categoryGastronomy",
}

export default function LandingMarquee({ language = "fr" }) {
  const { t } = useI18n()
  const rootRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const items = useMemo(() => APP_PARAMS.categories.map((category) => CATEGORY_KEYS[category.id] ? t(CATEGORY_KEYS[category.id]) : category.name), [t, language])
  const splitAt = Math.ceil(items.length / 2)
  const rows = [items.slice(0, splitAt), items.slice(splitAt)]

  useEffect(() => {
    const element = rootRef.current
    if (!element || !("IntersectionObserver" in window)) { setVisible(true); return undefined }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "80px" })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return <div ref={rootRef} className={"kora-lp-marquee kora-spotlight-marquee " + (visible ? "is-visible" : "is-offscreen")} aria-label={language === "en" ? "Talent categories on KORA" : "Univers de talents sur KORA"}>
    {rows.map((row, index) => <div className={"kora-spotlight-marquee-track " + (index ? "is-reverse" : "")} key={index}>
      <div className="kora-spotlight-marquee-group">
        {[...row, ...row].map((item, itemIndex) => <span className="kora-spotlight-marquee-word" key={item + "-" + itemIndex} aria-hidden={itemIndex >= row.length ? "true" : undefined}>{item}<i aria-hidden="true">✦</i></span>)}
      </div>
    </div>)}
  </div>
}
