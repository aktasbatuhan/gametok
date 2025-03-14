'use client'

import { useEffect, useRef, useState } from 'react'

// Game constants
const GAME_CONSTANTS = {
  CANVAS_WIDTH: 320,
  CANVAS_HEIGHT: 400,
  SLOPE_ANGLE: 15,
  MOVEMENT_SPEED: 0.8, // Reduced speed from 1.5
  TREE_GENERATION_INTERVAL: 180, // Increased interval from 120
  GRAVITY: 0.15, // Reduced gravity from 0.2
  PLAYER_WIDTH: 32,
  PLAYER_HEIGHT: 32,
  OBSTACLE_WIDTH: 32,
  OBSTACLE_HEIGHT: 48
}

const COLORS = {
  sky: '#ffffff',
  snow: '#ffffff',
  skiTrail: '#e6f2ff'
}

const IMAGES = {
  PLAYER: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/snowboarder-d8ooGdTTeqCc73t5hfW0TPLcqBEcmx.png",
  TREES: [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tree_0-IiABkoy1TJgd2IK76dMoZKcBoSM3OV.png",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tree_1-PQuEzy4tGxrfIvvsOKN1x30qB7LxAZ.png",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tree_2-3emosJCVNsMc6SFLYBDexLwAjvMMcc.png",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tree_3-tCJCvnL001vtrqLkK4TxBhvwDljBAz.png"
  ],
  SNOWMEN: [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snowman_0-TCuDVs2e6275EeFLJgVZT2gG6xR8eW.png",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snowman_1-1XU0CXxXygx3Tf6eGfSJhMcrv96ElE.png",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snowman_2-5TfN4Fu4Jr2F9t91GlSdbqPFfPvupL.png",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snowman_3-Lj63E3FyGim1kfm3G50zhSwi6zylMe.png",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snowman_4-V6HRnct6cFbhVyfOx74b7CwzyGJ3la.png",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snowman_5-m2NUZb2dgzRCPibAWx09MzpzNxYmLB.png"
  ]
}

const FONTS = {
  PIXEL: "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
}

interface Obstacle {
  x: number
  y: number
  sprite: HTMLImageElement
}

interface Player {
  x: number
  y: number
  velocityY: number
  isMovingUp: boolean
  sprite: HTMLImageElement | null
}

interface TrailPoint {
  x: number
  y: number
}

interface SnowBoredProps {
  onScoreUpdate?: (score: number) => void;
}

export default function SnowBored({ onScoreUpdate }: SnowBoredProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPlayButtonVisible, setIsPlayButtonVisible] = useState(true)
  
  const gameStateRef = useRef({
    player: {
      x: 100,
      y: GAME_CONSTANTS.CANVAS_HEIGHT / 2,
      velocityY: 0,
      isMovingUp: false,
      sprite: null as HTMLImageElement | null
    },
    obstacles: [] as Obstacle[],
    trailPoints: [] as TrailPoint[],
    frameCount: 0,
    startTime: Date.now(),
    gameSpeedMultiplier: 1,
    obstacleGenerationInterval: GAME_CONSTANTS.TREE_GENERATION_INTERVAL,
    lastSpeedIncreaseTime: 0,
    score: 0,
    isGameOver: false
  })

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !gameStateRef.current.isGameOver) {
      e.preventDefault(); // Prevent page scrolling
      gameStateRef.current.player.isMovingUp = true;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !gameStateRef.current.isGameOver) {
      e.preventDefault(); // Prevent page scrolling
      gameStateRef.current.player.isMovingUp = false;
    }
  };

  const handleTouchStart = () => {
    if (!gameStateRef.current.isGameOver) {
      gameStateRef.current.player.isMovingUp = true;
    }
  };

  const handleTouchEnd = () => {
    if (!gameStateRef.current.isGameOver) {
      gameStateRef.current.player.isMovingUp = false;
    }
  };

  // Report score to parent component
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score);
    }
  }, [score, onScoreUpdate]);

  // Auto-start the game when component mounts
  useEffect(() => {
    // Delay auto-start slightly to ensure smooth loading
    const timer = setTimeout(() => {
      if (isPlayButtonVisible) {
        startGame();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (isPlayButtonVisible) return;

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const fontLink = document.createElement('link')
    fontLink.href = FONTS.PIXEL
    fontLink.rel = 'stylesheet'
    document.head.appendChild(fontLink)

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = src
        img.onload = () => resolve(img)
        img.onerror = reject
      })
    }

    const loadObstacleSprites = async () => {
      const treeSprites = await Promise.all(IMAGES.TREES.map(loadImage))
      const snowmanSprites = await Promise.all(IMAGES.SNOWMEN.map(loadImage))
      return { treeSprites, snowmanSprites }
    }

    const initGame = async () => {
      const playerSprite = await loadImage(IMAGES.PLAYER)
      const { treeSprites, snowmanSprites } = await loadObstacleSprites()

      gameStateRef.current.player.sprite = playerSprite

      const getRandomObstacleSprite = () => {
        const useTree = Math.random() > 0.3
        const sprites = useTree ? treeSprites : snowmanSprites
        return sprites[Math.floor(Math.random() * sprites.length)]
      }

      for (let i = 0; i < 6; i++) {
        gameStateRef.current.obstacles.push({
          x: Math.random() * GAME_CONSTANTS.CANVAS_WIDTH,
          y: Math.random() * (GAME_CONSTANTS.CANVAS_HEIGHT - 100) + 50,
          sprite: getRandomObstacleSprite()
        })
      }

      const drawBackground = () => {
        ctx.fillStyle = COLORS.sky
        ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT)
      }

      const drawPlayer = () => {
        const { player } = gameStateRef.current
        if (player.sprite) {
          ctx.save()
          ctx.translate(player.x, player.y)
          
          if (gameStateRef.current.isGameOver) {
            ctx.rotate(-Math.PI / 2)
          }
          
          ctx.drawImage(
            player.sprite,
            -GAME_CONSTANTS.PLAYER_WIDTH / 2,
            -GAME_CONSTANTS.PLAYER_HEIGHT / 2,
            GAME_CONSTANTS.PLAYER_WIDTH,
            GAME_CONSTANTS.PLAYER_HEIGHT
          )
          ctx.restore()
        }
      }

      const drawObstacles = () => {
        gameStateRef.current.obstacles.forEach(obstacle => {
          ctx.drawImage(
            obstacle.sprite,
            obstacle.x - GAME_CONSTANTS.OBSTACLE_WIDTH / 2,
            obstacle.y - GAME_CONSTANTS.OBSTACLE_HEIGHT,
            GAME_CONSTANTS.OBSTACLE_WIDTH,
            GAME_CONSTANTS.OBSTACLE_HEIGHT
          )
        })
      }

      const drawSkiTrail = () => {
        ctx.strokeStyle = COLORS.skiTrail
        ctx.lineWidth = 2
        ctx.beginPath()
        gameStateRef.current.trailPoints.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.lineTo(point.x, point.y)
          }
        })
        ctx.stroke()
      }

      const drawUI = () => {
        ctx.fillStyle = '#000000'
        ctx.font = '16px "Press Start 2P", monospace'
        
        const scoreText = `Score: ${gameStateRef.current.score}`
        const scoreWidth = ctx.measureText(scoreText).width
        ctx.fillText(scoreText, GAME_CONSTANTS.CANVAS_WIDTH - scoreWidth - 20, 30)
        
        const currentTime = gameStateRef.current.isGameOver 
          ? gameTime 
          : Math.floor((Date.now() - gameStateRef.current.startTime) / 1000)
        const timeString = new Date(currentTime * 1000).toISOString().substr(14, 5)
        ctx.fillText(timeString, 20, 30)
      }

      const checkCollision = () => {
        const { player, obstacles } = gameStateRef.current
        for (let obstacle of obstacles) {
          const dx = Math.abs(player.x - obstacle.x)
          const dy = Math.abs(player.y - obstacle.y)
          if (dx < GAME_CONSTANTS.PLAYER_WIDTH / 2 && dy < GAME_CONSTANTS.PLAYER_HEIGHT / 2) {
            return true
          }
        }
        return false
      }

      const updateGame = () => {
        if (gameStateRef.current.isGameOver) return

        const { player, obstacles, trailPoints } = gameStateRef.current
        const currentTime = Date.now()
        
        if (currentTime - gameStateRef.current.lastSpeedIncreaseTime >= 4000) { // Increased from 2500 ms
          gameStateRef.current.gameSpeedMultiplier += 0.03 // Reduced from 0.05
          gameStateRef.current.obstacleGenerationInterval = Math.max(
            40, // Increased minimum interval from 30
            gameStateRef.current.obstacleGenerationInterval - 2 // Reduced decrease rate from 5
          )
          gameStateRef.current.lastSpeedIncreaseTime = currentTime
        }

        if (player.isMovingUp) {
          player.velocityY = Math.max(player.velocityY - 0.2, -GAME_CONSTANTS.MOVEMENT_SPEED)
        } else {
          player.velocityY = Math.min(player.velocityY + GAME_CONSTANTS.GRAVITY, GAME_CONSTANTS.MOVEMENT_SPEED)
        }

        player.y += player.velocityY

        if (player.y < 50) player.y = 50
        if (player.y > GAME_CONSTANTS.CANVAS_HEIGHT - 70) player.y = GAME_CONSTANTS.CANVAS_HEIGHT - 70

        trailPoints.unshift({ x: player.x, y: player.y + 10 })
        if (trailPoints.length > 50) {
          trailPoints.pop()
        }

        gameStateRef.current.obstacles = obstacles.map(obstacle => ({
          ...obstacle,
          x: obstacle.x - GAME_CONSTANTS.MOVEMENT_SPEED * gameStateRef.current.gameSpeedMultiplier
        })).filter(obstacle => obstacle.x > -50)

        gameStateRef.current.trailPoints = trailPoints.map(point => ({
          ...point,
          x: point.x - GAME_CONSTANTS.MOVEMENT_SPEED * gameStateRef.current.gameSpeedMultiplier
        })).filter(point => point.x > 0)

        if (gameStateRef.current.frameCount % gameStateRef.current.obstacleGenerationInterval === 0) {
          gameStateRef.current.obstacles.push({
            x: GAME_CONSTANTS.CANVAS_WIDTH + 50,
            y: Math.random() * (GAME_CONSTANTS.CANVAS_HEIGHT - 100) + 50,
            sprite: getRandomObstacleSprite()
          })
        }

        if (checkCollision()) {
          gameStateRef.current.isGameOver = true
          setGameOver(true)
          setGameTime(Math.floor((Date.now() - gameStateRef.current.startTime) / 1000))
          return
        }

        if (gameStateRef.current.frameCount % 60 === 0) {
          gameStateRef.current.score += 10
          setScore(gameStateRef.current.score)
        }

        gameStateRef.current.frameCount++
      }

      const gameLoop = () => {
        ctx.clearRect(0, 0, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT)
        
        drawBackground()
        drawSkiTrail()
        drawObstacles()
        drawPlayer()
        drawUI()
        
        if (!gameStateRef.current.isGameOver) {
          updateGame()
        }
        
        requestAnimationFrame(gameLoop)
      }

      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
      canvas.addEventListener('touchstart', handleTouchStart)
      canvas.addEventListener('touchend', handleTouchEnd)

      gameLoop()
    }

    initGame()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart)
        canvas.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [gameOver, gameTime, isPlayButtonVisible])

  const startGame = () => {
    setIsPlayButtonVisible(false);
    gameStateRef.current = {
      player: {
        x: 100,
        y: GAME_CONSTANTS.CANVAS_HEIGHT / 2,
        velocityY: 0,
        isMovingUp: false,
        sprite: null as HTMLImageElement | null
      },
      obstacles: [] as Obstacle[],
      trailPoints: [] as TrailPoint[],
      frameCount: 0,
      startTime: Date.now(),
      gameSpeedMultiplier: 1,
      obstacleGenerationInterval: GAME_CONSTANTS.TREE_GENERATION_INTERVAL,
      lastSpeedIncreaseTime: 0,
      score: 0,
      isGameOver: false
    };
    setGameOver(false);
    setScore(0);
  };

  return (
    <div 
      className="flex flex-col items-center justify-center h-full w-full"
      style={{
        backgroundImage: 'url("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ice-RFivzrFYklghXcbtYkoYiMiESh5rh5.png")',
        backgroundRepeat: 'repeat',
        backgroundSize: 'cover'
      }}
    >
      <h1 className={`text-xl font-bold mb-2 ${gameOver ? 'text-red-500' : 'text-white'}`} style={{ fontFamily: '"Press Start 2P", cursive' }}>
        {gameOver ? "It's Snow Over" : "We're Snow Board!"}
      </h1>
      <div className="relative flex-1 w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={GAME_CONSTANTS.CANVAS_WIDTH}
          height={GAME_CONSTANTS.CANVAS_HEIGHT}
          className="border-4 border-gray-700 rounded-lg max-h-full w-auto"
        />
        {isPlayButtonVisible && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75">
            <div className="text-white text-center">
              <button
                onClick={startGame}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-pixel"
              >
                Play Game
              </button>
            </div>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75">
            <div className="text-white text-center">
              <p className="mb-4 text-xl">Score: {score}</p>
              <button
                onClick={startGame}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-pixel"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="text-white mt-2 text-sm">Press and hold SPACE to move up</p>
    </div>
  )
}