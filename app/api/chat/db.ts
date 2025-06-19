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

  // Handle simple string content (most common case)
  const assistantMessages = messages.filter(msg => msg.role === "assistant")
  if (assistantMessages.length > 0) {
    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]
    
    // If content is a simple string, save it directly
    if (typeof lastAssistantMessage.content === 'string') {
      const { error } = await supabase.from("messages").insert({
        chat_id: chatId,
        role: "assistant",
        content: lastAssistantMessage.content,
        created_at: new Date().toISOString(),
        user_id: userId,
      })

      if (error) {
        console.error("Error saving assistant message (string):", error)
        throw new Error(`Failed to save assistant message: ${error.message}`)
      } else {
        console.log("Assistant message saved successfully (string).")
        return
      }
    }
  }

  // Handle complex content with parts (original logic)
  const parts: ContentPart[] = []
  const toolMap = new Map<string, ContentPart>()
  const textParts: string[] = []

  for (const msg of messages) {
    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "text") {
          textParts.push(part.text || "")
          parts.push(part)
        } else if (part.type === "tool-invocation" && part.toolInvocation) {
          const { toolCallId, state } = part.toolInvocation
          if (!toolCallId) continue

          const existing = toolMap.get(toolCallId)
          if (state === "result" || !existing) {
            toolMap.set(toolCallId, {
              ...part,
              toolInvocation: {
                ...part.toolInvocation,
                args: part.toolInvocation?.args || {},
              },
            })
          }
        } else if (part.type === "reasoning") {
          parts.push({
            type: "reasoning",
            reasoning: part.text || "",
            details: [
              {
                type: "text",
                text: part.text || "",
              },
            ],
          })
        } else if (part.type === "step-start") {
          parts.push(part)
        }
      }
    } else if (msg.role === "tool" && Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "tool-result") {
          const toolCallId = part.toolCallId || ""
          toolMap.set(toolCallId, {
            type: "tool-invocation",
            toolInvocation: {
              state: "result",
              step: DEFAULT_STEP,
              toolCallId,
              toolName: part.toolName || "",
              result: part.result,
            },
          })
        }
      }
    }
  }

  // Merge tool parts at the end
  parts.push(...toolMap.values())

  const finalPlainText = textParts.join("\n\n")

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    role: "assistant",
    content: finalPlainText || "",
    user_id: userId,
  })

  if (error) {
    console.error("Error saving final assistant message:", error)
    throw new Error(`Failed to save assistant message: ${error.message}`)
  } else {
    console.log("Assistant message saved successfully (merged).")
  }
}
