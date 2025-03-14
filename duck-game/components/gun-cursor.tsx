"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface GunCursorProps {
  gameActive: boolean
  onShoot: (x: number, y: number) => void
}

export default function GunCursor({ gameActive, onShoot }: GunCursorProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isShooting, setIsShooting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 768px)").matches)
  }, [])

  // Track mouse position
  useEffect(() => {
    if (!gameActive || isMobile) return

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [gameActive, isMobile])

  // Handle shooting animation
  const handleShoot = (e: React.MouseEvent) => {
    if (!gameActive) return

    setIsShooting(true)
    onShoot(e.clientX, e.clientY)

    setTimeout(() => {
      setIsShooting(false)
    }, 150)
  }

  // Don't show cursor on mobile devices
  if (isMobile || !gameActive) return null

  return (
    <>
      {/* Custom cursor that follows mouse */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <motion.div animate={isShooting ? { scale: 1.2 } : { scale: 1 }} transition={{ duration: 0.15 }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer circle */}
            <circle cx="20" cy="20" r="18" stroke="#000" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />

            {/* Inner circle */}
            <circle cx="20" cy="20" r="3" fill="#ff0000" fillOpacity="0.7" />

            {/* Crosshair lines */}
            <line x1="20" y1="5" x2="20" y2="15" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="20" y1="25" x2="20" y2="35" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="5" y1="20" x2="15" y2="20" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="25" y1="20" x2="35" y2="20" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.div>
      </div>

      {/* Invisible overlay to capture clicks */}
      <div className="fixed inset-0 z-40 cursor-none" onClick={handleShoot} />
    </>
  )
}

