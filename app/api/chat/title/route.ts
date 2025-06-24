import { updateChatTitleInDb } from "@/lib/chat-store/chats/api"
import { createClient } from "@/lib/supabase/server"
import { OpenAI } from "openai"
import { Ratelimit } from "@upstash/ratelimit"
import { kv } from "@vercel/kv"

export const maxDuration = 60

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, "1h"),
})

export async function POST(req: Request) {
  const { id, messages, userId } = await req.json()
  const ip = req.headers.get("x-real-ip")
  const identifier = userId || ip
  const { success } = await ratelimit.limit(identifier)

  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 })
  }

  const supabase = await createClient()
  if (!supabase) {
    return new Response("Cannot create Supabase client", { status: 500 })
  }

  const { data: chat } = await supabase
    .from("chats")
    .select("title")
    .eq("id", id)
    .single()

  if (chat?.title && chat.title !== "New Chat") {
    return new Response("Chat already has a title", { status: 200 })
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      ...messages,
      {
        role: "system",
        content: `
          Generate a concise, 2-4 word title for this conversation, excluding common phrases like "New Chat".
          Return ONLY the title, with no extra text, quotation marks, or any other formatting.
          Examples:
          - "Tech Startups"
          - "Travel to Japan"
          - "OpenAI Sora"
        `,
      },
    ],
    temperature: 0.5,
  })

  const title = completion.choices[0].message.content
  if (title) {
    try {
      await updateChatTitleInDb(id, title)
      return new Response(title, { status: 200 })
    } catch (error) {
      console.error("Error updating chat title:", error)
      return new Response("Error updating title", { status: 500 })
    }
  }

  return new Response("Error generating title", { status: 500 })
} 