# STFU Assistant - NextJS Frontend

A sophisticated real-time voice streaming application with ElevenLabs Conversational AI integration. This frontend provides a sleek interface for continuously streaming voice to an ElevenLabs agent and displaying AI responses in real-time.

## Features

- 🎤 **Real-time Voice Streaming**: Continuous voice capture and streaming
- 🤖 **AI Agent Integration**: ElevenLabs Conversational AI with real-time responses
- 📝 **Live Transcription**: Speech-to-text with real-time display
- 🎨 **Modern UI**: Sleek, animated interface with Tailwind CSS
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔄 **Real-time Updates**: Live status indicators and audio level monitoring
- 💾 **Export Features**: Download transcripts and copy text
- ⭐ **Response Rating**: Rate AI responses for feedback

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **ElevenLabs SDK** - AI voice and conversational AI
- **Web Audio API** - Real-time audio processing
- **WebSockets** - Real-time communication

## Prerequisites

1. **Node.js 18+** installed
2. **ElevenLabs API Key** from [ElevenLabs](https://elevenlabs.io/)
3. **ElevenLabs Agent ID** (create a Conversational AI agent)

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the client directory:

```env
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
```

### 2. Get ElevenLabs Credentials

#### API Key:
1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up/Login
3. Navigate to your profile settings
4. Copy your API key

#### Agent ID:
1. Go to [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
2. Create a new agent or use an existing one
3. Configure your agent with a good analysis prompt, such as:
   ```
   You are an intelligent voice assistant that analyzes and responds to user speech in real-time. 
   Provide helpful insights, summaries, and analysis of what the user says. 
   Be concise but informative. Focus on key points, themes, and actionable insights.
   ```
4. Copy the Agent ID from the agent settings

### 3. Install Dependencies

```bash
cd client
npm install
```

### 4. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Browser Permissions

Make sure to grant microphone permissions when prompted. The application requires:
- Microphone access for voice streaming
- Clipboard access for copy features (optional)

## Usage Guide

### Getting Started

1. **Connect**: Click the microphone button to initialize the connection
2. **Grant Permissions**: Allow microphone access when prompted
3. **Start Speaking**: The app will continuously listen and transcribe your voice
4. **View AI Responses**: AI analysis appears in the right panel with typewriter effect
5. **Manage Transcripts**: Use the action buttons to copy, download, or clear transcripts

### Features Walkthrough

#### Voice Streaming
- **Audio Level**: Visual feedback shows your voice level
- **Real-time Transcription**: See your words appear as you speak
- **Connection Status**: Clear indicators show connection and listening state

#### AI Responses
- **Typewriter Effect**: Responses appear with smooth typing animation
- **Response Rating**: Rate responses with thumbs up/down
- **Copy & Export**: Copy individual responses or export full conversations

#### Interface Elements
- **Status Indicators**: Real-time connection and listening status
- **Audio Visualization**: Live audio level bars
- **Smooth Animations**: Polished transitions and micro-interactions
- **Responsive Layout**: Adapts to different screen sizes

## Troubleshooting

### Common Issues

**Microphone Not Working:**
- Check browser permissions (look for microphone icon in address bar)
- Ensure no other applications are using the microphone
- Try refreshing the page and granting permissions again

**Connection Errors:**
- Verify your API key and Agent ID are correct
- Check your internet connection
- Ensure your ElevenLabs account has sufficient credits

**No AI Responses:**
- Check that your agent is properly configured
- Verify the agent ID matches your created agent
- Ensure the agent has a proper system prompt

**Audio Quality Issues:**
- Check your microphone quality
- Ensure you're in a quiet environment
- Try adjusting your distance from the microphone

### Browser Compatibility

- **Chrome**: Full support (recommended)
- **Safari**: Full support
- **Firefox**: Full support
- **Edge**: Full support

**Note**: The application requires a modern browser with Web Audio API support.

## Development

### Project Structure

```
client/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main application page
│   │   └── layout.tsx        # Root layout
│   └── components/
│       ├── VoiceStreaming.tsx       # Voice capture and streaming
│       ├── TranscriptDisplay.tsx    # User transcript display
│       ├── AgentResponseDisplay.tsx # AI response display
│       └── StatusIndicator.tsx      # Connection status
├── public/
│   └── grid.svg              # Background pattern
├── tailwind.config.ts        # Tailwind configuration
└── package.json
```

### Key Components

1. **VoiceStreaming**: Handles microphone access, audio processing, and ElevenLabs integration
2. **TranscriptDisplay**: Shows user speech transcription with export features
3. **AgentResponseDisplay**: Displays AI responses with rating and interaction features
4. **StatusIndicator**: Real-time status updates for connection and listening state

### Customization

#### Styling
- Modify `tailwind.config.ts` for custom themes
- Update component styles in individual files
- Add new animations in the Tailwind config

#### Features
- Extend the `VoiceStreaming` component for additional audio processing
- Add new response formats in `AgentResponseDisplay`
- Implement additional export formats in transcript management

## Production Deployment

### Build

```bash
npm run build
```

### Deploy

The application can be deployed on:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Any static hosting provider**

### Environment Variables

Ensure production environment variables are set:
- `NEXT_PUBLIC_ELEVENLABS_API_KEY`
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`

## Performance Considerations

- **Audio Streaming**: Optimized for low-latency real-time processing
- **Memory Management**: Automatic cleanup of audio streams and connections
- **Efficient Rendering**: Optimized component updates for smooth performance
- **Network Usage**: Configurable audio chunk sizes for bandwidth optimization

## Security Notes

- API keys are exposed in the frontend (NEXT_PUBLIC_*)
- For production, consider implementing a backend proxy
- Implement rate limiting for API calls
- Consider user authentication for sensitive applications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the STFU Assistant suite. Check the main repository for licensing information.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review ElevenLabs documentation
3. Create an issue in the repository

---

**Happy voice streaming! 🎤✨**
