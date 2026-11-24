const ITEMS = {
  fr: ["Musique", "Création de contenu", "Influence", "Sport", "Événementiel", "Mode", "Cinéma", "Humour", "Photographie", "Animation"],
  en: ["Music", "Content creation", "Influence", "Sports", "Events", "Fashion", "Cinema", "Comedy", "Photography", "Entertainment"],
}

export default function LandingMarquee({ language = "fr" }) {
  const items = ITEMS[language === "en" ? "en" : "fr"]

  return (
    <div className="kora-lp-marquee" aria-label={language === "en" ? "Talent categories on KORA" : "Univers de talents sur KORA"}>
      <div className="kora-lp-marquee-track">
        {[0, 1].map((copy) => (
          <div className="kora-lp-marquee-group" key={copy} aria-hidden={copy === 1 ? "true" : undefined}>
            {items.map((item) => (
              <span className="kora-lp-marquee-item" key={item}>
                <i aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
