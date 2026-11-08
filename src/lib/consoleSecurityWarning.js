const WARNING_TITLE = "AVERTISSEMENT DE SÉCURITÉ KORA";
const WARNING_BODY = [
  "Cette console est destinée aux développeurs.",
  "Ne collez jamais ici un code fourni par un inconnu.",
  "Un script collé peut voler votre session ou agir sur votre compte.",
  "Si vous ne comprenez pas un code, ne l'exécutez pas.",
].join("\n");

export function showConsoleSecurityWarning() {
  if (!import.meta.env.PROD || typeof window === "undefined") return;

  const warningKey = "__koraConsoleSecurityWarningShown";
  if (window[warningKey]) return;
  window[warningKey] = true;

  console.log(
    "%c" + WARNING_TITLE,
    "color:#b91c1c;font-size:18px;font-weight:800;padding:4px 0;"
  );
  console.warn(WARNING_BODY);
}
