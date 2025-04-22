import { useState, useEffect } from 'react'
import { exec } from 'child_process'
import path from 'path'
import fs from 'fs'
import { History as HistoryIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { DownloadIcon, MusicIcon, VideoIcon, FolderIcon, PlayIcon, DeleteIcon } from './components/icons'
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
  const [url, setUrl] = useState('')
  const [format, setFormat] = useState('mp4')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [downloadHistory, setDownloadHistory] = useState<DownloadedVideo[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, title: string} | null>(null)

  useEffect(() => {
    const handleProgress = (_: any, progress: number) => {
      setDownloadProgress(progress);
    };

    const handleComplete = () => {
      setUrl('');
      setDownloadProgress(100);
      setVideoInfo(null);
      toast.success('Download completed successfully!');
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
        const validHistory = history.filter((item: DownloadedVideo) => {
          const hasValidUrl = item.url && validateYouTubeUrl(item.url);
          const hasValidFiles = Object.values(item.formats || {}).some(
            format => format && format.filePath && fs.existsSync(format.filePath)
          );
          return hasValidUrl && hasValidFiles;
        });
        
        // Update storage if items were removed
        if (validHistory.length !== history.length) {
          localStorage.setItem('downloadHistory', JSON.stringify(validHistory));
        }
        
        setDownloadHistory(validHistory);
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

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError(null);
    setVideoInfo(null);
    setDownloadProgress(0);
  };

  const handleDownload = async () => {
    if (!url) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    if (!window.electron?.ipcRenderer) {
      setError('Electron API not available');
      return;
    }

    try {
      setError(null);
      setIsFetching(true);
      setDownloadProgress(0);

      // Get video info
      console.log('Fetching video info...');
      const info = await window.electron.ipcRenderer.invoke('get-video-info', url) as VideoInfo;
      console.log('Video info received:', info);
      setVideoInfo(info);
      
      setIsDownloading(true);
      setIsFetching(false);

      // Show save dialog
      const saveResult = await window.electron.ipcRenderer.invoke('show-save-dialog', {
        defaultPath: `${sanitizeFilename(info.videoDetails.title)}.${format}`
      });

      if (saveResult.canceled || !saveResult.filePath) {
        setIsDownloading(false);
        return;
      }

      console.log('Starting download...');
      // Start download with format
      await window.electron.ipcRenderer.invoke('download-video', {
        url,
        filePath: saveResult.filePath,
        format
      });

      setUrl('');
      setDownloadProgress(100);
      setVideoInfo(null);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred');
      setVideoInfo(null);
    } finally {
      setIsDownloading(false);
      setIsFetching(false);
    }
  };

  const handleOpenFileLocation = (filePath: string) => {
    if (!filePath) {
      console.error('No file path provided');
      toast.error('No file path provided');
      return;
    }

    try {
      // Clean up the file path and ensure it's properly formatted for Windows
      const cleanPath = filePath.trim().replace(/\//g, '\\');
      console.log('Attempting to open file location:', cleanPath);

      // Check if file exists
      const fileExists = fs.existsSync(cleanPath);
      console.log('File exists:', fileExists);

      if (!fileExists) {
        throw new Error(`File does not exist: ${cleanPath}`);
      }

      // Use the Windows System32 path for explorer
      const explorerPath = 'C:\\Windows\\explorer.exe';
      
      // First try to select the file
      const command = `"${explorerPath}" /select,"${cleanPath}"`;
      console.log('Executing command:', command);

      exec(command, (error) => {
        if (error) {
          console.error('Error executing select command:', error);
          console.log('Trying fallback to open folder...');
          
          // If selecting fails, try to just open the folder
          const folderPath = path.dirname(cleanPath);
          const fallbackCommand = `"${explorerPath}" "${folderPath}"`;
          console.log('Executing fallback command:', fallbackCommand);
          
          exec(fallbackCommand, (fallbackError) => {
            if (fallbackError) {
              console.error('Fallback also failed:', fallbackError);
              // Try the most basic command as last resort
              exec('start "" "' + folderPath + '"', (finalError) => {
                if (finalError) {
                  console.error('All attempts failed:', finalError);
                  toast.error('Failed to open file location');
                }
              });
            }
          });
        }
      });
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
      if (fs.existsSync(saveResult.filePath)) {
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
    <div className="min-h-screen bg-black text-gray-100">
      <div className="flex min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 overflow-hidden">
        {/* Main content area */}
        <div className={`flex-1 flex flex-col p-8 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'mr-96' : 'mr-0'}`}>
          {/* History Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`fixed top-4 right-4 p-3 rounded-full bg-gray-800 hover:bg-gray-700 
              text-gray-300 hover:text-white transition-all duration-200 z-50
              border border-gray-700 hover:border-gray-600 shadow-lg
              ${isSidebarOpen ? 'right-[calc(24rem+1rem)]' : 'right-4'}`}
            title={isSidebarOpen ? "Hide download history" : "Show download history"}
          >
            <HistoryIcon className="w-6 h-6" />
          </button>

          <div className="relative py-3 sm:max-w-xl sm:mx-auto">
            <div className="relative px-4 py-10 bg-gray-900/80 backdrop-blur-sm shadow-xl sm:rounded-3xl sm:p-20 border border-gray-800">
              <div className="max-w-md mx-auto">
                <div className="divide-y divide-gray-800">
                  <div className="py-8 text-base leading-6 space-y-4 text-gray-300 sm:text-lg sm:leading-7">
                    <h1 className="text-2xl font-bold text-center mb-8 text-white">YouTube Video Downloader</h1>
                    
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-4 py-2 text-gray-300 bg-gray-800/50 rounded-lg border border-gray-700 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          placeholder-gray-500"
                        placeholder="Enter YouTube URL"
                        value={url}
                        onChange={handleUrlChange}
                        disabled={isDownloading || isFetching}
                        aria-label="YouTube URL input"
                      />
                    </div>

                    <div className="relative">
                      <label htmlFor="format" className="block text-sm font-medium text-gray-400 mb-1">
                        Download Format
                      </label>
                      <select
                        id="format"
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        className="w-full px-4 py-2 text-gray-300 bg-gray-800/50 rounded-lg border border-gray-700
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isDownloading || isFetching}
                        aria-label="Download format selection"
                      >
                        <option value="mp4">MP4 (Video)</option>
                        <option value="mp3">MP3 (Audio Only)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleDownload}
                      disabled={isDownloading || isFetching || !url}
                      className={`w-full px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                        transition-all duration-200 ${
                        isDownloading || isFetching || !url
                          ? 'bg-gray-700 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20'
                      }`}
                      aria-label="Download video"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <DownloadIcon />
                        <span>{isFetching ? 'Fetching Info...' : isDownloading ? 'Downloading...' : 'Download'}</span>
                      </div>
                    </button>

                    {videoInfo && (
                      <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <h2 className="font-semibold text-white">{videoInfo.videoDetails.title}</h2>
                        <p className="text-sm text-gray-400 mt-2">
                          Duration: {Math.floor(parseInt(videoInfo.videoDetails.lengthSeconds) / 60)}:{(parseInt(videoInfo.videoDetails.lengthSeconds) % 60).toString().padStart(2, '0')}
                        </p>
                        <p className="text-sm text-gray-400">
                          Views: {parseInt(videoInfo.videoDetails.viewCount).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {(isDownloading || isFetching) && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-800 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 relative overflow-hidden"
                            style={{ width: `${downloadProgress}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 animate-pulse"></div>
                          </div>
                        </div>
                        <p className="text-center mt-2 text-gray-400">{downloadProgress}%</p>
                      </div>
                    )}

                    {error && (
                      <div className="mt-4 p-4 bg-red-900/20 text-red-400 rounded-lg border border-red-800/50" role="alert">
                        {error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download history sidebar */}
        <div 
          className={`fixed right-0 top-0 bottom-0 w-96 bg-gray-900/95 backdrop-blur-sm shadow-2xl 
            flex flex-col border-l border-gray-800 transform transition-all duration-300 ease-in-out 
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
                  hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-1"
              >
                <DeleteIcon />
                Clear All
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-800">
              {downloadHistory.map((video) => (
                <div key={video.id} className="group border-b border-gray-800 last:border-b-0 relative">
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmation({ id: video.id, title: video.title });
                    }}
                    className="absolute top-2 right-2 p-2 rounded-full bg-gray-800/80 text-gray-400 
                      opacity-0 group-hover:opacity-100 hover:bg-red-600/80 hover:text-white 
                      transition-all duration-200 z-10"
                    title="Delete from history"
                  >
                    <DeleteIcon />
                  </button>

                  {/* Thumbnail and title container */}
                  <div 
                    className="p-4 cursor-pointer transition-all duration-200 relative group hover:bg-gray-800/50 rounded-lg"
                    onClick={() => window.open(video.url, '_blank')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && window.open(video.url, '_blank')}
                  >
                    <div className="flex space-x-4">
                      <div className="relative flex-shrink-0 group">
                        {/* Thumbnail Container */}
                        <div className="relative w-48 aspect-video overflow-hidden rounded-xl bg-gray-800">
                          <img 
                            src={video.thumbnail || FALLBACK_THUMBNAIL} 
                            alt={video.title} 
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null; // Prevent infinite loop
                              target.src = FALLBACK_THUMBNAIL;
                            }}
                          />
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-black/70 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                              <PlayIcon />
                            </div>
                          </div>
                          {/* Duration Badge */}
                          <span className="absolute bottom-1 right-1 bg-black/90 text-white text-xs px-2 py-1 rounded font-medium">
                            {video.duration}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-1" title={video.title}>
                          {video.title}
                        </h3>
                        <p className="text-xs text-gray-400">
                          Downloaded: {new Date(video.downloadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Format buttons container */}
                  <div className="px-4 pb-4 flex gap-2">
                    {/* MP4 Button Group */}
                    <div className="flex-1">
                      <div className="flex h-10 w-full">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleRedownload(video, 'mp4');
                          }}
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-800/80 
                            text-gray-300 rounded-l-md hover:bg-blue-600/20 hover:text-blue-400 
                            transition-all duration-200"
                        >
                          <VideoIcon />
                          <span>MP4</span>
                        </button>
                        {video.formats.mp4 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleOpenFileLocation(video.formats.mp4?.filePath || '');
                            }}
                            className="w-10 bg-gray-800/80 text-gray-400 rounded-r-md border-l border-gray-700/50
                              hover:bg-blue-600/20 hover:text-blue-400 transition-all duration-200
                              flex items-center justify-center"
                            title="Open file location"
                          >
                            <FolderIcon />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* MP3 Button Group */}
                    <div className="flex-1">
                      <div className="flex h-10 w-full">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleRedownload(video, 'mp3');
                          }}
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-800/80 
                            text-gray-300 rounded-l-md hover:bg-green-600/20 hover:text-green-400 
                            transition-all duration-200"
                        >
                          <MusicIcon />
                          <span>MP3</span>
                        </button>
                        {video.formats.mp3 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleOpenFileLocation(video.formats.mp3?.filePath || '');
                            }}
                            className="w-10 bg-gray-800/80 text-gray-400 rounded-r-md border-l border-gray-700/50
                              hover:bg-green-600/20 hover:text-green-400 transition-all duration-200
                              flex items-center justify-center"
                            title="Open file location"
                          >
                            <FolderIcon />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {downloadHistory.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No downloads yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add confirmation dialog */}
        <DeleteConfirmation />
      </div>
    </div>
  );
};

export default App;
