'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Settings, AlertCircle, Wifi } from 'lucide-react'

interface VoiceStreamingAdvancedProps {
  onConnectionChange: (connected: boolean) => void
  onListeningChange: (listening: boolean) => void
  onUserTranscript: (transcript: string) => void
  onAgentResponse: (response: string) => void
  onStatusChange: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void
}

interface ConversationConfig {
  agent_id: string
  override_agent_settings?: {
    voice?: {
      voice_id: string
      stability: number
      similarity_boost: number
    }
    language?: string
    transcription?: {
      model: string
      keywords?: string[]
    }
  }
}

export default function VoiceStreamingAdvanced({
  onConnectionChange,
  onListeningChange,
  onUserTranscript,
  onAgentResponse,
  onStatusChange
}: VoiceStreamingAdvancedProps) {
  const [isListening, setIsListening] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [conversationId, setConversationId] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const maxReconnectAttempts = 5
  const reconnectDelay = 2000

  // Audio level monitoring
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    setAudioLevel(average / 255)

    if (isListening) {
      requestAnimationFrame(monitorAudioLevel)
    }
  }, [isListening])

  // Initialize WebSocket connection to ElevenLabs Conversational AI
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initializeWebSocketConnection = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID

    if (!apiKey || !agentId) {
      setError('Missing API key or Agent ID')
      onStatusChange('error')
      return false
    }

    try {
      onStatusChange('connecting')
      
      // Create WebSocket connection to ElevenLabs Conversational AI
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`
      
      websocketRef.current = new WebSocket(wsUrl, ['convai-protocol'])
      
      websocketRef.current.onopen = () => {
        console.log('WebSocket connected')
        
        // Send authentication and configuration
        const authMessage = {
          type: 'auth',
          api_key: apiKey
        }
        
        websocketRef.current?.send(JSON.stringify(authMessage))
        
        // Send conversation configuration
        const config: ConversationConfig = {
          agent_id: agentId,
          override_agent_settings: {
            transcription: {
              model: 'nova-2'
            }
          }
        }
        
        const configMessage = {
          type: 'conversation_config',
          config: config
        }
        
        websocketRef.current?.send(JSON.stringify(configMessage))
        
        setIsConnected(true)
        onConnectionChange(true)
        onStatusChange('connected')
        setError(null)
        reconnectAttemptsRef.current = 0
      }

      websocketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleWebSocketMessage(message)
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('WebSocket connection error')
        onStatusChange('error')
      }

      websocketRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        setIsConnected(false)
        onConnectionChange(false)
        setIsListening(false)
        onListeningChange(false)
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect()
        } else {
          onStatusChange('disconnected')
        }
      }

      return true
    } catch (err) {
      console.error('Error initializing WebSocket:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect')
      onStatusChange('error')
      return false
    }
  }, [onConnectionChange, onStatusChange, onListeningChange])

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: { type: string; conversation_id?: string; text?: string; error?: string }) => {
    switch (message.type) {
      case 'conversation_started':
        setConversationId(message.conversation_id || null)
        console.log('Conversation started:', message.conversation_id)
        break
        
      case 'user_transcript':
        onUserTranscript(message.text || '')
        break
        
      case 'agent_response':
        onAgentResponse(message.text || '')
        break
        
      case 'agent_response_audio':
        // Handle audio response if needed (currently muted)
        console.log('Agent audio response received')
        break
        
      case 'error':
        console.error('Server error:', message.error)
        setError(message.error || 'Unknown error')
        break
        
      default:
        console.log('Unknown message type:', message.type)
    }
  }, [onUserTranscript, onAgentResponse])

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    reconnectAttemptsRef.current++
    const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1) // Exponential backoff
    
    console.log(`Scheduling reconnect attempt ${reconnectAttemptsRef.current} in ${delay}ms`)
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      if (reconnectAttemptsRef.current <= maxReconnectAttempts) {
        await initializeWebSocketConnection()
      }
    }, delay)
  }, [initializeWebSocketConnection])

  // Initialize audio stream
  const initializeAudioStream = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1
        }
      })

      streamRef.current = stream

      // Set up audio context for level monitoring
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Set up MediaRecorder for audio capture
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          sendAudioChunk(event.data)
        }
      }

      return true
    } catch (err) {
      console.error('Error initializing audio stream:', err)
      setError(err instanceof Error ? err.message : 'Failed to access microphone')
      onStatusChange('error')
      return false
    }
  }

  // Send audio chunk to WebSocket
  const sendAudioChunk = (audioBlob: Blob) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      // Convert blob to base64 for WebSocket transmission
      const reader = new FileReader()
      reader.onload = () => {
        const base64Audio = (reader.result as string).split(',')[1]
        const audioMessage = {
          type: 'audio_chunk',
          audio: base64Audio,
          encoding: 'webm'
        }
        websocketRef.current?.send(JSON.stringify(audioMessage))
      }
      reader.readAsDataURL(audioBlob)
    }
  }

  // Start/stop listening
  const toggleListening = async () => {
    if (!isListening) {
      // Ensure we have both WebSocket and audio stream
      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
        const wsConnected = await initializeWebSocketConnection()
        if (!wsConnected) return
      }
      
      if (!streamRef.current) {
        const audioInitialized = await initializeAudioStream()
        if (!audioInitialized) return
      }
      
      if (mediaRecorderRef.current && streamRef.current) {
        audioChunksRef.current = []
        mediaRecorderRef.current.start(250) // Send audio chunks every 250ms
        setIsListening(true)
        onListeningChange(true)
        monitorAudioLevel()
        
        // Send start listening message
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
          websocketRef.current.send(JSON.stringify({
            type: 'start_listening'
          }))
        }
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      setIsListening(false)
      onListeningChange(false)
      setAudioLevel(0)
      
      // Send stop listening message
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'stop_listening'
        }))
      }
    }
  }

  // Cleanup function
  const cleanup = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    
    if (websocketRef.current) {
      websocketRef.current.close(1000, 'Component unmounting')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [])

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Voice Streaming</h2>
        <div className="flex items-center gap-2">
          {conversationId && (
            <div className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
              ID: {conversationId.slice(-8)}
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
          {reconnectAttemptsRef.current > 0 && (
            <span className="text-xs text-red-400 ml-auto">
              Retry {reconnectAttemptsRef.current}/{maxReconnectAttempts}
            </span>
          )}
        </motion.div>
      )}

      {/* Connection status */}
      {!isConnected && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-6"
        >
          <motion.button
            onClick={initializeWebSocketConnection}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
          >
            <Wifi className="w-4 h-4" />
            Connect to AI Agent
          </motion.button>
        </motion.div>
      )}

      {/* Main control */}
      <div className="text-center">
        <motion.button
          onClick={toggleListening}
          disabled={!isConnected}
          whileHover={{ scale: isConnected ? 1.05 : 1 }}
          whileTap={{ scale: isConnected ? 0.95 : 1 }}
          className={`
            relative w-24 h-24 rounded-full border-4 transition-all duration-300
            ${isListening 
              ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/25' 
              : 'bg-purple-500/20 border-purple-500 hover:bg-purple-500/30'
            }
            ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {/* Audio level indicator */}
          {isListening && (
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-red-300"
              animate={{ 
                scale: 1 + audioLevel * 0.5,
                opacity: 0.7 - audioLevel * 0.3
              }}
              transition={{ duration: 0.1 }}
            />
          )}
          
          {/* Icon */}
          <div className="flex items-center justify-center h-full">
            {isListening ? (
              <MicOff className="w-8 h-8 text-red-400" />
            ) : (
              <Mic className="w-8 h-8 text-purple-400" />
            )}
          </div>
        </motion.button>

        <div className="mt-4">
          <p className="text-lg font-medium text-white">
            {isListening ? 'Listening...' : isConnected ? 'Click to start listening' : 'Connect first'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {isConnected 
              ? 'Real-time AI conversation active' 
              : 'Connect to start real-time conversation'
            }
          </p>
        </div>

        {/* Audio level bar */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4"
          >
            <div className="w-32 h-2 bg-slate-700 rounded-full mx-auto overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                animate={{ width: `${audioLevel * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Audio Level</p>
          </motion.div>
        )}
      </div>
    </div>
  )
} 
