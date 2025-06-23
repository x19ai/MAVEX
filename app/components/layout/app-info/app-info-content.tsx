import { APP_NAME } from "@/lib/config"
import {
  Star,
  MessageSquare,
  Zap,
  Users,
  Award,
  Key,
} from "lucide-react"
import OpenAIIcon from "@/components/icons/openai"
import MistralIcon from "@/components/icons/mistral"
import DeepseekIcon from "@/components/icons/deepseek"
import ClaudeIcon from "@/components/icons/claude"
import GeminiIcon from "@/components/icons/gemini"
import GrokIcon from "@/components/icons/grok"
import PerplexityIcon from "@/components/icons/perplexity"

export function AppInfoContent() {
  return (
    <div className="space-y-4 w-full max-w-none">
      <div className="w-full max-w-none">
        <FeatureComparison />
      </div>
    </div>
  )
}

export function FeatureComparison() {
  return (
    <div className="mt-8 w-full max-w-none px-4">
      <h2 className="text-center text-2xl font-medium tracking-tight">
        Feature Comparison
      </h2>
      <p className="text-muted-foreground mt-2 text-center">
        Choose the plan that's right for you.
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-none">
        {/* Guest Plan */}
        <div className="border-border/50 rounded-lg border p-6">
          <h3 className="text-lg font-medium">Guest</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            For users who want to try out the basics.
          </p>
          <ul className="mt-6 space-y-4">
            <li className="flex items-center">
              <MessageSquare className="text-muted-foreground mr-3 h-5 w-5" />
              <span>5 daily messages</span>
            </li>
            <li className="flex items-center">
              <Zap className="text-muted-foreground mr-3 h-5 w-5" />
              <span>Access to free models</span>
            </li>
          </ul>
        </div>

        {/* Authenticated Plan */}
        <div className="border-border/50 rounded-lg border p-6">
          <h3 className="text-lg font-medium">Authenticated</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            For regular users who need more power.
          </p>
          <ul className="mt-6 space-y-4">
            <li className="flex items-center">
              <MessageSquare className="text-primary mr-3 h-5 w-5" />
              <span>20 daily messages</span>
            </li>
            <li className="flex items-center">
              <Zap className="text-primary mr-3 h-5 w-5" />
              <span>Access to all models BYOK</span>
            </li>
            <li className="flex items-center">
              <Users className="text-primary mr-3 h-5 w-5" />
              <span>Saved chat history</span>
            </li>
          </ul>
        </div>

        {/* $MAVEX Holder Plan with animated border */}
        <div className="relative">
          <div className="absolute -inset-1 rounded-xl z-0 animate-mavex-border" style={{background: "conic-gradient(from 0deg, #ab9ff2, #ffb347, #43e97b, #38f9d7, #ab9ff2)", filter: "blur(4px)"}}></div>
          <div className="relative border-primary/50 rounded-lg border-2 border-primary p-6 shadow-lg bg-background z-10">
            <h3 className="flex items-center text-lg font-medium text-primary">
              $MAVEX Holder
              <Star className="ml-2 h-5 w-5 fill-current" />
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              For our most dedicated and valued users.
            </p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-center">
                <MessageSquare className="text-primary mr-3 h-5 w-5" />
                <span className="font-semibold">Unlimited messages</span>
              </li>
              <li className="flex items-center">
                <Key className="text-primary mr-3 h-5 w-5" />
                <span className="font-semibold">Free Access to all models</span>
              </li>
              <li className="flex items-center">
                <Award className="text-primary mr-3 h-5 w-5" />
                <span className="font-semibold">Higher chat priority</span>
              </li>
              <li className="flex items-center">
                <Users className="text-primary mr-3 h-5 w-5" />
                <span className="font-semibold">Saved chat history</span>
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <OpenAIIcon className="h-8 w-8" />
              <MistralIcon className="h-8 w-8" />
              <DeepseekIcon className="h-8 w-8" />
              <ClaudeIcon className="h-8 w-8" />
              <GeminiIcon className="h-8 w-8" />
              <GrokIcon className="h-8 w-8" />
              <PerplexityIcon className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
