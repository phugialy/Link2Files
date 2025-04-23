import { X } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal = ({ isOpen, onClose }: InfoModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="min-h-screen px-4 text-center">
        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block w-full max-w-4xl p-6 sm:p-8 my-8 text-left align-middle transition-all transform bg-background border shadow-xl rounded-xl">
          {/* Header */}
          <div className="flex flex-col space-y-2 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                About Local Downloader
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-base text-muted-foreground">
              A modern, secure way to download content for offline use
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20 scrollbar-track-transparent">
            {/* Usage Warning */}
            <section className="space-y-3 bg-destructive/5 rounded-lg p-4 border border-destructive/20">
              <div className="flex items-center space-x-2">
                <span className="text-xl">⚠️</span>
                <h3 className="text-lg font-semibold text-destructive">Important Usage Warning</h3>
              </div>
              <div className="text-base text-muted-foreground space-y-2">
                <p>This tool is intended for:</p>
                <ul className="list-none space-y-2">
                  {['Personal use only', 'Downloading content you have the right to access', 'Creating offline backups of permitted content'].map((item) => (
                    <li key={item} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive/70"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Legal Disclaimer */}
            <section className="space-y-3 bg-card rounded-lg p-4 border">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📜</span>
                <h3 className="text-lg font-semibold">Legal Disclaimer</h3>
              </div>
              <div className="text-base text-muted-foreground space-y-3">
                <p>
                  This software is provided "as is", without warranty of any kind. Users are responsible for:
                </p>
                <ul className="list-none space-y-2">
                  {[
                    'Ensuring they have the right to download content',
                    'Complying with all applicable laws and terms of service',
                    'Using downloaded content in accordance with copyright laws'
                  ].map((item) => (
                    <li key={item} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 mt-2 rounded-full bg-primary"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-destructive font-medium bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                  The developers are not responsible for misuse of this software.
                </p>
              </div>
            </section>

            {/* How to Use */}
            <section className="space-y-3 bg-card rounded-lg p-4 border">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🎯</span>
                <h3 className="text-lg font-semibold">How to Use</h3>
              </div>
              <div className="text-base text-muted-foreground">
                <ol className="space-y-4">
                  {[
                    { title: 'Enter URL', desc: 'Paste a valid YouTube video URL in the input field' },
                    { title: 'Choose Format', desc: 'Select your preferred download format (MP3 or MP4)' },
                    { title: 'Download', desc: 'Click the download button and choose where to save the file' },
                    { title: 'Track Progress', desc: 'Monitor the download progress in the progress bar' }
                  ].map((step, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-medium text-sm">
                        {index + 1}
                      </span>
                      <div>
                        <strong>{step.title}:</strong> {step.desc}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* Features */}
            <section className="space-y-3 bg-card rounded-lg p-4 border">
              <div className="flex items-center space-x-2">
                <span className="text-xl">✨</span>
                <h3 className="text-lg font-semibold">Features</h3>
              </div>
              <div className="text-base text-muted-foreground">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Download videos in MP4 format',
                    'Extract audio in MP3 format',
                    'Track download history',
                    'Modern, user-friendly interface',
                    'Progress tracking',
                    'Secure, local downloads'
                  ].map((feature) => (
                    <li key={feature} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg h-11 px-6 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal; 