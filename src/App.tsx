import { useState, useEffect } from 'react'
import { History as HistoryIcon } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { Navbar } from './components/Navbar'
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

  const handleDeleteHistoryItem = async (videoId: string, filePaths?: { mp3?: string; mp4?: string }) => {
    try {
      // Delete the actual files if paths are provided
      if (filePaths) {
        const deletePromises = [];
        if (filePaths.mp3) {
          deletePromises.push(window.electron?.ipcRenderer.invoke('delete-file', filePaths.mp3));
        }
        if (filePaths.mp4) {
          deletePromises.push(window.electron?.ipcRenderer.invoke('delete-file', filePaths.mp4));
        }
        await Promise.all(deletePromises);
      }

      // Update history state and localStorage
      const updatedHistory = downloadHistory.filter(item => item.id !== videoId);
      setDownloadHistory(updatedHistory);
      localStorage.setItem('downloadHistory', JSON.stringify(updatedHistory));
      
      toast.success('Download history item deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete some files');
    }
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

  const handleWindowControl = async (action: 'minimize' | 'maximize' | 'close') => {
    try {
      await window.electron?.ipcRenderer.invoke(`${action}-window`);
    } catch (error) {
      console.error(`Failed to ${action} window:`, error);
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
    <div className="min-h-screen bg-[#111827] text-white relative">
      {/* Draggable title bar */}
      <div className="fixed top-0 left-0 right-0 h-8 bg-transparent z-50 draggable" />

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#1F2937',
            color: '#fff',
            borderRadius: '0.5rem',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            fontSize: '0.875rem',
            fontWeight: '500',
            padding: '0.75rem 1rem',
            gap: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          success: {
            style: {
              background: 'rgba(17, 24, 39, 0.95)',
              backdropFilter: 'blur(8px)',
            },
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* Wave Animation Background */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b from-gray-900 to-black transition-opacity duration-1000
          before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/0 before:via-blue-500/10 before:to-blue-500/0
          after:absolute after:inset-0 after:bg-gradient-to-b after:from-gray-900 after:to-black after:opacity-90
          ${showWaveAnimation ? 'before:animate-wave' : ''}`}
      />

      {/* Navigation Bar */}
      <Navbar 
        onHistoryClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isHistoryOpen={isSidebarOpen}
      />

      <div className="flex min-h-screen relative pt-16"> {/* Added pt-16 for navbar spacing */}
        {/* Main content area */}
        <div className={`flex-1 flex flex-col p-8 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'mr-96' : 'mr-0'}`}>
          {/* Downloader Component */}
          <Downloader onDownload={handleDownload} />

          {/* Progress Notification */}
          <div
            className={`fixed bottom-24 left-1/2 transform transition-all duration-300 ${
              isDownloading || isFetching ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
            } ${isSidebarOpen ? '-translate-x-[calc(50%+12rem)]' : '-translate-x-1/2'}`}
          >
            <div className="flex items-center gap-3 bg-[#1F2937]/90 backdrop-blur-sm border border-blue-500/20 rounded-lg px-4 py-3 shadow-lg">
              <div className="w-32 h-1 bg-blue-500/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300 relative"
                  style={{ width: `${downloadProgress}%` }}
                >
                  <div className="absolute inset-0 bg-blue-400 animate-pulse"></div>
                </div>
              </div>
              <span className="text-sm font-medium text-blue-400 min-w-[3rem] text-right">{Math.round(downloadProgress)}%</span>
            </div>
          </div>

          {error && (
            <div 
              className={`fixed bottom-4 left-4 right-4 p-4 bg-red-900/20 text-red-400 rounded-lg border border-red-800/50 transition-all duration-300 ${
                isSidebarOpen ? 'mr-[calc(24rem+1rem)]' : 'mr-4'
              }`} 
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        {/* Download history sidebar */}
        <div
          className={`fixed right-0 top-16 bottom-0 w-96 bg-[#0F1729]/95 backdrop-blur-sm shadow-2xl 
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
                formats={video.formats}
                onDownload={(url, format) => handleRedownload(video, format)}
                onOpenLocation={(format) => handleOpenLocation(video, format)}
                onDelete={(formats) => handleDeleteHistoryItem(video.id, formats)}
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

