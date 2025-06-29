'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mic, MicOff, AlertCircle, Loader2, Phone, PhoneOff } from 'lucide-react'
import { useElevenLabsWebSocket } from '../hooks/useElevenLabsWebSocket'
import type { ConnectionStatus } from '@/types/elevenlabs'

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

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID

  const {
    startConversation: startWebSocketConversation,
    stopConversation: stopWebSocketConversation,
    isConnected,
    conversationId
  } = useElevenLabsWebSocket({
    onUserTranscript: (transcript) => {
      onUserTranscript(transcript)
    },
    onAgentResponse: (response) => {
      onAgentResponse(response)
    },
    onStatusChange: (newStatus) => {
      setStatus(newStatus)
      onStatusChange(newStatus)
    },
    onConnectionChange: (connected) => {
      onConnectionChange(connected)
      if (!connected) {
        setIsCallActive(false)
        setIsListening(false)
        setIsMuted(false)
      }
    },
    agentId: agentId || '',
    isListening
  })

  useEffect(() => {
    const actuallyListening = isListening && isConnected && isCallActive
    onListeningChange(actuallyListening)
  }, [isListening, isConnected, isCallActive, onListeningChange])

  useEffect(() => {
    onMutedChange(isMuted)
  }, [isMuted, onMutedChange])

  useEffect(() => {
    if (!agentId) {
      setError('Missing NEXT_PUBLIC_ELEVENLABS_AGENT_ID environment variable')
    }
  }, [agentId])

  const startCall = useCallback(async () => {
    if (!agentId) {
      setError('Agent ID not configured. Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID.')
      return
    }

    try {
      setError(null)
      
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Microphone access denied'
        throw new Error(`Microphone access denied. ${errorMessage}. Please allow microphone access and try again.`)
      }

      await startWebSocketConversation()
      setIsCallActive(true)
      setIsListening(true)
      setIsMuted(false)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start call'
      setError(errorMessage)
      setIsCallActive(false)
      setIsListening(false)
    }
  }, [agentId, startWebSocketConversation])

  const endCall = useCallback(() => {
    setIsCallActive(false)
    setIsListening(false)
    setIsMuted(false)
    stopWebSocketConversation()
  }, [stopWebSocketConversation])

  const toggleMute = useCallback(() => {
    if (!isCallActive) return
    
    const newMutedState = !isMuted
    const newListeningState = !newMutedState
    
    setIsMuted(newMutedState)
    setIsListening(newListeningState)
  }, [isMuted, isCallActive])

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
      if (!isListening) {
        return 'Call active - Microphone muted'
      } else if (isListening) {
        return conversationId ? `Active call (${conversationId.slice(0, 8)})` : 'Microphone listening...'
      } else {
        return 'Call active - Microphone inactive'
      }
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-white">Voice Control</h2>
        <div className={`w-2 h-2 rounded-full ${
          status === 'connected' ? 'bg-green-500' :
          status === 'connecting' ? 'bg-yellow-500' :
          status === 'error' ? 'bg-red-500' :
          'bg-slate-500'
        }`} />
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-950/50 border border-red-900/50 rounded p-3 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {/* Call Controls */}
      <div className="text-center">
        {!isCallActive ? (
          <div>
            <button
              onClick={startCall}
              disabled={!agentId || status === 'connecting'}
              className={`w-16 h-16 rounded-full border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                status === 'connecting' 
                  ? 'bg-yellow-500/20 border-yellow-500' 
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {status === 'connecting' ? (
                <Loader2 className="w-6 h-6 animate-spin text-yellow-400 mx-auto" />
              ) : (
                <Phone className="w-6 h-6 text-slate-400 mx-auto" />
              )}
            </button>

            <div className="mt-3">
              <p className="text-sm font-medium text-white">Start Call</p>
              <p className="text-xs text-slate-400 mt-1">{getStatusText()}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mute/Unmute and End Call Buttons */}
            <div className="flex items-center justify-center gap-6">
              {/* Mute/Unmute Button */}
              <div className="text-center">
                <button
                  onClick={toggleMute}
                  className={`w-14 h-14 rounded-full border-2 transition-colors ${
                    !isListening 
                      ? 'bg-yellow-500/20 border-yellow-500' 
                      : 'bg-green-500/20 border-green-500'
                  }`}
                >
                  {!isListening ? (
                    <MicOff className="w-5 h-5 text-yellow-400 mx-auto" />
                  ) : (
                    <Mic className="w-5 h-5 text-green-400 mx-auto" />
                  )}
                </button>

                <div className="mt-2">
                  <p className="text-sm font-medium text-white">
                    {!isListening ? 'Unmute' : 'Mute'}
                  </p>
                </div>
              </div>

              {/* End Call Button */}
              <div className="text-center">
                <button
                  onClick={endCall}
                  className="w-14 h-14 rounded-full border-2 bg-red-500/20 border-red-500 hover:bg-red-500/30 transition-colors"
                >
                  <PhoneOff className="w-5 h-5 text-red-400 mx-auto" />
                </button>

                <div className="mt-2">
                  <p className="text-sm font-medium text-white">End Call</p>
                </div>
              </div>
            </div>

            {/* Call Status */}
            <div className="mt-4">
              <p className="text-xs text-slate-400">{getStatusText()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Technology info */}
      <div className="mt-4 text-xs text-slate-500 text-center">
        <p>ElevenLabs WebSocket • Real-time AI</p>
        {agentId && (
          <p className="mt-1 font-mono">Agent: {agentId.slice(0, 8)}...</p>
        )}
      </div>
    </div>
  )
} 
