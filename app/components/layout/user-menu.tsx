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

export function UserMenu() {
  const { user } = useUser()

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
        <TooltipContent>Profile</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        className="w-56"
        align="end"
        forceMount
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {user && (
          <>
            <DropdownMenuItem className="flex flex-col items-start gap-0 no-underline hover:bg-transparent focus:bg-transparent">
              <span>{user?.display_name}</span>
              <span className="text-muted-foreground max-w-full truncate">
                {user?.email}
              </span>
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
