import { useState } from 'react';
import { Download, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { FormatToggle } from './FormatToggle';
import InfoModal from './InfoModal';
import { Logo } from './Logo';

interface DownloaderProps {
  onDownload: (url: string, format: 'mp3' | 'mp4') => Promise<void>;
}

const Downloader = ({ onDownload }: DownloaderProps) => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [showInfo, setShowInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      await onDownload(url.trim(), format);
      setUrl('');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to start download. Please try again.');
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto mt-20 p-8 bg-[#0F1729] rounded-2xl shadow-xl border border-gray-800/50">
      {/* Header with Info Button */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-4">
          <div className="group cursor-default transform transition-transform duration-300 hover:scale-105">
            <Logo className="mb-2" showText={true} />
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-900/20 text-yellow-400/90 px-2 py-1 rounded-md border border-yellow-700/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-sm">Personal use only</span>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(true)}
          className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-full transition-colors"
          aria-label="Show information"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="url" className="block text-sm font-medium text-gray-300">
            Enter URL
          </label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste your link here..."
            className="w-full px-4 py-3 bg-[#1C2333] text-white placeholder-gray-400 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Select Format
          </label>
          <FormatToggle value={format} onChange={setFormat} />
        </div>

        <button
          type="submit"
          disabled={!url.trim()}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download
        </button>
      </form>

      {/* Info Modal */}
      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="How to Use Link2File"
        content={
          <div className="space-y-6">
            {/* Legal Disclaimer */}
            <section className="space-y-3 bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <h3 className="text-lg font-semibold text-white">Legal Disclaimer</h3>
              </div>
              <div className="text-gray-300 space-y-3 text-sm">
                <p>
                  This software is provided "as is", without warranty of any kind. By using this tool, you agree to:
                </p>
                <ul className="space-y-2 ml-1">
                  {[
                    'Comply with YouTube\'s terms of service',
                    'Take responsibility for the content you download',
                    'Use downloaded content in accordance with copyright laws'
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-500/70"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Usage Warning */}
            <section className="space-y-3 bg-red-900/20 rounded-lg p-4 border border-red-900/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <h3 className="text-lg font-semibold text-red-400">Personal Use Only</h3>
              </div>
              <p className="text-gray-300 text-sm">
                This tool is intended strictly for personal use. You must ensure you have the right to download any content. The developers are not responsible for any misuse of this software.
              </p>
            </section>

            {/* Quick Guide */}
            <section className="space-y-3 bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h3 className="text-lg font-semibold text-white">Quick Guide</h3>
              </div>
              <ol className="space-y-2 text-sm">
                {[
                  'Copy video URL from YouTube',
                  'Paste URL above',
                  'Select MP4 (video) or MP3 (audio)',
                  'Click Download'
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-medium text-xs flex-shrink-0">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>

            {/* App Limitations */}
            <section className="space-y-3 bg-yellow-900/20 rounded-lg p-4 border border-yellow-900/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">ℹ️</span>
                <h3 className="text-lg font-semibold text-yellow-400">Limitations</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                {[
                  'Maximum video length: 3 hours',
                  'Maximum quality: 1080p for MP4',
                  'Audio quality: up to 320kbps for MP3',
                  'One download at a time'
                ].map((limit) => (
                  <li key={limit} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 mt-2 rounded-full bg-yellow-500/70"></span>
                    {limit}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        }
      />
    </div>
  );
};

export default Downloader; 