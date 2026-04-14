"use client"

import { useEffect, useState } from "react"
import { getBrandIcon, getBrandProductLogo } from "@/lib/brandfetch"
import { cn } from "@/lib/utils"

interface BrandIconProps {
  /** Brand domain (e.g. "google.com", "figma.com") */
  domain: string
  /** For sub-product logos under a brand, specify the index in the "other" logos array */
  productIndex?: number
  alt: string
  className?: string
  size?: number
}

export function BrandIcon({ domain, productIndex, alt, className, size = 16 }: BrandIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null)

  useEffect(() => {
    const load = productIndex !== undefined
      ? getBrandProductLogo(domain, productIndex)
      : getBrandIcon(domain)

    load.then(setIconUrl)
  }, [domain, productIndex])

  if (!iconUrl) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center bg-muted text-[10px] font-medium",
          className
        )}
        style={{ width: size, height: size }}
      >
        {alt[0]}
      </span>
    )
  }

  return (
    <img
      src={iconUrl}
      alt={alt}
      width={size}
      height={size}
      className={cn("object-contain", className)}
    />
  )
}
