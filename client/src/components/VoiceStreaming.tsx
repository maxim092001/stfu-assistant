'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Settings, AlertCircle, Loader2 } from 'lucide-react'
import { useElevenLabsWebSocket } from '../hooks/useElevenLabsWebSocket'
import type { ConnectionStatus } from '../types/elevenlabs'

interface VoiceStreamingProps {
  onConnectionChange: (connected: boolean) => void
  onListeningChange: (listening: boolean) => void
  onUserTranscript: (transcript: string) => void
  onAgentResponse: (response: string) => void
  onStatusChange: (status: ConnectionStatus) => void
}

export default function VoiceStreaming({
  onConnectionChange,
  onListeningChange,
  onUserTranscript,
  onAgentResponse,
  onStatusChange
}: VoiceStreamingProps) {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')

  // Get environment variables
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY

  // ElevenLabs WebSocket connection with official voice-stream integration
  const {
    startConversation: startWebSocketConversation,
    stopConversation: stopWebSocketConversation,
    isConnected,
    conversationId
  } = useElevenLabsWebSocket({
    onUserTranscript: (transcript) => {
      console.log('📝 User transcript received:', transcript)
      onUserTranscript(transcript)
    },
    onAgentResponse: (response) => {
      console.log('🤖 Agent response received:', response)
      onAgentResponse(response)
    },
    onStatusChange: (newStatus) => {
      console.log('🔄 WebSocket status changed:', newStatus)
      setStatus(newStatus)
      onStatusChange(newStatus)
    },
    onConnectionChange: (connected) => {
      console.log('🔗 WebSocket connection changed:', connected)
      onConnectionChange(connected)
    },
    agentId: agentId || '',
    apiKey
  })

  // Update listening state
  useEffect(() => {
    const actuallyListening = isListening && isConnected
    console.log('👂 Listening state update:', { isListening, isConnected, actuallyListening })
    onListeningChange(actuallyListening)
  }, [isListening, isConnected, onListeningChange])

  // Validate environment variables
  useEffect(() => {
    if (!agentId) {
      setError('Missing NEXT_PUBLIC_ELEVENLABS_AGENT_ID environment variable')
              }
  }, [agentId])

  // Start conversation using official voice-stream
  const startConversation = useCallback(async () => {
    if (!agentId) {
      setError('Agent ID not configured. Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID.')
      return
    }

    try {
      setError(null)
      console.log('🚀 Starting conversation with voice-stream...')
      
      // Request microphone permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        console.log('🎙️ Microphone permission granted')
      } catch (permissionError) {
        throw new Error('Microphone access denied. Please allow microphone access and try again.')
  }

      // Start conversation (voice-stream will start automatically)
      await startWebSocketConversation()
      
      setIsListening(true)
      console.log('✅ Conversation started successfully with voice-stream')

    } catch (err) {
      console.error('❌ Failed to start conversation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to start conversation'
      setError(errorMessage)
      setIsListening(false)
    }
  }, [agentId, startWebSocketConversation])

  // Stop conversation
  const stopConversation = useCallback(() => {
    console.log('🛑 Stopping conversation...')
    setIsListening(false)
    stopWebSocketConversation()
    console.log('✅ Conversation stopped')
  }, [stopWebSocketConversation])

  // Toggle listening state
  const toggleListening = useCallback(async () => {
    console.log('🔄 Toggle listening clicked. Current state:', { isListening, isConnected })
    
    if (isListening) {
      stopConversation()
    } else {
      await startConversation()
      }
  }, [isListening, startConversation, stopConversation])

  // Get status display text
  const getStatusText = () => {
    if (error) return 'Error - Check console for details'
    
    switch (status) {
      case 'connecting':
        return 'Connecting to ElevenLabs...'
      case 'connected':
        if (isListening) {
          return conversationId ? `Active conversation (${conversationId.slice(0, 8)})` : 'Listening with voice-stream...'
        }
        return 'Connected - Click to start conversation'
      case 'error':
        return 'Connection error - Click to retry'
      case 'disconnected':
      default:
        return 'Click to start conversation'
        }
      }

  // Get button color based on state
  const getButtonColor = () => {
    if (error || status === 'error') {
      return 'bg-red-500/20 border-red-500 hover:bg-red-500/30'
    }
    if (isListening) {
      return 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/25'
    }
    if (status === 'connecting') {
      return 'bg-yellow-500/20 border-yellow-500'
    }
    return 'bg-purple-500/20 border-purple-500 hover:bg-purple-500/30'
  }

  // Get icon color based on state
  const getIconColor = () => {
    if (error || status === 'error') return 'text-red-400'
    if (isListening) return 'text-red-400'
    if (status === 'connecting') return 'text-yellow-400'
    return 'text-purple-400'
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">ElevenLabs Voice AI</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Environment check */}
      {!agentId && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-4 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <div className="text-yellow-300 text-sm">
            <p className="font-medium">Configuration Required</p>
            <p>Please set your NEXT_PUBLIC_ELEVENLABS_AGENT_ID in .env.local</p>
          </div>
        </motion.div>
      )}

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
        </motion.div>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4"
        >
          <div className="text-blue-300 text-xs space-y-1">
            <p>🔧 Debug Info (using official voice-stream):</p>
            <p>WebSocket: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
            <p>Voice Stream: {isListening ? '✅ Active' : '❌ Inactive'}</p>
            <p>Status: {status}</p>
            {conversationId && <p>Conversation: {conversationId}</p>}
          </div>
        </motion.div>
      )}

      {/* Main control */}
      <div className="text-center">
        <motion.button
          onClick={toggleListening}
          disabled={!agentId || status === 'connecting'}
          whileHover={{ scale: !agentId ? 1 : 1.05 }}
          whileTap={{ scale: !agentId ? 1 : 0.95 }}
          className={`
            relative w-24 h-24 rounded-full border-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
            ${getButtonColor()}
          `}
        >
          {/* Icon */}
          <div className="flex items-center justify-center h-full">
            {status === 'connecting' ? (
              <Loader2 className={`w-8 h-8 animate-spin ${getIconColor()}`} />
            ) : isListening ? (
              <MicOff className={`w-8 h-8 ${getIconColor()}`} />
            ) : (
              <Mic className={`w-8 h-8 ${getIconColor()}`} />
            )}
          </div>
        </motion.button>

        <div className="mt-4">
          <p className="text-lg font-medium text-white">
            {isListening ? 'Speaking with AI...' : 'Start Voice Conversation'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {getStatusText()}
          </p>
        </div>

        {/* Connection status indicator */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'connected' ? 'bg-green-400' :
            status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
            status === 'error' ? 'bg-red-400' :
            'bg-slate-500'
          }`} />
          <span className="text-xs text-slate-400 capitalize">{status}</span>
          {isListening && <span className="text-xs text-green-400">• voice-stream active</span>}
            </div>
      </div>

      {/* Technology info */}
      <div className="mt-4 text-xs text-slate-500 text-center">
        <p>✅ Official ElevenLabs voice-stream integration</p>
        <p>WebSocket • Real-time AI conversation</p>
        {agentId && (
          <p className="mt-1 font-mono">Agent: {agentId.slice(0, 8)}...</p>
        )}
      </div>
    </div>
  )
} 
