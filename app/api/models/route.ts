import {
  getAllModels,
  getModelsForUserProviders,
  getModelsWithAccessFlags,
  refreshModelsCache,
} from "@/lib/models"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { MAVEX_CONFIG } from "@/lib/config"
import { ModelConfig } from "@/lib/models/types"
import { Connection, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

function sortModelsUnlockedFirstAlphabetical(models: ModelConfig[]): ModelConfig[] {
  return models.slice().sort((a: ModelConfig, b: ModelConfig) => {
    if (a.accessible !== b.accessible) return a.accessible ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}

// Helper function to check MAVEX token balance directly
async function checkMavexTokenBalance(walletAddress: string): Promise<number> {
  try {
    // Initialize Solana connection
    const connection = new Connection(MAVEX_CONFIG.API.RPC, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 30000
    })

    // Get token accounts for the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      { programId: TOKEN_PROGRAM_ID }
    )

    // Find MAVEX token account
    const mavexAccount = tokenAccounts.value.find(
      account => account.account.data.parsed.info.mint === MAVEX_CONFIG.ADDRESS
    )

    if (mavexAccount) {
      return mavexAccount.account.data.parsed.info.tokenAmount.uiAmount
    } else {
      return 0
    }
  } catch (error) {
    console.error('Error checking MAVEX token balance:', error)
    return 0
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      const allModels = await getAllModels()
      const models = allModels.map((model) => ({
        ...model,
        accessible: true,
      }))
      return new Response(JSON.stringify({ models: sortModelsUnlockedFirstAlphabetical(models) }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      })
    }

    const { data: authData } = await supabase.auth.getUser()

    if (!authData?.user?.id) {
      const models = await getModelsWithAccessFlags()
      return new Response(JSON.stringify({ models: sortModelsUnlockedFirstAlphabetical(models) }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      })
    }

    // Fetch user profile to get wallet address and type
    const { data: userProfileData } = await supabase
      .from("users")
      .select("wallet_address, wallet_type")
      .eq("id", authData.user.id)
      .single()

    const { data, error } = await supabase
      .from("user_keys")
      .select("provider")
      .eq("user_id", authData.user.id)

    if (error) {
      console.error("Error fetching user keys:", error)
      const models = await getModelsWithAccessFlags()
      return new Response(JSON.stringify({ models: sortModelsUnlockedFirstAlphabetical(models) }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      })
    }

    const userProviders = data?.map((k) => k.provider) || []
    console.log("User providers:", userProviders)

    // If user has imported their own API key, only show their models
    if (userProviders.length > 0) {
      const models = await getModelsForUserProviders(userProviders)
      console.log("Models returned for user providers:", models.length)
      console.log("Sample models:", models.slice(0, 3).map(m => ({ id: m.id, providerId: m.providerId, accessible: m.accessible })))
      return new Response(JSON.stringify({ models: sortModelsUnlockedFirstAlphabetical(models) }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      })
    }

    // If user does not have their own API key, check for MAVEX holder
    let isMavexHolder = false
    if (userProfileData?.wallet_address && userProfileData?.wallet_type === "phantom") {
      // Check token balance directly instead of making HTTP request
      const balance = await checkMavexTokenBalance(userProfileData.wallet_address)
      console.log(`MAVEX token balance for ${userProfileData.wallet_address}:`, balance)
      if (balance > 0) {
        isMavexHolder = true
      }
    }

    if (isMavexHolder) {
      // Grant access to all models from openrouter, openai, google, and mistral
      const allModels = await getAllModels(true)
      const models = allModels.map((model) =>
        ["openrouter", "openai", "google", "mistral"].includes(model.providerId)
          ? { ...model, accessible: true, accessibleReason: "mavex" }
          : model
      )
      return new Response(JSON.stringify({ models: sortModelsUnlockedFirstAlphabetical(models) }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      })
    }

    // Default: show models with normal access flags
    const models = await getModelsWithAccessFlags()
    return new Response(JSON.stringify({ models: sortModelsUnlockedFirstAlphabetical(models) }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error fetching models:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch models" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

export async function POST() {
  try {
    refreshModelsCache()
    const models = await getAllModels()

    return NextResponse.json({
      message: "Models cache refreshed",
      models,
      timestamp: new Date().toISOString(),
      count: models.length,
    })
  } catch (error) {
    console.error("Failed to refresh models:", error)
    return NextResponse.json(
      { error: "Failed to refresh models" },
      { status: 500 }
    )
  }
}
