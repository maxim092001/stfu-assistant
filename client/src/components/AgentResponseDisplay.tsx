'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Copy, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react'
import { triggerTelegramNotification } from '../utils/telegram'

interface AgentResponseDisplayProps {
  response: string
  isConnected: boolean
}

interface ResponseEntry {
  id: string
  text: string
  displayText: string // The actual message to display
  timestamp: Date
  rating?: 'up' | 'down' | null
  isCritical?: boolean
  riskLevel?: number
}

interface ParsedResponse {
  message?: string
  risk?: number
  displayText: string
  riskLevel?: number
  isCritical: boolean
}

export default function AgentResponseDisplay({ response, isConnected }: AgentResponseDisplayProps) {
  const [responseHistory, setResponseHistory] = useState<ResponseEntry[]>([])
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)
  const [typingText, setTypingText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showCriticalOnly, setShowCriticalOnly] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Helper function to parse response and extract message/risk
  const parseResponse = (responseText: string): ParsedResponse => {
    try {
      const parsed = JSON.parse(responseText.trim())
      if (typeof parsed === 'object' && parsed !== null) {
        const message = parsed.message || responseText
        const risk = typeof parsed.risk === 'number' ? parsed.risk : undefined
        
        return {
          message: parsed.message,
          risk,
          displayText: message,
          riskLevel: risk,
          isCritical: risk !== undefined && risk >= 80
        }
      }
    } catch (error) {
      // Not valid JSON, treat as plain text
    }
    
    return {
      displayText: responseText,
      isCritical: false
    }
  }

  // Helper function to get risk color based on value
  const getRiskColor = (risk: number): string => {
    if (risk >= 71) return 'text-red-400 bg-red-950/30 border-red-900/50'
    if (risk >= 31) return 'text-yellow-400 bg-yellow-950/30 border-yellow-900/50'
    return 'text-green-400 bg-green-950/30 border-green-900/50'
  }

  // Helper function to get risk text color only
  const getRiskTextColor = (risk: number): string => {
    if (risk >= 71) return 'text-red-400'
    if (risk >= 31) return 'text-yellow-400'
    return 'text-green-400'
  }

  // Add new response to history with typing animation
  useEffect(() => {
    if (response.trim()) {
      const parsed = parseResponse(response)
      
      const newEntry: ResponseEntry = {
        id: `response-${Date.now()}`,
        text: response, // Keep original for copying
        displayText: parsed.displayText,
        timestamp: new Date(),
        rating: null,
        isCritical: parsed.isCritical,
        riskLevel: parsed.riskLevel
      }
      
      setResponseHistory(prev => {
        // Avoid duplicates
        if (prev.length > 0 && prev[prev.length - 1].text === response) {
          return prev
        }
        return [...prev, newEntry]
      })

      // Send Telegram notification for critical responses
      if (parsed.isCritical && parsed.riskLevel !== undefined) {
        triggerTelegramNotification({
          text: parsed.displayText,
          riskLevel: parsed.riskLevel,
          timestamp: newEntry.timestamp,
        }).catch(error => {
          console.error('Failed to send Telegram notification:', error)
        })
      }

      // Trigger typing animation for new response
      setIsTyping(true)
      setTypingText('')
      typewriterEffect(parsed.displayText)
    }
  }, [response])

  // Typewriter effect for responses
  const typewriterEffect = (text: string) => {
    let index = 0
    const typeSpeed = 30 // milliseconds per character

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

  // Filter responses based on critical toggle
  const filteredResponses = showCriticalOnly 
    ? responseHistory.filter(entry => entry.isCritical)
    : responseHistory

  // Auto-scroll to bottom when new response arrives
  useEffect(() => {
    if (scrollContainerRef.current && isScrolledToBottom) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [filteredResponses, isScrolledToBottom])

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

  // Minimalist Switch Component
  const Switch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => {
    return (
      <button
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? 'bg-slate-700' : 'bg-slate-600'
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-[calc(100vh-16rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Bot className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Assistant</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-500'}`} />
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Critical</span>
          <Switch checked={showCriticalOnly} onChange={setShowCriticalOnly} />
        </div>
      </div>

      {/* Response content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
      >
        {filteredResponses.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {showCriticalOnly ? 'No critical responses' : 'Waiting for response'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResponses.map((entry, index) => (
              <div key={entry.id} className="group">
                <div className={`p-3 rounded border ${
                  entry.isCritical 
                    ? 'bg-red-950/30 border-red-900/50' 
                    : 'bg-slate-800/50 border-slate-700/50'
                }`}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {entry.isCritical && (
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                      )}
                      <span className="text-xs text-slate-400">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                      {typeof entry.riskLevel === 'number' && (
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(entry.riskLevel)}`}>
                          Risk: {entry.riskLevel}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => copyToClipboard(entry.text)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded transition-opacity"
                    >
                      <Copy className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                  
                  {/* Response text */}
                  <p className="text-sm text-white leading-relaxed mb-2">
                    {index === filteredResponses.length - 1 && isTyping ? typingText : entry.displayText}
                    {index === filteredResponses.length - 1 && isTyping && (
                      <span className="ml-1 text-slate-400 animate-pulse">|</span>
                    )}
                  </p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => rateResponse(entry.id, 'up')}
                      className={`p-1 rounded transition-colors ${
                        entry.rating === 'up' 
                          ? 'text-green-400' 
                          : 'text-slate-500 hover:text-green-400'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={() => rateResponse(entry.id, 'down')}
                      className={`p-1 rounded transition-colors ${
                        entry.rating === 'down' 
                          ? 'text-red-400' 
                          : 'text-slate-500 hover:text-red-400'
                      }`}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      {!isScrolledToBottom && filteredResponses.length > 0 && (
        <button
          onClick={() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
              setIsScrolledToBottom(true)
            }
          }}
          className="absolute bottom-4 right-4 w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 text-xs transition-colors"
        >
          ↓
        </button>
      )}
    </div>
  )
} 
