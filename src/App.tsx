import { useState, useEffect } from 'react'
import { History as HistoryIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { DownloadIcon, MusicIcon, VideoIcon, FolderIcon, PlayIcon, DeleteIcon } from './components/icons'
import { DownloadHistoryItem } from './components/DownloadHistoryItem'
import Downloader from './components/Downloader'
import type { VideoInfo as VideoInfoType, DownloadedVideo } from './types'

// Declare the window interface for Electron
declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
        on(channel: string, func: (...args: any[]) => void): void;
        once(channel: string, func: (...args: any[]) => void): void;
        removeAllListeners(channel: string): void;
      };
    };
  }
}

interface VideoInfo extends VideoInfoType {
  // Add any additional properties if needed
}

const FALLBACK_THUMBNAIL = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"%3E%3Crect width="100%25" height="100%25" fill="%23282828"/%3E%3Cpath d="M187 153l106 54-106 54v-108z" fill="%23fff"/%3E%3C/svg%3E'

const App = () => {
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [downloadHistory, setDownloadHistory] = useState<DownloadedVideo[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, title: string} | null>(null)
  const [showWaveAnimation, setShowWaveAnimation] = useState(false)

  useEffect(() => {
    const handleProgress = (_: any, progress: number) => {
      console.log('Progress received:', progress);
      setDownloadProgress(progress);
    };

    const handleComplete = () => {
      console.log('Download complete');
      setDownloadProgress(100);
      
      // Trigger wave animation
      setShowWaveAnimation(true);
      
      // Delay hiding the progress bar and show history
      setTimeout(() => {
        setIsDownloading(false);
        setIsFetching(false);
        setDownloadProgress(0);
        setVideoInfo(null);
        setShowWaveAnimation(false);
        setIsSidebarOpen(true); // Auto open sidebar after download
        toast.success('Download completed successfully!');
      }, 1500);
    };

    // Add event listeners
    window.electron?.ipcRenderer?.on('download-progress', handleProgress);
    window.electron?.ipcRenderer?.on('download-complete', handleComplete);

    // Cleanup function
    return () => {
      window.electron?.ipcRenderer?.removeAllListeners('download-progress');
      window.electron?.ipcRenderer?.removeAllListeners('download-complete');
    };
  }, []);

  useEffect(() => {
    // Load download history from localStorage
    const savedHistory = localStorage.getItem('downloadHistory');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        // Filter out invalid entries
        const validateHistory = async () => {
          const validHistory = await Promise.all(
            history.map(async (item: DownloadedVideo) => {
              const hasValidUrl = item.url && validateYouTubeUrl(item.url);
              const hasValidFiles = await Promise.all(
                Object.values(item.formats || {}).map(async format => {
                  if (!format?.filePath) return false;
                  try {
                    return await window.electron?.ipcRenderer.invoke('check-file-exists', format.filePath);
                  } catch {
                    return false;
                  }
                })
              ).then(results => results.some(exists => exists));
              
              return hasValidUrl && hasValidFiles ? item : null;
            })
          );
          
          const filteredHistory = validHistory.filter(Boolean);
          
          // Update storage if items were removed
          if (filteredHistory.length !== history.length) {
            localStorage.setItem('downloadHistory', JSON.stringify(filteredHistory));
          }
          
          setDownloadHistory(filteredHistory);
        };
        
        validateHistory();
      } catch (error) {
        console.error('Error parsing download history:', error);
        setDownloadHistory([]);
      }
    }
  }, []);

  const validateYouTubeUrl = (url: string): boolean => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return pattern.test(url);
  };

  const sanitizeFilename = (filename: string): string => {
    return filename.replace(/[<>:"/\\|?*]/g, '_');
  };

  const handleDownload = async (url: string, format: 'mp3' | 'mp4') => {
    console.log('Download handler called with:', { url, format });
    
    if (!validateYouTubeUrl(url)) {
      const error = 'Please enter a valid YouTube URL';
      console.error(error);
      toast.error(error);
      return;
    }

    if (!window.electron?.ipcRenderer) {
      const error = 'Electron API not available';
      console.error(error);
      toast.error(error);
      return;
    }

    try {
      setError(null);
      setIsFetching(true);
      setDownloadProgress(0);
      setIsDownloading(true); // Set downloading state at the start

      // Get video info
      console.log('Fetching video info...');
      const info = await window.electron.ipcRenderer.invoke('get-video-info', url) as VideoInfo;
      console.log('Video info received:', info);
      setVideoInfo(info);
      
      setIsFetching(false);

      // Show save dialog
      console.log('Opening save dialog...');
      const saveResult = await window.electron.ipcRenderer.invoke('show-save-dialog', {
        defaultPath: `${sanitizeFilename(info.videoDetails.title)}.${format}`
      });

      console.log('Save dialog result:', saveResult);

      if (saveResult.canceled || !saveResult.filePath) {
        console.log('Save dialog cancelled or no path selected');
        setIsDownloading(false);
        setIsFetching(false);
        return;
      }

      // Start download with format
      const downloadResult = await window.electron.ipcRenderer.invoke('download-video', {
        url,
        filePath: saveResult.filePath,
        format
      });

      if (!downloadResult?.success) {
        throw new Error('Download failed - no success response');
      }

      // Add to download history
      const newDownload: DownloadedVideo = {
        id: Date.now().toString(),
        url,
        title: info.videoDetails.title,
        thumbnail: info.videoDetails.thumbnails?.[0]?.url || '',
        duration: `${Math.floor(parseInt(info.videoDetails.lengthSeconds) / 60)}:${(parseInt(info.videoDetails.lengthSeconds) % 60).toString().padStart(2, '0')}`,
        downloadDate: new Date().toLocaleString(),
        formats: {
          [format]: {
            filePath: saveResult.filePath,
            downloadDate: new Date().toLocaleString()
          }
        }
      };

      setDownloadHistory(prev => [newDownload, ...prev]);
      localStorage.setItem('downloadHistory', JSON.stringify([newDownload, ...downloadHistory]));

    } catch (err: any) {
      console.error('Download error:', err);
      const errorMessage = err.message || 'An error occurred during download';
      setError(errorMessage);
      toast.error(errorMessage);
      setVideoInfo(null);
      setIsDownloading(false);
      setIsFetching(false);
    }
  };

  const handleOpenLocation = async (video: DownloadedVideo, format: 'mp3' | 'mp4') => {
    const filePath = video.formats[format]?.filePath;
    if (!filePath) {
      toast.error(`No ${format.toUpperCase()} file found`);
      return;
    }

    try {
      await window.electron?.ipcRenderer.invoke('open-file-location', filePath);
    } catch (error) {
      console.error('Failed to open file location:', error);
      toast.error('Could not open file location. The file may have been moved or deleted.');
    }
  };

  const handleDeleteHistoryItem = (videoId: string) => {
    const updatedHistory = downloadHistory.filter(item => item.id !== videoId);
    setDownloadHistory(updatedHistory);
    localStorage.setItem('downloadHistory', JSON.stringify(updatedHistory));
    toast.success('Download history item deleted');
  };

  const handleRedownload = async (video: DownloadedVideo, format: 'mp3' | 'mp4') => {
    if (!video.url || !validateYouTubeUrl(video.url)) {
      toast.error('Invalid or missing video URL');
      return;
    }

    if (!window.electron?.ipcRenderer) {
      toast.error('Electron API not available');
      return;
    }

    try {
      setIsDownloading(true);
      const info = await window.electron.ipcRenderer.invoke('get-video-info', video.url) as VideoInfo;
      
      // Request save location with correct extension
      const saveResult = await window.electron.ipcRenderer.invoke('show-save-dialog', {
        title: 'Save As',
        defaultPath: `${sanitizeFilename(info.videoDetails.title)}.${format}`,
        filters: [
          { name: format.toUpperCase(), extensions: [format.toLowerCase()] }
        ]
      });

      if (saveResult.canceled || !saveResult.filePath) {
        return;
      }

      // Start download
      const downloadResult = await window.electron.ipcRenderer.invoke('download-video', {
        url: video.url,
        filePath: saveResult.filePath,
        format
      });

      if (!downloadResult.success) {
        throw new Error('Download failed');
      }

      // Update history with new format
      const exists = await window.electron?.ipcRenderer.invoke('check-file-exists', saveResult.filePath);
      if (exists) {
        const updatedVideo = {
          ...video,
          formats: {
            ...video.formats,
            [format]: {
              filePath: saveResult.filePath,
              downloadDate: new Date().toLocaleString()
            }
          }
        };

        const updatedHistory = downloadHistory.map(item => 
          item.id === video.id ? updatedVideo : item
        );

        setDownloadHistory(updatedHistory);
        localStorage.setItem('downloadHistory', JSON.stringify(updatedHistory));
        toast.success(`${format.toUpperCase()} download completed!`);
      }
    } catch (err: any) {
      console.error('Error:', err);
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const url = e.dataTransfer.getData('text');

    if (!window.electron?.ipcRenderer) {
      toast.error('Electron API not available');
      return;
    }

    try {
      const videoInfo = await window.electron.ipcRenderer.invoke('get-video-info', url);
      // ... existing code ...
    } catch (error) {
      // ... existing code ...
    }
  };

  // Add delete confirmation dialog component
  const DeleteConfirmation = () => {
    if (!deleteConfirmation) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-700 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-white mb-2">Delete Download</h3>
          <p className="text-gray-300 mb-4">
            Are you sure you want to remove "{deleteConfirmation.title}" from your download history?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirmation(null)}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleDeleteHistoryItem(deleteConfirmation.id);
                setDeleteConfirmation(null);
              }}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden">
      {/* Wave Animation Background */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b from-gray-900 to-black transition-opacity duration-1000
          before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/0 before:via-blue-500/10 before:to-blue-500/0
          after:absolute after:inset-0 after:bg-gradient-to-b after:from-gray-900 after:to-black after:opacity-90
          ${showWaveAnimation ? 'before:animate-wave' : ''}`}
      />

      <div className="flex min-h-screen relative">
        {/* Main content area */}
        <div className={`flex-1 flex flex-col p-8 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'mr-96' : 'mr-0'}`}>
          {/* History Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`fixed top-4 right-4 p-3 rounded-full bg-gray-800 hover:bg-gray-700 
              text-gray-300 hover:text-white transition-all duration-500 ease-in-out z-50
              border border-gray-700 hover:border-gray-600 shadow-lg
              ${isSidebarOpen ? 'right-[calc(24rem+1rem)]' : 'right-4'}`}
            title={isSidebarOpen ? "Hide download history" : "Show download history"}
          >
            <HistoryIcon className="w-6 h-6" />
          </button>

          {/* Downloader Component */}
          <Downloader onDownload={handleDownload} />

          {/* Progress and Error States */}
          <div className={`fixed bottom-4 left-4 right-4 bg-gray-900/95 backdrop-blur-sm p-4 rounded-lg 
            border border-gray-800 shadow-xl transform transition-all duration-500 ease-in-out 
            ${isDownloading || isFetching ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
          >
            <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 relative overflow-hidden"
                style={{ 
                  width: `${downloadProgress}%`,
                  transition: 'width 0.3s ease-in-out'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 animate-pulse"></div>
              </div>
            </div>
            <p className="text-center mt-2 text-gray-400">
              {isFetching ? 'Preparing download...' : `${Math.round(downloadProgress)}%`}
            </p>
          </div>

          {error && (
            <div className="fixed bottom-4 left-4 right-4 p-4 bg-red-900/20 text-red-400 rounded-lg border border-red-800/50" role="alert">
              {error}
            </div>
          )}
        </div>

        {/* Download history sidebar */}
        <div 
          className={`fixed right-0 top-0 bottom-0 w-96 bg-gray-900/95 backdrop-blur-sm shadow-2xl 
            flex flex-col border-l border-gray-800 transform transition-all duration-500 ease-in-out 
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} z-40`}
        >
          <div className="p-4 bg-gray-900/80 border-b border-gray-800 backdrop-blur-sm flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" />
              Download History
            </h2>
            {downloadHistory.length > 0 && (
              <button
                onClick={() => setDeleteConfirmation({ id: 'all', title: 'all downloads' })}
                className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 
                  hover:bg-red-900/30 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {downloadHistory.map((video) => (
              <DownloadHistoryItem
                key={video.id}
                title={video.title}
                url={video.url}
                thumbnail={video.thumbnail}
                onDownload={(url, format) => handleRedownload(video, format)}
                onOpenLocation={(format) => handleOpenLocation(video, format)}
              />
            ))}
            {downloadHistory.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No downloads yet
              </div>
            )}
          </div>
        </div>

        {/* Delete confirmation dialog */}
        <DeleteConfirmation />
      </div>
    </div>
  );
};

export default App;

