"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music } from 'lucide-react'

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-cyan-500' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-500' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500' },
}

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const INITIAL_DROP_TIME = 800
const SPEED_INCREASE_FACTOR = 0.95

const createEmptyBoard = () => Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0))

const randomTetromino = () => {
  const keys = Object.keys(TETROMINOS) as Array<keyof typeof TETROMINOS>
  const randKey = keys[Math.floor(Math.random() * keys.length)]
  return TETROMINOS[randKey]
}

interface TetrisProps {
  onScoreUpdate?: (score: number) => void;
}

export default function Tetris({ onScoreUpdate }: TetrisProps) {
  const [board, setBoard] = useState(createEmptyBoard())
  const [currentPiece, setCurrentPiece] = useState<any>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [dropTime, setDropTime] = useState(INITIAL_DROP_TIME)
  const [level, setLevel] = useState(1)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [completedRows, setCompletedRows] = useState<number[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const dropInterval = useRef<NodeJS.Timeout | null>(null)

  const checkCollision = (x: number, y: number, shape: number[][]) => {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] !== 0) {
          const newX = x + col
          const newY = y + row
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT || (newY >= 0 && board[newY][newX] !== 0)) {
            return true
          }
        }
      }
    }
    return false
  }

  const isValidMove = (x: number, y: number, shape: number[][]) => !checkCollision(x, y, shape)

  interface TetrominoState {
    x: number;
    y: number;
    tetromino: {
      shape: number[][];
      color: string;
    };
  }

  const moveLeft = useCallback(() => {
    if (currentPiece && isValidMove(currentPiece.x - 1, currentPiece.y, currentPiece.tetromino.shape)) {
      setCurrentPiece((prev: TetrominoState) => ({ ...prev, x: prev.x - 1 }))
    }
  }, [currentPiece, board])

  const moveRight = useCallback(() => {
    if (currentPiece && isValidMove(currentPiece.x + 1, currentPiece.y, currentPiece.tetromino.shape)) {
      setCurrentPiece((prev: TetrominoState) => ({ ...prev, x: prev.x + 1 }))
    }
  }, [currentPiece, board])

  const moveDown = useCallback(() => {
    if (!currentPiece) return
    if (isValidMove(currentPiece.x, currentPiece.y + 1, currentPiece.tetromino.shape)) {
      setCurrentPiece((prev: TetrominoState) => ({ ...prev, y: prev.y + 1 }))
    } else {
      placePiece()
    }
  }, [currentPiece, board])

  const rotate = useCallback(() => {
    if (!currentPiece) return
    const rotated = currentPiece.tetromino.shape[0].map((_: any, i: number) =>
      currentPiece.tetromino.shape.map((row: any) => row[i]).reverse()
    )
    let newX = currentPiece.x
    let newY = currentPiece.y

    // Try to rotate, if not possible, try to adjust position
    if (!isValidMove(newX, newY, rotated)) {
      // Try to move left
      if (isValidMove(newX - 1, newY, rotated)) {
        newX -= 1
      }
      // Try to move right
      else if (isValidMove(newX + 1, newY, rotated)) {
        newX += 1
      }
      // Try to move up
      else if (isValidMove(newX, newY - 1, rotated)) {
        newY -= 1
      }
      // If still not possible, don't rotate
      else {
        return
      }
    }

    setCurrentPiece((prev: TetrominoState) => ({
      ...prev,
      x: newX,
      y: newY,
      tetromino: { ...prev.tetromino, shape: rotated }
    }))

    // Continue falling after rotation
    if (isValidMove(newX, newY + 1, rotated) && newY + 1 < BOARD_HEIGHT) {
      setCurrentPiece((prev: TetrominoState) => ({ ...prev, y: prev.y + 1 }))
    }
  }, [currentPiece, board])

  const placePiece = useCallback(() => {
    if (!currentPiece) return
    const newBoard = board.map(row => [...row])
    currentPiece.tetromino.shape.forEach((row: number[], y: number) => {
      row.forEach((value: number, x: number) => {
        if (value !== 0) {
          const boardY = y + currentPiece.y
          const boardX = x + currentPiece.x
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = currentPiece.tetromino.color
          }
        }
      })
    })
    setBoard(newBoard)
    clearLines(newBoard)
    spawnNewPiece()
  }, [currentPiece, board])

  type BoardCell = string | 0;

  const clearLines = useCallback((newBoard: BoardCell[][]) => {
    let linesCleared: number[] = []
    const updatedBoard = newBoard.filter((row, index) => {
      if (row.every(cell => cell !== 0)) {
        linesCleared.push(index)
        return false
      }
      return true
    })
    
    if (linesCleared.length > 0) {
      setCompletedRows(linesCleared)
      setTimeout(() => {
        while (updatedBoard.length < BOARD_HEIGHT) {
          updatedBoard.unshift(Array(BOARD_WIDTH).fill(0))
        }
        setBoard(updatedBoard)
        setCompletedRows([])
        
        const newScore = score + linesCleared.length * 100
        setScore(newScore)
        
        if (Math.floor(newScore / 500) > level - 1) {
          setLevel(prev => prev + 1)
          setDropTime(prev => prev * SPEED_INCREASE_FACTOR)
        }
      }, 500)
    }
  }, [score, level])

  const spawnNewPiece = useCallback(() => {
    const newPiece = {
      x: Math.floor(BOARD_WIDTH / 2) - 1,
      y: 0,
      tetromino: randomTetromino()
    }
    if (checkCollision(newPiece.x, newPiece.y, newPiece.tetromino.shape)) {
      setGameOver(true)
    } else {
      setCurrentPiece(newPiece)
    }
  }, [board])

  // Report score to parent component
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score);
    }
  }, [score, onScoreUpdate]);

  useEffect(() => {
    if (!currentPiece && !gameOver) {
      spawnNewPiece()
    }
  }, [currentPiece, gameOver, spawnNewPiece])

  useEffect(() => {
    if (!gameOver) {
      dropInterval.current = setInterval(moveDown, dropTime)
    }
    return () => {
      if (dropInterval.current) clearInterval(dropInterval.current)
    }
  }, [moveDown, gameOver, dropTime])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return
      switch (e.key) {
        case 'ArrowLeft':
          moveLeft()
          break
        case 'ArrowRight':
          moveRight()
          break
        case 'ArrowDown':
          moveDown()
          break
        case 'ArrowUp':
          rotate()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [moveLeft, moveRight, moveDown, rotate, gameOver])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5
      audioRef.current.loop = true
      if (!gameOver && isMusicPlaying) {
        audioRef.current.play().catch(error => console.error("Audio playback failed:", error))
      } else {
        audioRef.current.pause()
      }
    }
  }, [gameOver, isMusicPlaying])

  const resetGame = () => {
    setBoard(createEmptyBoard())
    setCurrentPiece(null)
    setScore(0)
    setGameOver(false)
    setDropTime(INITIAL_DROP_TIME)
    setLevel(1)
    setCompletedRows([])
    if (dropInterval.current) clearInterval(dropInterval.current)
  }

  const renderCell = (x: number, y: number) => {
    if (
      currentPiece &&
      y >= currentPiece.y &&
      y < currentPiece.y + currentPiece.tetromino.shape.length &&
      x >= currentPiece.x &&
      x < currentPiece.x + currentPiece.tetromino.shape[0].length &&
      currentPiece.tetromino.shape[y - currentPiece.y][x - currentPiece.x] === 1
    ) {
      return currentPiece.tetromino.color
    }
    return board[y][x]
  }

  const toggleMusic = () => {
    setIsMusicPlaying(!isMusicPlaying)
  }

  // Touch controls for mobile
  const handleTouchStart = (direction: string) => {
    switch (direction) {
      case 'left':
        moveLeft();
        break;
      case 'right':
        moveRight();
        break;
      case 'down':
        moveDown();
        break;
      case 'rotate':
        rotate();
        break;
      default:
        break;
    }
  }

  return (
    <div className="flex flex-col items-center justify-between h-full w-full bg-gray-900 p-4">
      <div className="flex justify-between w-full items-center">
        <div>
          <div className="text-xl font-bold text-white">Score: {score}</div>
          <div className="text-sm text-gray-300">Level: {level}</div>
        </div>
        <button 
          onClick={toggleMusic}
          className={`p-2 rounded-full ${isMusicPlaying ? 'bg-purple-600' : 'bg-gray-700'}`}
        >
          <Music className="w-4 h-4 text-white" />
        </button>
      </div>
      
      <div 
        className="grid bg-gray-800 border border-gray-700 overflow-hidden my-2" 
        style={{ 
          gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
          aspectRatio: `${BOARD_WIDTH}/${BOARD_HEIGHT}`,
          width: '100%'
        }}
      >
        {board.map((row, y) => 
          row.map((_, x) => (
            <AnimatePresence key={`${y}-${x}`}>
              <motion.div 
                initial={false}
                animate={{
                  opacity: completedRows.includes(y) ? 0 : 1,
                  scale: completedRows.includes(y) ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
                className={`${renderCell(x, y) || 'bg-gray-900'} border border-gray-800`}
              />
            </AnimatePresence>
          ))
        )}
      </div>
      
      {gameOver && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <h2 className="text-xl font-bold text-white mb-2">Game Over!</h2>
            <p className="text-gray-300 mb-4">Your score: {score}</p>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
      
      {/* Mobile controls */}
      <div className="grid grid-cols-3 gap-2 w-full mt-2">
        <button 
          className="bg-gray-700 rounded-full p-2 text-white text-sm"
          onTouchStart={() => handleTouchStart('left')}
        >
          ←
        </button>
        <button 
          className="bg-gray-700 rounded-full p-2 text-white text-sm"
          onTouchStart={() => handleTouchStart('rotate')}
        >
          Rotate
        </button>
        <button 
          className="bg-gray-700 rounded-full p-2 text-white text-sm"
          onTouchStart={() => handleTouchStart('right')}
        >
          →
        </button>
        <div className="col-span-3">
          <button 
            className="bg-gray-700 rounded-full p-2 text-white text-sm w-full"
            onTouchStart={() => handleTouchStart('down')}
          >
            ↓
          </button>
        </div>
      </div>
      
      {!gameOver && (
        <button 
          onClick={resetGame}
          className="mt-2 px-4 py-1 bg-red-600 text-white text-xs rounded-full"
        >
          Reset
        </button>
      )}
      
      <audio ref={audioRef} src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Tetris-kxnh5j7hpNEcFspAndlU2huV5n6dvk.mp3" />
    </div>
  )
}