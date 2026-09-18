import { supabase } from "@/lib/supabase"

/**
 * Crée une invitation à partir d'un talent.
 *
 * Le manager n'est volontairement PAS envoyé depuis le frontend.
 * La fonction SQL côté Supabase doit récupérer :
 * talent_profiles.managed_by
 */
export async function createRequestFromTalent({
  talentId,
  projectId,
  title,
  description,
  budget,
  currency,
}) {
  if (!talentId) {
    throw new Error("Talent manquant")
  }

  if (!projectId) {
    throw new Error("Projet manquant")
  }

  const parsedBudget =
    budget === "" || budget === null || budget === undefined
      ? null
      : Number(budget)

  if (parsedBudget !== null && Number.isNaN(parsedBudget)) {
    throw new Error("Budget invalide")
  }

  const { data, error } = await supabase.rpc("create_request_from_talent", {
    p_talent_id: talentId,
    p_project_id: projectId,
    p_title: title?.trim() || null,
    p_description: description?.trim() || null,
    p_budget: parsedBudget,
    p_currency: currency?.trim() || null,
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Accepte ou refuse une demande côté Manager.
 *
 * Le contrôle d'autorisation doit être effectué côté SQL/RLS.
 */
export async function updateRequestStatus(requestId, status) {
  if (!requestId) {
    throw new Error("Demande manquante")
  }

  if (!["accepted", "rejected"].includes(status)) {
    throw new Error("Statut invalide")
  }

  const { data, error } = await supabase.rpc("update_request_status", {
    p_request_id: requestId,
    p_status: status,
  })

  if (error) {
    throw error
  }

  return data
}