"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { Copy } from "@phosphor-icons/react"
import { useState } from "react"

export function ContractAddress() {
  const [copied, setCopied] = useState(false)
  const contractAddress = "CA"
  const displayAddress = `${contractAddress.slice(0, 3)}..`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress)
      setCopied(true)
      toast({
        title: "Contract address copied!",
        status: "success",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy address",
        status: "error",
      })
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="bg-background hover:bg-muted text-muted-foreground h-8 px-3 rounded-full gap-2 font-mono text-xs"
      onClick={handleCopy}
      aria-label="Copy contract address"
    >
      <span>{displayAddress}</span>
      <Copy className="size-3" />
    </Button>
  )
} 