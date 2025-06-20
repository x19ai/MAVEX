import React from 'react'
import type { Agent } from '@/app/types/agent'

type Props = {
  agents: Agent[]
  moreAgents: Agent[]
  handleAgentClick: (agentId: string | null) => void
  openAgentId: string | null
  setOpenAgentId: (agentId: string | null) => void
}

export function AgentFeaturedSection(props: Props) {
  return <div>AgentFeaturedSection placeholder</div>
} 