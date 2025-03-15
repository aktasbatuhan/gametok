"use client"

import React from "react"
import { motion } from "framer-motion"

interface DuckProps {
  position: {
    x: number
    y: number
  }
  direction: "left" | "right"
  hit: boolean
  onClick: () => void
}

export default function Duck({ position, direction, hit, onClick }: DuckProps) {
  // Handle click event, preventing multiple clicks on the same duck
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hit) {
      onClick()
    }
  }

  return (
    <motion.div
      className="absolute cursor-pointer select-none"
      style={{
        left: position.x,
        top: position.y,
        transform: direction === "left" ? "scaleX(-1)" : "none",
        // Add a larger touch target for mobile
        touchAction: "manipulation",
        padding: "10px",
        margin: "-10px",
      }}
      animate={
        hit
          ? {
              y: [0, -20, 200],
              opacity: [1, 1, 0],
              rotate: [0, 0, 180],
            }
          : {}
      }
      transition={{ duration: 0.5 }}
      onClick={handleClick}
    >
      <svg
        width="50"
        height="50"
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={hit ? "text-red-500" : "text-yellow-500 hover:text-yellow-400"}
      >
        <path d="M40 15C40 20 35 25 30 25C25 25 20 20 20 15C20 10 25 5 30 5C35 5 40 10 40 15Z" fill="currentColor" />
        <path d="M20 20C15 20 5 25 5 30C5 35 10 40 15 40C20 40 45 35 45 30C45 25 25 20 20 20Z" fill="currentColor" />
        <path
          d="M45 25C45 27.5 42.5 30 40 30C37.5 30 35 27.5 35 25C35 22.5 37.5 20 40 20C42.5 20 45 22.5 45 25Z"
          fill="white"
        />
        <circle cx="42" cy="25" r="2" fill="black" />
        <path d="M15 30L10 35L5 30" stroke="orange" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </motion.div>
  )
}

