import { FC, useState } from 'react';
import { Download, Music, Video, Folder } from 'lucide-react';
import toast from 'react-hot-toast';

interface DownloadHistoryItemProps {
  title: string;
  url: string;
  thumbnail?: string;
  onDownload: (url: string, format: 'mp3' | 'mp4') => Promise<void>;
  onOpenLocation: (format: 'mp3' | 'mp4') => Promise<void>;
}

export const DownloadHistoryItem: FC<DownloadHistoryItemProps> = ({
  title,
  url,
  thumbnail,
  onDownload,
  onOpenLocation,
}) => {
  const [loadingFormat, setLoadingFormat] = useState<'mp3' | 'mp4' | null>(null);

  const handleDownload = async (format: 'mp3' | 'mp4') => {
    try {
      setLoadingFormat(format);
      await onDownload(url, format);
    } catch (error) {
      toast.error('Download failed. Please try again.');
      console.error('History download error:', error);
    } finally {
      setLoadingFormat(null);
    }
  };

  const handleOpenLocation = async (format: 'mp3' | 'mp4') => {
    try {
      await onOpenLocation(format);
    } catch (error) {
      toast.error('Could not open file location.');
      console.error('Open location error:', error);
    }
  };

  return (
    <div className="bg-[#1C2333] rounded-lg p-4 space-y-4">
      <div className="flex gap-4">
        {thumbnail && (
          <img 
            src={thumbnail} 
            alt={title} 
            className="w-24 h-16 object-cover rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{title}</h3>
          <p className="text-gray-400 text-sm truncate">{url}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {/* MP4 Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload('mp4')}
            disabled={loadingFormat !== null}
            className="flex-1 flex items-center justify-center gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-4 h-4" />
            {loadingFormat === 'mp4' ? 'Processing...' : 'Download MP4'}
          </button>
          <button
            onClick={() => handleOpenLocation('mp4')}
            className="flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            aria-label="Open MP4 file location"
          >
            <Folder className="w-4 h-4" />
          </button>
        </div>

        {/* MP3 Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload('mp3')}
            disabled={loadingFormat !== null}
            className="flex-1 flex items-center justify-center gap-2 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Music className="w-4 h-4" />
            {loadingFormat === 'mp3' ? 'Processing...' : 'Download MP3'}
          </button>
          <button
            onClick={() => handleOpenLocation('mp3')}
            className="flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            aria-label="Open MP3 file location"
          >
            <Folder className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}; 