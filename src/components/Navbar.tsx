import { History as HistoryIcon, Info as InfoIcon } from 'lucide-react'
import { useState } from 'react'
import type { FC } from 'react'
import InfoModal from './InfoModal'

type NavbarProps = {
  onHistoryClick?: () => void
  isHistoryOpen?: boolean
}

export const Navbar: FC<NavbarProps> = ({
  onHistoryClick,
  isHistoryOpen = false
}) => {
  const [showInfo, setShowInfo] = useState(false)

  const handleKeyDown = (handler?: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handler?.()
    }
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F1729] border-b border-gray-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">
              YouTube Downloader
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={onHistoryClick}
                onKeyDown={handleKeyDown(onHistoryClick)}
                className={`group relative px-4 py-2 rounded-lg text-gray-400 transition-all duration-300 ease-out
                  ${isHistoryOpen 
                    ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
                    : 'hover:bg-gray-800/60'
                  }
                `}
                aria-label="View Download History"
                aria-pressed={isHistoryOpen}
                tabIndex={0}
              >
                <div className="flex items-center gap-2">
                  <HistoryIcon 
                    className={`w-5 h-5 transition-all duration-300 transform
                      ${isHistoryOpen ? 'rotate-180 scale-110' : 'group-hover:scale-110'}
                    `} 
                  />
                  <span className={`text-sm font-medium transition-all duration-300 transform
                    ${isHistoryOpen 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                    }`}
                  >
                    History
                  </span>
                </div>
                <span className={`absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all duration-300 ease-out rounded-full
                  ${isHistoryOpen ? 'w-full' : 'w-0 group-hover:w-full'}`} 
                />
              </button>
              <button
                onClick={() => setShowInfo(true)}
                onKeyDown={handleKeyDown(() => setShowInfo(true))}
                className="group px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all duration-300"
                aria-label="View Information"
                tabIndex={0}
              >
                <InfoIcon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="How to Download"
        content={
          <div className="space-y-6">
            {/* Legal Disclaimer */}
            <section className="space-y-3 bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <h3 className="text-lg font-semibold text-white">Legal Disclaimer</h3>
              </div>
              <div className="text-gray-300 space-y-3 text-sm">
                <p>
                  This software is provided "as is", without warranty of any kind. By using this tool, you agree to:
                </p>
                <ul className="space-y-2 ml-1">
                  {[
                    'Comply with YouTube\'s terms of service',
                    'Take responsibility for the content you download',
                    'Use downloaded content in accordance with copyright laws'
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-500/70"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Usage Instructions */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <h3 className="text-lg font-semibold text-white">How to Use</h3>
              </div>
              <ol className="space-y-3 text-gray-300 text-sm list-decimal list-inside ml-1">
                <li>Paste a valid YouTube video URL in the input field</li>
                <li>Select your preferred format (MP4 for video, MP3 for audio)</li>
                <li>Click the Download button and choose where to save the file</li>
                <li>Wait for the download to complete</li>
              </ol>
            </section>

            {/* Features */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="text-lg font-semibold text-white">Features</h3>
              </div>
              <ul className="space-y-2 text-gray-300 text-sm ml-1">
                {[
                  'Download videos in MP4 format',
                  'Extract audio in MP3 format',
                  'Track download progress',
                  'View download history',
                  'Quick access to downloaded files'
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-500/70"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        }
      />
    </>
  )
} 