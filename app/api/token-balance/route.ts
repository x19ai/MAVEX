import { NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { MAVEX_CONFIG } from '@/lib/config'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
    }

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
      const balance = mavexAccount.account.data.parsed.info.tokenAmount.uiAmount
      return NextResponse.json({ balance })
    } else {
      return NextResponse.json({ balance: 0 })
    }
  } catch (error) {
    console.error('Error fetching token balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch token balance' },
      { status: 500 }
    )
  }
} 