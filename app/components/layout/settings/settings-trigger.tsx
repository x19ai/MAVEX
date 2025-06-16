"use client"

import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { User } from "@phosphor-icons/react"
import { GearSix } from "@phosphor-icons/react"
import type React from "react"
import { useState } from "react"
import { SettingsContent } from "./settings-content"
import { Button } from "@/components/ui/button"

type SettingsTriggerProps = {
  asMenuItem?: boolean
}

export function SettingsTrigger({ asMenuItem = false }: SettingsTriggerProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useBreakpoint(768)

  const trigger = asMenuItem ? (
    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
      <GearSix className="size-4" />
      <span>Settings</span>
    </DropdownMenuItem>
  ) : (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Settings"
      className="bg-background hover:bg-muted text-muted-foreground h-8 w-8 rounded-full"
      onClick={() => setOpen(true)}
    >
      <GearSix className="size-4" />
    </Button>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <SettingsContent isDrawer onClose={() => setOpen(false)} />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex h-[80%] min-h-[480px] w-full flex-col gap-0 p-0 sm:max-w-[768px]">
        <DialogHeader className="border-border border-b px-6 py-5">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <SettingsContent onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
