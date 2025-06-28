#!/usr/bin/env python3
"""
STFU Assistant - Speech to Text using ElevenLabs Conversational AI
This implementation uses Conversational AI to capture speech-to-text AND
logs the LLM's analysis of the speech without voice output.
"""

import os
import signal
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
        self.conversation = None
        
        print("🛡️ STFU Assistant - Conversational AI Speech-to-Text + LLM Analysis")
        print("Using ElevenLabs Conversational AI for real-time transcription and analysis")
        print("🔇 Agent voice output is muted - capturing speech and LLM analysis as text")
    
    def start_monitoring(self):
        """Start real-time speech monitoring with LLM analysis"""
        print("\n🤖 Hello! I am ready to listen, transcribe, and analyze everything you say.")
        
        try:
            # Test microphone first
            print("🎤 Testing microphone access...")
            
            # Option to test with default audio interface first
            use_default_audio = False  # Set to True to test with default audio
            
            if use_default_audio:
                print("🔧 Using DEFAULT audio interface for testing...")
                audio_interface = DefaultAudioInterface()
            else:
                print("🔧 Using SILENT audio interface...")
                audio_interface = SilentAudioInterface(self.client)
            
            # Initialize the conversation
            self.conversation = Conversation(
                # API client and agent ID
                self.client,
                self.agent_id,
                
                # Require auth when API key is set
                requires_auth=bool(self.api_key),
                callback_user_transcript=lambda transcript: print(f"🔊 User transcript: {transcript}"),
                callback_agent_response=lambda response: print(f"🔊 Agent response: {response}"),
                # Use the audio interface
                audio_interface=audio_interface,
            )
            
            # Set up signal handler for clean shutdown
            signal.signal(signal.SIGINT, self._signal_handler)
            
            self.conversation.start_session()
            
            # Wait for the conversation to end
            conversation_id = self.conversation.wait_for_session_end()
            print(f"\n📋 Conversation ID: {conversation_id}")
            
        except KeyboardInterrupt:
            print("\n🛑 Stopping speech monitoring...")
        except Exception as e:
            print(e)
        finally:
            self._cleanup()
    
    def _signal_handler(self, sig, frame):
        """Handle Ctrl+C signal"""
        print("\n🛑 Received stop signal...")
        if self.conversation:
            self.conversation.end_session()

    
    def _cleanup(self):
        """Cleanup resources"""
        if self.conversation:
            try:
                self.conversation.end_session()
            except:
                pass
    
class SilentAudioInterface(DefaultAudioInterface):
    """Custom audio interface that mutes agent speech output but converts it to text"""
    
    def __init__(self, elevenlabs_client: ElevenLabs):
        super().__init__()
        self.elevenlabs_client = elevenlabs_client
        print("🔇 Initialized silent audio interface - converting agent speech to text")
    
    def output(self, audio):
        """Convert agent response audio to text instead of playing it"""
        # if audio and len(audio) > 0:
        #     try:
        #         from io import BytesIO
        #         import time
        #         import wave
                
        #         # Convert raw PCM audio to WAV format
        #         wav_buffer = BytesIO()
        #         with wave.open(wav_buffer, 'wb') as wav_file:
        #             wav_file.setnchannels(1)  # Mono
        #             wav_file.setsampwidth(2)  # 16-bit
        #             wav_file.setframerate(16000)  # 16kHz
        #             wav_file.writeframes(audio)
                
        #         wav_buffer.seek(0)
                
        #         # Convert agent response audio to text
        #         transcription = self.elevenlabs_client.speech_to_text.convert(
        #             file=wav_buffer,
        #             model_id="scribe_v1",
        #             language_code="eng"
        #         )
                
        #         # Display the AI analysis as text
        #         if transcription and transcription.text:
        #             timestamp = time.strftime("%H:%M:%S")
        #             print(f"🧠 [{timestamp}] AI Analysis: {transcription.text}")
                
        #     except Exception as e:
        #         print(f"⚠️ Speech to text conversion error: {e}")
        
        # Don't actually play the audio
        pass
    


def main():
    """Main function"""
    print("🔧 Setting up ElevenLabs Conversational AI for speech-to-text + LLM analysis...")
    
    print("\n💡 Make sure you have:")
    print("   1. ELEVENLABS_API_KEY in your .env file")
    print("   2. ELEVENLABS_AGENT_ID in your .env file (create an agent first)")
    print("   3. Configure your agent with a good analysis prompt")
    print("   4. Microphone permissions granted")
    print()
    print("💭 Tip: Set your agent's prompt to something like:")
    print("   'Analyze and summarize what the user says. Provide insights, themes, or key points.'")
    print()
    print("🎤 IMPORTANT: Make sure:")
    print("   - Your microphone is working (test in another app)")
    print("   - No other app is using the microphone")
    print("   - Python/Terminal has microphone permissions")
    print("   - You're not muted in system settings")
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
