'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface GameSubmissionModalProps {
  onClose: () => void
}

export default function GameSubmissionModal({ onClose }: GameSubmissionModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [gameTitle, setGameTitle] = useState('')
  const [gameDescription, setGameDescription] = useState('')
  const [gameRepoUrl, setGameRepoUrl] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          gameTitle, 
          gameDescription, 
          gameRepoUrl 
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSubmitted(true)
      } else {
        setError(data.message || 'Failed to submit game. Please try again.')
      }
    } catch (err) {
      console.error('Error submitting game:', err)
      setError('An unexpected error occurred. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-800 rounded-lg max-w-md w-full p-6"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {submitted ? 'Thank You!' : 'Request to Add Your Game'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Request Submitted!</h3>
            <p className="text-gray-300 mb-6">
              We've received your game submission request. We'll review it and get back to you soon!
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Your Email *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="gameTitle" className="block text-sm font-medium text-gray-300 mb-1">
                Game Title *
              </label>
              <input
                type="text"
                id="gameTitle"
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="gameDescription" className="block text-sm font-medium text-gray-300 mb-1">
                Game Description *
              </label>
              <textarea
                id="gameDescription"
                value={gameDescription}
                onChange={(e) => setGameDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>
            
            <div>
              <label htmlFor="gameRepoUrl" className="block text-sm font-medium text-gray-300 mb-1">
                Game Repository URL *
              </label>
              <input
                type="url"
                id="gameRepoUrl"
                placeholder="https://github.com/username/game-repo"
                value={gameRepoUrl}
                onChange={(e) => setGameRepoUrl(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Link to your game code repository (GitHub, GitLab, etc.)
              </p>
            </div>

            <div className="mt-2 text-xs text-gray-400">
              <p>
                Please provide details about your game. If we like your idea, we'll contact you to discuss integration.
              </p>
            </div>

            {error && (
              <div className="bg-red-600/20 border border-red-500 p-3 rounded-md text-red-100 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 relative"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="opacity-0">Submit Request</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}