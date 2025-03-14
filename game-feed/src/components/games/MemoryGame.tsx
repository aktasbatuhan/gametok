"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Star, Sun, Moon, Cloud, Flower2, LucideIcon } from 'lucide-react'

type MemoryCard = {
  id: number
  icon: LucideIcon
  isMatched: boolean
  color: string
}

interface MemoryGameProps {
  onScoreUpdate?: (score: number) => void;
}

const createCards = () => {
  const iconConfigs = [
    { icon: Heart, color: "text-rose-400" },
    { icon: Star, color: "text-amber-400" },
    { icon: Sun, color: "text-yellow-400" },
    { icon: Moon, color: "text-purple-400" },
    { icon: Cloud, color: "text-sky-400" },
    { icon: Flower2, color: "text-emerald-400" }
  ]
  
  const cards: MemoryCard[] = []

  iconConfigs.forEach(({ icon, color }, index) => {
    cards.push(
      { id: index * 2, icon, color, isMatched: false },
      { id: index * 2 + 1, icon, color, isMatched: false }
    )
  })

  return cards.sort(() => Math.random() - 0.5)
}

export default function MemoryGame({ onScoreUpdate }: MemoryGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>(createCards())
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([])
  const [matches, setMatches] = useState(0)
  const [isChecking, setIsChecking] = useState(false)

  const handleCardClick = (clickedIndex: number) => {
    // Prevent clicking if already checking or card is already matched
    if (isChecking || cards[clickedIndex].isMatched) return
    // Prevent clicking if card is already flipped
    if (flippedIndexes.includes(clickedIndex)) return
    // Prevent clicking if two cards are already flipped
    if (flippedIndexes.length === 2) return

    // Add clicked card to flipped cards
    const newFlipped = [...flippedIndexes, clickedIndex]
    setFlippedIndexes(newFlipped)

    // If we now have two cards flipped, check for a match
    if (newFlipped.length === 2) {
      setIsChecking(true)
      const [firstIndex, secondIndex] = newFlipped
      const firstCard = cards[firstIndex]
      const secondCard = cards[secondIndex]

      if (firstCard.icon === secondCard.icon) {
        // Match found
        setTimeout(() => {
          setCards(cards.map((card, index) => 
            index === firstIndex || index === secondIndex
              ? { ...card, isMatched: true }
              : card
          ))
          setFlippedIndexes([])
          setMatches(m => m + 1)
          setIsChecking(false)
        }, 500)
      } else {
        // No match - reset after delay
        setTimeout(() => {
          setFlippedIndexes([])
          setIsChecking(false)
        }, 1000)
      }
    }
  }

  const resetGame = () => {
    setCards(createCards())
    setFlippedIndexes([])
    setMatches(0)
    setIsChecking(false)
  }

  // Report score to parent component
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(matches);
    }
  }, [matches, onScoreUpdate]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 space-y-4 bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950">
      <div className="text-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 text-transparent bg-clip-text">
          Memory Match
        </h1>
        <p className="text-indigo-200 text-sm">
          Matches: {matches} of {cards.length / 2}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 rounded-xl bg-indigo-950/50 backdrop-blur-sm w-full h-full">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="perspective-1000 aspect-square h-full w-full"
          >
            <div
              className={`relative w-full h-full cursor-pointer rounded-lg transition-all duration-300 transform-style-3d
                ${card.isMatched || flippedIndexes.includes(index) ? "rotate-y-180" : ""}
              `}
              onClick={() => handleCardClick(index)}
            >
              {/* Front of card (hidden when flipped) */}
              <div 
                className={`absolute inset-0 w-full h-full bg-indigo-900 border-2 border-indigo-700 rounded-lg backface-hidden
                  ${!flippedIndexes.includes(index) && !card.isMatched ? "z-10" : "z-0"}
                `}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl text-indigo-500">?</span>
                </div>
              </div>
              
              {/* Back of card (shows icon) */}
              <div 
                className={`absolute inset-0 w-full h-full border-2 rotate-y-180 rounded-lg backface-hidden
                  ${flippedIndexes.includes(index) || card.isMatched ? "z-10" : "z-0"}
                  ${card.isMatched 
                    ? "bg-indigo-800 border-indigo-400" 
                    : "bg-indigo-700 border-indigo-500"}
                `}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <card.icon
                    className={`w-8 h-8 ${
                      card.isMatched 
                        ? `${card.color} filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]` 
                        : card.color
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={resetGame} 
        className="px-4 py-2 bg-indigo-950 border border-indigo-700 hover:bg-indigo-900 hover:border-indigo-500 text-indigo-200 hover:text-indigo-100 rounded-full text-sm absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20"
      >
        New Game
      </button>
    </div>
  )
}