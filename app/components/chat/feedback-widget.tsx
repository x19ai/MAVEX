"use client"

import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { FeedbackForm } from "@/components/common/feedback-form"
import {
  MorphingPopover,
  MorphingPopoverContent,
  MorphingPopoverTrigger,
} from "@/components/motion-primitives/morphing-popover"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { QuestionMark } from "@phosphor-icons/react"
import { motion } from "motion/react"
import { useState } from "react"

const TRANSITION_POPOVER = {
  type: "spring",
  bounce: 0.1,
  duration: 0.3,
}

type FeedbackWidgetProps = {
  authUserId?: string
}

export function FeedbackWidget({ authUserId }: FeedbackWidgetProps) {
  return null
}
