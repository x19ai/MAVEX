"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/lib/user-store/provider"
import { User } from "@phosphor-icons/react"
import { formatWalletAddress } from "@/lib/utils"

export function UserProfile() {
  const { user } = useUser()

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
          <p className="text-muted-foreground text-sm">
            {user?.wallet_type === 'google' ? user?.email : user?.wallet_address || "Not signed in"}
          </p>
        </div>
      </div>
    </div>
  )
}
