"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/lib/user-store/provider"
import { Eye, EyeSlash, User } from "@phosphor-icons/react"
import { formatWalletAddress } from "@/lib/utils"
import { TokenBalance } from "./token-balance"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { Button } from "@/components/ui/button"

export function UserProfile() {
  const { user } = useUser()
  const { preferences, setWalletAddressHidden } = useUserPreferences()

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Profile</h3>
      <div className="flex items-center space-x-4">
        <div className="bg-muted flex items-center justify-center overflow-hidden rounded-full">
          {user?.profile_image ? (
            <Avatar className="size-12">
              <AvatarImage src={user.profile_image} className="object-cover" />
              <AvatarFallback>{user?.display_name?.charAt(0)}</AvatarFallback>
            </Avatar>
          ) : (
            <User className="text-muted-foreground size-12" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-medium">{user?.display_name || "Guest User"}</h4>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground text-sm">
              {user?.wallet_type === 'google' ? user?.email : preferences.isWalletAddressHidden ? '******************' : (user?.wallet_address || "Not signed in")}
            </p>
            {user?.wallet_type !== 'google' && user?.wallet_address && (
              <Button variant="ghost" size="icon" className="size-6" onClick={() => setWalletAddressHidden(!preferences.isWalletAddressHidden)}>
                {preferences.isWalletAddressHidden ? <EyeSlash size={16} /> : <Eye size={16} />}
              </Button>
            )}
          </div>
        </div>
      </div>
      <TokenBalance />
    </div>
  )
}
