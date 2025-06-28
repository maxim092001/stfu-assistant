'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Copy, Volume2, ThumbsUp, ThumbsDown } from 'lucide-react'

interface AgentResponseDisplayProps {
  response: string
  isConnected: boolean
}

interface ResponseEntry {
  id: string
  text: string
  timestamp: Date
  rating?: 'up' | 'down' | null
}

export default function AgentResponseDisplay({ response, isConnected }: AgentResponseDisplayProps) {
  const [responseHistory, setResponseHistory] = useState<ResponseEntry[]>([])
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)
  const [typingText, setTypingText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Add new response to history with typing animation
  useEffect(() => {
    if (response.trim()) {
      const newEntry: ResponseEntry = {
        id: `response-${Date.now()}`,
        text: response,
        timestamp: new Date(),
        rating: null
      }
      
      setResponseHistory(prev => {
        // Avoid duplicates
        if (prev.length > 0 && prev[prev.length - 1].text === response) {
          return prev
        }
        return [...prev, newEntry]
      })

      // Trigger typing animation for new response
      setIsTyping(true)
      setTypingText('')
      typewriterEffect(response)
    }
  }, [response])

  // Typewriter effect for responses
  const typewriterEffect = (text: string) => {
    let index = 0
    const typeSpeed = 50 // milliseconds per character

    const type = () => {
      if (index < text.length) {
        setTypingText(text.slice(0, index + 1))
        index++
        typingTimeoutRef.current = setTimeout(type, typeSpeed)
      } else {
        setIsTyping(false)
      }
    }

    type()
  }

  // Auto-scroll to bottom when new response arrives
  useEffect(() => {
    if (scrollContainerRef.current && isScrolledToBottom) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [responseHistory, isScrolledToBottom])

  // Handle scroll to detect if user has scrolled up
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5
      setIsScrolledToBottom(isAtBottom)
    }
  }

  // Copy response to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Rate response
  const rateResponse = (responseId: string, rating: 'up' | 'down') => {
    setResponseHistory(prev => 
      prev.map(entry => 
        entry.id === responseId 
          ? { ...entry, rating: entry.rating === rating ? null : rating }
          : entry
      )
    )
  }

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="w-5 h-5 text-green-400" />
            {isConnected && (
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
              />
            )}
          </div>
          <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {isConnected ? 'Online' : 'Offline'}
          </div>
        </div>
        
        {/* Voice controls */}
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300"
            title="Text-to-speech (Coming soon)"
            disabled
          >
            <Volume2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Response content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 pr-2"
      >
        {responseHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Waiting for AI response</p>
              <p className="text-sm">
                {isConnected 
                  ? 'Start speaking to get AI analysis' 
                  : 'Connect to start conversation'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {responseHistory.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 relative">
                    {/* Timestamp and AI indicator */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400 font-medium">AI Assistant</span>
                        <span className="text-xs text-slate-400">
                          {entry.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => copyToClipboard(entry.text)}
                          className="p-1 rounded bg-slate-700/50 hover:bg-slate-600/50"
                          title="Copy response"
                        >
                          <Copy className="w-3 h-3 text-slate-300" />
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Response text */}
                    <p className="text-white leading-relaxed mb-3">
                      {index === responseHistory.length - 1 && isTyping ? typingText : entry.text}
                      {index === responseHistory.length - 1 && isTyping && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="ml-1 text-green-400"
                        >
                          |
                        </motion.span>
                      )}
                    </p>
                    
                    {/* Rating buttons */}
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => rateResponse(entry.id, 'up')}
                        className={`p-1 rounded transition-colors ${
                          entry.rating === 'up' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'text-slate-400 hover:text-green-400'
                        }`}
                        title="Helpful response"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => rateResponse(entry.id, 'down')}
                        className={`p-1 rounded transition-colors ${
                          entry.rating === 'down' 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'text-slate-400 hover:text-red-400'
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </motion.button>
                      
                      <div className="text-xs text-slate-500 ml-2">
                        Was this helpful?
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Scroll to bottom indicator */}
      {!isScrolledToBottom && responseHistory.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
              setIsScrolledToBottom(true)
            }
          }}
          className="absolute bottom-4 right-4 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-full p-2 text-green-400 transition-colors"
        >
          ↓
        </motion.button>
      )}
    </div>
  )
} 
