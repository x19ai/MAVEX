import { APP_NAME } from "@/lib/config"

export function AppInfoContent() {
  return (
    <div className="space-y-4">
      <p className="text-foreground leading-relaxed">
        <span className="font-medium">{APP_NAME}</span> is an interface
        for AI chat.
        <br />
        Multi-model, BYOK-ready, and fully self-hostable.
        <br />
        Use Claude, OpenAI, Gemini, local models, and more, all in one place.
        <br />
      </p>
    </div>
  )
}
