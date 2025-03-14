import DuckGame from "@/components/duck-game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-sky-400 to-sky-200">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-white drop-shadow-md">Duck Arcade</h1>
      <DuckGame />
    </main>
  )
}

