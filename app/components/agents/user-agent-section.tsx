import React from 'react'
import type { Agent } from '@/app/types/agent'

type Props = {
  agents: Agent[] | null
  moreAgents: Agent[]
  userId: string | null
  handleAgentClick: (agentId: string | null) => void
  openAgentId: string | null
  setOpenAgentId: (agentId: string | null) => void
}

export function UserAgentsSection(props: Props) {
  return <div>UserAgentsSection placeholder</div>
} 