'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Settings, AlertCircle } from 'lucide-react'

interface VoiceStreamingProps {
  onConnectionChange: (connected: boolean) => void
  onListeningChange: (listening: boolean) => void
  onUserTranscript: (transcript: string) => void
  onAgentResponse: (response: string) => void
  onStatusChange: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void
}

export default function VoiceStreaming({
  onConnectionChange,
  onListeningChange,
  onUserTranscript,
  onAgentResponse,
  onStatusChange
}: VoiceStreamingProps) {
  const [isListening, setIsListening] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

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

  // Initialize Web Speech API for real-time transcription
  const initializeSpeechRecognition = () => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      setError('Speech recognition not available - server side')
      return false
    }

    // Check for Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported. Please use Chrome, Safari, or Edge.')
      return false
    }

    try {
      recognitionRef.current = new SpeechRecognition()
    
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event) => {
          let transcript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript
            }
          }
          
          if (transcript.trim()) {
            onUserTranscript(transcript)
            // Send to AI agent for analysis
            sendToAIAgent(transcript)
          }
        }

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          if (event.error === 'not-allowed') {
            setError('Microphone access denied')
          } else {
            setError(`Speech recognition error: ${event.error}`)
          }
          setIsListening(false)
          onListeningChange(false)
        }

        recognitionRef.current.onend = () => {
          if (isListening) {
            // Restart recognition if it stops unexpectedly
            setTimeout(() => {
              if (recognitionRef.current && isListening) {
                recognitionRef.current.start()
              }
            }, 100)
          }
        }
      }

      return true
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error)
      setError(`Speech recognition initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
  }

  // Send transcript to AI agent via ElevenLabs API
  const sendToAIAgent = async (transcript: string) => {
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID

    if (!apiKey || !agentId) {
      console.error('Missing API key or Agent ID')
      return
    }

    try {
      // For this demo, we'll simulate an AI response
      // In production, you would use ElevenLabs Conversational AI API
      simulateAIResponse(transcript)
      
      // Uncomment below for actual ElevenLabs API call
      /*
      const response = await fetch('https://api.elevenlabs.io/v1/convai/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          message: transcript
        })
      })

      if (response.ok) {
        const data = await response.json()
        onAgentResponse(data.response || 'AI response received')
      }
      */
    } catch (error) {
      console.error('Error sending to AI agent:', error)
    }
  }

  // Simulate AI response for demo purposes
  const simulateAIResponse = (userText: string) => {
    setTimeout(() => {
      const responses = [
        `I understand you said: "${userText}". Let me analyze that for you.`,
        `That's an interesting point about "${userText.slice(0, 50)}${userText.length > 50 ? '...' : ''}". Here's my analysis:`,
        `Based on your input: "${userText}", I can provide the following insights:`,
        `You mentioned: "${userText}". This suggests several key themes I'd like to explore:`,
        `Analyzing your statement: "${userText}". I notice some important patterns here:`
      ]
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      
      // Add some analytical content
      const analyses = [
        "This shows clear communication patterns and demonstrates thoughtful expression.",
        "The key themes here relate to human cognition and conversational dynamics.",
        "I detect emotional undertones and contextual significance in your message.",
        "This input reveals interesting linguistic patterns worth exploring further.",
        "Your expression shows depth and complexity that merits deeper analysis."
      ]
      
      const analysis = analyses[Math.floor(Math.random() * analyses.length)]
      const fullResponse = `${randomResponse} ${analysis}`
      
      onAgentResponse(fullResponse)
    }, 1000 + Math.random() * 2000) // Random delay 1-3 seconds
  }

  // Initialize audio stream
  const initializeAudioStream = async () => {
    try {
      onStatusChange('connecting')
      setError(null)

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

      // Initialize speech recognition
      if (!initializeSpeechRecognition()) {
        throw new Error('Speech recognition not available')
      }

      setIsConnected(true)
      onConnectionChange(true)
      onStatusChange('connected')

    } catch (err) {
      console.error('Error initializing audio stream:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize audio')
      onStatusChange('error')
    }
  }

  // Start/stop listening
  const toggleListening = async () => {
    if (!isListening) {
      if (!streamRef.current) {
        await initializeAudioStream()
      }
      
      if (recognitionRef.current && streamRef.current) {
        try {
          recognitionRef.current.start()
          setIsListening(true)
          onListeningChange(true)
          monitorAudioLevel()
        } catch (error) {
          console.error('Error starting speech recognition:', error)
          setError('Failed to start speech recognition')
        }
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      onListeningChange(false)
      setAudioLevel(0)
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Voice Streaming</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300"
        >
          <Settings className="w-5 h-5" />
        </motion.button>
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
        </motion.div>
      )}

      {/* Main control */}
      <div className="text-center">
        <motion.button
          onClick={toggleListening}
          disabled={false}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            relative w-24 h-24 rounded-full border-4 transition-all duration-300
            ${isListening 
              ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/25' 
              : 'bg-purple-500/20 border-purple-500 hover:bg-purple-500/30'
            }
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
            {isListening ? 'Listening...' : 'Click to start listening'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {isConnected ? 'Connected - Ready for voice input' : 'Click the button to connect'}
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

      {/* Browser compatibility note */}
      <div className="mt-4 text-xs text-slate-500 text-center">
        <p>Using Web Speech API for real-time transcription</p>
        <p>Works best in Chrome, Safari, and Edge</p>
      </div>
    </div>
  )
} 
