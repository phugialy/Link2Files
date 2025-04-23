import { Music, Video } from 'lucide-react'
import type { FC } from 'react'

type Format = 'mp3' | 'mp4'

type FormatToggleProps = {
  value: Format
  onChange: (format: Format) => void
  disabled?: boolean
}

export const FormatToggle: FC<FormatToggleProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const handleKeyDown = (format: Format) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onChange(format)
    }
  }

  return (
    <div className="flex items-center justify-center p-1 bg-[#1C2333] rounded-lg">
      <div className="grid grid-cols-2 w-full gap-1">
        <button
          onClick={() => onChange('mp4')}
          onKeyDown={handleKeyDown('mp4')}
          disabled={disabled}
          aria-label="Select MP4 format"
          aria-pressed={value === 'mp4'}
          tabIndex={0}
          className={`
            flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all
            ${value === 'mp4' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-gray-300'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <Video className="w-4 h-4" />
          <span className="font-medium">MP4</span>
        </button>
        <button
          onClick={() => onChange('mp3')}
          onKeyDown={handleKeyDown('mp3')}
          disabled={disabled}
          aria-label="Select MP3 format"
          aria-pressed={value === 'mp3'}
          tabIndex={0}
          className={`
            flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all
            ${value === 'mp3' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-gray-300'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <Music className="w-4 h-4" />
          <span className="font-medium">MP3</span>
        </button>
      </div>
    </div>
  )
} 