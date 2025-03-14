"use client"

import { useState, useEffect } from "react"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

function Square({
  value,
  onSquareClick,
  isWinningSquare,
  disabled,
}: {
  value: string | null
  onSquareClick: () => void
  isWinningSquare: boolean
  disabled: boolean
}) {
  return (
    <button
      className={`h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary/20 text-2xl sm:text-4xl font-bold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors touch-manipulation
        ${isWinningSquare ? "bg-primary/20" : "hover:bg-primary/10"}`}
      onClick={onSquareClick}
      disabled={disabled}
      aria-label={value ? `${value} is in this square` : "Empty square"}
    >
      {value}
    </button>
  )
}

function Board({
  squares,
  xIsNext,
  onPlay,
  aiThinking,
}: {
  squares: (string | null)[]
  xIsNext: boolean
  onPlay: (nextSquares: (string | null)[]) => void
  aiThinking: boolean
}) {
  const winner = calculateWinner(squares)
  const winningLine = winner ? winner.line : []
  const gameOver = winner || squares.every((square) => square !== null)

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
      <div className="text-xl font-medium flex items-center gap-2">
        {status}
        {aiThinking && <Loader2 className="animate-spin h-5 w-5" />}
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
              disabled={!xIsNext || gameOver || aiThinking}
            />
          ))}
      </div>
    </div>
  )
}

export default function TicTacToe() {
  const [history, setHistory] = useState<(string | null)[][]>([Array(9).fill(null)])
  const [currentMove, setCurrentMove] = useState(0)
  const [aiThinking, setAiThinking] = useState(false)
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

  async function getAINextMove(squares: (string | null)[]): Promise<number | null> {
    // Create a board representation for the AI
    const boardRepresentation = squares.map((square) => square || " ").join("")

    // Create a prompt for the AI
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

Choose the best move (return only the position number 0-8).
`

    // Get AI's response
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
    })

    // Parse the response to get a valid move
    const moveMatch = text.match(/\d+/)
    if (moveMatch) {
      const move = Number.parseInt(moveMatch[0], 10)
      // Validate the move
      if (move >= 0 && move < 9 && squares[move] === null) {
        return move
      }
    }

    // Fallback: find first empty square if AI response is invalid
    const firstEmptyIndex = squares.findIndex((square) => square === null)
    return firstEmptyIndex >= 0 ? firstEmptyIndex : null
  }

  function handlePlay(nextSquares: (string | null)[]) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares]
    setHistory(nextHistory)
    setCurrentMove(nextHistory.length - 1)
  }

  function jumpTo(move: number) {
    setCurrentMove(move)
  }

  function resetGame() {
    setHistory([Array(9).fill(null)])
    setCurrentMove(0)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-md p-3 sm:p-6 shadow-lg">
        <h1 className="mb-3 sm:mb-6 text-center text-xl sm:text-3xl font-bold">Tic Tac Toe vs AI</h1>

        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} aiThinking={aiThinking} />

        <div className="mt-4 sm:mt-6 flex justify-center">
          <Button onClick={resetGame} variant="outline" className="touch-manipulation">
            Restart Game
          </Button>
        </div>

        <div className="mt-4 sm:mt-6">
          <h2 className="mb-2 text-base sm:text-lg font-medium">Game History</h2>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {history.map((_, move) => (
              <Button
                key={move}
                variant={move === currentMove ? "default" : "outline"}
                size="sm"
                onClick={() => jumpTo(move)}
                className="text-xs sm:text-sm touch-manipulation"
              >
                {move === 0 ? "Start" : `Move #${move}`}
              </Button>
            ))}
          </div>
        </div>
      </Card>
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

  for (let i = 0; i