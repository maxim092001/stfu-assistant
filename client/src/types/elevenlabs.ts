// ElevenLabs WebSocket API Types

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface AudioQueueItem {
  audioData: string;
  eventId: string;
}

// WebSocket Event Types from ElevenLabs API
export interface ConversationInitiationMetadataEvent {
  type: 'conversation_initiation_metadata'
  conversation_initiation_metadata_event: {
    conversation_id: string
  }
}

export interface UserTranscriptionEvent {
  type: 'user_transcript'
  user_transcription_event: {
    user_transcript: string
  }
}

export interface AgentResponseEvent {
  type: 'agent_response'
  agent_response_event: {
    agent_response: string
  }
}

export interface AudioEvent {
  type: 'audio'
  audio_event: {
    audio_base_64: string
    event_id: number
  }
}

export interface InterruptionEvent {
  type: 'interruption'
  interruption_event: {
    reason: string
  }
}

export interface PingEvent {
  type: 'ping'
  ping_event: {
    event_id: number
    ping_ms?: number
  }
}

export interface VadScoreEvent {
  type: 'vad_score'
  vad_score_event: {
    score: number
  }
}

export interface InternalTentativeAgentResponseEvent {
  type: 'internal_tentative_agent_response'
  internal_tentative_agent_response_event: {
    tentative_agent_response: string
  }
}

// Union type for all possible WebSocket events
export type ElevenLabsWebSocketEvent = 
  | ConversationInitiationMetadataEvent
  | UserTranscriptionEvent
  | AgentResponseEvent
  | AudioEvent
  | InterruptionEvent
  | PingEvent
  | VadScoreEvent
  | InternalTentativeAgentResponseEvent 
