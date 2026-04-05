"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ShootingStar {
  id: number
  x: number
  y: number
  angle: number
  scale: number
  speed: number
  distance: number
}

export interface ShootingStarsProps {
  className?: string
  children?: React.ReactNode
  /** Minimum star speed */
  minSpeed?: number
  /** Maximum star speed */
  maxSpeed?: number
  /** Minimum delay between stars (ms) */
  minDelay?: number
  /** Maximum delay between stars (ms) */
  maxDelay?: number
  /** Color of the star head */
  starColor?: string
  /** Color of the gradient trail */
  trailColor?: string
  /** Width of the star */
  starWidth?: number
  /** Height of the star */
  starHeight?: number
  /** Maximum stars visible at once */
  maxStars?: number
  /** Disable animation (stars won't spawn) */
  disabled?: boolean
}

export function ShootingStars({
  className,
  children,
  minSpeed = 3,
  maxSpeed = 8,
  minDelay = 8000,
  maxDelay = 15000,
  starColor = "#00E5FF",
  trailColor = "#FFB700",
  starWidth = 10,
  starHeight = 1,
  maxStars = 1,
  disabled = false,
}: ShootingStarsProps) {
  const [stars, setStars] = useState<ShootingStar[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout>(undefined)

  const getRandomStartPoint = useCallback(() => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0, angle: 45 }

    const { width, height } = container.getBoundingClientRect()
    const side = Math.floor(Math.random() * 4)

    switch (side) {
      case 0:
        return { x: Math.random() * width, y: 0, angle: 45 }
      case 1:
        return { x: width, y: Math.random() * height, angle: 135 }
      case 2:
        return { x: Math.random() * width, y: height, angle: 225 }
      case 3:
        return { x: 0, y: Math.random() * height, angle: 315 }
      default:
        return { x: 0, y: 0, angle: 45 }
    }
  }, [])

  const createStar = useCallback(() => {
    const { x, y, angle } = getRandomStartPoint()
    const newStar: ShootingStar = {
      id: Date.now() + Math.random(),
      x,
      y,
      angle,
      scale: 1,
      speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
      distance: 0,
    }
    setStars((prev) => (prev.length >= maxStars ? prev : [...prev, newStar]))

    const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay
    timeoutRef.current = setTimeout(createStar, randomDelay)
  }, [getRandomStartPoint, minSpeed, maxSpeed, minDelay, maxDelay])

  useEffect(() => {
    if (disabled) {
      setStars([])
      return
    }

    const initialDelay = setTimeout(createStar, 100)

    return () => {
      clearTimeout(initialDelay)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [createStar, disabled])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const moveStars = () => {
      const { width, height } = container.getBoundingClientRect()

      setStars((prevStars) =>
        prevStars
          .map((star) => {
            const newX =
              star.x + star.speed * Math.cos((star.angle * Math.PI) / 180)
            const newY =
              star.y + star.speed * Math.sin((star.angle * Math.PI) / 180)
            const newDistance = star.distance + star.speed
            const newScale = 1 + newDistance / 100

            if (
              newX < -50 ||
              newX > width + 50 ||
              newY < -50 ||
              newY > height + 50
            ) {
              return null
            }

            return {
              ...star,
              x: newX,
              y: newY,
              distance: newDistance,
              scale: newScale,
            }
          })
          .filter((star): star is ShootingStar => star !== null)
      )

      animationRef.current = requestAnimationFrame(moveStars)
    }

    animationRef.current = requestAnimationFrame(moveStars)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      >
        <defs>
          <linearGradient
            id="shooting-star-gradient"
            x1="0%"
            x2="100%"
            y1="0%"
            y2="0%"
          >
            <stop offset="0%" stopColor={trailColor} stopOpacity={0} />
            <stop offset="100%" stopColor={starColor} stopOpacity={1} />
          </linearGradient>
        </defs>

        {stars.map((star) => (
          <rect
            key={star.id}
            fill="url(#shooting-star-gradient)"
            width={starWidth * star.scale}
            height={starHeight}
            x={star.x}
            y={star.y}
            transform={`rotate(${star.angle}, ${star.x + (starWidth * star.scale) / 2}, ${star.y + starHeight / 2})`}
          />
        ))}
      </svg>

      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  )
}
