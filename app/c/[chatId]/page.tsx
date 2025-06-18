import { Chat } from "@/app/components/chat/chat"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Page({ params }: { params: { chatId: string } }) {
  if (isSupabaseEnabled) {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        redirect("/")
      }
    }
  }

  // Fetch messages from Supabase for SSR hydration safety
  let initialMessages = []
  if (isSupabaseEnabled && params?.chatId) {
    const supabase = await createClient()
    if (supabase) {
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", params.chatId)
        .order("created_at", { ascending: true })
      initialMessages = messagesData || []
    }
  }

  return (
    <MessagesProvider initialMessages={initialMessages}>
      <LayoutApp>
        <Chat />
      </LayoutApp>
    </MessagesProvider>
  )
}
