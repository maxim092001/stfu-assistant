# 🚀 Production Setup Guide

## Overview
This NextJS application integrates with ElevenLabs Conversational AI using the **official voice-stream package** as recommended in the [ElevenLabs WebSocket documentation](https://elevenlabs.io/docs/conversational-ai/libraries/web-sockets/llms.txt).

## 🔧 Environment Setup

Create a `.env.local` file in the `client` directory with your ElevenLabs credentials:

```bash
# Required: Your ElevenLabs Agent ID
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here

# Optional: Your ElevenLabs API Key (for private agents)
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_api_key_here
```

### Getting Your Agent ID
1. Go to [ElevenLabs Conversational AI](https://elevenlabs.io/conversational-ai)
2. Create or select an existing agent
3. Copy the Agent ID from the agent settings

## 📋 Prerequisites

- Node.js 18+ (React 19 support)
- Modern browser with WebRTC support
- Microphone access permissions

## 🛠 Installation & Setup

1. **Install dependencies:**
```bash
cd client
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **For production build:**
```bash
npm run build
npm start
```

## 🎯 Key Features

✅ **Official ElevenLabs Integration**: Uses `voice-stream` package as recommended in docs  
✅ **Real-time WebSocket Communication**: Direct connection to ElevenLabs API  
✅ **Production-ready Audio Handling**: Web Audio API with proper cleanup  
✅ **Responsive UI**: Modern design with Tailwind CSS  
✅ **TypeScript Support**: Full type safety  
✅ **Error Handling**: Comprehensive error states and recovery  

## ⚠️ Known Issues & Considerations

### ScriptProcessorNode Deprecation Warning
The `voice-stream` package currently uses the deprecated `ScriptProcessorNode` API. This is a **library limitation**, not an implementation issue. The warning can be safely ignored as:

- ScriptProcessorNode still works in all browsers
- AudioWorkletNode migration is the library maintainer's responsibility
- Performance impact is minimal for voice streaming use cases

**Console warning you might see:**
```
[Deprecation] The ScriptProcessorNode is deprecated. Use AudioWorkletNode instead.
```

### Browser Compatibility
- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support (iOS 14.5+)
- **Mobile**: Requires HTTPS in production

## 🔒 Security Best Practices

1. **API Key Protection**: Never expose your ElevenLabs API key in client-side code
2. **HTTPS Required**: WebSocket connections require HTTPS in production
3. **Microphone Permissions**: Always request explicit user consent
4. **Rate Limiting**: Implement conversation limits to prevent abuse

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables in Production
Ensure these are set in your deployment platform:
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`
- `NEXT_PUBLIC_ELEVENLABS_API_KEY` (if using private agents)

## 📊 Performance Optimization

- **Audio Buffering**: Automatic adaptive buffering based on connection quality
- **WebSocket Keep-alive**: Ping/pong mechanism prevents connection drops
- **Audio Queue Management**: Prevents overlapping audio playback
- **Memory Management**: Proper AudioContext cleanup prevents memory leaks

## 🐛 Troubleshooting

### Common Issues

1. **"WebSocket connection failed"**
   - Check your Agent ID is correct
   - Ensure HTTPS in production
   - Verify firewall/proxy settings

2. **"Microphone access denied"**
   - Grant microphone permissions in browser
   - Use HTTPS (required for microphone access)
   - Check browser security settings

3. **"Audio playback issues"**
   - Ensure Web Audio API support
   - Check audio output device
   - Try refreshing the page to reset AudioContext

### Debug Mode
In development, the app shows detailed debug information including:
- WebSocket connection status
- Voice stream activity
- Conversation ID
- Real-time audio levels

## 📚 Technical Architecture

### WebSocket Flow (Following Official Docs)
1. Connect to `wss://api.elevenlabs.io/v1/convai/conversation?agent_id={id}`
2. Send `conversation_initiation_client_data`
3. Start voice-stream audio capture
4. Send `user_audio_chunk` messages
5. Receive `audio`, `user_transcript`, `agent_response` events
6. Handle `ping`/`pong` for connection keep-alive

### Audio Pipeline
1. **Capture**: `voice-stream` package handles microphone → base64
2. **Transport**: WebSocket sends audio chunks to ElevenLabs
3. **Processing**: ElevenLabs AI processes speech and generates response
4. **Playback**: Web Audio API handles response audio with queuing

## 🔄 Updates & Maintenance

- **voice-stream**: Monitor for AudioWorkletNode migration
- **ElevenLabs API**: Follow changelog for WebSocket API updates
- **Dependencies**: Regular security updates via `npm audit`

## 📞 Support

For issues related to:
- **This implementation**: Check GitHub issues
- **ElevenLabs API**: [ElevenLabs Documentation](https://elevenlabs.io/docs)
- **voice-stream package**: Check npm package repository

---

**✨ Ready for Production!** This implementation follows ElevenLabs' official recommendations and best practices for real-time conversational AI integration. 
