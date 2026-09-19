import { supabase } from "@/lib/supabase"

/**
 * Création sécurisée d'une demande de collaboration.
 * Le manager n'est jamais fourni par le frontend : Supabase le déduit du talent.
 * projectId est désormais optionnel : lorsqu'il est null, le RPC crée le projet
 * à partir du contexte professionnel de la demande.
 */
export async function createRequestFromTalent({
  talentId,
  projectId = null,
  title,
  projectType,
  description,
  projectDateStart,
  projectDateEnd,
  budget,
  currency = "XOF",
  location,
  additionalInfo,
}) {
  if (!talentId) throw new Error("Talent manquant")
  if (!title?.trim()) throw new Error("Le titre du projet est obligatoire")
  if (!description?.trim()) throw new Error("La description du projet est obligatoire")

  const numericBudget =
    budget === "" || budget === null || budget === undefined
      ? null
      : Number(budget)

  if (numericBudget !== null && (!Number.isFinite(numericBudget) || numericBudget < 0)) {
    throw new Error("Le budget proposé est invalide")
  }

  const { data, error } = await supabase.rpc("create_request_from_talent_v2", {
    p_talent_id: talentId,
    p_project_id: projectId || null,
    p_title: title.trim(),
    p_project_type: projectType?.trim() || null,
    p_description: description.trim(),
    p_project_date_start: projectDateStart || null,
    p_project_date_end: projectDateEnd || null,
    p_budget: numericBudget,
    p_currency: currency || "XOF",
    p_location: location?.trim() || null,
    p_additional_info: additionalInfo?.trim() || null,
  })

  if (error) throw error

  return data
}

export async function updateRequestStatus(requestId, status) {
  if (!requestId) throw new Error("Demande manquante")
  if (!["accepted", "rejected"].includes(status)) {
    throw new Error("Statut invalide")
  }

  const { data, error } = await supabase.rpc("update_request_status", {
    p_request_id: requestId,
    p_status: status,
  })

  if (error) throw error

  return data
}

export async function updateManagerProjectStatus(projectId, status) {
  if (!projectId) throw new Error("Projet manquant")
  if (!["active", "completed", "cancelled"].includes(status)) {
    throw new Error("Statut de projet invalide")
  }

  const { data, error } = await supabase.rpc("manager_update_project_status", {
    p_project_id: projectId,
    p_status: status,
  })

  if (error) throw error
  return data
}
