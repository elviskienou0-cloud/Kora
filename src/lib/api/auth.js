import { supabase } from "@/lib/supabase"

const PUBLIC_ROLES = ["client", "manager"]

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
}

function getAuthErrorMessage(error) {
  if (!error) {
    return "Une erreur d'authentification est survenue."
  }

  if (error.message === "Invalid login credentials") {
    return "Identifiants incorrects."
  }

  return error.message
}

export async function loginRequest({
  email,
  password,
}) {
  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase()

  if (!cleanEmail || !password) {
    throw new Error(
      "L'email et le mot de passe sont obligatoires."
    )
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

  if (error) {
    throw new Error(getAuthErrorMessage(error))
  }

  if (!data?.user) {
    throw new Error("Utilisateur introuvable.")
  }

  return data.user
}

export async function registerRequest({
  email,
  password,
  firstName,
  lastName,
  role,
}) {
  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase()

  const normalizedRole = normalizeRole(role)

  if (!cleanEmail || !password) {
    throw new Error(
      "L'email et le mot de passe sont obligatoires."
    )
  }

  if (!PUBLIC_ROLES.includes(normalizedRole)) {
    throw new Error(
      "Type de compte invalide. Choisissez Client ou Manager."
    )
  }

  const name =
    `${firstName || ""} ${lastName || ""}`.trim() ||
    cleanEmail

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        name,
        first_name: firstName || "",
        last_name: lastName || "",
        role: normalizedRole,
      },
    },
  })

  if (error) {
    throw new Error(getAuthErrorMessage(error))
  }

  if (!data?.user) {
    throw new Error("Impossible de créer le compte.")
  }

  return {
    user: data.user,
    session: data.session,
    pendingEmailConfirmation: !data.session,
  }
}

export async function getMeRequest() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw new Error(getAuthErrorMessage(error))
  }

  return user
}

export async function logoutRequest() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(getAuthErrorMessage(error))
  }

  return true
}

export async function updateMeRequest(patch = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(getAuthErrorMessage(userError))
  }

  if (!user) {
    throw new Error("Utilisateur non connecté.")
  }

  /*
   * Ces champs sont protégés contre les modifications
   * provenant du frontend.
   */
  const {
    id,
    role,
    authId,
    created_at,
    updated_at,
    ...safePatch
  } = patch

  const { data, error } = await supabase
    .from("profiles")
    .update(safePatch)
    .eq("id", user.id)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}