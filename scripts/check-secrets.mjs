import fs from "node:fs"
import path from "node:path"

const roots = ["src", "public", "dist", "index.html"]
const textExtensions = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".html", ".css",
  ".json", ".svg", ".xml", ".txt", ".map",
])
const checks = [
  {
    name: "clé secrète Supabase moderne",
    pattern: new RegExp("sb_secret_[A-Za-z0-9_-]{12,}", "g"),
  },
  {
    name: "clé privée PEM",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    name: "clé API Resend",
    pattern: /\bre_[A-Za-z0-9_-]{24,}\b/g,
  },
  {
    name: "clé live de paiement",
    pattern: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/g,
  },
  {
    name: "variable secrète injectée dans le frontend",
    pattern: /(?:import\.meta\.env\.)?VITE_[A-Z0-9_]*(?:SECRET|PRIVATE|SERVICE_ROLE|ACCESS_TOKEN|REFRESH_TOKEN|PASSWORD)\b/g,
  },
  {
    name: "affectation de secret serveur dans le frontend",
    pattern: /(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|KORA_SUPABASE_SECRET_KEY|RESEND_API_KEY|SASPAY_SECRET_KEY|SASPAY_PRIVATE_KEY)\s*[:=]\s*["'`][^"'`\r\n]{8,}["'`]/g,
  },
]

const files = []
function collect(target) {
  if (!fs.existsSync(target)) return
  const stat = fs.statSync(target)
  if (stat.isFile()) {
    files.push(target)
    return
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue
    const child = path.join(target, entry.name)
    if (entry.isDirectory()) collect(child)
    else if (textExtensions.has(path.extname(entry.name).toLowerCase())) files.push(child)
  }
}

for (const root of roots) collect(root)

const findings = []
for (const file of files) {
  const content = fs.readFileSync(file, "utf8")
  for (const check of checks) {
    check.pattern.lastIndex = 0
    let match
    while ((match = check.pattern.exec(content)) !== null) {
      const line = content.slice(0, match.index).split("\n").length
      findings.push({ file, line, name: check.name })
      if (match[0].length === 0) check.pattern.lastIndex++
    }
  }
}

if (findings.length) {
  console.error("\nÉCHEC — élément sensible détecté dans le frontend :")
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} — ${finding.name}`)
  }
  console.error("\nRetire le secret du frontend et place-le dans une variable serveur sécurisée.")
  process.exit(1)
}

console.log(`Contrôle des secrets réussi : ${files.length} fichier(s) frontend vérifié(s).`)
console.log("Aucun motif de clé privée ou de secret serveur connu détecté.")
