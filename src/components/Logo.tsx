import type { FC } from 'react'

interface LogoProps {
  className?: string
  showText?: boolean
}

export const Logo: FC<LogoProps> = ({ className = '', showText = true }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full" />
        
        {/* Infinity symbol */}
        <div className="relative w-6 h-6 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 transform rotate-90 group-hover:rotate-[450deg] transition-transform duration-700"
          >
            <path
              d="M12 12C12 12 16 8.7 16 6C16 3.3 13.7 1 11 1C8.3 1 6 3.3 6 6C6 8.7 10 12 10 12C10 12 6 15.3 6 18C6 20.7 8.3 23 11 23C13.7 23 16 20.7 16 18C16 15.3 12 12 12 12Z"
              className="fill-blue-500"
            />
            <path
              d="M12 12C12 12 16 15.3 16 18C16 20.7 13.7 23 11 23C8.3 23 6 20.7 6 18C6 15.3 10 12 10 12C10 12 6 8.7 6 6C6 3.3 8.3 1 11 1C13.7 1 16 3.3 16 6C16 8.7 12 12 12 12Z"
              className="fill-blue-400"
            />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex items-baseline">
          <span className="text-blue-400 font-bold tracking-tight">Link</span>
          <span className="text-blue-500 font-bold">2</span>
          <span className="text-white font-bold tracking-tight">File</span>
        </div>
      )}
    </div>
  )
} 