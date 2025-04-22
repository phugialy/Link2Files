import { useState, useEffect } from 'react'
import { ipcRenderer } from 'electron'

interface VideoInfo {
  title: string;
  formats: any[];
  videoDetails: {
    title: string;
    description: string;
    lengthSeconds: string;
    viewCount: string;
  };
}

const App = () => {
  const [url, setUrl] = useState('')
  const [format, setFormat] = useState('mp4')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)

  useEffect(() => {
    const handleProgress = (_: any, progress: number) => {
      setDownloadProgress(progress);
    };

    ipcRenderer.on('download-progress', handleProgress);

    return () => {
      ipcRenderer.removeListener('download-progress', handleProgress);
    };
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

    try {
      setError(null);
      setIsFetching(true);
      setDownloadProgress(0);

      // Get video info
      console.log('Fetching video info...');
      const info = await ipcRenderer.invoke('get-video-info', url) as VideoInfo;
      console.log('Video info received:', info);
      setVideoInfo(info);
      
      setIsDownloading(true);
      setIsFetching(false);

      // Show save dialog
      const saveResult = await ipcRenderer.invoke('show-save-dialog', {
        defaultPath: `${sanitizeFilename(info.videoDetails.title)}.${format}`
      });

      if (saveResult.canceled || !saveResult.filePath) {
        setIsDownloading(false);
        return;
      }

      console.log('Starting download...');
      // Start download with format
      await ipcRenderer.invoke('download-video', {
        url,
        filePath: saveResult.filePath,
        format
      });

      setUrl('');
      setDownloadProgress(100);
      setVideoInfo(null);
      alert('Download completed successfully!');
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred');
      setVideoInfo(null);
    } finally {
      setIsDownloading(false);
      setIsFetching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-2xl font-bold text-center mb-8">YouTube Video Downloader</h1>
                
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter YouTube URL"
                    value={url}
                    onChange={handleUrlChange}
                    disabled={isDownloading || isFetching}
                    aria-label="YouTube URL input"
                  />
                </div>

                <div className="relative">
                  <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                    Download Format
                  </label>
                  <select
                    id="format"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                  className={`w-full px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    isDownloading || isFetching || !url
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                  aria-label="Download video"
                >
                  {isFetching ? 'Fetching Info...' : isDownloading ? 'Downloading...' : 'Download'}
                </button>

                {videoInfo && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h2 className="font-semibold">{videoInfo.videoDetails.title}</h2>
                    <p className="text-sm text-gray-600 mt-2">
                      Duration: {Math.floor(parseInt(videoInfo.videoDetails.lengthSeconds) / 60)}:{(parseInt(videoInfo.videoDetails.lengthSeconds) % 60).toString().padStart(2, '0')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Views: {parseInt(videoInfo.videoDetails.viewCount).toLocaleString()}
                    </p>
                  </div>
                )}

                {(isDownloading || isFetching) && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${downloadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-center mt-2">{downloadProgress}%</p>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg" role="alert">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
