'use client'

import { motion } from 'framer-motion'
import { Wifi, WifiOff, Mic, MicOff, AlertTriangle, CheckCircle } from 'lucide-react'

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
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          icon: CheckCircle,
          text: 'Connected',
          description: 'Ready to stream audio'
        }
      case 'connecting':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          icon: Wifi,
          text: 'Connecting...',
          description: 'Establishing connection'
        }
      case 'error':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          icon: AlertTriangle,
          text: 'Connection Error',
          description: 'Failed to connect to AI agent'
        }
      default:
        return {
          color: 'text-slate-400',
          bgColor: 'bg-slate-500/20',
          borderColor: 'border-slate-500/30',
          icon: WifiOff,
          text: 'Disconnected',
          description: 'Click to start listening'
        }
    }
  }

  const config = getStatusConfig()
  const StatusIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 flex items-center justify-center"
    >
      <div className={`
        flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-sm
        ${config.bgColor} ${config.borderColor}
      `}>
        {/* Connection status */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={status === 'connecting' ? { rotate: 360 } : {}}
            transition={{ duration: 2, repeat: status === 'connecting' ? Infinity : 0, ease: "linear" }}
          >
            <StatusIcon className={`w-4 h-4 ${config.color}`} />
          </motion.div>
          <span className={`text-sm font-medium ${config.color}`}>
            {config.text}
          </span>
        </div>

        {/* Divider */}
        {status === 'connected' && (
          <>
            <div className={`w-px h-4 ${config.borderColor}`} />
            
            {/* Listening status */}
            <div className="flex items-center gap-2">
              <motion.div
                animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1, repeat: isListening ? Infinity : 0 }}
              >
                {isListening ? (
                  <Mic className="w-4 h-4 text-red-400" />
                ) : (
                  <MicOff className="w-4 h-4 text-slate-400" />
                )}
              </motion.div>
              <span className={`text-sm font-medium ${isListening ? 'text-red-400' : 'text-slate-400'}`}>
                {isListening ? 'Listening' : 'Idle'}
              </span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
} 
