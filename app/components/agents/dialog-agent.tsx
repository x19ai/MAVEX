import React from 'react'

type Props = {
  id: string
  slug: string
  name: string
  description?: string
  avatar_url?: string
  example_inputs?: string[]
  isAvailable?: boolean
  onAgentClick?: (agentId: string | null) => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  randomAgents?: any[]
  system_prompt?: string
  tools?: any[]
  mcp_config?: any
  trigger?: React.ReactNode
}

export function DialogAgent(props: Props) {
  return <div>DialogAgent placeholder</div>
} 