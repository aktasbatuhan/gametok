"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import Image from "next/image";

import FlappyBird from "@/components/games/FlappyBird";
import MemoryGame from "@/components/games/MemoryGame";
import Tetris from "@/components/games/Tetris";
import TicTacToe from "@/components/games/TicTacToe";
import SnowBored from "@/components/games/SnowBored";
import BrazilianSoccer from "@/components/games/BrazilianSoccer";
import GameSubmissionModal from "@/components/GameSubmissionModal";

const BUILT_IN_GAMES = [
  {
    id: "flappy-bird",
    title: "Flappy Bird",
    component: FlappyBird,
    description: "Tap to fly through pipes. How far can you go?",
    thumbnail: null, // We're showing the game directly, no need for thumbnails
    creatorUrl: "https://v0.dev/chat/community/flappy-bird-H6d9DNE50jO"
  },
  {
    id: "memory-game",
    title: "Memory Game",
    component: MemoryGame,
    description: "Match pairs of cards to test your memory skills!",
    thumbnail: null,
    creatorUrl: "https://v0.dev/chat/community/kids-memory-game-Tmi0y0iPzxv"
  },
  {
    id: "tetris",
    title: "Tetris",
    component: Tetris,
    description: "Arrange falling blocks to clear lines and score points.",
    thumbnail: null,
    creatorUrl: "https://v0.dev/chat/community/tetris-E7PZvkE1Rf1"
  },
  {
    id: "tic-tac-toe",
    title: "Tic Tac Toe vs AI",
    component: TicTacToe,
    description: "Challenge an AI opponent in classic Tic Tac Toe!",
    thumbnail: null,
    creatorUrl: "https://v0.dev/chat/community/tic-tac-toe-3DnWgkMaTgl"
  },
  {
    id: "snow-bored",
    title: "Snow Bored",
    component: SnowBored,
    description: "Snowboard down the slopes, avoiding obstacles!",
    thumbnail: null,
    creatorUrl: "https://v0.dev/chat/community/we-re-snow-back-P3zKfFoshCq"
  }
];

type GameType = {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  thumbnail: string | null;
  creatorUrl?: string;
  author?: string;
  authorUrl?: string;
  sourceUrl?: string;
};

export default function Home() {
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const gameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showAddGameForm, setShowAddGameForm] = useState(false);
  
  // State for showing the game submission modal
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  // Prevent keyboard navigation with arrow keys and space
  useEffect(() => {
    const preventKeyScroll = (e: KeyboardEvent) => {
      // Prevent all arrow keys and space from causing scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        // Only prevent if not inside an input element
        const target = e.target as HTMLElement;
        const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        
        if (!isInputElement) {
          // Always prevent default scrolling behavior
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', preventKeyScroll, { capture: true });
    return () => window.removeEventListener('keydown', preventKeyScroll, { capture: true });
  }, []);

  // Smooth controlled scrolling
  const scrollToGame = (index: number) => {
    if (gameRefs.current[index]) {
      setIsScrolling(true);
      gameRefs.current[index]?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      
      // Prevent additional scrolling during transition
      setTimeout(() => {
        setIsScrolling(false);
      }, 800); // Match this with your scroll transition duration
    }
  };

  // This handles the sharing functionality
  const shareToTwitter = (gameId: string, score: number) => {
    const game = BUILT_IN_GAMES.find((g) => g.id === gameId);
    if (!game) return;
    
    const text = `I just scored ${score} in ${game.title} on GameTok! Can you beat my score? #GameTok`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };
  
  // Prevent wheel events during scroll transitions
  useEffect(() => {
    const preventWheelDuringTransition = (e: WheelEvent) => {
      if (isScrolling) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('wheel', preventWheelDuringTransition, { passive: false });
    return () => window.removeEventListener('wheel', preventWheelDuringTransition);
  }, [isScrolling]);

  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* Header */}
      <header className="fixed top-0 w-full bg-black z-50 flex justify-between items-center px-4 py-3">
        <h1 className="text-2xl font-bold text-white">GameTok</h1>
        <nav className="flex gap-4 overflow-x-auto max-w-[80%] pb-2">
          {BUILT_IN_GAMES.map((game, index) => (
            <button
              key={game.id}
              className={`text-sm whitespace-nowrap ${
                activeGameIndex === index 
                  ? "text-white font-bold" 
                  : "text-gray-400"
              }`}
              onClick={() => scrollToGame(index)}
            >
              {game.title}
            </button>
          ))}
        </nav>
      </header>

      {/* Main feed */}
      <div className="w-full mt-16 pb-20 overflow-hidden">
        {BUILT_IN_GAMES.map((game, index) => (
          <GameFeedItem
            key={game.id}
            game={game}
            onShare={(score) => shareToTwitter(game.id, score)}
            ref={(el) => {
              gameRefs.current[index] = el;
              return undefined;
            }}
            onInView={() => {
              if (!isScrolling) {
                setActiveGameIndex(index);
              }
            }}
            isScrolling={isScrolling}
          />
        ))}
      </div>
      
      {/* Navigation dots */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-40">
        {BUILT_IN_GAMES.map((game, index) => (
          <button
            key={game.id}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeGameIndex === index 
                ? "bg-white scale-125" 
                : "bg-gray-500 hover:bg-gray-300"
            }`}
            onClick={() => scrollToGame(index)}
            aria-label={`Go to ${game.title}`}
          />
        ))}
      </div>
      
      {/* Submit game button */}
      <button
        onClick={() => setShowSubmissionModal(true)}
        className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
        aria-label="Submit your game"
      >
        <Plus size={20} />
        <span className="font-medium">Submit Game</span>
      </button>
      
      {/* Game submission modal */}
      <AnimatePresence>
        {showSubmissionModal && (
          <GameSubmissionModal 
            onClose={() => setShowSubmissionModal(false)} 
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// Game Feed Item Component
interface GameFeedItemProps {
  game: {
    id: string;
    title: string;
    description: string;
    component: React.ComponentType<any>;
    thumbnail: string | null;
    creatorUrl?: string;
    author?: string;
    authorUrl?: string;
    sourceUrl?: string;
  };
  onShare: (score: number) => void;
  onInView: () => void;
  isScrolling?: boolean;
}

const GameFeedItem = React.forwardRef<HTMLDivElement, GameFeedItemProps>(({ game, onShare, onInView, isScrolling = false }, ref) => {
  const [inViewRef, inView] = useInView({
    threshold: 0.7,
    triggerOnce: false
  });

  const [score, setScore] = useState(0);
  const GameComponent = game.component;
  
  // Import and use the mobile detection hook
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const [mobileMode, setMobileMode] = useState(isMobile);
  
  useEffect(() => {
    const handleResize = () => {
      setMobileMode(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Combine the refs
  const setRefs = useCallback(
    (element: HTMLDivElement | null) => {
      // For the inView hook
      inViewRef(element);
      // For the forwarded ref
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    },
    [inViewRef, ref]
  );

  // Update score and notify parent when in view
  useEffect(() => {
    if (inView) {
      onInView();
    }
  }, [inView, onInView]);

  return (
    <motion.div
      ref={setRefs}
      initial={{ opacity: 0.7 }}
      animate={{ 
        opacity: inView ? 1 : 0.7,
        scale: inView ? 1 : 0.98
      }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex flex-col items-center justify-center relative"
    >
      {/* Game container - different styling for mobile vs desktop */}
      <div className={`${mobileMode 
          ? "w-full h-screen bg-black" 
          : "max-w-md w-full aspect-[9/16] bg-black rounded-3xl overflow-hidden border-4 border-gray-800 shadow-2xl"
        } relative`}
      >
        {/* Game content */}
        <div className="h-full w-full">
          {inView && <GameComponent onScoreUpdate={setScore} />}
        </div>
        
        {/* Game info overlay */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent ${mobileMode ? 'z-20' : ''}`}>
          <div className="flex justify-between items-end">
            <div className="text-white">
              <h2 className="text-xl font-bold">{game.title}</h2>
              <p className="text-sm opacity-80">{game.description}</p>
              
              {/* Show attribution for v0.dev games */}
              {game.creatorUrl && !game.author && (
                <p className="text-xs opacity-70 mt-1">
                  <a 
                    href={game.creatorUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-300"
                  >
                    Created with v0.dev
                  </a>
                </p>
              )}
              
              {/* Show custom game author */}
              {game.author && (
                <p className="text-xs opacity-70 mt-1">
                  By: {game.authorUrl ? (
                    <a 
                      href={game.authorUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-300"
                    >
                      {game.author}
                    </a>
                  ) : (
                    game.author
                  )}
                </p>
              )}
              
              {/* Source code link for custom games */}
              {game.sourceUrl && (
                <p className="text-xs opacity-70 mt-1">
                  <a 
                    href={game.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-300"
                  >
                    View Source
                  </a>
                </p>
              )}
              
              <p className="mt-2 font-bold text-lg flex items-center gap-2">
                <span className="bg-white/20 px-2 py-1 rounded-md">Score: {score}</span>
              </p>
            </div>
            
            <div className="flex flex-col gap-4 items-center">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => onShare(score)}
                className="bg-black p-3 rounded-full shadow-lg"
                aria-label="Share to X (Twitter)"
              >
                <div className="relative w-6 h-6">
                  <Image 
                    src="/images/x-logo.png" 
                    alt="X logo" 
                    fill 
                    className="object-contain"
                  />
                </div>
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Notch at top of "phone" - only show on desktop */}
        {!mobileMode && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-2xl z-10"></div>
        )}
      </div>
      
      {/* Game loading indicator */}
      {!inView && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-white">Loading Game...</div>
        </div>
      )}
    </motion.div>
  );
});
