import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  ".vercel",
  ".vite",
  "coverage",
  ".gradle",
  "Pods",
])
const ignoredRelativeDirectories = new Set([
  "android/app/build",
  "ios/build",
])
const maxFileBytes = 20 * 1024 * 1024

const checks = [
  {
    name: "clé secrète Supabase moderne",
    pattern: /\bsb_secret_[A-Za-z0-9_-]{12,}\b/g,
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
    name: "clé secrète Stripe",
    pattern: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/g,
  },
  {
    name: "secret webhook Stripe",
    pattern: /\bwhsec_[A-Za-z0-9]{16,}\b/g,
  },
  {
    name: "jeton GitHub",
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/g,
  },
  {
    name: "jeton Slack",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g,
  },
  {
    name: "clé d'accès AWS",
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    name: "clé API Google",
    pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/g,
  },
  {
    name: "clé API OpenAI",
    pattern: /\bsk-proj-[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    name: "variable Vite contenant un secret",
    pattern: /(?:import\.meta\.env\.)?VITE_[A-Z0-9_]*(?:SECRET|PRIVATE|SERVICE_ROLE|ACCESS_TOKEN|REFRESH_TOKEN|PASSWORD)\b/g,
  },
  {
    name: "affectation d'un secret serveur",
    pattern: /\b(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|KORA_SUPABASE_SECRET_KEY|RESEND_API_KEY|SASPAY_(?:SECRET_KEY|PRIVATE_KEY|API_KEY|TOKEN|WEBHOOK_SECRET)|STRIPE_(?:SECRET_KEY|WEBHOOK_SECRET)|AWS_SECRET_ACCESS_KEY)\b\s*[:=]\s*(?:"([^"\r\n]{16,})"|'([^'\r\n]{16,})'|\x60([^\x60\r\n]{16,})\x60|([^\s#]{16,}))/g,
  },
]

function isPlaceholder(value) {
  const normalized = value.trim()
  return !normalized ||
    /^(?:your[-_ ]|replace[-_ ]|example[-_ ]|changeme|change[-_ ]me|placeholder|<.*>|\$\{.*\}|xxx+)/i.test(normalized)
}

function collectFiles(directory, output = []) {
  if (!fs.existsSync(directory)) return output

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    const relative = path.relative(root, absolute).replaceAll(path.sep, "/")

    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) continue
      if ([...ignoredRelativeDirectories].some((ignored) =>
        relative === ignored || relative.startsWith(ignored + "/")
      )) continue
      collectFiles(absolute, output)
      continue
    }

    if (entry.isFile()) output.push(absolute)
  }

  return output
}

const files = collectFiles(root)
const findings = []
let skippedBinary = 0
let skippedLarge = 0

for (const file of files) {
  let stat
  try {
    stat = fs.statSync(file)
  } catch {
    continue
  }

  if (stat.size > maxFileBytes) {
    skippedLarge++
    continue
  }

  let buffer
  try {
    buffer = fs.readFileSync(file)
  } catch {
    continue
  }

  if (buffer.includes(0)) {
    skippedBinary++
    continue
  }

  const source = buffer.toString("utf8")
  if (source.includes("\uFFFD")) continue
  const relative = path.relative(root, file).replaceAll(path.sep, "/")

  for (const check of checks) {
    check.pattern.lastIndex = 0
    let match
    while ((match = check.pattern.exec(source)) !== null) {
      const candidate = match.slice(1).find(Boolean)
      if (candidate && isPlaceholder(candidate)) continue

      const line = source.slice(0, match.index).split("\n").length
      findings.push({ file: relative, line, name: check.name })
      if (match[0].length === 0) check.pattern.lastIndex++
    }
  }

  // Detect legacy Supabase service_role JWTs without flagging public anon JWTs.
  const jwtPattern = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g
  let jwt
  while ((jwt = jwtPattern.exec(source)) !== null) {
    try {
      const payload = JSON.parse(Buffer.from(jwt[0].split(".")[1], "base64url").toString("utf8"))
      if (payload?.role === "service_role") {
        const line = source.slice(0, jwt.index).split("\n").length
        findings.push({ file: relative, line, name: "JWT Supabase service_role historique" })
      }
    } catch {
      // Not a decodable JWT; ignore it.
    }
  }
}

if (findings.length) {
  console.error("\nÉCHEC — secret ou clé privée détecté dans le dépôt ou le bundle :")
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} — ${finding.name}`)
  }
  console.error("\nRévoque/renouvelle tout secret déjà exposé, puis déplace-le côté serveur.")
  process.exit(1)
}

console.log(`Contrôle réussi : ${files.length} fichier(s) texte du dépôt et du bundle parcourus.`)
console.log(`Fichiers binaires ignorés : ${skippedBinary}; fichiers de plus de 20 Mo ignorés : ${skippedLarge}.`)
console.log("Aucun motif connu de clé privée ou de secret serveur détecté dans les fichiers accessibles.")
