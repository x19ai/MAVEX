"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/lib/user-store/provider"
import { MAVEX_CONFIG } from "@/lib/config"

export function TokenBalance() {
  const { user } = useUser()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTokenBalance() {
      if (!user?.wallet_address || user.wallet_type !== 'phantom') {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch token balance using our API route
        const response = await fetch(`/api/token-balance?wallet=${user.wallet_address}`)
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('Token balance response:', data)

        if (data.error) {
          throw new Error(data.error)
        }

        setBalance(data.balance)
      } catch (err) {
        console.error("Error fetching token balance:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch token balance")
      } finally {
        setLoading(false)
      }
    }

    fetchTokenBalance()
  }, [user?.wallet_address])

  if (!user?.wallet_address || user.wallet_type !== 'phantom') {
    return null
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium">{MAVEX_CONFIG.TOKEN_NAME} Balance</h3>
      <div className="mt-2">
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading balance...</p>
        ) : error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : (
          <p className="text-sm font-medium">
            {balance !== null ? `${Math.floor(balance).toLocaleString()} ${MAVEX_CONFIG.TOKEN_SYMBOL}` : `No ${MAVEX_CONFIG.TOKEN_SYMBOL} tokens found`}
          </p>
        )}
      </div>
    </div>
  )
} 