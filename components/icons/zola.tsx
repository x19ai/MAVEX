import * as React from "react"
import type { ImgHTMLAttributes } from "react"

export function ZolaIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/logo.svg"
      alt="Zola Logo"
      className="size-4"
      {...props}
    />
  )
} 