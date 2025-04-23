# Link2File Converter

A modern Electron application for converting YouTube URLs into local files, built with React, TypeScript, and TailwindCSS. This tool allows you to easily convert YouTube links into your preferred format for personal local storage.

## Features

- Convert YouTube URLs to MP4 video files
- Extract and convert to MP3 audio files
- Modern and responsive UI with Framer Motion animations
- Real-time conversion progress tracking
- Video information preview before conversion
- Flexible format selection (Video/Audio)
- Toast notifications for conversion status
- Cross-platform support (Windows, macOS, Linux)

## Prerequisites

- Node.js (v20.18.1 or higher)
- npm (v10.9.0 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/phugialy/ytb-downloader.git
cd ytb-downloader
```

2. Install dependencies:
```bash
npm install
```

## Development

To run the application in development mode:

```bash
npm run dev
```

## Building

To build the application:

```bash
npm run build
```

This will create executables for your platform in the `release` directory.

## Technologies Used

- Electron
- React
- TypeScript
- TailwindCSS
- Vite
- yt-dlp
- Framer Motion
- Lucide React Icons
- React Hot Toast

## Project Structure

```
├── electron/          # Electron main process
├── src/              # React application source
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   └── utils/        # Utility functions
├── public/           # Static assets
└── scripts/          # Build and utility scripts
```

## License

MIT License

## Disclaimer

This application is for educational purposes only. Please respect YouTube's terms of service and content creators' rights when using this application. The tool is designed for personal use to convert and save content for offline viewing/listening.
