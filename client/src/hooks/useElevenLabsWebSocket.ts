'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useVoiceStream } from 'voice-stream'
import type { 
  ElevenLabsWebSocketEvent, 
  ConnectionStatus,
  AudioQueueItem
} from '../types/elevenlabs'

interface UseElevenLabsWebSocketProps {
  onUserTranscript: (transcript: string) => void
  onAgentResponse: (response: string) => void
  onStatusChange: (status: ConnectionStatus) => void
  onConnectionChange: (connected: boolean) => void
  agentId: string
  apiKey?: string
}

// Send message helper - exactly as in docs
const sendMessage = (websocket: WebSocket | null, request: object) => {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    return
  }
  websocket.send(JSON.stringify(request))
}

export function useElevenLabsWebSocket({
  onUserTranscript,
  onAgentResponse,
  onStatusChange,
  onConnectionChange,
  agentId,
  apiKey
}: UseElevenLabsWebSocketProps) {
  const websocketRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  
  // Audio playback refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<AudioQueueItem[]>([])
  const isPlayingAudioRef = useRef(false)
  const currentGainNodeRef = useRef<GainNode | null>(null)

  // Use official voice-stream package as recommended by ElevenLabs
  const { startStreaming, stopStreaming } = useVoiceStream({
    onAudioChunked: (audioData) => {
      console.log('🎙️ voice-stream audio chunk:', {
        length: audioData.length,
        websocketConnected: isConnected,
        sample: audioData.substring(0, 50) + '...'
      })
      
      // Use the exact sendMessage pattern from docs
      sendMessage(websocketRef.current, {
        user_audio_chunk: audioData,
      })
      console.log('✅ Audio chunk sent via voice-stream')
    },
  })

  // Initialize Web Audio API for playback
  const initializeAudioPlayback = useCallback(async () => {
    // Only create new AudioContext if we don't have one or if it's closed
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext()
    }
    
    // Resume audio context if suspended (required for Chrome autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }
  }, [])

  // Play audio from base64 string
  const playAudio = useCallback(async (base64Audio: string) => {
    if (!audioContextRef.current) return

    try {
      // Decode base64 to array buffer
      const binaryString = atob(base64Audio)
      const arrayBuffer = new ArrayBuffer(binaryString.length)
      const uint8Array = new Uint8Array(arrayBuffer)
      
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i)
      }

      // Decode audio data
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer.slice(0))
      
      // Create audio source and gain node
      const source = audioContextRef.current.createBufferSource()
      const gainNode = audioContextRef.current.createGain()
      
      source.buffer = audioBuffer
      source.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      
      // Store reference for potential interruption
      currentGainNodeRef.current = gainNode
      
      // Start playback
      source.start()
      
      return new Promise<void>((resolve) => {
        source.onended = () => {
          currentGainNodeRef.current = null
          resolve()
        }
      })
    } catch (error) {
      console.error('Error playing audio:', error)
      throw error
    }
  }, [])

  // Process audio queue
  const processAudioQueue = useCallback(async () => {
    if (isPlayingAudioRef.current || audioQueueRef.current.length === 0) {
      return
    }

    isPlayingAudioRef.current = true

    while (audioQueueRef.current.length > 0) {
      const audioItem = audioQueueRef.current.shift()
      if (!audioItem) break

      try {
        await playAudio(audioItem.audioData)
      } catch (error) {
        console.error('Error playing queued audio:', error)
      }
    }

    isPlayingAudioRef.current = false
  }, [playAudio])

  // Stop current audio playback
  const stopAudio = useCallback(() => {
    if (currentGainNodeRef.current) {
      currentGainNodeRef.current.gain.exponentialRampToValueAtTime(
        0.01,
        audioContextRef.current!.currentTime + 0.1
      )
    }
    // Clear audio queue
    audioQueueRef.current = []
    isPlayingAudioRef.current = false
  }, [])

  // Start conversation - following official docs pattern exactly
  const startConversation = useCallback(async () => {
    if (isConnected || !agentId) return

    try {
      onStatusChange('connecting')
      
      // Initialize audio context
      await initializeAudioPlayback()
      
      // Use exact WebSocket URL from docs with agent_id
      const websocketUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`
      console.log('🔗 Connecting to:', websocketUrl)
      
      const websocket = new WebSocket(websocketUrl)
      websocketRef.current = websocket

      websocket.onopen = async () => {
        console.log('✅ WebSocket connected')
        setIsConnected(true)
        onConnectionChange(true)
        onStatusChange('connected')
        
        // Send conversation initiation exactly as docs show
        sendMessage(websocket, {
          type: "conversation_initiation_client_data",
        })
        
        // Start audio streaming
        await startStreaming()
        console.log('🎙️ voice-stream started')
      }

      websocket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data) as ElevenLabsWebSocketEvent
          console.log('📨 WebSocket message received:', data.type, data)
          
          // Handle ping events to keep connection alive - exactly as docs show
          if (data.type === "ping") {
            setTimeout(() => {
              sendMessage(websocket, {
                type: "pong",
                event_id: data.ping_event.event_id,
              })
            }, data.ping_event.ping_ms || 0)
            return
          }

          // Handle conversation initiation
          if (data.type === "conversation_initiation_metadata") {
            setConversationId(data.conversation_initiation_metadata_event.conversation_id)
            console.log('🎯 Conversation initialized:', data.conversation_initiation_metadata_event.conversation_id)
            return
          }

          if (data.type === "user_transcript") {
            const transcript = data.user_transcription_event.user_transcript
            console.log('📝 User transcript:', transcript)
            onUserTranscript(transcript)
            return
          }

          if (data.type === "agent_response") {
            const response = data.agent_response_event.agent_response
            console.log('🤖 Agent response:', response)
            onAgentResponse(response)
            return
          }

          if (data.type === "audio") {
            console.log('🔊 Audio response received')
            const audioItem: AudioQueueItem = {
              audioData: data.audio_event.audio_base_64,
              eventId: data.audio_event.event_id
            }
            audioQueueRef.current.push(audioItem)
            processAudioQueue()
            return
          }

          if (data.type === "interruption") {
            console.log('⚠️ Conversation interrupted:', data.interruption_event.reason)
            stopAudio()
            return
          }

          // Handle other event types
          console.log('❓ Unhandled WebSocket event:', data)
          
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      }

      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        onStatusChange('error')
      }

      // Follow docs pattern for cleanup
      websocket.onclose = async () => {
        console.log('🔌 WebSocket connection closed')
        websocketRef.current = null
        setIsConnected(false)
        setConversationId(null)
        onConnectionChange(false)
        onStatusChange('disconnected')
        stopStreaming()
        stopAudio()
      }

    } catch (error) {
      console.error('❌ Failed to start conversation:', error)
      onStatusChange('error')
      throw error
    }
  }, [agentId, isConnected, onStatusChange, onConnectionChange, initializeAudioPlayback, startStreaming, onUserTranscript, onAgentResponse, processAudioQueue, stopAudio, stopStreaming])

  // Stop conversation - following docs pattern
  const stopConversation = useCallback(async () => {
    if (!websocketRef.current) return
    websocketRef.current.close()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close()
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  return {
    startConversation,
    stopConversation,
    isConnected,
    conversationId
  }
} 
