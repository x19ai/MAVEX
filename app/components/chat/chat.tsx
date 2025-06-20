"use client"

import { ChatInput } from "@/app/components/chat-input/chat-input"
import { Conversation } from "@/app/components/chat/conversation"
import { useModel } from "@/app/components/chat/use-model"
import { useChatDraft } from "@/app/hooks/use-chat-draft"
import { toast } from "@/components/ui/toast"
import { useAgent } from "@/lib/agent-store/provider"
import { getOrCreateGuestUserId } from "@/lib/api"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useMessages } from "@/lib/chat-store/messages/provider"
import { useChatSession } from "@/lib/chat-store/session/provider"
import { MESSAGE_MAX_LENGTH, SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { Attachment } from "@/lib/file-handling"
import { API_ROUTE_CHAT } from "@/lib/routes"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { useUser } from "@/lib/user-store/provider"
import { cn } from "@/lib/utils"
import { useChat } from "@ai-sdk/react"
import { AnimatePresence, motion } from "motion/react"
import dynamic from "next/dynamic"
import { redirect, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useChatHandlers } from "./use-chat-handlers"
import { useChatUtils } from "./use-chat-utils"
import { useFileUpload } from "./use-file-upload"
import { FeedbackWidget } from "./feedback-widget"
import { v4 as uuidv4 } from 'uuid'
import { PerformanceDashboard } from "./performance-dashboard"
import { measureAsync } from "@/lib/utils"

// Utility function to generate chat title from conversation
function generateChatTitle(userMessage: string, assistantMessage: string): string {
  // Clean and truncate the user message
  const cleanUserMessage = userMessage
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim()
    .substring(0, 40)
  
  // Clean and truncate the assistant message
  const cleanAssistantMessage = assistantMessage
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim()
    .substring(0, 25)
  
  // Create a meaningful title
  if (cleanUserMessage && cleanAssistantMessage) {
    // If both messages are available, create a combined title
    const combinedTitle = `${cleanUserMessage}... - ${cleanAssistantMessage}...`
    return combinedTitle.length > 80 ? combinedTitle.substring(0, 80) : combinedTitle
  } else if (cleanUserMessage) {
    // If only user message is available
    return cleanUserMessage.length > 50 ? `${cleanUserMessage.substring(0, 50)}...` : cleanUserMessage
  } else if (cleanAssistantMessage) {
    // If only assistant message is available
    return cleanAssistantMessage.length > 50 ? `${cleanAssistantMessage.substring(0, 50)}...` : cleanAssistantMessage
  } else {
    return "New Chat"
  }
}

const DialogAuth = dynamic(
  () => import("./dialog-auth").then((mod) => mod.DialogAuth),
  { ssr: false }
)

function SearchParamsProvider({
  setInput,
}: {
  setInput: (input: string) => void
}) {
  const searchParams = useSearchParams()
  const prompt = searchParams.get("prompt")

  if (prompt && typeof window !== "undefined") {
    requestAnimationFrame(() => setInput(prompt))
  }

  return null
}

export function Chat() {
  const { chatId } = useChatSession()
  const {
    createNewChat,
    getChatById,
    updateChatModel,
    bumpChat,
    updateTitle,
    isLoading: isChatsLoading,
  } = useChats()

  const currentChat = useMemo(
    () => (chatId ? getChatById(chatId) : null),
    [chatId, getChatById]
  )

  const { messages: initialMessages, cacheAndAddMessage } = useMessages()
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { preferences } = useUserPreferences()
  const [hasDialogAuth, setHasDialogAuth] = useState(false)
  const [enableSearch, setEnableSearch] = useState(false)

  const {
    files,
    setFiles,
    handleFileUploads,
    createOptimisticAttachments,
    cleanupOptimisticAttachments,
    handleFileUpload,
    handleFileRemove,
  } = useFileUpload()

  const { selectedModel, handleModelChange } = useModel({
    currentChat: currentChat || null,
    user,
    updateChatModel,
    chatId,
  })

  const { currentAgent } = useAgent()
  const systemPrompt = useMemo(
    () =>
      currentAgent?.system_prompt ||
      user?.system_prompt ||
      SYSTEM_PROMPT_DEFAULT,
    [currentAgent?.system_prompt, user?.system_prompt]
  )

  const hasSentFirstMessageRef = useRef(false)
  const prevChatIdRef = useRef<string | null>(chatId)
  const optimisticIdCounter = useRef(0)
  const isAuthenticated = useMemo(() => !!user?.id, [user?.id])

  const { draftValue, clearDraft } = useChatDraft(chatId)

  const userId = user?.id || currentChat?.user_id || "";

  // Handle errors directly in onError callback
  const handleError = useCallback((error: Error) => {
    let errorMsg = "Something went wrong."
    try {
      const parsed = JSON.parse(error.message)
      errorMsg = parsed.error || errorMsg
    } catch {
      errorMsg = error.message || errorMsg
    }
    toast({
      title: errorMsg,
      status: "error",
    })
  }, [])

  const {
    messages,
    input,
    handleSubmit,
    status,
    error,
    reload,
    stop,
    setMessages,
    setInput,
    append,
  } = useChat({
    api: API_ROUTE_CHAT,
    initialMessages,
    initialInput: draftValue,
    onFinish: async (message) => {
      // This callback is for side effects after the `useChat` hook has finished streaming.
      // The hook itself handles updating the `messages` array for display.

      console.log("Client onFinish: Caching final assistant message.", { id: message.id });
      
      // 1. Persist the final message to our cache.
      // `cacheAndAddMessage` has deduplication logic to prevent duplicates.
      await cacheAndAddMessage(message);
      
      // 2. Clear the input draft value.
      clearDraft();
      
      // 3. Bump the chat to the top of the list in the sidebar.
      if (chatId) {
        // Use a timeout to ensure this happens after the current render cycle.
        setTimeout(() => bumpChat(chatId), 0);
      }
    },
    onError: handleError,
  })

  // Handle title updates in useEffect to avoid setState during render
  useEffect(() => {
    const handleTitleUpdate = async () => {
      if (!chatId || messages.length < 2) return
      
      const assistantMessage = messages.find(m => m.role === "assistant")
      const userMessage = messages.find(m => m.role === "user")
      
      if (!assistantMessage || !userMessage) return
      
      // Only update title if it's still the default title or if it's a new chat
      const currentChat = getChatById(chatId)
      const currentTitle = currentChat?.title || ""
      const isDefaultTitle = !currentTitle || 
        currentTitle === "New Chat" || 
        currentTitle === "Untitled Chat" ||
        currentTitle.startsWith("optimistic-")
      
      if (isDefaultTitle) {
        const newTitle = generateChatTitle(userMessage.content, assistantMessage.content)
        console.log("Generated new title:", newTitle)
        
        try {
          await updateTitle(chatId, newTitle)
          console.log("Chat title updated successfully")
        } catch (error) {
          console.error("Failed to update chat title:", error)
        }
      }
    }

    // Only run title update when we have a new assistant message
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === "assistant") {
      handleTitleUpdate()
    }
  }, [messages, chatId, getChatById, updateTitle])

  // Reset messages when navigating from a chat to home (moved to useEffect to avoid setState during render)
  useEffect(() => {
    if (
      prevChatIdRef.current !== null &&
      chatId === null &&
      messages.length > 0
    ) {
      setMessages([])
    }
    prevChatIdRef.current = chatId
  }, [chatId, messages.length, setMessages])

  const { checkLimitsAndNotify, ensureChatExists } = useChatUtils({
    isAuthenticated,
    chatId,
    messages,
    input,
    selectedModel,
    systemPrompt,
    selectedAgentId: currentAgent?.id || null,
    createNewChat,
    setHasDialogAuth,
  })

  const { handleInputChange, handleDelete, handleEdit } = useChatHandlers({
    messages,
    setMessages,
    setInput,
    chatId,
  })

  const submit = useCallback(async () => {
    console.log("Submit function called")
    return measureAsync("client-submit-total", async () => {
      console.log("Starting submit performance measurement")
      setIsSubmitting(true)

      const uid = await getOrCreateGuestUserId(user)
      if (!uid) {
        setIsSubmitting(false)
        return
      }

      const optimisticId = `optimistic-${++optimisticIdCounter.current}`
      const optimisticAttachments =
        files.length > 0 ? createOptimisticAttachments(files) : []

      const optimisticMessage = {
        id: optimisticId,
        content: input,
        role: "user" as const,
        createdAt: new Date(),
        experimental_attachments:
          optimisticAttachments.length > 0 ? optimisticAttachments : undefined,
      }

      setMessages((prev) => [...prev, optimisticMessage])
      setInput("")

      const submittedFiles = [...files]
      setFiles([])

      try {
        // Run validation and chat creation in parallel for better performance
        const [allowed, currentChatId] = await Promise.all([
          measureAsync("client-check-limits", () => checkLimitsAndNotify(uid)),
          measureAsync("client-ensure-chat", () => ensureChatExists(uid))
        ])

        if (!allowed) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
          cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
          return
        }

        if (!currentChatId) {
          setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
          cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
          return
        }

        if (input.length > MESSAGE_MAX_LENGTH) {
          toast({
            title: `The message you submitted was too long, please submit something shorter. (Max ${MESSAGE_MAX_LENGTH} characters)`,
            status: "error",
          })
          setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
          cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
          return
        }

        let attachments: Attachment[] | null = []
        if (submittedFiles.length > 0) {
          attachments = await measureAsync("client-file-upload", () => 
            handleFileUploads(uid, currentChatId)
          )
          if (attachments === null) {
            setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
            cleanupOptimisticAttachments(
              optimisticMessage.experimental_attachments
            )
            return
          }
        }

        const options = {
          body: {
            chatId: currentChatId,
            userId: uid,
            model: selectedModel,
            isAuthenticated,
            systemPrompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
            agentId: currentAgent?.id || null,
            enableSearch,
          },
          experimental_attachments: attachments || undefined,
        }

        // Start the chat request immediately
        handleSubmit(undefined, options)
        
        // Clean up optimistic message and cache the real message
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
        cacheAndAddMessage(optimisticMessage)
        clearDraft()
        hasSentFirstMessageRef.current = true

        // Bump chat to top in background (non-blocking)
        if (messages.length > 0 && chatId) {
          setTimeout(() => bumpChat(chatId), 0)
        }
        
        console.log("Submit function completed successfully")
      } catch (submitError) {
        console.error("Error in submit function:", submitError)
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
        // Don't show error toast here as useChat handles errors in onError callback
      } finally {
        setIsSubmitting(false)
      }
    })
  }, [
    user,
    files,
    createOptimisticAttachments,
    input,
    setMessages,
    setInput,
    setFiles,
    checkLimitsAndNotify,
    cleanupOptimisticAttachments,
    ensureChatExists,
    handleFileUploads,
    currentAgent?.id,
    selectedModel,
    isAuthenticated,
    systemPrompt,
    handleSubmit,
    cacheAndAddMessage,
    clearDraft,
    messages.length,
    bumpChat,
  ])

  const handleSuggestion = useCallback(
    async (suggestion: string) => {
      setIsSubmitting(true)
      const optimisticId = `optimistic-${++optimisticIdCounter.current}`
      const optimisticMessage = {
        id: optimisticId,
        content: suggestion,
        role: "user" as const,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, optimisticMessage])

      try {
        const uid = await getOrCreateGuestUserId(user)

        if (!uid) {
          setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
          return
        }

        const allowed = await checkLimitsAndNotify(uid)
        if (!allowed) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
          return
        }

        const currentChatId = await ensureChatExists(uid)

        if (!currentChatId) {
          setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
          return
        }

        const options = {
          body: {
            chatId: currentChatId,
            userId: uid,
            model: selectedModel,
            isAuthenticated,
            systemPrompt: SYSTEM_PROMPT_DEFAULT,
          },
        }

        append(
          {
            role: "user",
            content: suggestion,
          },
          options
        )
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      } catch (suggestionError) {
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        toast({ title: "Failed to send suggestion", status: "error" })
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      ensureChatExists,
      selectedModel,
      user,
      append,
      checkLimitsAndNotify,
      isAuthenticated,
      setMessages,
    ]
  )

  const handleReload = useCallback(async () => {
    const uid = await getOrCreateGuestUserId(user)
    if (!uid) {
      return
    }

    const options = {
      body: {
        chatId,
        userId: uid,
        model: selectedModel,
        isAuthenticated,
        systemPrompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
      },
    }

    reload(options)
  }, [user, chatId, selectedModel, isAuthenticated, systemPrompt, reload])

  // Memoize the conversation props to prevent unnecessary rerenders
  const conversationProps = useMemo(
    () => ({
      messages,
      status,
      onDelete: handleDelete,
      onEdit: handleEdit,
      onReload: handleReload,
    }),
    [messages, status, handleDelete, handleEdit, handleReload]
  )

  // Memoize the chat input props
  const chatInputProps = useMemo(
    () => ({
      value: input,
      onSuggestion: handleSuggestion,
      onValueChange: handleInputChange,
      onSend: submit,
      isSubmitting,
      files,
      onFileUpload: handleFileUpload,
      onFileRemove: handleFileRemove,
      hasSuggestions:
        preferences.promptSuggestions && !chatId && messages.length === 0,
      onSelectModel: handleModelChange,
      selectedModel,
      isUserAuthenticated: isAuthenticated,
      stop,
      status,
      setEnableSearch,
      enableSearch,
    }),
    [
      input,
      handleSuggestion,
      handleInputChange,
      submit,
      isSubmitting,
      files,
      handleFileUpload,
      handleFileRemove,
      preferences.promptSuggestions,
      chatId,
      messages.length,
      handleModelChange,
      selectedModel,
      isAuthenticated,
      stop,
      status,
      setEnableSearch,
      enableSearch,
    ]
  )

  // Handle redirect for invalid chatId - only redirect if we're certain the chat doesn't exist
  // and we're not in a transient state during chat creation
  if (
    chatId &&
    !isChatsLoading &&
    !currentChat &&
    !isSubmitting &&
    status === "ready" &&
    messages.length === 0 &&
    !hasSentFirstMessageRef.current // Don't redirect if we've already sent a message in this session
  ) {
    return redirect("/")
  }

  const showOnboarding = !chatId && messages.length === 0

  return (
    <div
      className={cn(
        "@container/main relative flex h-full flex-col items-center justify-end md:justify-center"
      )}
    >
      <DialogAuth open={hasDialogAuth} setOpen={setHasDialogAuth} />

      <Suspense>
        <SearchParamsProvider setInput={setInput} />
      </Suspense>

      <AnimatePresence initial={false} mode="popLayout">
        {showOnboarding ? (
          <motion.div
            key="onboarding"
            className="absolute bottom-[60%] mx-auto max-w-[50rem] md:relative md:bottom-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layout="position"
            layoutId="onboarding"
            transition={{
              layout: {
                duration: 0,
              },
            }}
          >
            <h1 className="mb-6 text-3xl font-medium tracking-tight">
              What&apos;s on your mind?
            </h1>
          </motion.div>
        ) : (
          <Conversation key="conversation" {...conversationProps} />
        )}
      </AnimatePresence>

      <motion.div
        className={cn(
          "relative inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl"
        )}
        layout="position"
        layoutId="chat-input-container"
        transition={{
          layout: {
            duration: messages.length === 1 ? 0.3 : 0,
          },
        }}
      >
        <ChatInput {...chatInputProps} />
      </motion.div>

      <div className="fixed right-1 bottom-1 z-50 flex gap-2">
        <FeedbackWidget authUserId={user?.id} />
        {preferences.showPerformanceDashboard && <PerformanceDashboard />}
      </div>
    </div>
  )
}
