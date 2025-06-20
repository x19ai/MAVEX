"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import Image from "next/image"

import { useState, useEffect } from "react"

type DialogAuthProps = {
  open: boolean
  setOpen: (open: boolean) => void
}

export function DialogAuth({ open, setOpen }: DialogAuthProps) {
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

  if (!isSupabaseEnabled) {
    return null
  }

  const supabase = createClient()

  if (!supabase) {
    return null
  }

  const handleSignInWithPhantom = async () => {
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
        statement: `Authenticate your Phantom wallet with MAVEX. This won't trigger a blockchain transaction.`,
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            You&apos;ve reached the limit for today
          </DialogTitle>
          <DialogDescription className="pt-2 text-base">
            Sign in below to increase your message limits.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}
        <DialogFooter className="mt-6 sm:justify-center">
          <Button
            variant="secondary"
            className="w-full text-base"
            size="lg"
            onClick={handleSignInWithPhantom}
            disabled={isLoading || !isPhantomAvailable}
          >
            <Image
              src="/Phantom_SVG_Icon.svg"
              alt="Phantom logo"
              width={20}
              height={20}
              className="mr-2 size-4"
            />
            <span>{isLoading ? "Connecting..." : "Continue with Phantom"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
