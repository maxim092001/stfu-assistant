#!/usr/bin/env python3
"""
STFU Assistant - Speech to Text using ElevenLabs Conversational AI
This implementation uses Conversational AI but mutes the agent's voice response,
effectively using it as a real-time speech-to-text service.
"""

import os
import signal
from datetime import datetime
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs.conversational_ai.conversation import Conversation
from elevenlabs.conversational_ai.default_audio_interface import DefaultAudioInterface

load_dotenv()

class STFUConversationalAI:
    """Speech to Text using ElevenLabs Conversational AI (silent agent)"""
    
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        self.agent_id = os.getenv("ELEVENLABS_AGENT_ID")
        
        if not self.api_key:
            print("❌ Error: ELEVENLABS_API_KEY not found in .env file")
            return
            
        if not self.agent_id:
            print("❌ Error: ELEVENLABS_AGENT_ID not found in .env file")
            print("💡 You need to create a Conversational AI agent and add its ID to your .env file")
            return
        
        # Initialize ElevenLabs client
        self.client = ElevenLabs(api_key=self.api_key)
        
        # Conversation log
        self.conversation_log = []
        self.conversation = None
        self.is_listening = False
        
        print("🛡️ STFU Assistant - Conversational AI Speech-to-Text")
        print("Using ElevenLabs Conversational AI for real-time transcription")
        print("🔇 Agent voice output is muted - only capturing your speech")
    
    def start_monitoring(self):
        """Start real-time speech monitoring using Conversational AI"""
        print("\n🤖 Hello! I am ready to listen and log everything you say.")
        print("🎤 Starting Conversational AI speech monitoring...")
        print("🗣️  Speak naturally - I'll capture your speech in real-time")
        print("🔇 The AI agent won't speak back - this is speech-to-text only")
        print("🛑 Press Ctrl+C to stop\n")
        
        try:
            # Create a custom audio interface that mutes output
            audio_interface = SilentAudioInterface()
            
            # Initialize the conversation
            self.conversation = Conversation(
                # API client and agent ID
                self.client,
                self.agent_id,
                
                # Require auth when API key is set
                requires_auth=bool(self.api_key),
                
                # Use the silent audio interface (no speech output)
                audio_interface=audio_interface,
                
                # Capture user transcripts
                callback_user_transcript=self._log_user_speech,
                
                # Suppress agent responses (we only want transcription)
                callback_agent_response=self._suppress_agent_response,
                callback_agent_response_correction=self._suppress_agent_correction,
                
                # Optional: uncomment to see latency measurements
                # callback_latency_measurement=lambda latency: print(f"⚡ Latency: {latency}ms"),
            )
            
            self.is_listening = True
            
            # Set up signal handler for clean shutdown
            signal.signal(signal.SIGINT, self._signal_handler)
            
            # Start the conversation session
            print("🔄 Starting Conversational AI session...")
            self.conversation.start_session()
            
            # Wait for the conversation to end
            conversation_id = self.conversation.wait_for_session_end()
            print(f"\n📋 Conversation ID: {conversation_id}")
            
        except KeyboardInterrupt:
            print("\n🛑 Stopping speech monitoring...")
        except Exception as e:
            print(f"❌ Error starting Conversational AI: {e}")
        finally:
            self._cleanup()
            self._save_log()
    
    def _signal_handler(self, sig, frame):
        """Handle Ctrl+C signal"""
        print("\n🛑 Received stop signal...")
        self.is_listening = False
        if self.conversation:
            self.conversation.end_session()
    
    def _log_user_speech(self, transcript):
        """Log user speech transcripts (callback for user speech)"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Add to conversation log
        self.conversation_log.append({
            "timestamp": timestamp,
            "text": transcript
        })
        
        # Display the transcription
        print(f"📝 [{timestamp}] You said: \"{transcript}\"")
    
    def _suppress_agent_response(self, response):
        """Suppress agent responses - we only want speech-to-text"""
        # Don't print or play agent responses
        # The agent processes the speech but we ignore its output
        pass
    
    def _suppress_agent_correction(self, original, corrected):
        """Suppress agent response corrections"""
        # Don't print or play agent corrections
        pass
    
    def _cleanup(self):
        """Cleanup resources"""
        if self.conversation:
            try:
                self.conversation.end_session()
            except:
                pass
    
    def _save_log(self):
        """Save conversation log to file"""
        if not self.conversation_log:
            print("No speech was detected during this session.")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_filename = f"speech_log_conversational_{timestamp}.txt"
        
        with open(log_filename, 'w') as f:
            f.write("STFU Assistant - Conversational AI Speech Log\n")
            f.write("=" * 50 + "\n\n")
            
            for entry in self.conversation_log:
                f.write(f"[{entry['timestamp']}] {entry['text']}\n")
        
        print(f"\n📁 Speech log saved to: {log_filename}")
        print(f"📊 Total phrases captured: {len(self.conversation_log)}")


class SilentAudioInterface(DefaultAudioInterface):
    """Custom audio interface that mutes agent speech output"""
    
    def __init__(self):
        super().__init__()
        print("🔇 Initialized silent audio interface - agent voice is muted")
    
    def output(self, audio):
        """Override output to suppress agent speech"""
        # Don't play the agent's audio response
        # This effectively mutes the AI assistant while keeping speech recognition
        pass
    
    def interrupt(self):
        """Override interrupt handling"""
        # Handle interruptions silently
        pass


def main():
    """Main function"""
    print("🔧 Setting up ElevenLabs Conversational AI for speech-to-text...")
    print("💡 Make sure you have:")
    print("   1. ELEVENLABS_API_KEY in your .env file")
    print("   2. ELEVENLABS_AGENT_ID in your .env file (create an agent first)")
    print()
    
    assistant = STFUConversationalAI()
    if assistant.api_key and assistant.agent_id:
        assistant.start_monitoring()
    else:
        print("\n❌ Missing required environment variables")
        print("📖 Please check the ElevenLabs Conversational AI documentation:")
        print("   https://elevenlabs.io/docs/conversational-ai/quickstart")

if __name__ == "__main__":
    main() 
