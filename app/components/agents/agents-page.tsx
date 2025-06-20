"use client"

import { Agent } from "@/app/types/agent"
import { Button } from "@/components/ui/button"
import { useMemo, useState } from "react"
import { AgentFeaturedSection } from "./agent-featured-section"
import { DialogCreateAgentTrigger } from "./dialog-create-agent/dialog-trigger-create-agent"
import { UserAgentsSection } from "./user-agent-section"

type AgentsPageProps = {
  curatedAgents: Agent[]
  userAgents: Agent[] | null
  userId: string | null
}

export function AgentsPage({
  curatedAgents,
  userAgents,
  userId,
}: AgentsPageProps) {
  const [openAgentId, setOpenAgentId] = useState<string | null>(null)

  // Ensure curatedAgents is an array for safe use
  const safeCuratedAgents = curatedAgents || []

  const randomAgents = useMemo(() => {
    return safeCuratedAgents
      .filter((agent) => agent.id !== openAgentId)
      .sort((a, b) => {
        // Use a deterministic hash of the agent ID for consistent sorting
        const hashA = a.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const hashB = b.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return hashA - hashB
      })
      .slice(0, 4)
  }, [safeCuratedAgents, openAgentId])

  const handleAgentClick = (agentId: string | null) => {
    setOpenAgentId(agentId)
  }

  return (
    <div className="bg-background min-h-screen px-4 pt-20 pb-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-20 text-center">
          <h1 className="text-foreground text-sm font-medium">
            Agents (experimental)
          </h1>
          <div className="text-foreground mx-auto my-4 max-w-2xl text-3xl font-medium tracking-tight md:text-5xl">
            Your every day AI assistant
          </div>
          <p className="text-muted-foreground mx-auto mb-4 max-w-2xl text-lg">
            a growing set of personal AI agents, built for ideas, writing, and
            product work.
          </p>
          <DialogCreateAgentTrigger
            trigger={
              <Button variant="outline" className="rounded-full">
                Create an agent
              </Button>
            }
          />
        </div>

        <AgentFeaturedSection
          agents={safeCuratedAgents}
          moreAgents={randomAgents}
          handleAgentClick={handleAgentClick}
          openAgentId={openAgentId}
          setOpenAgentId={setOpenAgentId}
        />
        <UserAgentsSection
          agents={userAgents || null}
          moreAgents={randomAgents}
          userId={userId || null}
          handleAgentClick={handleAgentClick}
          openAgentId={openAgentId}
          setOpenAgentId={setOpenAgentId}
        />
      </div>
    </div>
  )
}
