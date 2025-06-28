// ElevenLabs WebSocket API Types

export type BaseEvent = {
  type: string;
};

export type ConversationInitiationClientData = BaseEvent & {
  type: "conversation_initiation_client_data";
  conversation_config_override?: {
    agent?: {
      prompt?: string;
      first_message?: string;
      language?: string;
    };
    tts?: {
      voice_id?: string;
    };
  };
  custom_llm_extra_body?: Record<string, any>;
  dynamic_variables?: Record<string, string>;
};

export type ConversationInitiationMetadata = BaseEvent & {
  type: "conversation_initiation_metadata";
  conversation_initiation_metadata_event: {
    conversation_id: string;
  };
};

export type UserAudioChunk = BaseEvent & {
  user_audio_chunk: string; // base64 encoded audio
};

export type UserTranscriptEvent = BaseEvent & {
  type: "user_transcript";
  user_transcription_event: {
    user_transcript: string;
  };
};

export type AgentResponseEvent = BaseEvent & {
  type: "agent_response";
  agent_response_event: {
    agent_response: string;
  };
};

export type AudioResponseEvent = BaseEvent & {
  type: "audio";
  audio_event: {
    audio_base_64: string;
    event_id: number;
  };
};

export type InterruptionEvent = BaseEvent & {
  type: "interruption";
  interruption_event: {
    reason: string;
  };
};

export type PingEvent = BaseEvent & {
  type: "ping";
  ping_event: {
    event_id: number;
    ping_ms?: number;
  };
};

export type PongEvent = BaseEvent & {
  type: "pong";
  event_id: number;
};

export type VADScoreEvent = BaseEvent & {
  type: "vad_score";
  vad_score_event: {
    vad_score: number;
  };
};

export type InternalTentativeAgentResponseEvent = BaseEvent & {
  type: "internal_tentative_agent_response";
  tentative_agent_response_internal_event: {
    tentative_agent_response: string;
  };
};

export type ElevenLabsWebSocketEvent =
  | ConversationInitiationMetadata
  | UserTranscriptEvent
  | AgentResponseEvent
  | AudioResponseEvent
  | InterruptionEvent
  | PingEvent
  | VADScoreEvent
  | InternalTentativeAgentResponseEvent;

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
    event_id: string
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
    event_id: string
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
