'use client'

import { useState, useEffect, useRef } from 'react'
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

  useEffect(() => {
    if (transcript.trim()) {
      const newEntry: TranscriptEntry = {
        id: `transcript-${Date.now()}`,
        text: transcript,
        timestamp: new Date()
      }
      
      setTranscriptHistory(prev => {
        if (prev.length > 0 && prev[prev.length - 1].text === transcript) {
          return prev
        }
        return [...prev, newEntry]
      })
    }
  }, [transcript])

  useEffect(() => {
    if (scrollContainerRef.current && isScrolledToBottom) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [transcriptHistory, isScrolledToBottom])

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5
      setIsScrolledToBottom(isAtBottom)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const copyAllTranscripts = async () => {
    const allText = transcriptHistory
      .map(entry => `[${entry.timestamp.toLocaleTimeString()}] ${entry.text}`)
      .join('\n')
    await copyToClipboard(allText)
  }

  const clearHistory = () => {
    setTranscriptHistory([])
  }

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
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Your Voice</span>
          {isListening && !isMuted && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
          {isMuted && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-xs text-yellow-400">MUTED</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={copyAllTranscripts}
            disabled={transcriptHistory.length === 0}
            className="p-1 hover:bg-slate-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copy all transcripts"
          >
            <Copy className="w-3 h-3 text-slate-400" />
          </button>
          
          <button
            onClick={downloadTranscript}
            disabled={transcriptHistory.length === 0}
            className="p-1 hover:bg-slate-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download transcript"
          >
            <Download className="w-3 h-3 text-slate-400" />
          </button>
          
          <button
            onClick={clearHistory}
            disabled={transcriptHistory.length === 0}
            className="p-1 hover:bg-slate-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear history"
          >
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
        </div>
      </div>

      {/* Transcript content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
      >
        {transcriptHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No voice input yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {transcriptHistory.map((entry) => (
              <div key={entry.id} className="group">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => copyToClipboard(entry.text)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded transition-opacity"
                    >
                      <Copy className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                  <p className="text-sm text-white leading-relaxed">{entry.text}</p>
                </div>
              </div>
            ))}
            
            {/* Current transcript */}
            {isListening && transcript && (
              <div className="bg-blue-950/30 border border-blue-900/50 rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-xs text-blue-400">Live</span>
                </div>
                <p className="text-sm text-white leading-relaxed">{transcript}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      {!isScrolledToBottom && transcriptHistory.length > 0 && (
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
