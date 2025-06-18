import { createClient } from "@/lib/supabase/client"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import type { Message as MessageAISDK } from "ai"
import { readFromIndexedDB, writeToIndexedDB } from "../persist"
import { v4 as uuidv4 } from 'uuid'

export async function getMessagesFromDb(
  chatId: string
): Promise<MessageAISDK[]> {
  // fallback to local cache only
  if (!isSupabaseEnabled) {
    const cached = await getCachedMessages(chatId)
    return cached
  }

  const supabase = createClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("messages")
    .select("id, content, role, experimental_attachments, created_at, parts")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })

  if (!data || error) {
    console.error("Failed to fetch messages:", error)
    return []
  }

  const messages = data.map((message) => ({
    ...message,
    id: String(message.id),
    content: message.content ?? "",
    createdAt: message.created_at ? new Date(message.created_at) : new Date(0),
    parts: (message?.parts as MessageAISDK["parts"]) || undefined,
  }))

  console.log(`Retrieved ${messages.length} messages from database for chat ${chatId}:`, 
    messages.map(m => ({ role: m.role, content: m.content.substring(0, 50) + '...' })))

  const uniqueMessages = Array.from(
    new Map(messages.map(msg => [msg.id, msg])).values()
  );

  return uniqueMessages
}

async function insertMessageToDb(chatId: string, message: MessageAISDK, userId: string) {
  const supabase = createClient()
  if (!supabase) {
    console.error("No Supabase client available for message insertion")
    return
  }
  if (!message.id) {
    message.id = uuidv4();
  }
  const payload = {
    chat_id: chatId,
    role: message.role,
    content: message.content,
    experimental_attachments: message.experimental_attachments,
    created_at: message.createdAt?.toISOString() || new Date().toISOString(),
    user_id: userId,
  };
  console.log("Payload for assistant insert:", payload);
  const { error } = await supabase.from("messages").insert(payload);

  if (error) {
    console.error("Failed to insert message to database:", error, payload);
    throw error;
  } else {
    console.log(`Successfully saved ${message.role} message to database for chat ${chatId}`);
  }
}

async function insertMessagesToDb(chatId: string, messages: MessageAISDK[]) {
  const supabase = createClient()
  if (!supabase) return

  const payload = messages.map((message) => ({
    chat_id: chatId,
    role: message.role,
    content: message.content,
    experimental_attachments: message.experimental_attachments,
    created_at: message.createdAt?.toISOString() || new Date().toISOString(),
  }))

  await supabase.from("messages").insert(payload)
}

async function deleteMessagesFromDb(chatId: string) {
  const supabase = createClient()
  if (!supabase) return

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("chat_id", chatId)

  if (error) {
    console.error("Failed to clear messages from database:", error)
  }
}

type ChatMessageEntry = {
  id: string
  messages: MessageAISDK[]
}

export async function getCachedMessages(
  chatId: string
): Promise<MessageAISDK[]> {
  const entry = await readFromIndexedDB<ChatMessageEntry>("messages", chatId)

  if (!entry || Array.isArray(entry)) return []

  return (entry.messages || []).sort(
    (a, b) => +new Date(a.createdAt || 0) - +new Date(b.createdAt || 0)
  )
}

export async function cacheMessages(
  chatId: string,
  messages: MessageAISDK[]
): Promise<void> {
  await writeToIndexedDB("messages", { id: chatId, messages })
}

export async function addMessage(
  chatId: string,
  message: MessageAISDK,
  userId: string
): Promise<void> {
  if (!message.id) {
    message.id = uuidv4();
  }
  console.log("addMessage called:", { chatId, role: message.role, content: message.content?.substring(0, 50), id: message.id, userId });
  
  try {
    // Try to save to database if Supabase is enabled
    if (isSupabaseEnabled) {
      await insertMessageToDb(chatId, message, userId);
      console.log("Message saved to database successfully");
    } else {
      console.log("Supabase not enabled, skipping database save");
    }
    
    // Always save to local cache
    const current = await getCachedMessages(chatId)
    const updated = [...current, message]
    await writeToIndexedDB("messages", { id: chatId, messages: updated })
    console.log("Message saved to local cache successfully")
  } catch (error) {
    console.error("Error in addMessage:", error)
    // Even if database save fails, try to save to local cache
    try {
      const current = await getCachedMessages(chatId)
      const updated = [...current, message]
      await writeToIndexedDB("messages", { id: chatId, messages: updated })
      console.log("Message saved to local cache as fallback")
    } catch (cacheError) {
      console.error("Failed to save to local cache:", cacheError)
    }
  }
}

export async function setMessages(
  chatId: string,
  messages: MessageAISDK[]
): Promise<void> {
  await insertMessagesToDb(chatId, messages)
  await writeToIndexedDB("messages", { id: chatId, messages })
}

export async function clearMessagesCache(chatId: string): Promise<void> {
  await writeToIndexedDB("messages", { id: chatId, messages: [] })
}

export async function clearMessagesForChat(chatId: string): Promise<void> {
  await deleteMessagesFromDb(chatId)
  await clearMessagesCache(chatId)
}
