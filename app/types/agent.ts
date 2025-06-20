export type Agent = {
  id: string
  slug: string
  name: string
  description?: string
  avatar_url?: string
  example_inputs?: string[]
  system_prompt?: string
  tools?: any[]
  mcp_config?: any
}

export type AgentSummary = {
  id: string
  slug: string
  name: string
  description?: string
  avatar_url?: string
  example_inputs?: string[]
  system_prompt?: string
  tools?: any[]
  mcp_config?: any
} 