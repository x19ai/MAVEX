"use client"

import { Button } from "@/components/ui/button"
// import { signInWithGoogle } from "@/lib/api"
import { createClient } from "@/lib/supabase/client"
import { APP_NAME } from "@/lib/config"

import Link from "next/link"
import { useState, useEffect } from "react"
import { HeaderGoBack } from "../components/header-go-back"
import Image from "next/image"
import {
  CheckCircle,
  XCircle,
  Star,
  MessageSquare,
  UploadCloud,
  Zap,
  Users,
  Award,
  Key,
} from "lucide-react"
import React from "react"
import OpenAIIcon from "@/components/icons/openai"
import MistralIcon from "@/components/icons/mistral"
import DeepseekIcon from "@/components/icons/deepseek"
import ClaudeIcon from "@/components/icons/claude"
import GeminiIcon from "@/components/icons/gemini"
import GrokIcon from "@/components/icons/grok"
import PerplexityIcon from "@/components/icons/perplexity"
import OllamaIcon from "@/components/icons/ollama"
import OpenRouterIcon from "@/components/icons/openrouter"
import GoogleIcon from "@/components/icons/google"
import AnthropicIcon from "@/components/icons/anthropic"
import XIcon from "@/components/icons/x"
import XaiIcon from "@/components/icons/xai"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPhantomAvailable, setIsPhantomAvailable] = useState(false)

  useEffect(() => {
    // Check for Phantom wallet
    const checkPhantomWallet = () => {
      try {
        // Check for both window.solana and window.phantom
        const provider = window?.solana?.phantom || window?.phantom?.solana
        console.log('Phantom provider:', provider)
        setIsPhantomAvailable(!!provider)
      } catch (err) {
        console.error('Error checking Phantom wallet:', err)
        setIsPhantomAvailable(false)
      }
    }

    // Check immediately
    checkPhantomWallet()

    // Also check after a short delay to ensure wallet is initialized
    const timeoutId = setTimeout(checkPhantomWallet, 1000)

    return () => clearTimeout(timeoutId)
  }, [])

  // async function handleSignInWithGoogle() {
  //   const supabase = createClient()

  //   if (!supabase) {
  //     throw new Error("Supabase is not configured")
  //   }

  //   try {
  //     setIsLoading(true)
  //     setError(null)

  //     const data = await signInWithGoogle(supabase)

  //     // Redirect to the provider URL
  //     if (data?.url) {
  //       window.location.href = data.url
  //     } else {
  //       // Fallback to home if no redirect URL (though should not happen with OAuth)
  //       window.location.href = '/'
  //     }
  //   } catch (err: unknown) {
  //     console.error("Error signing in with Google:", err)
  //     setError(
  //       (err as Error).message ||
  //         "An unexpected error occurred. Please try again."
  //     )
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  async function handleSignInWithPhantom() {
    const supabase = createClient()

    if (!supabase) {
      throw new Error("Supabase is not configured")
    }

    try {
      setIsLoading(true)
      setError(null)

      // Check if Phantom is installed
      const provider = window?.solana?.phantom || window?.phantom?.solana
      console.log('Attempting to connect to Phantom:', provider)

      if (!provider) {
        throw new Error("Phantom wallet is not installed. Please install it from https://phantom.app/")
      }

      // Connect to Phantom
      console.log('Connecting to Phantom...')
      const resp = await provider.connect()
      console.log('Connected to Phantom:', resp)
      const publicKey = resp.publicKey.toString()
      console.log('Public key:', publicKey)

      // Sign in with Supabase using the signature
      console.log('Signing in with Supabase...')
      const { data, error } = await supabase.auth.signInWithWeb3({
        chain: 'solana',
        statement: `This won't trigger a blockchain transaction`,
        wallet: window.phantom?.solana || window.solana?.phantom as any // Type assertion needed due to interface mismatch
      })

      if (error) throw error

      // The user is now signed in
      if (data?.user) {
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('wallet_address', publicKey)
          .maybeSingle()

        if (fetchError) {
          console.error('Error checking for existing user:', fetchError)
          // Decide how to handle this - maybe proceed or show an error
        }

        if (!existingUser) {
          // Get a random animal image from the 1x1 directory
          const animalImages = [
            'Dolphine.png', 'Fox.png', 'Tiger.png', 'Chameleon.png', 'Elephant.png',
            'Zebra.png', 'Crocodile.png', 'Cow.png', 'Seal.png', 'Giraffe.png',
            'Dog.png', 'Cat.png', 'Jaguar.png', 'Orangutan.png', 'Octopus.png',
            'Snake.png', 'Monkey.png', 'Squirrel.png', 'Cheetah.png', 'Panda.png',
            'Koala.png', 'Tasmanian Devil.png', 'Pelican.png', 'Goose.png',
            'Bald Eagle.png', 'raven.png', 'Penguin.png', 'Flamingo.png',
            'Lion.png', 'Kangaroo.png', 'Cub.png', 'Parrot.png', 'Turtle.png'
          ]
          const randomAnimal = animalImages[Math.floor(Math.random() * animalImages.length)]
          const animalName = randomAnimal.split('.')[0] // Extract name without extension
          
          // Create or update user profile in the users table
          const { error: upsertError } = await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: `${animalName}@phantom.wallet`,
              display_name: animalName,
              profile_image: `/1x1/${randomAnimal}`,
              anonymous: false,
              created_at: new Date().toISOString(),
              last_active_at: new Date().toISOString(),
              wallet_address: publicKey,
              wallet_type: 'phantom'
            })

          if (upsertError) {
            console.error('Error creating/updating user profile:', upsertError)
          }
        }

        // Redirect to home page after successful Phantom login
        window.location.href = '/'
      }
    } catch (err: unknown) {
      console.error("Error signing in with Phantom:", err)
      setError(
        (err as Error).message ||
          "An unexpected error occurred. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background flex h-dvh w-full flex-col">
      <HeaderGoBack href="/" />

      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-foreground text-3xl font-medium tracking-tight sm:text-4xl">
              Welcome to {APP_NAME}
            </h1>
            <p className="text-muted-foreground mt-3">
              Sign in below to increase your message limits.
            </p>
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}
          <div className="mt-8 space-y-4">
            {isPhantomAvailable ? (
              <Button
                variant="secondary"
                className="w-full border-none bg-[#ab9ff2] text-base text-white hover:bg-[#ab9ff2]/90 sm:text-base"
                size="lg"
                onClick={handleSignInWithPhantom}
                disabled={isLoading}
              >
                <Image
                  src="/Phantom-Icon_Transparent_White.svg"
                  alt="Phantom logo"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Continue with Phantom
              </Button>
            ) : (
              <a
                href="https://phantom.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  variant="secondary"
                  className="w-full text-base sm:text-base"
                  size="lg"
                >
                  <Image
                    src="/Phantom-Icon_Transparent_White.svg"
                    alt="Phantom logo"
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  Install Phantom Wallet
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* FeatureComparison moved to app-info-content.tsx */}
      </main>

      <footer className="text-muted-foreground p-4 text-center text-sm">
        <p>
          By continuing, you agree to our{" "}
          <Link href="/" className="text-foreground hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/" className="text-foreground hover:underline">
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  )
}
