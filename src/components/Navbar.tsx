import { History as HistoryIcon, Settings as SettingsIcon, Info as InfoIcon } from 'lucide-react'
import type { FC } from 'react'

type NavbarProps = {
  onHistoryClick?: () => void
  onSettingsClick?: () => void
  onInfoClick?: () => void
}

export const Navbar: FC<NavbarProps> = ({
  onHistoryClick,
  onSettingsClick,
  onInfoClick
}) => {
  const handleKeyDown = (handler?: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handler?.()
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            YouTube Downloader
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={onHistoryClick}
              onKeyDown={handleKeyDown(onHistoryClick)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="View Download History"
              tabIndex={0}
            >
              <HistoryIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onSettingsClick}
              onKeyDown={handleKeyDown(onSettingsClick)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open Settings"
              tabIndex={0}
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onInfoClick}
              onKeyDown={handleKeyDown(onInfoClick)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="View Information"
              tabIndex={0}
            >
              <InfoIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
} 