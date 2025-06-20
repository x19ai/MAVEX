"use client"

import { ChatInput } from "@/app/components/chat-input/chat-input"
import { Conversation } from "@/app/components/chat/conversation"
import { useModel } from "@/app/components/chat/use-model"
import { useChatDraft } from "@/app/hooks/use-chat-draft"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useMessages } from "@/lib/chat-store/messages/provider"
import { useChatSession } from "@/lib/chat-store/session/provider"
import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { useUser } from "@/lib/user-store/provider"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "motion/react"
import dynamic from "next/dynamic"
import { redirect } from "next/navigation"
import { useMemo, useState, useEffect, useRef } from "react"
import { useChatCore } from "./use-chat-core"
import { useChatOperations } from "./use-chat-operations"
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
  const { preferences } = useUserPreferences()
  const { draftValue, clearDraft } = useChatDraft(chatId)

  // File upload functionality
  const {
    files,
    setFiles,
    handleFileUploads,
    createOptimisticAttachments,
    cleanupOptimisticAttachments,
    handleFileUpload,
    handleFileRemove,
  } = useFileUpload()

  // Model selection
  const { selectedModel, handleModelChange } = useModel({
    currentChat: currentChat || null,
    user,
    updateChatModel,
    chatId,
  })

  // State to pass between hooks
  const [hasDialogAuth, setHasDialogAuth] = useState(false)
  const isAuthenticated = useMemo(() => !!user?.id, [user?.id])
  const systemPrompt = useMemo(
    () => user?.system_prompt || SYSTEM_PROMPT_DEFAULT,
    [user?.system_prompt]
  )

  // --- FIX: Initialize useChatOperations FIRST ---
  // We'll pass dummy setMessages/setInput for now, then replace them after useChatCore is initialized
  const [chatCoreState, setChatCoreState] = useState<any>(null)
  const chatOps = useChatOperations({
    isAuthenticated,
    chatId,
    messages: chatCoreState?.messages || initialMessages,
    input: chatCoreState?.input || draftValue,
    selectedModel,
    systemPrompt,
    createNewChat,
    setHasDialogAuth,
    setMessages: chatCoreState?.setMessages || (() => {}),
    setInput: chatCoreState?.handleInputChange || (() => {}),
  })
  const checkLimitsAndNotify = chatOps.checkLimitsAndNotify
  const ensureChatExists = chatOps.ensureChatExists
  const { handleDelete, handleEdit } = chatOps

  // --- Now initialize useChatCore with correct functions ---
  const chatCore = useChatCore({
    initialMessages,
    draftValue,
    cacheAndAddMessage,
    chatId,
    user,
    files,
    createOptimisticAttachments,
    setFiles,
    checkLimitsAndNotify,
    cleanupOptimisticAttachments,
    ensureChatExists,
    handleFileUploads,
    selectedModel,
    clearDraft,
    bumpChat,
  })

  // Save chatCore state for chatOps to use
  useEffect(() => {
    setChatCoreState({
      messages: chatCore.messages,
      input: chatCore.input,
      setMessages: chatCore.setMessages,
      handleInputChange: chatCore.handleInputChange,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatCore.messages, chatCore.input, chatCore.setMessages, chatCore.handleInputChange])

  const {
    messages,
    input,
    status,
    stop,
    hasSentFirstMessageRef,
    isSubmitting,
    enableSearch,
    setEnableSearch,
    submit,
    handleSuggestion,
    handleReload,
    handleInputChange,
    setMessages,
  } = chatCore

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
