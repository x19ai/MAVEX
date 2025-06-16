import type { Tables } from "@/app/types/database.types"

export type UserProfile = {
  profile_image: string
  display_name: string
  wallet_address?: string | null
  wallet_type?: string | null
} & Tables<"users">
