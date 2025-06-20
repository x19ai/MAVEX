import { saveFinalAssistantMessage } from "@/app/api/chat/db"
import type {
  ChatApiParams,
  LogUserMessageParams,
  StoreAssistantMessageParams,
  SupabaseClientType,
} from "@/app/types/api.types"
import { sanitizeUserInput } from "@/lib/sanitize"
import { validateUserIdentity } from "@/lib/server/api"
import { checkUsageByModel, incrementUsageByModel } from "@/lib/usage"

export async function validateAndTrackUsage({
  userId,
  model,
  isAuthenticated,
}: ChatApiParams): Promise<SupabaseClientType | null> {
  const cacheKey = `${userId}-${model}-${isAuthenticated}`
  const now = Date.now()
  // const cached = userValidationCache.get(cacheKey)
  // if (cached && now - cached.timestamp < USER_CACHE_TTL) {
  //   return cached.supabase
  // }

  const supabase = await validateUserIdentity(userId, isAuthenticated)
  // userValidationCache.set(cacheKey, {
  //   supabase,
  //   timestamp: now
  // })
  if (supabase) {
    // Check usage but don't block on increment
    await checkUsageByModel(supabase, userId, model, isAuthenticated)
  }
  return supabase
}

export async function logUserMessage({
  supabase,
  userId,
  chatId,
  content,
  attachments,
  model,
  isAuthenticated,
}: LogUserMessageParams): Promise<void> {
  if (!supabase) return

  try {
    // Log user message and increment usage in parallel
    await Promise.all([
      supabase.from("messages").insert({
        chat_id: chatId,
        role: "user",
        content: sanitizeUserInput(content),
        experimental_attachments: attachments,
        user_id: userId,
      }),
      incrementUsageByModel(supabase, userId, model, isAuthenticated)
    ])
  } catch (error) {
    console.error("Error saving user message:", error)
    // Don't throw - this is non-critical for the chat response
  }
}

export async function trackSpecialAgentUsage(supabase: SupabaseClientType, userId: string): Promise<void> {
  if (!supabase) return
  // await checkSpecialAgentUsage(supabase, userId)
  // await incrementSpecialAgentUsage(supabase, userId)
}

export async function storeAssistantMessage({
  supabase,
  chatId,
  userId,
  messages,
}: StoreAssistantMessageParams & { userId: string }): Promise<void> {
  if (!supabase) return
  
  try {
    await saveFinalAssistantMessage(supabase, chatId, userId, messages)
  } catch (err) {
    console.error("Failed to save assistant messages:", err)
    // Don't throw - this is non-critical for the chat response
  }
}
