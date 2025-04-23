import { FC, useState } from 'react';
import { Music, Video, Folder, Copy, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface DownloadHistoryItemProps {
  title: string;
  url: string;
  thumbnail?: string;
  formats: {
    mp3?: { filePath: string; downloadDate: string };
    mp4?: { filePath: string; downloadDate: string };
  };
  onDownload: (url: string, format: 'mp3' | 'mp4') => Promise<void>;
  onOpenLocation: (format: 'mp3' | 'mp4') => Promise<void>;
  onDelete: (formats: { mp3?: string; mp4?: string }) => Promise<void>;
}

export const DownloadHistoryItem: FC<DownloadHistoryItemProps> = ({
  title,
  url,
  thumbnail,
  formats,
  onDownload,
  onOpenLocation,
  onDelete,
}) => {
  const [loadingFormat, setLoadingFormat] = useState<'mp3' | 'mp4' | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = async (format: 'mp3' | 'mp4') => {
    try {
      setLoadingFormat(format);
      await onDownload(url, format);
      toast.success('Download started successfully', {
        icon: '🎵',
        duration: 2000,
      });
    } catch (error) {
      toast.error('Failed to start download. Please try again.', {
        duration: 3000,
      });
      console.error('Download error:', error);
    } finally {
      setLoadingFormat(null);
    }
  };

  const handleOpenLocation = async (format: 'mp3' | 'mp4') => {
    try {
      await onOpenLocation(format);
      toast.success('Opening file location...', {
        icon: '📂',
        duration: 1500,
      });
    } catch (error) {
      toast.error('Could not open file location', {
        duration: 3000,
      });
      console.error('Open location error:', error);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">"{title}"</span>
          <span className="text-sm text-gray-400">copied to clipboard</span>
        </div>,
        {
          icon: '📋',
          duration: 1500,
        }
      );
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy URL', {
        duration: 3000,
      });
      console.error('Copy URL error:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the copy URL action
    try {
      setIsDeleting(true);
      // Pass the file paths to be deleted
      const filesToDelete = {
        mp3: formats.mp3?.filePath,
        mp4: formats.mp4?.filePath
      };
      await onDelete(filesToDelete);
      toast.success('Video removed from history', {
        icon: '🗑️',
        duration: 2000,
      });
    } catch (error) {
      toast.error('Failed to remove video', {
        duration: 3000,
      });
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-[#1C2333] rounded-lg overflow-hidden hover:bg-[#1F2937] transition-colors duration-200 group/item">
      {/* Video Info Section */}
      <div 
        className="p-4 cursor-pointer group relative"
        onClick={handleCopyUrl}
        role="button"
        tabIndex={0}
        aria-label="Copy video URL"
      >
        <div className="flex gap-4">
          {/* Thumbnail with overlay */}
          <div className="relative w-32 h-20 flex-shrink-0">
            {thumbnail ? (
              <img 
                src={thumbnail} 
                alt={title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                <Video className="w-8 h-8 text-gray-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
              {copied ? (
                <Check className="w-6 h-6 text-green-400" />
              ) : (
                <Copy className="w-6 h-6 text-white" />
              )}
            </div>
          </div>

          {/* Title and URL */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium line-clamp-2 group-hover:text-blue-400 transition-colors">
              {title}
            </h3>
            <p className="text-gray-400 text-sm truncate mt-1">{url}</p>
          </div>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="opacity-0 group-hover/item:opacity-100 transition-all duration-200 p-2 rounded-full"
            aria-label="Delete from history"
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-500/50 border-t-transparent" />
            ) : (
              <Trash2 className="w-5 h-5 text-red-400/70 hover:text-red-400 hover:scale-110 transition-all" />
            )}
          </button>
        </div>
      </div>

      {/* Format Controls */}
      <div className="border-t border-gray-800 p-4 grid grid-cols-2 gap-4">
        {/* MP4 Controls */}
        <div className="flex">
          <button
            onClick={() => handleDownload('mp4')}
            disabled={loadingFormat !== null}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-l-lg flex-grow transition-all duration-200 ${
              formats.mp4 
                ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' 
                : 'bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              <span className="text-sm">MP4</span>
            </div>
            {loadingFormat === 'mp4' && (
              <div className="ml-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
              </div>
            )}
          </button>
          {formats.mp4 && (
            <button
              onClick={() => handleOpenLocation('mp4')}
              className="px-2 bg-blue-500/10 hover:bg-blue-500/20 border-l border-blue-400/20 rounded-r-lg transition-colors"
              title="Open file location"
            >
              <Folder className="w-4 h-4 text-blue-400" />
            </button>
          )}
        </div>

        {/* MP3 Controls */}
        <div className="flex">
          <button
            onClick={() => handleDownload('mp3')}
            disabled={loadingFormat !== null}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-l-lg flex-grow transition-all duration-200 ${
              formats.mp3 
                ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400' 
                : 'bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              <span className="text-sm">MP3</span>
            </div>
            {loadingFormat === 'mp3' && (
              <div className="ml-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent" />
              </div>
            )}
          </button>
          {formats.mp3 && (
            <button
              onClick={() => handleOpenLocation('mp3')}
              className="px-2 bg-green-500/10 hover:bg-green-500/20 border-l border-green-400/20 rounded-r-lg transition-colors"
              title="Open file location"
            >
              <Folder className="w-4 h-4 text-green-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 