"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUser } from "@/lib/user-store/provider"
import { AppInfoTrigger } from "./app-info/app-info-trigger"
import { FeedbackTrigger } from "./feedback/feedback-trigger"
import { SettingsTrigger } from "./settings/settings-trigger"
import { formatWalletAddress } from "@/lib/utils"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { Eye, EyeSlash } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

export function UserMenu() {
  const { user } = useUser()
  const { preferences, setWalletAddressHidden } = useUserPreferences()

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setWalletAddressHidden(!preferences.isWalletAddressHidden)
  }

  return (
    // fix shadcn/ui / radix bug when dialog into dropdown menu
    <DropdownMenu modal={false}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger>
            <Avatar className="bg-background hover:bg-muted">
              {user ? (
                <>
                  <AvatarImage src={user?.profile_image ?? undefined} />
                  <AvatarFallback>{user?.display_name?.charAt(0)}</AvatarFallback>
                </>
              ) : (
                <AvatarFallback>?</AvatarFallback>
              )}
            </Avatar>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{preferences.isWalletAddressHidden ? '******************' : user?.wallet_address}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        className="w-56"
        align="end"
        forceMount
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {user && (
          <>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="flex flex-col items-start gap-0 no-underline hover:bg-transparent focus:bg-transparent"
            >
              <span>{user?.display_name || "Guest User"}</span>
              <div className="flex w-full items-center justify-between">
                <span className="text-muted-foreground max-w-full">
                  {user?.wallet_type === 'google' ? user?.email : (
                    preferences.isWalletAddressHidden ? '******************' : formatWalletAddress(user?.wallet_address || "")
                  )}
                </span>
                {user?.wallet_type !== 'google' && user?.wallet_address && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={handleToggleVisibility}
                  >
                    {preferences.isWalletAddressHidden ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </Button>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <AppInfoTrigger />
        <FeedbackTrigger />
        <SettingsTrigger asMenuItem={true} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
