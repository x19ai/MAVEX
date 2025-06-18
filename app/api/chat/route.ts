import { loadAgent } from "@/lib/agents/load-agent"
import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { loadMCPToolsFromURL } from "@/lib/mcp/load-mcp-from-url"
import { getAllModels } from "@/lib/models"
import { getProviderForModel } from "@/lib/openproviders/provider-map"
import type { ProviderWithoutOllama } from "@/lib/user-keys"
import { Attachment } from "@ai-sdk/ui-utils"
import { Message as MessageAISDK, streamText, ToolSet } from "ai"
import {
  logUserMessage,
  storeAssistantMessage,
  trackSpecialAgentUsage,
  validateAndTrackUsage,
} from "./api"
import {
  ApiError,
  cleanMessagesForTools,
  createErrorResponse,
  handleStreamError,
} from "./utils"

export const maxDuration = 60

type ChatRequest = {
  messages: MessageAISDK[]
  chatId: string
  userId: string
  model: string
  isAuthenticated: boolean
  systemPrompt: string
  agentId: string | null
  enableSearch: boolean
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      chatId,
      userId,
      model,
      isAuthenticated,
      systemPrompt,
      agentId,
      enableSearch,
    } = (await req.json()) as ChatRequest

    if (!messages || !chatId || !userId) {
      return new Response(
        JSON.stringify({ error: "Error, missing information" }),
        { status: 400 }
      )
    }

    const supabase = await validateAndTrackUsage({
      userId,
      model,
      isAuthenticated,
    })

    const userMessage = messages[messages.length - 1]

    if (supabase && userMessage?.role === "user") {
      await logUserMessage({
        supabase,
        userId,
        chatId,
        content: userMessage.content,
        attachments: userMessage.experimental_attachments as Attachment[],
        model,
        isAuthenticated,
      })
    }

    let agentConfig = null

    if (agentId) {
      agentConfig = await loadAgent(agentId)
    }

    const allModels = await getAllModels()
    const modelConfig = allModels.find((m) => m.id === model)

    if (!modelConfig || !modelConfig.apiSdk) {
      throw new Error(`Model ${model} not found`)
    }

    const effectiveSystemPrompt =
      agentConfig?.systemPrompt || systemPrompt || SYSTEM_PROMPT_DEFAULT

    let toolsToUse = undefined

    if (agentConfig?.mcpConfig) {
      const { tools } = await loadMCPToolsFromURL(agentConfig.mcpConfig.server)
      toolsToUse = tools
    } else if (agentConfig?.tools) {
      toolsToUse = agentConfig.tools
      if (supabase) {
        await trackSpecialAgentUsage(supabase, userId)
      }
    }

    // Clean messages when switching between agents with different tool capabilities
    const hasTools = !!toolsToUse && Object.keys(toolsToUse).length > 0
    const cleanedMessages = cleanMessagesForTools(messages, hasTools)

    let streamError: ApiError | null = null

    let apiKey: string | undefined
    if (isAuthenticated && userId) {
      const { getEffectiveApiKey } = await import("@/lib/user-keys")
      const provider = getProviderForModel(model)
      apiKey =
        (await getEffectiveApiKey(userId, provider as ProviderWithoutOllama)) ||
        undefined
    }

    const result = streamText({
      model: modelConfig.apiSdk(apiKey, { enableSearch }),
      system: effectiveSystemPrompt,
      messages: cleanedMessages,
      tools: toolsToUse as ToolSet,
      maxSteps: 10,
      onError: (err: unknown) => {
        streamError = handleStreamError(err)
      },

      onFinish: async ({ response }) => {
        console.log("API onFinish called with response:", {
          chatId,
          messageCount: response.messages.length,
          messages: response.messages.map(m => ({ 
            role: m.role, 
            content: typeof m.content === 'string' ? m.content.substring(0, 50) : 'complex content'
          }))
        })
        if (supabase) {
          try {
            await storeAssistantMessage({
              supabase,
              chatId,
              userId,
              messages: response.messages as unknown as import("@/app/types/api.types").Message[],
            })
            console.log("Assistant message saved successfully in API route (forced save)")
          } catch (error) {
            console.error("Failed to save assistant message in API route:", error)
          }
        } else {
          console.log("No supabase client available for assistant message saving - Supabase not configured")
          // Fallback: Save to local storage via client-side
          console.log("Messages will be saved locally via client-side cache only")
        }
      },
    })

    if (streamError) {
      throw streamError
    }

    const originalResponse = result.toDataStreamResponse({
      sendReasoning: true,
      sendSources: true,
    })

    return new Response(originalResponse.body, {
      status: originalResponse.status,
    })
  } catch (err: unknown) {
    console.error("Error in /api/chat:", err)
    const error = err as {
      code?: string
      message?: string
      statusCode?: number
    }

    return createErrorResponse(error)
  }
}
