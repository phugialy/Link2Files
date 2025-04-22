export interface VideoInfo {
  title: string;
  formats: any[];
  videoDetails: {
    title: string;
    description: string;
    lengthSeconds: string;
    viewCount: string;
    thumbnails?: {
      url: string;
      width: number;
      height: number;
    }[];
  };
}

export interface VideoFormat {
  filePath: string;
  downloadDate: string;
}

export interface DownloadedVideo {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: string;
  downloadDate: string;
  formats: {
    mp3?: VideoFormat;
    mp4?: VideoFormat;
  };
} 