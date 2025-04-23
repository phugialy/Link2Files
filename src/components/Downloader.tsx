import { useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { FormatToggle } from './FormatToggle';

interface DownloaderProps {
  onDownload: (url: string, format: 'mp3' | 'mp4') => Promise<void>;
}

const Downloader = ({ onDownload }: DownloaderProps) => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
      console.log('Starting download process...', { url, format });
      setIsLoading(true);
      await onDownload(url.trim(), format);
      console.log('Download initiated successfully');
      setUrl('');
    } catch (error) {
      console.error('Download failed in Downloader component:', error);
      toast.error(error instanceof Error ? error.message : 'Download failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#12172B] rounded-3xl p-8 space-y-6">
        <h1 className="text-2xl font-bold text-white text-center mb-8">
          YouTube Video Downloader
        </h1>

        {/* URL Input */}
        <div className="space-y-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter YouTube URL"
            className="w-full h-12 px-4 rounded-lg bg-[#1C2333] text-white border border-[#2A3347] focus:outline-none focus:border-blue-500 placeholder:text-gray-500"
            disabled={isLoading}
          />
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Download Format</p>
          <FormatToggle
            value={format}
            onChange={setFormat}
            disabled={isLoading}
          />
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isLoading || !url.trim()}
          className="w-full h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          <span>{isLoading ? 'Processing...' : 'Download'}</span>
        </button>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            <span>Processing your download...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Downloader; 