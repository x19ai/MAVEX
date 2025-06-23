"use client"

import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { APP_NAME } from "@/lib/config"
import { Info } from "@phosphor-icons/react"
import Image from "next/image"
import { AppInfoContent } from "./app-info-content"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

type AppInfoTriggerProps = {
  trigger?: React.ReactNode
}

export function AppInfoTrigger({ trigger }: AppInfoTriggerProps) {
  const isMobile = useBreakpoint(768)

  const defaultTrigger = (
    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
      <Info className="size-4" />
      About {APP_NAME}
    </DropdownMenuItem>
  )

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>{trigger || defaultTrigger}</DrawerTrigger>
        <DrawerContent className="bg-background border-border">
          <DrawerHeader>
            <Image
              src="/banner_ocean.jpg"
              alt={`calm paint generate by ${APP_NAME}`}
              width={400}
              height={128}
              className="h-32 w-full object-cover"
            />
            <VisuallyHidden>
              <DrawerTitle>{APP_NAME}</DrawerTitle>
            </VisuallyHidden>
            <DrawerDescription className="hidden">
              Your minimalist AI chat companion
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <AppInfoContent />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="[&>button:last-child]:bg-background gap-0 overflow-hidden rounded-3xl p-0 shadow-xs !w-[1800px] !max-w-[99vw] h-auto max-h-[90vh] p-8 [&>button:last-child]:rounded-full [&>button:last-child]:p-1">
        <DialogHeader className="p-0">
          <Image
            src="/banner_ocean.jpg"
            alt={`calm paint generate by ${APP_NAME}`}
            width={400}
            height={128}
            className="h-32 w-full object-cover"
          />
          <VisuallyHidden>
            <DialogTitle>{APP_NAME}</DialogTitle>
          </VisuallyHidden>
          <DialogDescription className="hidden">
            Your minimalist AI chat companion
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <AppInfoContent />
        </div>
      </DialogContent>
    </Dialog>
  )
}
