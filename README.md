# GeniusPA - AI Meeting Assistant

GeniusPA is an intelligent personal assistant for meetings and documents, built with React Native and Expo. It uses advanced AI to transcribe, summarize, and help you interact with your content.

## Features

- 🎙️ **Audio Recording & Transcription** - Record meetings/classes with automatic transcription
- 📄 **Document Processing** - Import and process documents from URLs
- 🤖 **AI Chat Interface** - Ask questions about your content with context-aware responses
- 📊 **Export Functionality** - Export conversations and transcripts to various formats
- 💎 **Subscription System** - Freemium model with Pro and Premium tiers
- 🔒 **Privacy-First** - All data processed securely with local storage

## Getting Started

### Prerequisites

- Node.js 18+ 
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Joelpillar51/GeniusPA.git
cd GeniusPA
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
- OpenAI API key (required for transcription and AI chat)
- Anthropic Claude API key (optional)
- Grok API key (optional)

4. Start the development server:
```bash
npm start
# or
bun start
```

## Tech Stack

- **React Native** with TypeScript
- **Expo SDK 53**
- **Zustand** for state management
- **NativeWind** (Tailwind CSS for React Native)
- **React Navigation** for navigation
- **expo-av** for audio recording
- **OpenAI API** for transcription and AI chat
- **Anthropic Claude API** for alternative AI responses
- **Grok API** for additional AI options

## API Requirements

### Required
- **OpenAI API** - Core functionality for transcription and AI chat

### Optional
- **Anthropic Claude API** - Alternative AI provider
- **Grok API** - Additional AI provider option

## Key Features

### Recording & Transcription
- High-quality audio recording with expo-av
- Automatic transcription using OpenAI's Whisper API
- Manual transcription controls for user preference
- Comprehensive error handling with retry mechanisms

### AI Chat System
- Context-aware conversations about recordings and documents
- Multiple AI provider support (OpenAI, Claude, Grok)
- Direct AI chat without content requirements
- Markdown formatting for AI responses

### Subscription Management
- Free tier: 5-minute recordings, 3 per day, 1 document
- Pro tier: 2-hour recordings, 50 per day, 100 documents
- Premium tier: Unlimited usage
- Strict subscription enforcement with upgrade prompts

### Document Processing
- URL-based document import (web articles, PDFs, etc.)
- AI-powered content extraction and summarization
- Support for Google Docs (with proper sharing settings)
- Smart text truncation and expansion

## User Preferences

- **Auto Transcribe**: Disabled by default, user can enable
- **Auto Summarize**: Disabled by default, user can enable
- **Recording Quality**: Standard, High, Lossless options
- **Theme**: Light, Dark, System modes
- **Notifications**: Configurable alerts

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Email: support@geniuspa.app

## Privacy & Security

- All recordings processed locally on device
- API calls use encrypted connections
- No personal data stored on external servers
- User data remains private and secure
- Full data deletion capabilities

---

Built with ❤️ using React Native and Expo