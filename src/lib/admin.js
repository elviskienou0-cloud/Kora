import { supabase } from "@/lib/supabase"

export async function listAdminUsers({
  search = "",
  page = 1,
  pageSize = 20,
} = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("profiles")
    .select(
      "id, name, role, avatar, is_suspended, suspended_at, suspended_reason, created_at, updated_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to)

  const value = search.trim()

  if (value) {
    query = query.ilike("name", `%${value}%`)
  }

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  return {
    data: data || [],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.max(
      1,
      Math.ceil((count ?? 0) / pageSize)
    ),
  }
}


export async function suspendAdminUser(
  userId,
  reason = ""
) {
  if (!userId) {
    throw new Error("Utilisateur manquant.")
  }

  const { data, error } = await supabase.rpc(
    "admin_suspend_user",
    {
      p_user_id: userId,
      p_reason: reason || null,
    }
  )

  if (error) {
    throw error
  }

  return data
}


export async function reactivateAdminUser(
  userId
) {
  if (!userId) {
    throw new Error("Utilisateur manquant.")
  }

  const { data, error } = await supabase.rpc(
    "admin_reactivate_user",
    {
      p_user_id: userId,
    }
  )

  if (error) {
    throw error
  }

  return data
}


export async function listAdminReports({
  status = "all",
  page = 1,
  pageSize = 20,
} = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, description, status, admin_note, resolved_by, resolved_at, created_at, updated_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to)

  if (status !== "all") {
    query = query.eq("status", status)
  }

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  return {
    data: data || [],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.max(
      1,
      Math.ceil((count ?? 0) / pageSize)
    ),
  }
}


export async function updateAdminReport(
  reportId,
  status,
  adminNote = ""
) {
  if (!reportId) {
    throw new Error("Signalement manquant.")
  }

  const { data, error } = await supabase.rpc(
    "admin_update_report",
    {
      p_report_id: reportId,
      p_status: status,
      p_admin_note: adminNote || null,
    }
  )

  if (error) {
    throw error
  }

  return data
}


export async function listAdminAuditLogs({
  page = 1,
  pageSize = 30,
} = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from("admin_audit_logs")
    .select(
      "id, actor_id, action, entity_type, entity_id, target_user_id, metadata, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    throw error
  }

  return {
    data: data || [],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.max(
      1,
      Math.ceil((count ?? 0) / pageSize)
    ),
  }
}


export async function adminModerateTalent({
  talentId,
  status,
  visible,
  verified,
  reason = "",
}) {
  if (!talentId) {
    throw new Error("Talent manquant.")
  }

  const { data, error } = await supabase.rpc(
    "admin_set_talent_moderation",
    {
      p_talent_id: talentId,
      p_status: status,
      p_visible:
        typeof visible === "boolean"
          ? visible
          : null,
      p_verified:
        typeof verified === "boolean"
          ? verified
          : null,
      p_reason: reason || null,
    }
  )

  if (error) {
    throw error
  }

  return data
}