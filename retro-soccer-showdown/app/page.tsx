"use client"

import { useEffect, useRef, useState } from "react"

// Replace the main container with a more responsive layout
export default function Home() {
  const [gameStarted, setGameStarted] = useState(false)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-yellow-400 via-green-500 to-blue-600 p-2 sm:p-4">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-4 text-center text-shadow-sm">
        Brazilian Street Soccer
      </h1>

      <div className="relative w-full max-w-2xl aspect-[4/3] bg-black rounded-lg overflow-hidden shadow-2xl border-2 sm:border-4 border-yellow-400">
        <BrazilianSoccerGame gameStarted={gameStarted} setGameStarted={setGameStarted} />
      </div>

      <div className="mt-2 sm:mt-4 text-white text-center text-xs sm:text-sm md:text-base max-w-md">
        <p className="font-bold mb-1">Controls:</p>
        <p className="text-xs sm:text-sm">
          <span className="hidden sm:inline">Desktop: WASD/Arrows to move, Space to kick | </span>
          <span>Mobile: Drag to move, Tap to kick</span>
        </p>
      </div>
    </main>
  )
}

// Game constants
const GAME_WIDTH = 320
const GAME_HEIGHT = 240
const PLAYER_SPEED = 3.5 // Increased player speed
const BALL_SPEED = 2.5 // Increased ball speed
const KICK_POWER = 6 // Increased kick power
const GAME_DURATION = 120 // 2 minutes in seconds
const GOAL_WIDTH = 12 // Wider goals (was 8)
const GOAL_HEIGHT = 60 // Taller goals (was 48)

// Add these new constants for touch controls
const TOUCH_CONTROLS_ENABLED = true

// Brazilian Soccer Game Component
function BrazilianSoccerGame({
  gameStarted,
  setGameStarted,
}: {
  gameStarted: boolean
  setGameStarted: (started: boolean) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef<number>()

  // Game state
  const [score, setScore] = useState({ player: 0, cpu: 0 })
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [gameOver, setGameOver] = useState(false)

  // Game objects using refs to avoid re-renders
  const playerRef = useRef({ x: 80, y: 120, width: 16, height: 16 })
  const cpuRef = useRef({ x: 240, y: 120, width: 16, height: 16 })
  const ballRef = useRef({ x: 160, y: 120, width: 8, height: 8, speedX: 0, speedY: 0 })

  // Input state
  const keysRef = useRef<Record<string, boolean>>({})
  const touchRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    dx: 0,
    dy: 0,
    action: false,
  })

  // Add state for device detection
  const [isMobile, setIsMobile] = useState(false)
  const [showTouchControls, setShowTouchControls] = useState(false)

  // Add refs for touch controls
  const touchJoystickRef = useRef<HTMLDivElement>(null)
  const kickButtonRef = useRef<HTMLDivElement>(null)

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth < 768
      setIsMobile(isMobileDevice)
      setShowTouchControls(isMobileDevice && TOUCH_CONTROLS_ENABLED)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Sound effect function
  const playSound = (type: "kick" | "goal" | "whistle") => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = "sine"

      // Different sounds for different actions
      switch (type) {
        case "kick":
          oscillator.frequency.value = 440 // A4
          gainNode.gain.value = 0.1
          setTimeout(() => oscillator.stop(), 100)
          break
        case "goal":
          oscillator.frequency.value = 523.25 // C5
          gainNode.gain.value = 0.2
          setTimeout(() => oscillator.stop(), 300)
          break
        case "whistle":
          oscillator.frequency.value = 880 // A5
          gainNode.gain.value = 0.15
          setTimeout(() => oscillator.stop(), 500)
          break
      }

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start()

      setTimeout(() => {
        audioContext.close().catch((e) => console.warn("Error closing audio context:", e))
      }, 1000)
    } catch (error) {
      console.warn("Web Audio API error:", error)
    }
  }

  // Start the game
  const startGame = () => {
    playSound("whistle")
    setGameStarted(true)
    setGameOver(false)
    setScore({ player: 0, cpu: 0 })
    setTimeLeft(GAME_DURATION)

    // Reset positions
    playerRef.current = { x: 80, y: 120, width: 16, height: 16 }
    cpuRef.current = { x: 240, y: 120, width: 16, height: 16 }
    ballRef.current = { x: 160, y: 120, width: 8, height: 8, speedX: 0, speedY: 0 }
  }

  // End the game
  const endGame = () => {
    playSound("whistle")
    setGameOver(true)
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for game controls to avoid scrolling
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)
      ) {
        e.preventDefault()
      }

      // Start game with space
      if (e.code === "Space" && (!gameStarted || gameOver)) {
        startGame()
        return
      }

      keysRef.current[e.code] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameStarted, gameOver])

  // Handle touch input
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!gameStarted || gameOver) {
        startGame()
        return
      }

      if (e.touches.length === 0) return

      const touch = e.touches[0]
      touchRef.current = {
        ...touchRef.current,
        active: true,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0 || !gameStarted || gameOver) return
      e.preventDefault() // Prevent scrolling while playing

      const touch = e.touches[0]

      // Calculate normalized direction vector
      const dx = (touch.clientX - touchRef.current.startX) / 30
      const dy = (touch.clientY - touchRef.current.startY) / 30

      // Clamp values between -1 and 1
      const clampedDx = Math.max(-1, Math.min(1, dx))
      const clampedDy = Math.max(-1, Math.min(1, dy))

      touchRef.current = {
        ...touchRef.current,
        currentX: touch.clientX,
        currentY: touch.clientY,
        dx: clampedDx,
        dy: clampedDy,
      }
    }

    const handleTouchEnd = () => {
      touchRef.current = {
        ...touchRef.current,
        active: false,
        dx: 0,
        dy: 0,
      }

      // Tap to kick
      touchRef.current.action = true
      setTimeout(() => {
        touchRef.current.action = false
      }, 100)
    }

    window.addEventListener("touchstart", handleTouchStart)
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleTouchEnd)

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }
  }, [gameStarted, gameOver])

  // Handle click to start
  useEffect(() => {
    const handleClick = () => {
      if (!gameStarted || gameOver) {
        startGame()
      }
    }

    window.addEventListener("click", handleClick)

    return () => {
      window.removeEventListener("click", handleClick)
    }
  }, [gameStarted, gameOver])

  // Timer effect
  useEffect(() => {
    if (!gameStarted || gameOver) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, gameOver])

  // Add a resize handler to ensure pixel-perfect rendering on all devices
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      // Get the container dimensions
      const container = canvas.parentElement
      if (!container) return

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      // Calculate the maximum size while maintaining aspect ratio
      const aspectRatio = GAME_WIDTH / GAME_HEIGHT
      let width = containerWidth
      let height = width / aspectRatio

      if (height > containerHeight) {
        height = containerHeight
        width = height * aspectRatio
      }

      // Set canvas display size (CSS pixels)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      // Set canvas render size (actual pixels)
      canvas.width = GAME_WIDTH
      canvas.height = GAME_HEIGHT
    }

    // Initial resize
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [gameStarted, gameOver])

  // Improved resize handler for better responsiveness
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      // Get the container dimensions
      const container = canvas.parentElement
      if (!container) return

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      // Calculate the maximum size while maintaining aspect ratio
      const aspectRatio = GAME_WIDTH / GAME_HEIGHT
      let width = containerWidth
      let height = width / aspectRatio

      if (height > containerHeight) {
        height = containerHeight
        width = height * aspectRatio
      }

      // Set canvas display size (CSS pixels)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      // Set canvas render size (actual pixels)
      canvas.width = GAME_WIDTH
      canvas.height = GAME_HEIGHT

      // Update touch controls position if they exist
      if (showTouchControls) {
        if (touchJoystickRef.current) {
          touchJoystickRef.current.style.left = `${width * 0.15}px`
          touchJoystickRef.current.style.bottom = `${height * 0.15}px`
        }

        if (kickButtonRef.current) {
          kickButtonRef.current.style.right = `${width * 0.15}px`
          kickButtonRef.current.style.bottom = `${height * 0.15}px`
        }
      }
    }

    // Initial resize
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [gameStarted, gameOver, showTouchControls])

  // Enhanced touch input handling for better mobile experience
  useEffect(() => {
    if (!isMobile) return

    let joystickActive = false
    let kickActive = false
    let joystickStartX = 0
    let joystickStartY = 0

    const handleJoystickStart = (e: TouchEvent) => {
      if (!gameStarted || gameOver) {
        startGame()
        return
      }

      joystickActive = true
      const touch = e.touches[0]
      joystickStartX = touch.clientX
      joystickStartY = touch.clientY

      touchRef.current = {
        ...touchRef.current,
        active: true,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        dx: 0,
        dy: 0,
      }

      e.preventDefault()
    }

    const handleJoystickMove = (e: TouchEvent) => {
      if (!joystickActive || !gameStarted || gameOver) return

      const touch = e.touches[0]

      // Calculate normalized direction vector
      const dx = (touch.clientX - joystickStartX) / 50 // More sensitive
      const dy = (touch.clientY - joystickStartY) / 50

      // Clamp values between -1 and 1
      const clampedDx = Math.max(-1, Math.min(1, dx))
      const clampedDy = Math.max(-1, Math.min(1, dy))

      touchRef.current = {
        ...touchRef.current,
        currentX: touch.clientX,
        currentY: touch.clientY,
        dx: clampedDx,
        dy: clampedDy,
      }

      e.preventDefault()
    }

    const handleJoystickEnd = () => {
      joystickActive = false
      touchRef.current = {
        ...touchRef.current,
        active: false,
        dx: 0,
        dy: 0,
      }
    }

    const handleKickStart = (e: TouchEvent) => {
      if (!gameStarted || gameOver) {
        startGame()
        return
      }

      kickActive = true
      touchRef.current.action = true
      e.preventDefault()
    }

    const handleKickEnd = () => {
      kickActive = false
      setTimeout(() => {
        touchRef.current.action = false
      }, 100)
    }

    // Add touch controls event listeners if they exist
    if (touchJoystickRef.current) {
      touchJoystickRef.current.addEventListener("touchstart", handleJoystickStart)
      touchJoystickRef.current.addEventListener("touchmove", handleJoystickMove, { passive: false })
      touchJoystickRef.current.addEventListener("touchend", handleJoystickEnd)
    }

    if (kickButtonRef.current) {
      kickButtonRef.current.addEventListener("touchstart", handleKickStart)
      kickButtonRef.current.addEventListener("touchend", handleKickEnd)
    }

    // Clean up
    return () => {
      if (touchJoystickRef.current) {
        touchJoystickRef.current.removeEventListener("touchstart", handleJoystickStart)
        touchJoystickRef.current.removeEventListener("touchmove", handleJoystickMove)
        touchJoystickRef.current.removeEventListener("touchend", handleJoystickEnd)
      }

      if (kickButtonRef.current) {
        kickButtonRef.current.removeEventListener("touchstart", handleKickStart)
        kickButtonRef.current.removeEventListener("touchend", handleKickEnd)
      }
    }
  }, [isMobile, gameStarted, gameOver, touchJoystickRef.current, kickButtonRef.current])

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return

    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    canvas.width = GAME_WIDTH
    canvas.height = GAME_HEIGHT

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Track frame rate for consistent gameplay across devices
    let lastFrameTime = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    // Create grass pattern with device-specific optimizations
    const createGrassPattern = () => {
      // For lower-end devices, use a simpler pattern
      if (isMobile) {
        const patternCanvas = document.createElement("canvas")
        patternCanvas.width = 10
        patternCanvas.height = 10
        const patternCtx = patternCanvas.getContext("2d")

        if (patternCtx) {
          // Simpler pattern for mobile
          patternCtx.fillStyle = "#2ecc71"
          patternCtx.fillRect(0, 0, 10, 10)

          // Just a few darker patches
          patternCtx.fillStyle = "#27ae60"
          patternCtx.fillRect(0, 0, 5, 5)
          patternCtx.fillRect(5, 5, 5, 5)
        }

        return ctx.createPattern(patternCanvas, "repeat")
      } else {
        // Full quality pattern for desktop
        const patternCanvas = document.createElement("canvas")
        patternCanvas.width = 20
        patternCanvas.height = 20
        const patternCtx = patternCanvas.getContext("2d")

        if (patternCtx) {
          // Base green
          patternCtx.fillStyle = "#2ecc71"
          patternCtx.fillRect(0, 0, 20, 20)

          // Darker green patches
          patternCtx.fillStyle = "#27ae60"

          // Create a more natural pattern
          for (let i = 0; i < 8; i++) {
            const x = Math.floor(Math.random() * 20)
            const y = Math.floor(Math.random() * 20)
            const size = 3 + Math.floor(Math.random() * 4)
            patternCtx.fillRect(x, y, size, size)
          }

          // Add some lighter patches
          patternCtx.fillStyle = "#3ae681"
          for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * 20)
            const y = Math.floor(Math.random() * 20)
            const size = 2 + Math.floor(Math.random() * 3)
            patternCtx.fillRect(x, y, size, size)
          }

          // Add field lines pattern
          if (Math.random() > 0.7) {
            patternCtx.fillStyle = "#25a55a"
            patternCtx.fillRect(0, 10, 20, 1)
          }
        }

        return ctx.createPattern(patternCanvas, "repeat")
      }
    }

    const grassPattern = createGrassPattern()

    // Game loop function with frame rate control
    const gameLoop = (timestamp: number) => {
      // Calculate delta time for consistent gameplay speed
      const deltaTime = timestamp - lastFrameTime

      // Skip frames if needed to maintain consistent gameplay
      if (deltaTime < frameInterval) {
        requestRef.current = requestAnimationFrame(gameLoop)
        return
      }

      // Calculate a multiplier to ensure consistent speed regardless of frame rate
      const speedMultiplier = deltaTime / frameInterval

      // Update last frame time
      lastFrameTime = timestamp - (deltaTime % frameInterval)

      // Clear canvas
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

      // Draw field with grass pattern
      if (grassPattern) {
        ctx.fillStyle = grassPattern
      } else {
        ctx.fillStyle = "#2ecc71" // Fallback green
      }
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

      // Draw field markings - simplified for mobile if needed
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
      ctx.lineWidth = 2

      // Center line
      ctx.beginPath()
      ctx.moveTo(GAME_WIDTH / 2, 0)
      ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT)
      ctx.stroke()

      // Center circle
      ctx.beginPath()
      ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2, 30, 0, Math.PI * 2)
      ctx.stroke()

      // Center spot
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
      ctx.beginPath()
      ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2, 3, 0, Math.PI * 2)
      ctx.fill()

      // Only draw detailed field markings on desktop
      if (!isMobile) {
        // Penalty areas
        ctx.strokeRect(0, GAME_HEIGHT / 2 - 50, 40, 100)
        ctx.strokeRect(GAME_WIDTH - 40, GAME_HEIGHT / 2 - 50, 40, 100)

        // Penalty spots
        ctx.beginPath()
        ctx.arc(30, GAME_HEIGHT / 2, 3, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(GAME_WIDTH - 30, GAME_HEIGHT / 2, 3, 0, Math.PI * 2)
        ctx.fill()

        // Corner arcs
        ctx.beginPath()
        ctx.arc(0, 0, 10, 0, Math.PI / 2)
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(GAME_WIDTH, 0, 10, Math.PI / 2, Math.PI)
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(0, GAME_HEIGHT, 10, 0, -Math.PI / 2)
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(GAME_WIDTH, GAME_HEIGHT, 10, -Math.PI / 2, -Math.PI)
        ctx.stroke()
      }

      // Draw goal areas
      ctx.strokeRect(0, GAME_HEIGHT / 2 - 40, 20, 80)
      ctx.strokeRect(GAME_WIDTH - 20, GAME_HEIGHT / 2 - 40, 20, 80)

      // Draw goals - make them larger and more visible
      ctx.fillStyle = "#FFFFFF"
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 1

      // Left goal
      ctx.fillRect(0, GAME_HEIGHT / 2 - GOAL_HEIGHT / 2, GOAL_WIDTH, GOAL_HEIGHT)
      ctx.strokeRect(0, GAME_HEIGHT / 2 - GOAL_HEIGHT / 2, GOAL_WIDTH, GOAL_HEIGHT)

      // Right goal
      ctx.fillRect(GAME_WIDTH - GOAL_WIDTH, GAME_HEIGHT / 2 - GOAL_HEIGHT / 2, GOAL_WIDTH, GOAL_HEIGHT)
      ctx.strokeRect(GAME_WIDTH - GOAL_WIDTH, GAME_HEIGHT / 2 - GOAL_HEIGHT / 2, GOAL_WIDTH, GOAL_HEIGHT)

      // Add goal nets (simple pattern) - simplified for mobile
      ctx.fillStyle = "#EEEEEE"
      const netSpacing = isMobile ? 8 : 6
      for (let y = GAME_HEIGHT / 2 - GOAL_HEIGHT / 2; y < GAME_HEIGHT / 2 + GOAL_HEIGHT / 2; y += netSpacing) {
        for (let x = 0; x < GOAL_WIDTH; x += netSpacing) {
          ctx.fillRect(x, y, 2, 2) // Left goal net
          ctx.fillRect(GAME_WIDTH - GOAL_WIDTH + x, y, 2, 2) // Right goal net
        }
      }

      // Update player position based on input
      const player = playerRef.current
      const keys = keysRef.current
      const touch = touchRef.current

      let dx = 0
      let dy = 0

      // Keyboard controls
      if (keys.ArrowUp || keys.KeyW) dy -= PLAYER_SPEED * speedMultiplier
      if (keys.ArrowDown || keys.KeyS) dy += PLAYER_SPEED * speedMultiplier
      if (keys.ArrowLeft || keys.KeyA) dx -= PLAYER_SPEED * speedMultiplier
      if (keys.ArrowRight || keys.KeyD) dx += PLAYER_SPEED * speedMultiplier

      // Touch controls
      if (touch.active) {
        dx = touch.dx * PLAYER_SPEED * speedMultiplier
        dy = touch.dy * PLAYER_SPEED * speedMultiplier
      }

      // Update player position
      player.x = Math.max(0, Math.min(GAME_WIDTH - player.width, player.x + dx))
      player.y = Math.max(0, Math.min(GAME_HEIGHT - player.height, player.y + dy))

      // Simple CPU AI - follow the ball but not too aggressively
      const cpu = cpuRef.current
      const ball = ballRef.current

      const cpuToBallX = ball.x - cpu.x
      const cpuToBallY = ball.y - cpu.y
      const cpuToBallDist = Math.sqrt(cpuToBallX * cpuToBallX + cpuToBallY * cpuToBallY)

      if (cpuToBallDist > 5) {
        // Make CPU slower and less aggressive
        const cpuSpeed = PLAYER_SPEED * 0.6 // Reduced from 0.75

        // Only move aggressively if ball is in CPU's half
        const aggressionFactor = ball.x > GAME_WIDTH / 2 ? 1 : 0.5

        const cpuDx = (cpuToBallX / cpuToBallDist) * cpuSpeed * aggressionFactor * speedMultiplier
        const cpuDy = (cpuToBallY / cpuToBallDist) * cpuSpeed * aggressionFactor * speedMultiplier

        // Keep CPU in bounds and on right side of field
        cpu.x = Math.max(GAME_WIDTH / 2 - 20, Math.min(GAME_WIDTH - cpu.width, cpu.x + cpuDx))
        cpu.y = Math.max(0, Math.min(GAME_HEIGHT - cpu.height, cpu.y + cpuDy))
      }

      // Update ball position with speed multiplier for consistent physics
      ball.x += ball.speedX * speedMultiplier
      ball.y += ball.speedY * speedMultiplier

      // Ball friction
      ball.speedX *= Math.pow(0.98, speedMultiplier)
      ball.speedY *= Math.pow(0.98, speedMultiplier)

      // Stop ball if it's moving very slowly
      if (Math.abs(ball.speedX) < 0.01) ball.speedX = 0
      if (Math.abs(ball.speedY) < 0.01) ball.speedY = 0

      // Ball collision with walls
      if (ball.y < 0 || ball.y + ball.height > GAME_HEIGHT) {
        ball.speedY = -ball.speedY * 0.8
        ball.y = ball.y < 0 ? 0 : GAME_HEIGHT - ball.height
      }

      // Check for goals - left goal (CPU scores)
      if (
        ball.x < GOAL_WIDTH &&
        ball.y > GAME_HEIGHT / 2 - GOAL_HEIGHT / 2 &&
        ball.y < GAME_HEIGHT / 2 + GOAL_HEIGHT / 2
      ) {
        playSound("goal")
        setScore((prev) => {
          const newScore = { ...prev, cpu: prev.cpu + 1 }
          console.log("CPU scored! New score:", newScore)
          return newScore
        })

        // Reset ball position
        ball.x = GAME_WIDTH / 2
        ball.y = GAME_HEIGHT / 2
        ball.speedX = 0
        ball.speedY = 0
      }

      // Check for goals - right goal (Player scores)
      if (
        ball.x + ball.width > GAME_WIDTH - GOAL_WIDTH &&
        ball.y > GAME_HEIGHT / 2 - GOAL_HEIGHT / 2 &&
        ball.y < GAME_HEIGHT / 2 + GOAL_HEIGHT / 2
      ) {
        playSound("goal")
        setScore((prev) => {
          const newScore = { ...prev, player: prev.player + 1 }
          console.log("Player scored! New score:", newScore)
          return newScore
        })

        // Reset ball position
        ball.x = GAME_WIDTH / 2
        ball.y = GAME_HEIGHT / 2
        ball.speedX = 0
        ball.speedY = 0
      }

      // Ball collision with walls (sides)
      if (
        (ball.x < 0 && (ball.y < GAME_HEIGHT / 2 - GOAL_HEIGHT / 2 || ball.y > GAME_HEIGHT / 2 + GOAL_HEIGHT / 2)) ||
        (ball.x + ball.width > GAME_WIDTH &&
          (ball.y < GAME_HEIGHT / 2 - GOAL_HEIGHT / 2 || ball.y > GAME_HEIGHT / 2 + GOAL_HEIGHT / 2))
      ) {
        ball.speedX = -ball.speedX * 0.8
        ball.x = ball.x < 0 ? 0 : GAME_WIDTH - ball.width
      }

      // Ball collision with player
      if (
        ball.x < player.x + player.width &&
        ball.x + ball.width > player.x &&
        ball.y < player.y + player.height &&
        ball.y + ball.height > player.y
      ) {
        playSound("kick")

        // Calculate direction from player to ball
        const dx = ball.x + ball.width / 2 - (player.x + player.width / 2)
        const dy = ball.y + ball.height / 2 - (player.y + player.height / 2)
        const dist = Math.sqrt(dx * dx + dy * dy) || 1

        // Set ball velocity based on collision
        ball.speedX = (dx / dist) * BALL_SPEED * 2
        ball.speedY = (dy / dist) * BALL_SPEED * 2

        // Move ball outside player
        if (dx > 0) {
          ball.x = player.x + player.width + 1
        } else {
          ball.x = player.x - ball.width - 1
        }
      }

      // Ball collision with CPU
      if (
        ball.x < cpu.x + cpu.width &&
        ball.x + ball.width > cpu.x &&
        ball.y < cpu.y + cpu.height &&
        ball.y + ball.height > cpu.y
      ) {
        playSound("kick")

        // Calculate direction from CPU to ball
        const dx = ball.x + ball.width / 2 - (cpu.x + cpu.width / 2)
        const dy = ball.y + ball.height / 2 - (cpu.y + cpu.height / 2)
        const dist = Math.sqrt(dx * dx + dy * dy) || 1

        // Set ball velocity based on collision
        ball.speedX = (dx / dist) * BALL_SPEED * 2
        ball.speedY = (dy / dist) * BALL_SPEED * 2

        // Move ball outside CPU
        if (dx > 0) {
          ball.x = cpu.x + cpu.width + 1
        } else {
          ball.x = cpu.x - ball.width - 1
        }
      }

      // Kick the ball - improved mechanics
      if (keysRef.current.Space || touchRef.current.action) {
        // Check if player is close to the ball
        const dx = ball.x + ball.width / 2 - (player.x + player.width / 2)
        const dy = ball.y + ball.height / 2 - (player.y + player.height / 2)
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 40) {
          // Increased kick range (was 30)
          playSound("kick")

          // Calculate kick direction
          let kickDx = dx / dist
          const kickDy = dy / dist

          // If player is on the left side, add a slight bias toward the right goal
          if (player.x < GAME_WIDTH / 2) {
            kickDx = (kickDx + 0.3) / 1.3 // Bias toward right
          }

          ball.speedX = kickDx * KICK_POWER
          ball.speedY = kickDy * KICK_POWER

          // Add a slight vertical randomness to make the ball movement more interesting
          ball.speedY += (Math.random() - 0.5) * 2
        }
      }

      // Draw player (blue with Brazilian yellow trim)
      ctx.fillStyle = "#3498db"
      ctx.fillRect(player.x, player.y, player.width, player.height)
      ctx.fillStyle = "#f1c40f" // Yellow trim
      ctx.fillRect(player.x, player.y + player.height - 4, player.width, 4)

      // Draw player face
      ctx.fillStyle = "#000000"
      ctx.fillRect(player.x + 2, player.y + 2, 4, 4) // Left eye
      ctx.fillRect(player.x + player.width - 6, player.y + 2, 4, 4) // Right eye

      // Draw CPU (red with white trim)
      ctx.fillStyle = "#e74c3c"
      ctx.fillRect(cpu.x, cpu.y, cpu.width, cpu.height)
      ctx.fillStyle = "#ffffff" // White trim
      ctx.fillRect(cpu.x, cpu.y + cpu.height - 4, cpu.width, 4)

      // Draw CPU face
      ctx.fillStyle = "#000000"
      ctx.fillRect(cpu.x + 2, cpu.y + 2, 4, 4) // Left eye
      ctx.fillRect(cpu.x + cpu.width - 6, cpu.y + 2, 4, 4) // Right eye

      // Draw ball (Brazilian colors)
      ctx.fillStyle = "#f1c40f" // Yellow
      ctx.beginPath()
      ctx.arc(ball.x + ball.width / 2, ball.y + ball.height / 2, ball.width / 2, 0, Math.PI * 2)
      ctx.fill()

      // Ball details - simplified on mobile
      if (!isMobile) {
        ctx.fillStyle = "#2ecc71" // Green
        ctx.beginPath()
        ctx.arc(ball.x + ball.width / 2, ball.y + ball.height / 2, ball.width / 4, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#3498db" // Blue
        ctx.beginPath()
        ctx.arc(ball.x + ball.width / 2, ball.y + ball.height / 2, ball.width / 8, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw improved scoreboard
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
      ctx.fillRect(0, 0, GAME_WIDTH, 24)

      // Player score area
      ctx.fillStyle = "#3498db" // Player color
      ctx.fillRect(GAME_WIDTH / 4 - 30, 0, 60, 24)
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "16px monospace"
      ctx.textAlign = "center"
      ctx.fillText(score.player.toString(), GAME_WIDTH / 4, 18)

      // CPU score area
      ctx.fillStyle = "#e74c3c" // CPU color
      ctx.fillRect((GAME_WIDTH * 3) / 4 - 30, 0, 60, 24)
      ctx.fillStyle = "#FFFFFF"
      ctx.textAlign = "center"
      ctx.fillText(score.cpu.toString(), (GAME_WIDTH * 3) / 4, 18)

      // VS text
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "12px monospace"
      ctx.fillText("VS", GAME_WIDTH / 2, 18)

      // Draw timer with more prominence
      const minutes = Math.floor(timeLeft / 60)
      const seconds = timeLeft % 60
      const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`

      // Timer background
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
      ctx.fillRect(GAME_WIDTH / 2 - 30, 30, 60, 24)
      ctx.strokeStyle = timeLeft <= 30 ? "#e74c3c" : "#FFFFFF" // Red when time is running out
      ctx.lineWidth = 2
      ctx.strokeRect(GAME_WIDTH / 2 - 30, 30, 60, 24)

      // Timer text
      ctx.fillStyle = timeLeft <= 30 ? "#e74c3c" : "#FFFFFF" // Red when time is running out
      ctx.font = "16px monospace"
      ctx.textAlign = "center"
      ctx.fillText(timeString, GAME_WIDTH / 2, 48)

      // Add a pulsing effect when time is running out
      if (timeLeft <= 10 && Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillStyle = "#e74c3c"
        ctx.globalAlpha = 0.3
        ctx.fillRect(GAME_WIDTH / 2 - 30, 30, 60, 24)
        ctx.globalAlpha = 1.0
      }

      // Continue the game loop
      requestRef.current = requestAnimationFrame(gameLoop)
    }

    // Start the game loop
    requestRef.current = requestAnimationFrame(gameLoop)

    // Clean up
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [gameStarted, gameOver, score, isMobile])

  // Modify the canvas return statement to include touch controls
  if (gameStarted && !gameOver) {
    return (
      <div className="game-container">
        <canvas
          ref={canvasRef}
          className="pixelated w-full h-full"
          style={{
            imageRendering: "pixelated",
            objectFit: "contain",
            backgroundColor: "black",
          }}
        />

        {/* Touch controls for mobile */}
        {showTouchControls && (
          <>
            <div
              ref={touchJoystickRef}
              className="touch-button"
              style={{
                position: "absolute",
                left: "15%",
                bottom: "15%",
                width: "70px",
                height: "70px",
                opacity: 0.7,
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8l0 8M8 12l8 0" />
              </svg>
            </div>

            <div
              ref={kickButtonRef}
              className="touch-button"
              style={{
                position: "absolute",
                right: "15%",
                bottom: "15%",
                width: "70px",
                height: "70px",
                opacity: 0.7,
              }}
            >
              <span className="text-lg">KICK</span>
            </div>
          </>
        )}

        {/* Orientation warning for landscape on small devices */}
        <div className="orientation-warning">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <path d="M12 18h.01" />
          </svg>
          <h2 className="text-xl font-bold mt-4">Please rotate your device</h2>
          <p className="mt-2">For the best gaming experience, please use portrait orientation</p>
        </div>
      </div>
    )
  }

  // Update the start screen to be more responsive
  if (!gameStarted && !gameOver) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-green-600 text-white overflow-hidden touch-control">
        {/* Animated grass background */}
        <div className="absolute inset-0 z-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-green-700"
              style={{
                width: "10px",
                height: "40px",
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 45}deg)`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>

        {/* Field lines */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="w-40 h-40 border-4 border-white rounded-full opacity-20" />
          <div className="absolute h-full w-1 bg-white opacity-20" />
        </div>

        <div className="relative z-10 flex flex-col items-center p-4">
          <h1 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-4 text-yellow-400 text-shadow-sm">
            Brazilian Street Soccer
          </h1>

          <div className="w-24 sm:w-32 h-24 sm:h-32 bg-yellow-400 rounded-full mb-4 sm:mb-6 flex items-center justify-center shadow-lg">
            <div className="w-16 sm:w-24 h-16 sm:h-24 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-10 sm:w-16 h-10 sm:h-16 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-base sm:text-xl">BR</span>
              </div>
            </div>
          </div>

          <p className="text-base sm:text-xl mb-2 sm:mb-4 animate-pulse font-bold">
            {isMobile ? "Tap to Start" : "Press SPACE or Click to Start"}
          </p>

          <div className="bg-black/40 p-2 sm:p-4 rounded-lg text-sm sm:text-base">
            <p className="mb-1 font-bold">Controls:</p>
            {isMobile ? (
              <p>Drag left side to move • Tap right side to kick</p>
            ) : (
              <>
                <p className="mb-1">WASD/Arrows: Move</p>
                <p>Space: Kick</p>
              </>
            )}
            <p className="mt-2 text-yellow-300">2 Minute Match</p>
          </div>
        </div>
      </div>
    )
  }

  // Update the game over screen to be more responsive
  if (gameOver) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-green-600 text-white overflow-hidden touch-control">
        {/* Animated confetti for winner */}
        {score.player > score.cpu && (
          <div className="absolute inset-0 z-0">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 10 + 5}px`,
                  backgroundColor: ["#f1c40f", "#3498db", "#2ecc71"][Math.floor(Math.random() * 3)],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.7 + 0.3,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  animation: `fall ${Math.random() * 3 + 2}s linear infinite`,
                }}
              />
            ))}
          </div>
        )}

        <h1 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-4 text-yellow-400">Game Over!</h1>

        <div className="bg-black/60 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6 shadow-lg max-w-xs sm:max-w-sm">
          <h2 className="text-lg sm:text-2xl mb-2 sm:mb-4 text-center">Final Score</h2>
          <div className="flex justify-center items-center gap-4 sm:gap-8">
            <div className="text-center">
              <div className="w-8 sm:w-12 h-8 sm:h-12 bg-blue-500 mx-auto mb-1 sm:mb-2 flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <p className="font-bold text-sm sm:text-base">Player</p>
              <p className="text-xl sm:text-3xl font-bold">{score.player}</p>
            </div>
            <span className="text-xl sm:text-3xl">-</span>
            <div className="text-center">
              <div className="w-8 sm:w-12 h-8 sm:h-12 bg-red-500 mx-auto mb-1 sm:mb-2 flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <p className="font-bold text-sm sm:text-base">CPU</p>
              <p className="text-xl sm:text-3xl font-bold">{score.cpu}</p>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">
              {score.player > score.cpu ? "You Win! 🏆" : score.player < score.cpu ? "CPU Wins!" : "Draw!"}
            </p>
            <p className="text-xs sm:text-sm opacity-80">
              {score.player > score.cpu
                ? "Congratulations! You are the champion!"
                : score.player < score.cpu
                  ? "Better luck next time!"
                  : "An even match!"}
            </p>
          </div>
        </div>

        <p className="text-base sm:text-xl mb-2 animate-pulse font-bold">
          {isMobile ? "Tap to Play Again" : "Press SPACE or Click to Play Again"}
        </p>
      </div>
    )
  }
}

