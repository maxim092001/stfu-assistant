'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Copy, Download, Trash2 } from 'lucide-react'

interface TranscriptDisplayProps {
  transcript: string
  isListening: boolean
  isMuted?: boolean
}

interface TranscriptEntry {
  id: string
  text: string
  timestamp: Date
}

export default function TranscriptDisplay({ transcript, isListening, isMuted = false }: TranscriptDisplayProps) {
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>([])
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Add new transcript to history
  useEffect(() => {
    if (transcript.trim()) {
      const newEntry: TranscriptEntry = {
        id: `transcript-${Date.now()}`,
        text: transcript,
        timestamp: new Date()
      }
      
      setTranscriptHistory(prev => {
        // Avoid duplicates
        if (prev.length > 0 && prev[prev.length - 1].text === transcript) {
          return prev
        }
        return [...prev, newEntry]
      })
    }
  }, [transcript])

  // Auto-scroll to bottom when new transcript arrives
  useEffect(() => {
    if (scrollContainerRef.current && isScrolledToBottom) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [transcriptHistory, isScrolledToBottom])

  // Handle scroll to detect if user has scrolled up
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5
      setIsScrolledToBottom(isAtBottom)
    }
  }

  // Copy transcript to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Copy all transcripts
  const copyAllTranscripts = async () => {
    const allText = transcriptHistory
      .map(entry => `[${entry.timestamp.toLocaleTimeString()}] ${entry.text}`)
      .join('\n')
    await copyToClipboard(allText)
  }

  // Clear transcript history
  const clearHistory = () => {
    setTranscriptHistory([])
  }

  // Download transcript as file
  const downloadTranscript = () => {
    const allText = transcriptHistory
      .map(entry => `[${entry.timestamp.toLocaleTimeString()}] ${entry.text}`)
      .join('\n')
    
    const blob = new Blob([allText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 h-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Your Voice</h3>
          {isListening && !isMuted && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-red-500 rounded-full"
            />
          )}
          {isMuted && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-xs text-yellow-400 font-medium">MUTED</span>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyAllTranscripts}
            disabled={transcriptHistory.length === 0}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copy all transcripts"
          >
            <Copy className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadTranscript}
            disabled={transcriptHistory.length === 0}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download transcript"
          >
            <Download className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearHistory}
            disabled={transcriptHistory.length === 0}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear history"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Transcript content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 pr-2"
      >
        {transcriptHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No voice input yet</p>
              <p className="text-sm">Start speaking to see your words appear here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {transcriptHistory.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group relative"
                >
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 relative">
                    {/* Timestamp */}
                    <div className="text-xs text-slate-400 mb-1">
                      {entry.timestamp.toLocaleTimeString()}
                    </div>
                    
                    {/* Transcript text */}
                    <p className="text-white leading-relaxed">{entry.text}</p>
                    
                    {/* Copy button for individual transcript */}
                    <motion.button
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute top-2 right-2 p-1 rounded bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(entry.text)}
                      title="Copy this transcript"
                    >
                      <Copy className="w-3 h-3 text-slate-300" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Current transcript (if actively listening) */}
            {isListening && transcript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-purple-500 rounded-full"
                  />
                  <span className="text-xs text-purple-400">Live transcription</span>
                </div>
                <p className="text-white leading-relaxed">{transcript}</p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Scroll to bottom indicator */}
      {!isScrolledToBottom && transcriptHistory.length > 0 && (
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
          className="absolute bottom-4 right-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-full p-2 text-purple-400 transition-colors"
        >
          ↓
        </motion.button>
      )}
    </div>
  )
} 
