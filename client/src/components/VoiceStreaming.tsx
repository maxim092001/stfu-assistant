'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Settings, AlertCircle, Loader2, Phone, PhoneOff } from 'lucide-react'
import { useElevenLabsWebSocket } from '../hooks/useElevenLabsWebSocket'
import type { ConnectionStatus } from '../types/elevenlabs'

interface VoiceStreamingProps {
  onConnectionChange: (connected: boolean) => void
  onListeningChange: (listening: boolean) => void
  onMutedChange: (muted: boolean) => void
  onUserTranscript: (transcript: string) => void
  onAgentResponse: (response: string) => void
  onStatusChange: (status: ConnectionStatus) => void
}

export default function VoiceStreaming({
  onConnectionChange,
  onListeningChange,
  onMutedChange,
  onUserTranscript,
  onAgentResponse,
  onStatusChange
}: VoiceStreamingProps) {
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')

  // Get environment variables
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID

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
      if (!connected) {
        // Reset call state when connection is lost
        setIsCallActive(false)
        setIsListening(false)
        setIsMuted(false)
      }
    },
    agentId: agentId || '',
    isListening
  })

  // Update listening state - simplified logic
  useEffect(() => {
    const actuallyListening = isListening && isConnected && isCallActive
    console.log('👂 Listening state update:', { 
      isListening, 
      isConnected, 
      isCallActive, 
      actuallyListening,
      isMuted 
    })
    console.log('📡 Passing to hook - isListening:', isListening)
    onListeningChange(actuallyListening)
  }, [isListening, isConnected, isCallActive, onListeningChange])

  // Update muted state callback
  useEffect(() => {
    onMutedChange(isMuted)
  }, [isMuted, onMutedChange])

  // Validate environment variables
  useEffect(() => {
    if (!agentId) {
      setError('Missing NEXT_PUBLIC_ELEVENLABS_AGENT_ID environment variable')
    }
  }, [agentId])

  // Start call - establishes connection and starts listening
  const startCall = useCallback(async () => {
    if (!agentId) {
      setError('Agent ID not configured. Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID.')
      return
    }

    try {
      setError(null)
      console.log('🚀 Starting call...')
      
      // Request microphone permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        console.log('🎙️ Microphone permission granted')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Microphone access denied'
        throw new Error(`Microphone access denied. ${errorMessage}. Please allow microphone access and try again.`)
      }

      // Start conversation (voice-stream will start automatically)
      await startWebSocketConversation()
      
      // Set call as active and start listening
      setIsCallActive(true)
      setIsListening(true)
      setIsMuted(false)
      console.log('✅ Call started successfully')

    } catch (err) {
      console.error('❌ Failed to start call:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to start call'
      setError(errorMessage)
      setIsCallActive(false)
      setIsListening(false)
    }
  }, [agentId, startWebSocketConversation])

  // End call - disconnects everything and cleans up
  const endCall = useCallback(() => {
    console.log('🛑 Ending call...')
    setIsCallActive(false)
    setIsListening(false)
    setIsMuted(false)
    stopWebSocketConversation()
    console.log('✅ Call ended')
  }, [stopWebSocketConversation])

  // Toggle mute - controls both muted state and listening state
  const toggleMute = useCallback(() => {
    console.log('🔇 Toggle mute clicked. BEFORE:', { 
      isMuted, 
      isCallActive, 
      isListening,
      isConnected 
    })
    
    if (!isCallActive) {
      console.log('⚠️ Cannot mute - no active call')
      return
    }
    
    const newMutedState = !isMuted
    const newListeningState = !newMutedState // If muted, stop listening; if unmuted, start listening
    
    console.log('🔄 Setting new states:', {
      oldMuted: isMuted,
      newMuted: newMutedState,
      oldListening: isListening,
      newListening: newListeningState
    })
    
    setIsMuted(newMutedState)
    setIsListening(newListeningState)
    
    if (newMutedState) {
      console.log('🔇🔇🔇 MAXON MUTED - SHOULD STOP SENDING AUDIO 🔇🔇🔇')
    } else {
      console.log('🎙️🎙️🎙️ MAXON UNMUTED - SHOULD START SENDING AUDIO 🎙️🎙️🎙️')
    }
    
    console.log('✅ State update completed:', {
      action: newMutedState ? 'MUTED' : 'UNMUTED',
      listening: newListeningState
    })
  }, [isMuted, isCallActive, isListening])

  // Get status display text
  const getStatusText = () => {
    if (error) return 'Error - Check console for details'
    
    if (!isCallActive) {
      switch (status) {
        case 'connecting':
          return 'Connecting to ElevenLabs...'
        case 'connected':
          return 'Connected - Click to start call'
        case 'error':
          return 'Connection error - Click to retry'
        case 'disconnected':
        default:
          return 'Click to start call'
      }
    } else {
      // Call is active
      if (!isListening) {
        return 'Call active - Microphone muted'
      } else if (isListening) {
        return conversationId ? `Active call (${conversationId.slice(0, 8)})` : 'Microphone listening...'
      } else {
        return 'Call active - Microphone inactive'
      }
    }
  }

  // Get button color based on state
  const getButtonColor = () => {
    if (error || status === 'error') {
      return 'bg-red-500/20 border-red-500 hover:bg-red-500/30'
    }
    if (isCallActive) {
      if (!isListening) {
        return 'bg-yellow-500/20 border-yellow-500 hover:bg-yellow-500/30'
      }
      return 'bg-green-500/20 border-green-500 hover:bg-green-500/30'
    }
    if (status === 'connecting') {
      return 'bg-yellow-500/20 border-yellow-500'
    }
    return 'bg-purple-500/20 border-purple-500 hover:bg-purple-500/30'
  }

  // Get icon color based on state
  const getIconColor = () => {
    if (error || status === 'error') return 'text-red-400'
    if (isCallActive) {
      if (!isListening) return 'text-yellow-400'
      return 'text-green-400'
    }
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
            <p>Call Active: {isCallActive ? '✅ Yes' : '❌ No'}</p>
            <p>Microphone: {isCallActive && isListening ? '✅ Active' : isCallActive && !isListening ? '🔇 Muted' : '❌ Inactive'}</p>
            <p>Listening: {isListening ? '✅ Yes' : '❌ No'}</p>
            <p>Status: {status}</p>
            {conversationId && <p>Conversation: {conversationId}</p>}
          </div>
        </motion.div>
      )}

      {/* Call Controls */}
      <div className="text-center">
        {!isCallActive ? (
          // Start Call Button
          <div>
            <motion.button
              onClick={startCall}
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
                ) : (
                  <Phone className={`w-8 h-8 ${getIconColor()}`} />
                )}
              </div>
            </motion.button>

            <div className="mt-4">
              <p className="text-lg font-medium text-white">
                Start Call
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {getStatusText()}
              </p>
            </div>
          </div>
        ) : (
          // Call Active - Show Mute/Unmute and End Call buttons
          <div className="space-y-4">
            {/* Mute/Unmute Button */}
            <div>
              <motion.button
                onClick={toggleMute}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative w-20 h-20 rounded-full border-4 transition-all duration-300
                  ${!isListening 
                    ? 'bg-yellow-500/20 border-yellow-500 hover:bg-yellow-500/30' 
                    : 'bg-green-500/20 border-green-500 hover:bg-green-500/30'
                  }
                `}
              >
                {/* Icon */}
                <div className="flex items-center justify-center h-full">
                  {!isListening ? (
                    <MicOff className="w-6 h-6 text-yellow-400" />
                  ) : (
                    <Mic className="w-6 h-6 text-green-400" />
                  )}
                </div>
              </motion.button>

              <div className="mt-2">
                <p className="text-sm font-medium text-white">
                  {!isListening ? 'Unmute Mic' : 'Mute Mic'}
                </p>
                <p className="text-xs text-slate-400">
                  {!isListening ? 'Turn microphone on' : 'Turn microphone off'}
                </p>
              </div>
            </div>

            {/* End Call Button */}
            <div>
              <motion.button
                onClick={endCall}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-20 h-20 rounded-full border-4 transition-all duration-300 bg-red-500/20 border-red-500 hover:bg-red-500/30"
              >
                {/* Icon */}
                <div className="flex items-center justify-center h-full">
                  <PhoneOff className="w-6 h-6 text-red-400" />
                </div>
              </motion.button>

              <div className="mt-2">
                <p className="text-sm font-medium text-white">
                  End Call
                </p>
                <p className="text-xs text-slate-400">
                  Disconnect and cleanup
                </p>
              </div>
            </div>

            {/* Call Status */}
            <div className="mt-4">
              <p className="text-sm text-slate-300">
                {getStatusText()}
              </p>
            </div>
          </div>
        )}

        {/* Connection status indicator */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'connected' ? 'bg-green-400' :
            status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
            status === 'error' ? 'bg-red-400' :
            'bg-slate-500'
          }`} />
          <span className="text-xs text-slate-400 capitalize">{status}</span>
          {isCallActive && isListening && (
            <span className="text-xs text-green-400">• microphone active</span>
          )}
          {isCallActive && !isListening && (
            <span className="text-xs text-yellow-400">• microphone muted</span>
          )}
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
