"use client"

import { toast } from "@/components/ui/toast"
import { useChatSession } from "@/lib/chat-store/session/provider"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import type { Message as MessageAISDK } from "ai"
import { createContext, useContext, useEffect, useState } from "react"
import { writeToIndexedDB } from "../persist"
import {
  cacheMessages,
  clearMessagesForChat,
  getCachedMessages,
  getMessagesFromDb,
  setMessages as saveMessages,
} from "./api"

interface MessagesContextType {
  messages: MessageAISDK[]
  setMessages: React.Dispatch<React.SetStateAction<MessageAISDK[]>>
  refresh: () => Promise<void>
  saveAllMessages: (messages: MessageAISDK[]) => Promise<void>
  cacheAndAddMessage: (message: MessageAISDK) => Promise<void>
  resetMessages: () => Promise<void>
  deleteMessages: () => Promise<void>
}

const MessagesContext = createContext<MessagesContextType | null>(null)

export function useMessages() {
  const context = useContext(MessagesContext)
  if (!context)
    throw new Error("useMessages must be used within MessagesProvider")
  return context
}

export function MessagesProvider({ children, initialMessages = [] }: { children: React.ReactNode, initialMessages?: MessageAISDK[] }) {
  const [messages, setMessages] = useState<MessageAISDK[]>(initialMessages)
  const [isHydrated, setIsHydrated] = useState(false)
  const { chatId } = useChatSession()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (chatId === null) {
      setMessages([])
    }
  }, [chatId])

  useEffect(() => {
    if (!chatId || !isHydrated) return;

    const load = async () => {
      console.log("Loading messages for chat:", chatId);

      let finalMessages: MessageAISDK[] = [];
      let loadedFromCache = false;

      try {
        // First, try to load from the local cache to show something immediately.
        const cached = await getCachedMessages(chatId);
        if (cached.length > 0) {
          console.log(
            "Loaded cached messages:",
            cached.map(m => ({
              role: m.role,
              content: m.content.substring(0, 30),
            }))
          );
          finalMessages = cached;
          loadedFromCache = true;
          setMessages(finalMessages); // Show cached messages immediately
        }

        // Then, always try to fetch from the database to get the most up-to-date information.
        if (isSupabaseEnabled) {
          try {
            const fresh = await getMessagesFromDb(chatId);
            console.log(
              "Loaded fresh messages from DB:",
              fresh.map(m => ({
                role: m.role,
                content: m.content.substring(0, 30),
              }))
            );

            if (fresh.length > 0) {
              finalMessages = fresh;
              // Update cache with fresh data
              await cacheMessages(chatId, fresh);
            } else if (loadedFromCache) {
              // If DB is empty but we had cached messages, it might be a new chat not yet persisted.
              // Keep the cached messages for now.
            }

          } catch (dbError) {
            console.error("Failed to fetch messages from database:", dbError);
            // If the database fails, we rely on the cached messages if they exist.
          }
        } else {
          console.log("Supabase not enabled, using cached messages only");
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        // Set the final state after all operations are complete.
        setMessages(finalMessages);
      }
    };

    load();
  }, [chatId, isHydrated]);

  const refresh = async () => {
    if (!chatId) return

    try {
      const fresh = await getMessagesFromDb(chatId)
      setMessages(fresh)
    } catch {
      toast({ title: "Failed to refresh messages", status: "error" })
    }
  }

  const cacheAndAddMessage = async (message: MessageAISDK) => {
    if (!chatId) return

    try {
      setMessages((prev) => {
        // Deduplicate messages before adding to prevent duplicates in client state
        const isMessageAlreadyPresent = prev.some((m) => m.id === message.id)
        if (isMessageAlreadyPresent) {
          console.log("Message already present in client state, skipping add:", message.id)
          return prev
        }

        const updated = [...prev, message]
        writeToIndexedDB("messages", { id: chatId, messages: updated })
        return updated
      })
    } catch {
      toast({ title: "Failed to save message", status: "error" })
    }
  }

  const saveAllMessages = async (newMessages: MessageAISDK[]) => {
    // @todo: manage the case where the chatId is null (first time the user opens the chat)
    if (!chatId) return

    try {
      await saveMessages(chatId, newMessages)
      setMessages(newMessages)
    } catch {
      toast({ title: "Failed to save messages", status: "error" })
    }
  }

  const deleteMessages = async () => {
    if (!chatId) return

    setMessages([])
    await clearMessagesForChat(chatId)
  }

  const resetMessages = async () => {
    setMessages([])
  }

  return (
    <MessagesContext.Provider
      value={{
        messages,
        setMessages,
        refresh,
        saveAllMessages,
        cacheAndAddMessage,
        resetMessages,
        deleteMessages,
      }}
    >
      {children}
    </MessagesContext.Provider>
  )
}
