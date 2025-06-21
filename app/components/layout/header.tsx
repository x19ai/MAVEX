"use client"

import { HistoryTrigger } from "@/app/components/history/history-trigger"
import { AppInfoTrigger } from "@/app/components/layout/app-info/app-info-trigger"
import { ButtonNewChat } from "@/app/components/layout/button-new-chat"
import { UserMenu } from "@/app/components/layout/user-menu"
import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/config"
import { useUser } from "@/lib/user-store/provider"
import { Info } from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import { DialogPublish } from "./dialog-publish"
import { HeaderSidebarTrigger } from "./header-sidebar-trigger"
import { HeaderTwitterButton } from "./header-twitter-button"
import { ContractAddress } from "./contract-address"
import { SettingsTrigger } from "./settings/settings-trigger"

export function Header({ hasSidebar }: { hasSidebar: boolean }) {
  const isMobile = useBreakpoint(768)
  const { user } = useUser()

  const isLoggedIn = !!user

  return (
    <header className="h-app-header pointer-events-none fixed top-0 right-0 left-0 z-50">
      <div className="relative mx-auto flex h-full max-w-full items-center justify-between bg-transparent px-4 sm:px-6 lg:bg-transparent lg:px-8">
        <div className="flex flex-1 items-center justify-between">
          <div className="-ml-0.5 flex flex-1 items-center gap-2 lg:-ml-2.5">
            <div className="flex flex-1 items-center gap-2">
              <Link
                href="/"
                className="pointer-events-auto inline-flex items-center gap-2 text-xl font-medium tracking-tight"
              >
                <Image
                  src="/logo.svg"
                  alt={`${APP_NAME} logo`}
                  width={20}
                  height={20}
                  className="size-5"
                />
                {APP_NAME}
              </Link>
              {hasSidebar && isMobile && <HeaderSidebarTrigger />}
            </div>
          </div>
          <div />
          <div className="pointer-events-auto flex flex-1 items-center justify-end gap-4">
            <div className="flex items-center gap-2">
              <ContractAddress />
              <HeaderTwitterButton />
            </div>
            {!isLoggedIn ? (
              <>
                <SettingsTrigger />
                <AppInfoTrigger
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-background hover:bg-muted text-muted-foreground h-8 w-8 rounded-full"
                      aria-label={`About ${APP_NAME}`}
                    >
                      <Info className="size-4" />
                    </Button>
                  }
                />
                <Link
                  href="/auth"
                  className="font-base text-muted-foreground hover:text-foreground text-base transition-colors"
                >
                  Login
                </Link>
              </>
            ) : (
              <>
                <ButtonNewChat />
                <DialogPublish />
                {!hasSidebar && <HistoryTrigger hasSidebar={hasSidebar} />}
                <SettingsTrigger />
                <UserMenu />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
