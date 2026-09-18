import { supabase } from "@/lib/supabase"

/**
 * Crée ou récupère une conversation directe entre l'utilisateur courant
 * et un autre utilisateur. Toute l'autorisation est vérifiée côté SQL.
 */
export async function createDirectConversation(otherUserId) {
  if (!otherUserId) {
    throw new Error("Destinataire manquant")
  }

  const { data, error } = await supabase.rpc(
    "create_direct_conversation",
    {
      p_other_user_id: otherUserId,
    }
  )

  if (error) {
    throw error
  }

  const conversationId =
    typeof data === "string"
      ? data
      : data?.conversation_id ||
        data?.[0]?.conversation_id ||
        data?.id

  if (!conversationId) {
    throw new Error("Conversation introuvable")
  }

  return conversationId
}

/**
 * Marque comme lus tous les messages reçus dans une conversation.
 * Aucun UPDATE direct sur public.messages n'est requis côté frontend.
 */
export async function markMessagesRead(conversationId) {
  if (!conversationId) {
    return null
  }

  const { data, error } = await supabase.rpc(
    "mark_messages_read",
    {
      p_conversation_id: conversationId,
    }
  )

  if (error) {
    throw error
  }

  return data
}

/**
 * Construit l'URL permettant d'ouvrir directement une conversation.
 */
export function buildMessagesUrl(conversationId) {
  if (!conversationId) {
    return "/messages"
  }

  return `/messages?conversation=${encodeURIComponent(
    conversationId
  )}`
}