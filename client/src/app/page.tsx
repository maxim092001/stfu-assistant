'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import VoiceStreaming from '@/components/VoiceStreaming'
import TranscriptDisplay from '@/components/TranscriptDisplay'
import AgentResponseDisplay from '@/components/AgentResponseDisplay'
import StatusIndicator from '@/components/StatusIndicator'

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [userTranscript, setUserTranscript] = useState('')
  const [agentResponse, setAgentResponse] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected)
    setConnectionStatus(connected ? 'connected' : 'disconnected')
  }

  const handleListeningChange = (listening: boolean) => {
    setIsListening(listening)
  }

  const handleUserTranscript = (transcript: string) => {
    setUserTranscript(transcript)
  }

  const handleAgentResponse = (response: string) => {
    setAgentResponse(response)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      {/* Main container */}
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: isListening ? 360 : 0 }}
              transition={{ duration: 2, repeat: isListening ? Infinity : 0, ease: "linear" }}
              className="p-3 bg-purple-600/20 rounded-full backdrop-blur-sm border border-purple-500/30"
            >
              <Zap className="w-8 h-8 text-purple-400" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              STFU Assistant
            </h1>
          </div>
          <p className="text-slate-300 text-lg">
            Real-time voice streaming with AI analysis
          </p>
          <StatusIndicator status={connectionStatus} isListening={isListening} />
        </motion.header>

        {/* Main content grid */}
        <div className="flex-1 grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
          {/* Left column - Voice streaming controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <VoiceStreaming
              onConnectionChange={handleConnectionChange}
              onListeningChange={handleListeningChange}
              onUserTranscript={handleUserTranscript}
              onAgentResponse={handleAgentResponse}
              onStatusChange={setConnectionStatus}
            />
            
            <TranscriptDisplay
              transcript={userTranscript}
              isListening={isListening}
            />
          </motion.div>

          {/* Right column - Agent responses */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AgentResponseDisplay
              response={agentResponse}
              isConnected={isConnected}
            />
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-400 text-sm mt-8"
        >
          <p>Powered by ElevenLabs Conversational AI • Real-time voice streaming</p>
        </motion.footer>
      </div>
    </div>
  )
}
