#!/usr/bin/env python3
"""
STFU Assistant - Speech to Text using ElevenLabs Conversational AI
This implementation uses Conversational AI to capture speech-to-text AND
logs the LLM's analysis of the speech without voice output.
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
    """Speech to Text + LLM Analysis using ElevenLabs Conversational AI (silent voice)"""
    
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
        
        print("🛡️ STFU Assistant - Conversational AI Speech-to-Text + LLM Analysis")
        print("Using ElevenLabs Conversational AI for real-time transcription and analysis")
        print("🔇 Agent voice output is muted - capturing speech and LLM analysis as text")
    
    def start_monitoring(self):
        """Start real-time speech monitoring with LLM analysis"""
        print("\n🤖 Hello! I am ready to listen, transcribe, and analyze everything you say.")
        print("🎤 Starting Conversational AI speech monitoring...")
        print("🗣️  Speak naturally - I'll capture your speech and provide AI analysis")
        print("🔇 The AI agent won't speak back - text analysis only")
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
                
                # Process LLM responses (instead of suppressing them)
                callback_agent_response=self._log_agent_analysis,
                callback_agent_response_correction=self._log_agent_correction,
                
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
            "type": "user_speech",
            "text": transcript
        })
        
        # Display the transcription
        print(f"📝 [{timestamp}] You said: \"{transcript}\"")
    
    def _log_agent_analysis(self, response):
        """Log LLM analysis responses (callback for agent responses)"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Add to conversation log
        self.conversation_log.append({
            "timestamp": timestamp,
            "type": "llm_analysis",
            "text": response
        })
        
        # Display the LLM analysis
        print(f"🧠 [{timestamp}] AI Analysis: \"{response}\"")
    
    def _log_agent_correction(self, original, corrected):
        """Log agent response corrections"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Add correction to conversation log
        self.conversation_log.append({
            "timestamp": timestamp,
            "type": "llm_correction",
            "text": f"Corrected: '{original}' → '{corrected}'"
        })
        
        # Display the correction
        print(f"✏️ [{timestamp}] AI Correction: '{original}' → '{corrected}'")
    
    def _cleanup(self):
        """Cleanup resources"""
        if self.conversation:
            try:
                self.conversation.end_session()
            except:
                pass
    
    def _save_log(self):
        """Save conversation log to file with both speech and analysis"""
        if not self.conversation_log:
            print("No speech was detected during this session.")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_filename = f"speech_log_conversational_{timestamp}.txt"
        
        with open(log_filename, 'w') as f:
            f.write("STFU Assistant - Conversational AI Speech + LLM Analysis Log\n")
            f.write("=" * 60 + "\n\n")
            
            for entry in self.conversation_log:
                entry_type = entry.get('type', 'unknown')
                if entry_type == 'user_speech':
                    f.write(f"[{entry['timestamp']}] USER: {entry['text']}\n")
                elif entry_type == 'llm_analysis':
                    f.write(f"[{entry['timestamp']}] AI: {entry['text']}\n")
                elif entry_type == 'llm_correction':
                    f.write(f"[{entry['timestamp']}] CORRECTION: {entry['text']}\n")
                else:
                    f.write(f"[{entry['timestamp']}] {entry['text']}\n")
                f.write("\n")  # Add spacing between entries
        
        # Count different types of entries
        user_entries = len([e for e in self.conversation_log if e.get('type') == 'user_speech'])
        ai_entries = len([e for e in self.conversation_log if e.get('type') == 'llm_analysis'])
        
        print(f"\n📁 Speech + Analysis log saved to: {log_filename}")
        print(f"📊 Total user phrases: {user_entries}")
        print(f"🧠 Total AI analyses: {ai_entries}")


class SilentAudioInterface(DefaultAudioInterface):
    """Custom audio interface that mutes agent speech output but keeps processing"""
    
    def __init__(self):
        super().__init__()
        print("🔇 Initialized silent audio interface - agent voice is muted, text analysis enabled")
    
    def output(self, audio):
        """Override output to suppress agent speech"""
        # Don't play the agent's audio response
        # This effectively mutes the AI assistant while keeping text analysis
        pass
    
    def interrupt(self):
        """Override interrupt handling"""
        # Handle interruptions silently
        pass


def main():
    """Main function"""
    print("🔧 Setting up ElevenLabs Conversational AI for speech-to-text + LLM analysis...")
    print("💡 Make sure you have:")
    print("   1. ELEVENLABS_API_KEY in your .env file")
    print("   2. ELEVENLABS_AGENT_ID in your .env file (create an agent first)")
    print("   3. Configure your agent with a good analysis prompt")
    print()
    print("💭 Tip: Set your agent's prompt to something like:")
    print("   'Analyze and summarize what the user says. Provide insights, themes, or key points.'")
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
