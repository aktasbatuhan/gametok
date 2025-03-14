"use client"

import { useState, useEffect } from "react"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

interface SquareProps {
  value: string | null
  onSquareClick: () => void
  isWinningSquare: boolean
  disabled: boolean
}

function Square({ value, onSquareClick, isWinningSquare, disabled }: SquareProps) {
  return (
    <button
      className={`h-16 w-16 border-2 border-primary/20 text-3xl font-bold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors
        ${isWinningSquare ? "bg-primary/20" : "hover:bg-primary/10"}`}
      onClick={onSquareClick}
      disabled={disabled}
      aria-label={value ? `${value} is in this square` : "Empty square"}
    >
      {value}
    </button>
  )
}

interface BoardProps {
  squares: (string | null)[]
  xIsNext: boolean
  onPlay: (nextSquares: (string | null)[]) => void
  aiThinking: boolean
}

function Board({ squares, xIsNext, onPlay, aiThinking }: BoardProps) {
  const winner = calculateWinner(squares)
  const winningLine = winner ? winner.line : []
  const isGameOver = winner !== null || squares.every((square) => square !== null)

  function handleClick(i: number) {
    if (squares[i] || calculateWinner(squares) || !xIsNext) {
      return
    }

    const nextSquares = squares.slice()
    nextSquares[i] = "X"
    onPlay(nextSquares)
  }

  let status
  if (winner) {
    status = `Winner: ${winner.player}`
  } else if (squares.every((square) => square !== null)) {
    status = "Draw! Game over"
  } else {
    status = `Next player: ${xIsNext ? "X (You)" : "O (AI)"}`
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-base font-medium flex items-center gap-2 text-white">
        {status}
        {aiThinking && (
          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {Array(9)
          .fill(null)
          .map((_, i) => (
            <Square
              key={i}
              value={squares[i]}
              onSquareClick={() => handleClick(i)}
              isWinningSquare={winningLine.includes(i)}
              disabled={!xIsNext || isGameOver || aiThinking}
            />
          ))}
      </div>
    </div>
  )
}

interface TicTacToeProps {
  onScoreUpdate?: (score: number) => void;
}

export default function TicTacToe({ onScoreUpdate }: TicTacToeProps) {
  const [history, setHistory] = useState<(string | null)[][]>([Array(9).fill(null)])
  const [currentMove, setCurrentMove] = useState(0)
  const [aiThinking, setAiThinking] = useState(false)
  const [score, setScore] = useState(0)
  const xIsNext = currentMove % 2 === 0
  const currentSquares = history[currentMove]

  // Get AI move when it's the AI's turn
  useEffect(() => {
    const getAiMove = async () => {
      // If it's not AI's turn, or game is over, do nothing
      if (xIsNext || calculateWinner(currentSquares) || currentSquares.every((square) => square !== null)) {
        return
      }

      setAiThinking(true)
      try {
        const nextMove = await getAINextMove(currentSquares)
        if (nextMove !== null) {
          const nextSquares = currentSquares.slice()
          nextSquares[nextMove] = "O"

          const nextHistory = [...history.slice(0, currentMove + 1), nextSquares]
          setHistory(nextHistory)
          setCurrentMove(nextHistory.length - 1)
        }
      } catch (error) {
        console.error("Error getting AI move:", error)
      } finally {
        setAiThinking(false)
      }
    }

    getAiMove()
  }, [xIsNext, currentSquares, history, currentMove])

  // Update score
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score)
    }
  }, [score, onScoreUpdate])

  // Calculate score based on game state
  useEffect(() => {
    const winner = calculateWinner(currentSquares)
    if (winner) {
      if (winner.player === 'X') {
        setScore(prev => prev + 10) // Player wins
      }
    } else if (currentSquares.every(square => square !== null)) {
      setScore(prev => prev + 5) // Draw
    }
  }, [currentSquares])

  async function getAINextMove(squares: (string | null)[]): Promise<number | null> {
    // If we can win, do it
    const winningMove = findWinningMove(squares, 'O');
    if (winningMove !== null) {
      return winningMove;
    }
    
    // If player can win, block them
    const blockingMove = findWinningMove(squares, 'X');
    if (blockingMove !== null) {
      return blockingMove;
    }
    
    try {
      // Create a board representation for the AI
      const boardRepresentation = squares.map((square) => square || " ").join("")
  
      // Create a prompt for the AI with some randomness encouragement
      const prompt = `
  You are playing Tic Tac Toe as O against a human player who is X.
  Current board state (0-indexed, left to right, top to bottom):
  ${boardRepresentation.slice(0, 3)}
  ${boardRepresentation.slice(3, 6)}
  ${boardRepresentation.slice(6, 9)}
  
  Available positions: ${squares
        .map((square, index) => (square === null ? index : null))
        .filter((pos) => pos !== null)
        .join(", ")}
  
  Choose a good move. Be a bit unpredictable and creative rather than always picking the most obvious move.
  (return only the position number 0-8)
  `
  
      // Get AI's response (but add a timeout to avoid hanging)
      const timeoutPromise = new Promise<{text: string}>((_, reject) => 
        setTimeout(() => reject(new Error('AI response timeout')), 2000)
      );
      
      const { text } = await Promise.race([
        generateText({
          model: openai("gpt-4o"),
          prompt,
        }),
        timeoutPromise
      ]);
  
      // Parse the response to get a valid move
      const moveMatch = text.match(/\d+/);
      if (moveMatch) {
        const move = Number.parseInt(moveMatch[0], 10);
        // Validate the move
        if (move >= 0 && move < 9 && squares[move] === null) {
          return move;
        }
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      // Continue to fallback strategies
    }
  
    // Strategic fallbacks if API fails
    
    // Try center square if available
    if (squares[4] === null) {
      return 4;
    }
    
    // Try corners
    const corners = [0, 2, 6, 8].filter(i => squares[i] === null);
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }
    
    // Try edges
    const edges = [1, 3, 5, 7].filter(i => squares[i] === null);
    if (edges.length > 0) {
      return edges[Math.floor(Math.random() * edges.length)];
    }
    
    // Last resort: find first empty square
    const firstEmptyIndex = squares.findIndex((square) => square === null);
    return firstEmptyIndex >= 0 ? firstEmptyIndex : null;
  }
  
  // Helper function to find a winning move for the given player
  function findWinningMove(squares: (string | null)[], player: string): number | null {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    for (const [a, b, c] of lines) {
      // Check if we can win by placing in position a
      if (squares[a] === null && squares[b] === player && squares[c] === player) {
        return a;
      }
      // Check if we can win by placing in position b
      if (squares[a] === player && squares[b] === null && squares[c] === player) {
        return b;
      }
      // Check if we can win by placing in position c
      if (squares[a] === player && squares[b] === player && squares[c] === null) {
        return c;
      }
    }
    
    return null;
  }

  function handlePlay(nextSquares: (string | null)[]) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares]
    setHistory(nextHistory)
    setCurrentMove(nextHistory.length - 1)
  }

  function resetGame() {
    setHistory([Array(9).fill(null)])
    setCurrentMove(0)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 p-4">
      <h1 className="mb-4 text-center text-2xl font-bold text-white">Tic Tac Toe vs AI</h1>

      <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} aiThinking={aiThinking} />

      <div className="mt-4 flex justify-center">
        <button 
          onClick={resetGame} 
          className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          Restart Game
        </button>
      </div>
    </div>
  )
}

function calculateWinner(squares: (string | null)[]) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { player: squares[a], line: lines[i] }
    }
  }

  return null
}