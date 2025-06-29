'use client'

import { CheckCircle, AlertTriangle, Loader2, XCircle, Mic, MicOff } from 'lucide-react'

interface StatusIndicatorProps {
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  isListening: boolean
}

export default function StatusIndicator({ status, isListening }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'text-green-400',
          icon: CheckCircle,
          text: 'Connected'
        }
      case 'connecting':
        return {
          color: 'text-yellow-400',
          icon: Loader2,
          text: 'Connecting...'
        }
      case 'error':
        return {
          color: 'text-red-400',
          icon: AlertTriangle,
          text: 'Error'
        }
      default:
        return {
          color: 'text-slate-400',
          icon: XCircle,
          text: 'Disconnected'
        }
    }
  }

  const config = getStatusConfig()
  const StatusIcon = config.icon

  return (
    <div className="mt-3 flex items-center justify-center">
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          <StatusIcon className={`w-3 h-3 ${config.color} ${status === 'connecting' ? 'animate-spin' : ''}`} />
          <span className={`text-xs ${config.color}`}>
            {config.text}
          </span>
        </div>

        {/* Listening status */}
        {status === 'connected' && (
          <>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center gap-1.5">
              {isListening ? (
                <Mic className="w-3 h-3 text-green-400" />
              ) : (
                <MicOff className="w-3 h-3 text-slate-500" />
              )}
              <span className={`text-xs ${isListening ? 'text-green-400' : 'text-slate-500'}`}>
                {isListening ? 'Listening' : 'Idle'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 
