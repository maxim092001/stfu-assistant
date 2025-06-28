#!/usr/bin/env python3
"""
STFU Assistant - Real-time Speech to Text using ONLY ElevenLabs Speech-to-Text API
"""

import os
import pyaudio
import wave
import tempfile
import time
from datetime import datetime
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

load_dotenv()

class STFUStage1:
    """Stage 1: Speech to Text using ONLY ElevenLabs Speech-to-Text API"""
    
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        
        if not self.api_key:
            print("❌ Error: ELEVENLABS_API_KEY not found in .env file")
            return
        
        # Initialize ElevenLabs client
        self.client = ElevenLabs(api_key=self.api_key)
        
        # Audio configuration - optimized for ElevenLabs STT compatibility
        self.chunk_size = 4096  # Larger chunks for stability
        self.sample_rate = 16000  # 16kHz is standard for speech recognition
        self.channels = 1
        self.audio_format = pyaudio.paInt16  # 16-bit PCM
        self.record_duration = 3  # 3-second chunks for balance of speed/accuracy
        
        # Audio objects
        self.audio = pyaudio.PyAudio()
        self.is_listening = False
        
        # Conversation log
        self.conversation_log = []
        
        print("🛡️ STFU Assistant - ElevenLabs Real-time STT")
        print("Using ONLY ElevenLabs Speech-to-Text API")
        print("⚠️  ElevenLabs STT requires file uploads, optimized for best real-time performance")
    
    def start_monitoring(self):
        """Start real-time speech monitoring using ElevenLabs STT"""
        print("\n🤖 Hello! I am ready to listen and log everything you say.")
        print("🎤 Starting ElevenLabs STT monitoring...")
        print("🗣️  Speak naturally - I'll convert your speech to text")
        print("⏱️  Processing in 3-second segments for optimal balance")
        print("🛑 Press Ctrl+C to stop\n")
        
        self.is_listening = True
        
        try:
            while self.is_listening:
                self._record_and_transcribe()
        except KeyboardInterrupt:
            print("\n🛑 Stopping speech monitoring...")
            self.is_listening = False
        finally:
            self._cleanup()
            self._save_log()
    
    def _record_and_transcribe(self):
        """Record audio chunk and transcribe using ElevenLabs STT"""
        temp_path = None
        try:
            # Record audio
            stream = self.audio.open(
                format=self.audio_format,
                channels=self.channels,
                rate=self.sample_rate,
                input=True,
                frames_per_buffer=self.chunk_size
            )
            
            print("🎤 Listening...")
            frames = []
            
            # Record for specified duration
            frames_to_record = int(self.sample_rate / self.chunk_size * self.record_duration)
            for _ in range(frames_to_record):
                if not self.is_listening:
                    break
                try:
                    data = stream.read(self.chunk_size, exception_on_overflow=False)
                    frames.append(data)
                except IOError as e:
                    print(f"⚠️ Audio input error: {e}")
                    continue
            
            stream.stop_stream()
            stream.close()
            
            if not frames or len(frames) < frames_to_record // 2:
                print("🔇 Insufficient audio data, skipping...")
                return
            
            # Create audio data
            audio_data = b''.join(frames)
            
            # Check if audio has sufficient content (at least 1 second of audio)
            min_audio_length = self.sample_rate * 2 * 1  # 1 second of 16-bit audio
            if len(audio_data) < min_audio_length:
                print("🔇 Audio segment too short, skipping...")
                return
            
            # Create temporary WAV file with proper format for ElevenLabs
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_path = temp_file.name
            
            # Write properly formatted WAV file
            try:
                with wave.open(temp_path, 'wb') as wf:
                    wf.setnchannels(self.channels)
                    wf.setsampwidth(self.audio.get_sample_size(self.audio_format))
                    wf.setframerate(self.sample_rate)
                    wf.writeframes(audio_data)
                
                # Verify the file was written correctly
                with wave.open(temp_path, 'rb') as wf:
                    if wf.getnframes() == 0:
                        print("❌ Generated WAV file is empty")
                        return
                
                print("🔄 Converting speech to text with ElevenLabs...")
                
                # Transcribe using ElevenLabs Speech-to-Text API
                with open(temp_path, 'rb') as audio_file:
                    result = self.client.speech_to_text.convert(
                        file=audio_file,
                        model_id="scribe_v1",
                        language_code="en"
                    )
                
                # Process transcription result
                if result and hasattr(result, 'text') and result.text.strip():
                    self._log_user_speech(result.text.strip())
                else:
                    print("🔇 No speech detected in this segment")
                    
            except Exception as stt_error:
                print(f"❌ ElevenLabs STT Error: {stt_error}")
                # Try to get more specific error info
                if hasattr(stt_error, 'response'):
                    print(f"   Response: {stt_error.response}")
                if hasattr(stt_error, 'status_code'):
                    print(f"   Status Code: {stt_error.status_code}")
                    
        except Exception as e:
            print(f"❌ Error in speech processing: {e}")
        finally:
            # Always clean up temp file
            if temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except:
                    pass
            time.sleep(0.1)  # Brief pause before next iteration
    
    def _log_user_speech(self, transcript):
        """Log user speech transcripts"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Add to conversation log
        self.conversation_log.append({
            "timestamp": timestamp,
            "text": transcript
        })
        
        # Display the transcription
        print(f"📝 [{timestamp}] You said: \"{transcript}\"")
    
    def _cleanup(self):
        """Cleanup audio resources"""
        if hasattr(self, 'audio'):
            self.audio.terminate()
    
    def _save_log(self):
        """Save conversation log to file"""
        if not self.conversation_log:
            print("No speech was detected during this session.")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_filename = f"speech_log_{timestamp}.txt"
        
        with open(log_filename, 'w') as f:
            f.write("STFU Assistant - ElevenLabs Speech Log\n")
            f.write("=" * 45 + "\n\n")
            
            for entry in self.conversation_log:
                f.write(f"[{entry['timestamp']}] {entry['text']}\n")
        
        print(f"\n📁 Speech log saved to: {log_filename}")
        print(f"📊 Total phrases captured: {len(self.conversation_log)}")

def main():
    """Main function"""
    assistant = STFUStage1()
    if assistant.api_key:
        assistant.start_monitoring()

if __name__ == "__main__":
    main() 
