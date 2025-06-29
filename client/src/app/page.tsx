'use client'

import { useState } from 'react'
import { Bot } from 'lucide-react'
import VoiceStreaming from '@/components/VoiceStreaming'
import TranscriptDisplay from '@/components/TranscriptDisplay'
import AgentResponseDisplay from '@/components/AgentResponseDisplay'
import StatusIndicator from '@/components/StatusIndicator'

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
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

  const handleMutedChange = (muted: boolean) => {
    setIsMuted(muted)
  }

  const handleUserTranscript = (transcript: string) => {
    setUserTranscript(transcript)
  }

  const handleAgentResponse = (response: string) => {
    setAgentResponse(response)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-6 min-h-screen flex flex-col">
        {/* Header */}
        <header className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bot className="w-5 h-5 text-slate-400" />
            <h1 className="text-xl font-medium text-white">STFU Assistant</h1>
          </div>
          <p className="text-sm text-slate-400">Real-time voice streaming with AI analysis</p>
          <StatusIndicator status={connectionStatus} isListening={isListening} />
        </header>

        {/* Main content */}
        <div className="flex-1 grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto w-full">
          {/* Left column */}
          <div className="space-y-4">
            <VoiceStreaming
              onConnectionChange={handleConnectionChange}
              onListeningChange={handleListeningChange}
              onMutedChange={handleMutedChange}
              onUserTranscript={handleUserTranscript}
              onAgentResponse={handleAgentResponse}
              onStatusChange={setConnectionStatus}
            />
            
            <TranscriptDisplay
              transcript={userTranscript}
              isListening={isListening}
              isMuted={isMuted}
            />
          </div>

          {/* Right column */}
          <div>
            <AgentResponseDisplay
              response={agentResponse}
              isConnected={isConnected}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 mt-6">
          <p>Powered by ElevenLabs Conversational AI</p>
        </footer>
      </div>
    </div>
  )
}
