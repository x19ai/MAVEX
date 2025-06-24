import { FREE_MODELS_IDS } from "../config"
import { claudeModels } from "./data/claude"
import { deepseekModels } from "./data/deepseek"
import { geminiModels } from "./data/gemini"
import { grokModels } from "./data/grok"
import { mistralModels } from "./data/mistral"
import { getOllamaModels, ollamaModels } from "./data/ollama"
import { openaiModels } from "./data/openai"
import { openrouterModels } from "./data/openrouter"
import { perplexityModels } from "./data/perplexity"
import { ModelConfig } from "./types"

// Static models (always available)
const STATIC_MODELS: ModelConfig[] = [
  ...openaiModels,
  ...mistralModels,
  ...deepseekModels,
  ...claudeModels,
  ...grokModels,
  ...perplexityModels,
  ...geminiModels,
  ...ollamaModels, // Static fallback Ollama models
  ...openrouterModels,
]

// Debug: Log the models being loaded
console.log("Static models loaded:", {
  openai: openaiModels.length,
  mistral: mistralModels.length,
  deepseek: deepseekModels.length,
  claude: claudeModels.length,
  grok: grokModels.length,
  perplexity: perplexityModels.length,
  gemini: geminiModels.length,
  ollama: ollamaModels.length,
  openrouter: openrouterModels.length,
  total: STATIC_MODELS.length
})

// Debug: Log Google models specifically
const googleModels = STATIC_MODELS.filter(m => m.providerId === "google")
console.log("Google models found:", googleModels.map(m => m.id))

// Dynamic models cache with better TTL management
let dynamicModelsCache: ModelConfig[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes (increased from 5)

// Pre-warm the cache with static models
let isInitialized = false

// Function to get all models including dynamically detected ones
export async function getAllModels(forceRefresh = false): Promise<ModelConfig[]> {
  const now = Date.now()

  // Use cache if it's still valid and not forcing refresh
  if (!forceRefresh && dynamicModelsCache && now - lastFetchTime < CACHE_DURATION) {
    return dynamicModelsCache
  }

  // If not initialized, return static models immediately and warm cache in background
  if (!isInitialized && !forceRefresh) {
    isInitialized = true
    dynamicModelsCache = STATIC_MODELS
    lastFetchTime = now
    
    // Warm cache in background
    warmCacheInBackground()
    return STATIC_MODELS
  }

  try {
    // Get dynamically detected Ollama models (includes enabled check internally)
    const detectedOllamaModels = await getOllamaModels()

    // Combine static models (excluding static Ollama models) with detected ones
    const staticModelsWithoutOllama = STATIC_MODELS.filter(
      (model) => model.providerId !== "ollama"
    )

    dynamicModelsCache = [...staticModelsWithoutOllama, ...detectedOllamaModels]

    lastFetchTime = now
    return dynamicModelsCache
  } catch (error) {
    console.warn("Failed to load dynamic models, using static models:", error)
    // Keep the static models in cache even if dynamic loading fails
    if (!dynamicModelsCache) {
      dynamicModelsCache = STATIC_MODELS
      lastFetchTime = now
    }
    return dynamicModelsCache
  }
}

// Background cache warming function
async function warmCacheInBackground() {
  try {
    const detectedOllamaModels = await getOllamaModels()
    const staticModelsWithoutOllama = STATIC_MODELS.filter(
      (model) => model.providerId !== "ollama"
    )
    
    dynamicModelsCache = [...staticModelsWithoutOllama, ...detectedOllamaModels]
    lastFetchTime = Date.now()
  } catch (error) {
    console.warn("Background cache warming failed:", error)
  }
}

export async function getModelsWithAccessFlags(): Promise<ModelConfig[]> {
  const models = await getAllModels(true) // Force refresh to ensure latest data

  const freeModels = models
    .filter(
      (model) =>
        FREE_MODELS_IDS.includes(model.id) || model.providerId === "ollama"
    )
    .map((model) => ({
      ...model,
      accessible: true,
    }))

  const proModels = models
    .filter((model) => !freeModels.map((m) => m.id).includes(model.id))
    .map((model) => ({
      ...model,
      accessible: false,
    }))

  return [...freeModels, ...proModels]
}

export async function getModelsForProvider(
  provider: string
): Promise<ModelConfig[]> {
  const models = await getAllModels(true) // Force refresh to ensure latest data

  const providerModels = models
    .filter((model) => model.providerId === provider)
    .map((model) => ({
      ...model,
      accessible: true,
    }))

  return providerModels
}

// Function to get models based on user's available providers
export async function getModelsForUserProviders(
  providers: string[]
): Promise<ModelConfig[]> {
  const allModels = await getAllModels(true) // Force refresh to ensure latest data
  console.log("All models count:", allModels.length)
  console.log("User providers:", providers)
  
  const userModels = allModels
    .filter((model) => providers.includes(model.providerId))
    .map((model) => ({
      ...model,
      accessible: true,
    }))

  console.log("Filtered models count:", userModels.length)
  console.log("Models by provider:", userModels.reduce((acc, model) => {
    acc[model.providerId] = (acc[model.providerId] || 0) + 1
    return acc
  }, {} as Record<string, number>))

  return userModels
}

// Synchronous function to get model info for simple lookups
// This uses cached data if available, otherwise falls back to static models
export function getModelInfo(modelId: string): ModelConfig | undefined {
  // First check the cache if it exists
  if (dynamicModelsCache) {
    return dynamicModelsCache.find((model) => model.id === modelId)
  }

  // Fall back to static models for immediate lookup
  return STATIC_MODELS.find((model) => model.id === modelId)
}

// For backward compatibility - static models only
export const MODELS: ModelConfig[] = STATIC_MODELS

// Function to refresh the models cache
export function refreshModelsCache(): void {
  dynamicModelsCache = null
  lastFetchTime = 0
  isInitialized = false
}
