import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/prompt-kit/chat-container"
import { Loader } from "@/components/prompt-kit/loader"
import { ScrollButton } from "@/components/prompt-kit/scroll-button"
import { Message as MessageType } from "@ai-sdk/react"
import { useRef } from "react"
import { Message } from "./message"

type ConversationProps = {
  messages: MessageType[]
  status?: "streaming" | "ready" | "submitted" | "error"
  onDelete: (id: string) => void
  onEdit: (id: string, newText: string) => void
  onReload: () => void
}

export function Conversation({
  messages,
  status = "ready",
  onDelete,
  onEdit,
  onReload,
}: ConversationProps) {
  const initialMessageCount = useRef(messages.length)

  // Deduplicate by id and sort by createdAt
  const dedupedSortedMessages = Array.from(
    new Map(messages.map((msg) => [msg.id, msg])).values()
  ).sort((a, b) => {
    // Fallback to 0 if createdAt is missing
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });

  if (!dedupedSortedMessages || dedupedSortedMessages.length === 0)
    return <div className="h-full w-full"></div>

  return (
    <ChatContainerRoot className="relative w-full">
      <ChatContainerContent className="flex w-full flex-col items-center pt-20 pb-4">
        {dedupedSortedMessages.map((message, idx) => (
          <Message
            key={message.id}
            variant={message.role}
            id={message.id}
            attachments={message.experimental_attachments}
            isLast={idx === dedupedSortedMessages.length - 1}
            onDelete={onDelete}
            onEdit={onEdit}
            onReload={onReload}
            hasScrollAnchor={idx === dedupedSortedMessages.length - 1}
            parts={message.parts}
            status={status}
          >
            {message.content}
          </Message>
        ))}
        <ScrollButton />
      </ChatContainerContent>
      {status === "streaming" && <Loader />}
    </ChatContainerRoot>
  )
}
