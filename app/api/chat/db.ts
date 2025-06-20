import type { Database } from "@/app/types/database.types"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { ContentPart, Message } from "@/app/types/api.types"
import type { Json } from "@/app/types/database.types"

const DEFAULT_STEP = 0

export async function saveFinalAssistantMessage(
  supabase: SupabaseClient<Database>,
  chatId: string,
  userId: string,
  messages: Message[]
) {
  console.log("saveFinalAssistantMessage called with:", {
    chatId,
    messageCount: messages.length,
    messages: messages.map(m => ({ 
      role: m.role, 
      contentType: typeof m.content,
      content: typeof m.content === 'string' ? m.content.substring(0, 100) : 'array'
    }))
  })

  // Filter for assistant messages and get the last one.
  const assistantMessages = messages.filter(msg => msg.role === "assistant")
  if (assistantMessages.length === 0) {
    console.log("No assistant messages to save.")
    return
  }
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]

  // Consolidate content processing here
  let finalContent = ""
  let isComplexContent = false

  if (typeof lastAssistantMessage.content === "string") {
    finalContent = lastAssistantMessage.content
  } else if (Array.isArray(lastAssistantMessage.content)) {
    isComplexContent = true
    const textParts = lastAssistantMessage.content
      .filter(part => part.type === "text")
      .map(part => part.text || "")
    finalContent = textParts.join("\n\n")
  }

  // Always insert a single message.
  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    role: "assistant",
    content: finalContent,
    // Note: experimental_attachments could be added here if needed for complex content
    user_id: userId,
  })

  if (error) {
    console.error("Error saving final assistant message:", error)
    throw new Error(`Failed to save assistant message: ${error.message}`)
  } else {
    console.log(`Assistant message saved successfully (isComplex: ${isComplexContent}).`)
  }
}
