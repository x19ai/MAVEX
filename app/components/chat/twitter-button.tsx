"use client"

import { TwitterLogo } from "@phosphor-icons/react"
import { motion } from "motion/react"

const TRANSITION = {
  type: "spring",
  bounce: 0.1,
  duration: 0.3,
}

export function TwitterButton() {
  const handleTwitterClick = () => {
    window.open("https://twitter.com/zolafork", "_blank")
  }

  return (
    <motion.button
      className="border-border bg-background text-foreground hover:bg-secondary flex size-6 items-center justify-center rounded-full border shadow-md"
      style={{
        transformOrigin: "bottom right",
        originX: "right",
        originY: "bottom",
        scaleX: 1,
        scaleY: 1,
      }}
      onClick={handleTwitterClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="sr-only">Twitter</span>
      <TwitterLogo className="text-foreground size-4" />
    </motion.button>
  )
} 