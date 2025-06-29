'use client'

import { useState, useEffect } from 'react'
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
  const [isClient, setIsClient] = useState(false)

  // Ensure this only runs on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

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

  // Don't render until we're on the client side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Bot className="w-8 h-8 mx-auto mb-4 text-slate-400 animate-pulse" />
          <p className="text-slate-400">Loading STFU Assistant...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative">
      {/* Sponsor Badges */}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
        {/* Bolt.new Badge - Required for hackathon */}
        <a 
          href="https://bolt.new/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:scale-105 transition-all duration-200 hover:drop-shadow-lg"
          aria-label="Built with Bolt.new"
        >
          <img 
            src="/white_circle_360x360.png" 
            alt="Built with Bolt.new" 
            className="w-12 h-12 md:w-16 md:h-16"
          />
        </a>

        {/* ElevenLabs Logo */}
        <a 
          href="https://elevenlabs.io/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:scale-105 transition-all duration-200 hover:drop-shadow-lg"
          aria-label="Powered by ElevenLabs"
        >
          <img 
            src="/elevenlabs-logo-white.svg" 
            alt="Powered by ElevenLabs" 
            className="h-6 md:h-8 w-auto"
          />
        </a>
      </div>

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