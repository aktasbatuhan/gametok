"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface DuckPosition {
  id: number
  x: number
  y: number
  direction: "left" | "right"
  speed: number
  hit: boolean
}

interface DuckGameProps {
  onScoreUpdate?: (score: number) => void;
}

export default function DuckGame({ onScoreUpdate }: DuckGameProps) {
  const [gameActive, setGameActive] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [ducks, setDucks] = useState<DuckPosition[]>([])
  const [highScore, setHighScore] = useState(0)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const duckSpawnRef = useRef<NodeJS.Timeout | null>(null)
  const [shotsFired, setShotsFired] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const audioContext = useRef<AudioContext | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [shootEffect, setShootEffect] = useState<{x: number, y: number} | null>(null)

  // Initialize high score from localStorage and check if mobile
  useEffect(() => {
    const savedHighScore = localStorage.getItem("duckGameHighScore")
    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore))
    }

    // Initialize audio context
    if (typeof window !== "undefined") {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      setIsMobile(window.matchMedia("(max-width: 768px)").matches)
    }

    return () => {
      if (audioContext.current) {
        audioContext.current.close()
      }
    }
  }, [])

  // Report score to parent component
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score);
    }
  }, [score, onScoreUpdate]);

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
    
    // Show shoot effect on mobile
    if (isMobile) {
      setShootEffect({ x, y })
    }

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

          // Check if shot coordinates are within duck hitbox (larger for mobile for easier gameplay)
          const hitboxSize = isMobile ? 70 : 50
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

    setDucks((prevDucks) => prevDucks.map((duck) => (duck.id === id ? { ...duck, hit: true } : duck)))

    setScore((prevScore) => prevScore + 1)
    setTimeout(() => playSound("hit"), 100)
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

  // Handle click on game area (for both desktop and mobile shooting)
  const handleGameAreaClick = (e: React.MouseEvent) => {
    if (!gameActive) return
    
    // Get the coordinates
    const x = e.clientX
    const y = e.clientY
    
    // If on mobile, we'll handle tapping on the game area to shoot
    // If on desktop, we'll use the cursor to shoot
    handleShoot(x, y)
  }

  // Shooting effect component for visual feedback on mobile
  const ShootEffect = ({ position, onComplete }: { position: { x: number, y: number } | null, onComplete: () => void }) => {
    if (!position) return null;
    
    return (
      <motion.div
        className="absolute z-10 pointer-events-none"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
        }}
        initial={{ opacity: 1, scale: 0 }}
        animate={{ opacity: 0, scale: 2 }}
        transition={{ duration: 0.3 }}
        onAnimationComplete={onComplete}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="20" fill="yellow" fillOpacity="0.5" />
          <circle cx="20" cy="20" r="10" fill="orange" fillOpacity="0.7" />
        </svg>
      </motion.div>
    );
  };

  // Custom cursor component for desktop
  const Cursor = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isShooting, setIsShooting] = useState(false);
    
    useEffect(() => {
      if (!gameActive || isMobile) return;
      
      // More efficient mouse move handling
      const handleMouseMove = (e: MouseEvent) => {
        if (cursorRef.current) {
          // Use transform for better performance
          cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        }
      };
      
      // Listen for clicks to animate shooting
      const handleClick = () => {
        if (gameActive) {
          setIsShooting(true);
          setTimeout(() => setIsShooting(false), 150);
        }
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('click', handleClick);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', handleClick);
      };
    }, [gameActive, isMobile]);
    
    // Don't show cursor on mobile
    if (isMobile || !gameActive) return null;
    
    return (
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 z-50 pointer-events-none"
        style={{ 
          transform: 'translate(-50%, -50%)', 
          transition: 'transform 0.01s linear',
          willChange: 'transform',
        }}
      >
        <motion.div 
          animate={isShooting ? { scale: 1.2 } : { scale: 1 }} 
          transition={{ duration: 0.15 }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" stroke="#000" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />
            <circle cx="20" cy="20" r="3" fill="#ff0000" fillOpacity="0.7" />
            <line x1="20" y1="5" x2="20" y2="15" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="20" y1="25" x2="20" y2="35" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="5" y1="20" x2="15" y2="20" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="25" y1="20" x2="35" y2="20" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.div>
      </div>
    );
  };

  // Duck component
  const Duck = ({ position, direction, hit, onClick }: { 
    position: { x: number, y: number },
    direction: "left" | "right",
    hit: boolean,
    onClick: () => void
  }) => {
    return (
      <motion.div
        className="absolute cursor-pointer select-none"
        style={{
          left: position.x,
          top: position.y,
          transform: direction === "left" ? "scaleX(-1)" : "none",
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
        onClick={hit ? undefined : onClick}
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

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="relative w-full h-full flex flex-col">
        {/* Game header */}
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

        {/* Game area */}
        <div 
          ref={gameAreaRef} 
          className="relative flex-grow bg-gradient-to-b from-sky-100 to-blue-200 overflow-hidden"
          onClick={handleGameAreaClick}
          style={{ cursor: !isMobile && gameActive ? 'none' : 'default' }}
          onTouchStart={(e) => {
            // Prevent default to avoid unwanted mobile behaviors
            e.preventDefault();
            if (!gameActive) return;
            
            // Get touch coordinates
            const touch = e.touches[0];
            if (touch) {
              handleShoot(touch.clientX, touch.clientY);
            }
          }}
        >
          {/* Start/game over overlay */}
          {!gameActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {timeLeft === 0 ? "Game Over!" : "Duck Arcade"}
              </h2>
              <button 
                onClick={startGame} 
                className="bg-yellow-500 hover:bg-yellow-600 text-lg px-8 py-3 rounded-lg font-bold text-white"
              >
                {timeLeft === 0 ? "Play Again" : "Start Game"}
              </button>
            </div>
          )}

          {/* Shooting effect for mobile */}
          <ShootEffect 
            position={shootEffect} 
            onComplete={() => setShootEffect(null)} 
          />

          {/* Render ducks */}
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

        {/* Game footer */}
        <div className="p-2 bg-blue-50 border-t">
          <p className="text-center text-sm text-muted-foreground">
            {isMobile ? "Tap anywhere on the screen to shoot ducks!" : "Click anywhere to shoot ducks!"}
          </p>
        </div>
      </div>

      {/* Custom cursor for desktop */}
      <Cursor />
    </div>
  )
}