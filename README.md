# STFU Assistant - Stage 1

Simple real-time speech-to-text using ElevenLabs Speech-to-Text API.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file with your ElevenLabs API key:
```
ELEVENLABS_API_KEY=your_api_key_here
```

4. Run:
```bash
python stfu_stage1.py
```

## What it does

- Uses ElevenLabs Speech-to-Text API for real-time transcription
- Greets you with "Hello! I am ready to listen and log everything you say."
- Captures audio in 3-second chunks and transcribes using Whisper model
- Displays transcribed text in real-time with timestamps
- Logs all speech to a text file for later review 
