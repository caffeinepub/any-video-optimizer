import DownloadView from "@/components/DownloadView";
import EditorView from "@/components/EditorView";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProcessingView from "@/components/ProcessingView";
import UploadView from "@/components/UploadView";
import { Toaster } from "@/components/ui/sonner";
import { useCallback, useState } from "react";

export type ViewState = "home" | "editor" | "processing" | "download";

export interface VideoFile {
  file: File;
  objectUrl: string;
  name: string;
  sizeBytes: number;
  duration: number;
  width: number;
  height: number;
}

export interface OptimizationSettings {
  resolution: "auto" | "1080p" | "720p" | "480p";
  bitrate: "adaptive" | "custom";
  customBitrate: string;
  videoCodec: "h264" | "h265";
  frameRate: "original" | "24fps" | "30fps" | "60fps";
  audioCodec: "aac" | "mp3";
  audioBitrate: "128" | "192" | "320";
  volumeNormalize: boolean;
  metaCleaner: {
    deviceInfo: boolean;
    gpsData: boolean;
    timestamps: boolean;
    encodingHistory: boolean;
  };
}

export const DEFAULT_SETTINGS: OptimizationSettings = {
  resolution: "auto",
  bitrate: "adaptive",
  customBitrate: "",
  videoCodec: "h264",
  frameRate: "original",
  audioCodec: "aac",
  audioBitrate: "192",
  volumeNormalize: true,
  metaCleaner: {
    deviceInfo: true,
    gpsData: true,
    timestamps: true,
    encodingHistory: true,
  },
};

export default function App() {
  const [view, setView] = useState<ViewState>("home");
  const [reachedView, setReachedView] = useState<Set<ViewState>>(
    new Set(["home"]),
  );
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [settings, setSettings] =
    useState<OptimizationSettings>(DEFAULT_SETTINGS);

  const navigateTo = useCallback(
    (target: ViewState) => {
      if (reachedView.has(target)) {
        setView(target);
      }
    },
    [reachedView],
  );

  const handleFileSelected = useCallback((vf: VideoFile) => {
    setVideoFile(vf);
    setReachedView((prev) => new Set([...prev, "editor"]));
    setView("editor");
  }, []);

  const handleStartProcessing = useCallback(() => {
    setReachedView((prev) => new Set([...prev, "processing"]));
    setView("processing");
  }, []);

  const handleProcessingDone = useCallback(() => {
    setReachedView((prev) => new Set([...prev, "download"]));
    setView("download");
  }, []);

  const handleReset = useCallback(() => {
    if (videoFile) {
      URL.revokeObjectURL(videoFile.objectUrl);
    }
    setVideoFile(null);
    setSettings(DEFAULT_SETTINGS);
    setView("home");
    setReachedView(new Set(["home"]));
  }, [videoFile]);

  const viewOrder: ViewState[] = ["home", "editor", "processing", "download"];
  const currentStep = viewOrder.indexOf(view);

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.115 0.022 265)",
            border: "1px solid oklch(0.22 0.04 265 / 0.5)",
            color: "oklch(0.94 0.012 265)",
          },
        }}
      />
      <Header
        currentView={view}
        reachedView={reachedView}
        onNavigate={navigateTo}
      />
      <main className="flex-1 pt-16">
        <div className="animate-fade-in" key={view}>
          {view === "home" && (
            <UploadView onFileSelected={handleFileSelected} />
          )}
          {view === "editor" && videoFile && (
            <EditorView
              videoFile={videoFile}
              settings={settings}
              onSettingsChange={setSettings}
              onStartProcessing={handleStartProcessing}
              currentStep={currentStep}
            />
          )}
          {view === "processing" && videoFile && (
            <ProcessingView
              videoFile={videoFile}
              settings={settings}
              currentStep={currentStep}
              onDone={handleProcessingDone}
            />
          )}
          {view === "download" && videoFile && (
            <DownloadView
              videoFile={videoFile}
              settings={settings}
              currentStep={currentStep}
              onReset={handleReset}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
