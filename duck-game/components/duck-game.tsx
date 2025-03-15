"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Duck from "@/components/duck"
import { useToast } from "@/hooks/use-toast"
import GunCursor from "@/components/gun-cursor"

interface DuckPosition {
  id: number
  x: number
  y: number
  direction: "left" | "right"
  speed: number
  hit: boolean
}

export default function DuckGame() {
  const [gameActive, setGameActive] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [ducks, setDucks] = useState<DuckPosition[]>([])
  const [highScore, setHighScore] = useState(0)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const duckSpawnRef = useRef<NodeJS.Timeout | null>(null)
  const [shotsFired, setShotsFired] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const audioContext = useRef<AudioContext | null>(null)

  // Initialize high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem("duckGameHighScore")
    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore))
    }

    // Initialize audio context
    if (typeof window !== "undefined") {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    return () => {
      if (audioContext.current) {
        audioContext.current.close()
      }
    }
  }, [])

  // Calculate accuracy
  useEffect(() => {
    if (shotsFired > 0) {
      setAccuracy(Math.round((score / shotsFired) * 100))
    } else {
      setAccuracy(100)
    }
  }, [score, shotsFired])

  // Game timer
  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (gameActive && timeLeft === 0) {
      endGame()
    }
  }, [gameActive, timeLeft])

  // Start game
  const startGame = () => {
    setGameActive(true)
    setScore(0)
    setTimeLeft(30)
    setDucks([])
    setShotsFired(0)
    setAccuracy(100)

    // Start duck spawning
    spawnDuck()
    duckSpawnRef.current = setInterval(spawnDuck, 1500)

    // Start game loop for duck movement
    gameLoopRef.current = setInterval(updateDuckPositions, 50)
  }

  // End game
  const endGame = () => {
    setGameActive(false)

    // Clear intervals
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    if (duckSpawnRef.current) clearInterval(duckSpawnRef.current)

    // Update high score
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem("duckGameHighScore", score.toString())
      toast({
        title: "New High Score!",
        description: `You set a new record: ${score} points!`,
      })
    } else {
      toast({
        title: "Game Over!",
        description: `Your score: ${score} points with ${accuracy}% accuracy`,
      })
    }
  }

  // Spawn a new duck
  const spawnDuck = () => {
    if (!gameAreaRef.current) return

    const gameWidth = gameAreaRef.current.clientWidth
    const gameHeight = gameAreaRef.current.clientHeight

    const direction = Math.random() > 0.5 ? "left" : "right"
    const x = direction === "right" ? -50 : gameWidth
    const y = Math.random() * (gameHeight - 100) + 50
    const speed = Math.random() * 3 + 2

    setDucks((prevDucks) => [
      ...prevDucks,
      {
        id: Date.now(),
        x,
        y,
        direction,
        speed,
        hit: false,
      },
    ])
  }

  // Update duck positions
  const updateDuckPositions = () => {
    if (!gameAreaRef.current) return

    const gameWidth = gameAreaRef.current.clientWidth

    setDucks((prevDucks) => {
      return prevDucks
        .map((duck) => {
          if (duck.hit) return duck

          let newX = duck.x
          if (duck.direction === "right") {
            newX += duck.speed
          } else {
            newX -= duck.speed
          }

          // Remove ducks that have gone off screen
          if ((duck.direction === "right" && newX > gameWidth + 50) || (duck.direction === "left" && newX < -50)) {
            return null
          }

          return { ...duck, x: newX }
        })
        .filter(Boolean) as DuckPosition[]
    })
  }

  // Play sound effect
  const playSound = (type: "shoot" | "hit") => {
    if (!audioContext.current) return

    const oscillator = audioContext.current.createOscillator()
    const gainNode = audioContext.current.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.current.destination)

    if (type === "shoot") {
      // Gunshot sound
      oscillator.type = "square"
      oscillator.frequency.setValueAtTime(150, audioContext.current.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.2)
      gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.2)
    } else {
      // Hit sound
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(500, audioContext.current.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(700, audioContext.current.currentTime + 0.1)
      gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1)
    }

    oscillator.start()
    oscillator.stop(audioContext.current.currentTime + 0.2)
  }

  // Handle shooting
  const handleShoot = (x: number, y: number) => {
    if (!gameActive) return

    setShotsFired((prev) => prev + 1)
    playSound("shoot")

    // Check if shot hit any ducks
    if (gameAreaRef.current) {
      const gameRect = gameAreaRef.current.getBoundingClientRect()
      const relativeX = x - gameRect.left
      const relativeY = y - gameRect.top

      // Check each duck to see if it was hit
      let hitADuck = false

      setDucks((prevDucks) =>
        prevDucks.map((duck) => {
          // Skip already hit ducks
          if (duck.hit) return duck

          // Check if shot coordinates are within duck hitbox (larger than the duck for easier gameplay)
          const hitboxSize = 50
          const hitboxX = duck.x - hitboxSize / 2
          const hitboxY = duck.y - hitboxSize / 2

          if (
            relativeX >= hitboxX &&
            relativeX <= hitboxX + hitboxSize &&
            relativeY >= hitboxY &&
            relativeY <= hitboxY + hitboxSize
          ) {
            hitADuck = true
            setTimeout(() => playSound("hit"), 100)
            return { ...duck, hit: true }
          }

          return duck
        }),
      )

      if (hitADuck) {
        setScore((prevScore) => prevScore + 1)
      }
    }
  }

  // Handle duck click/tap directly (for mobile)
  const handleDuckClick = (id: number) => {
    if (!gameActive) return

    setShotsFired((prev) => prev + 1)
    playSound("shoot")

    // Check if the duck is already hit
    const duck = ducks.find(d => d.id === id);
    if (duck && !duck.hit) {
      // Mark the duck as hit
      setDucks((prevDucks) => prevDucks.map((duck) => (duck.id === id ? { ...duck, hit: true } : duck)))
      
      // Increment score
      setScore((prevScore) => prevScore + 1)
      
      // Play hit sound
      setTimeout(() => playSound("hit"), 100)
    }
  }

  // Remove hit ducks after animation
  useEffect(() => {
    const hitDucks = ducks.filter((duck) => duck.hit)
    if (hitDucks.length > 0) {
      const timer = setTimeout(() => {
        setDucks((prevDucks) => prevDucks.filter((duck) => !duck.hit))
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [ducks])

  return (
    <Card className="w-full max-w-3xl overflow-hidden relative">
      <div className="p-4 bg-blue-50 flex flex-wrap justify-between items-center border-b">
        <div className="flex flex-col sm:flex-row sm:gap-4">
          <div className="text-lg font-bold">Score: {score}</div>
          {gameActive && (
            <>
              <div className="text-sm text-muted-foreground">Shots: {shotsFired}</div>
              <div className="text-sm text-muted-foreground">Accuracy: {accuracy}%</div>
            </>
          )}
        </div>
        <div className="text-lg font-medium">Time: {timeLeft}s</div>
        <div className="text-lg font-medium">High Score: {highScore}</div>
      </div>

      <div ref={gameAreaRef} className="relative bg-gradient-to-b from-sky-100 to-blue-200 h-[60vh] overflow-hidden">
        {!gameActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {timeLeft === 0 ? "Game Over!" : "Duck Arcade"}
            </h2>
            <Button size="lg" onClick={startGame} className="bg-yellow-500 hover:bg-yellow-600 text-lg">
              {timeLeft === 0 ? "Play Again" : "Start Game"}
            </Button>
          </div>
        )}

        {ducks.map((duck) => (
          <Duck
            key={duck.id}
            position={{ x: duck.x, y: duck.y }}
            direction={duck.direction}
            hit={duck.hit}
            onClick={() => handleDuckClick(duck.id)}
          />
        ))}
      </div>

      <div className="p-4 bg-blue-50 border-t">
        <p className="text-center text-sm text-muted-foreground">Click or tap on the ducks to score points!</p>
      </div>

      <GunCursor gameActive={gameActive} onShoot={handleShoot} />
    </Card>
  )
}

