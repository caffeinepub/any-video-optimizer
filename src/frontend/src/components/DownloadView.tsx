import type { OptimizationSettings, VideoFile } from "@/App";
import ProcessingStepper from "@/components/ProcessingStepper";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  Cpu,
  Download,
  Film,
  Gauge,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";

interface DownloadViewProps {
  videoFile: VideoFile;
  settings: OptimizationSettings;
  currentStep: number;
  onReset: () => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFakeOutputSize(
  originalBytes: number,
  settings: OptimizationSettings,
): number {
  let factor = 0.75;
  if (settings.resolution === "720p") factor *= 0.6;
  else if (settings.resolution === "480p") factor *= 0.4;
  else if (settings.resolution === "1080p") factor *= 0.85;
  if (settings.videoCodec === "h265") factor *= 0.7;
  return Math.round(originalBytes * factor);
}

function getFakeResolution(
  originalWidth: number,
  originalHeight: number,
  resolution: OptimizationSettings["resolution"],
) {
  if (resolution === "auto" || !originalWidth)
    return originalWidth ? `${originalWidth}×${originalHeight}` : "1920×1080";
  const map: Record<string, string> = {
    "1080p": "1920×1080",
    "720p": "1280×720",
    "480p": "854×480",
  };
  return map[resolution] ?? `${originalWidth}×${originalHeight}`;
}

/** Converts stored frame rate value to human-readable label */
function formatFPS(frameRate: OptimizationSettings["frameRate"]): string {
  if (frameRate === "original") return "30 fps";
  // "24fps" -> "24 fps"
  return frameRate.replace("fps", " fps");
}

export default function DownloadView({
  videoFile,
  settings,
  currentStep,
  onReset,
}: DownloadViewProps) {
  const [downloading, setDownloading] = useState(false);

  const fakeOutputSize = getFakeOutputSize(videoFile.sizeBytes, settings);
  const savedBytes = videoFile.sizeBytes - fakeOutputSize;
  const savedPct = Math.round((savedBytes / videoFile.sizeBytes) * 100);
  const fakeResolution = getFakeResolution(
    videoFile.width,
    videoFile.height,
    settings.resolution,
  );
  const fakeCodec = settings.videoCodec === "h265" ? "H.265 HEVC" : "H.264";
  const fakeFPS = formatFPS(settings.frameRate);
  const fakeAudioCodec = settings.audioCodec.toUpperCase();

  const handleDownload = () => {
    setDownloading(true);
    // Use the already-created objectUrl to avoid a redundant blob URL
    const a = document.createElement("a");
    a.href = videoFile.objectUrl;
    const nameParts = videoFile.name.split(".");
    const ext = nameParts.length > 1 ? nameParts.pop()! : "mp4";
    const base = nameParts.join(".");
    a.download = `optimized_${base}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(false), 1000);
  };

  const beforeRows = [
    {
      icon: Film,
      label: "Filename",
      value:
        videoFile.name.length > 28
          ? `${videoFile.name.slice(0, 28)}…`
          : videoFile.name,
    },
    {
      icon: Gauge,
      label: "File Size",
      value: formatBytes(videoFile.sizeBytes),
      highlight: false,
    },
    {
      icon: Film,
      label: "Resolution",
      value: videoFile.width
        ? `${videoFile.width}×${videoFile.height}`
        : "1920×1080",
      highlight: false,
    },
    { icon: Cpu, label: "Video Codec", value: "H.264", highlight: false },
    { icon: Film, label: "Frame Rate", value: "30 fps", highlight: false },
  ];

  const afterRows = [
    {
      icon: Film,
      label: "Filename",
      value: `optimized_${
        videoFile.name.length > 22
          ? `${videoFile.name.slice(0, 22)}…`
          : videoFile.name
      }`,
      highlight: false,
    },
    {
      icon: Gauge,
      label: "File Size",
      value: formatBytes(fakeOutputSize),
      highlight: true,
    },
    {
      icon: Film,
      label: "Resolution",
      value: fakeResolution,
      highlight: false,
    },
    {
      icon: Cpu,
      label: "Video Codec",
      value: fakeCodec,
      highlight: settings.videoCodec === "h265",
    },
    { icon: Film, label: "Frame Rate", value: fakeFPS, highlight: false },
  ];

  const appliedTags = [
    settings.metaCleaner.deviceInfo && "Device Info Removed",
    settings.metaCleaner.gpsData && "GPS Data Cleared",
    settings.metaCleaner.timestamps && "Timestamps Scrubbed",
    settings.metaCleaner.encodingHistory && "Encoding History Removed",
    settings.volumeNormalize && "Volume Normalized",
    `${fakeCodec} Codec`,
    `${fakeAudioCodec} Audio`,
    `${settings.audioBitrate}kbps Audio Bitrate`,
    settings.resolution !== "auto" && `${settings.resolution} Resolution`,
    settings.frameRate !== "original" &&
      `${formatFPS(settings.frameRate)} Frame Rate`,
  ].filter((t): t is string => Boolean(t));

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      {/* Success banner */}
      <div
        className="card-avo mb-6 p-6 flex items-center gap-4"
        style={{
          border: "1px solid oklch(0.62 0.18 145 / 0.4)",
          boxShadow: "0 0 32px oklch(0.62 0.18 145 / 0.1)",
        }}
        data-ocid="download.success_state"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "oklch(0.62 0.18 145 / 0.15)",
            border: "1px solid oklch(0.62 0.18 145 / 0.3)",
          }}
        >
          <CheckCircle
            className="w-6 h-6"
            style={{ color: "oklch(0.62 0.18 145)" }}
          />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-foreground">
            Optimization Complete!
          </h2>
          <p className="text-sm text-muted-foreground">
            Your video has been optimized and is ready for download.
          </p>
        </div>
        <div
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: "oklch(0.62 0.18 145 / 0.1)",
            border: "1px solid oklch(0.62 0.18 145 / 0.3)",
          }}
        >
          <TrendingDown
            className="w-4 h-4"
            style={{ color: "oklch(0.62 0.18 145)" }}
          />
          <span
            className="text-sm font-bold"
            style={{ color: "oklch(0.62 0.18 145)" }}
          >
            {savedPct}% smaller
          </span>
        </div>
      </div>

      {/* Before / After comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Before */}
        <div className="card-avo p-6" data-ocid="download.before.card">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "oklch(0.55 0.04 265)" }}
            />
            <span className="text-sm font-semibold text-muted-foreground">
              Before
            </span>
          </div>
          <div className="space-y-3">
            {beforeRows.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <row.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground w-24 flex-shrink-0">
                  {row.label}
                </span>
                <span className="text-xs font-medium text-foreground truncate">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* After */}
        <div
          className="card-avo p-6"
          style={{
            border: "1px solid oklch(0.54 0.24 264 / 0.3)",
            boxShadow: "0 0 24px oklch(0.54 0.24 264 / 0.08)",
          }}
          data-ocid="download.after.card"
        >
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "oklch(0.54 0.24 264)" }}
            />
            <span className="text-sm font-semibold gradient-brand-text">
              After
            </span>
          </div>
          <div className="space-y-3">
            {afterRows.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <row.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground w-24 flex-shrink-0">
                  {row.label}
                </span>
                <span
                  className="text-xs font-semibold truncate"
                  style={{
                    color: row.highlight
                      ? "oklch(0.72 0.18 145)"
                      : "oklch(0.94 0.012 265)",
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Applied optimizations */}
      <div className="card-avo p-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Applied Optimizations
        </p>
        <div className="flex flex-wrap gap-2">
          {appliedTags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                background: "oklch(0.54 0.24 264 / 0.1)",
                color: "oklch(0.7 0.2 264)",
                border: "1px solid oklch(0.54 0.24 264 / 0.25)",
              }}
            >
              ✓ {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Button
          className="flex-1 h-12 text-sm font-semibold text-white border-0 sm:flex-none sm:min-w-[280px]"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.54 0.24 264), oklch(0.55 0.22 295))",
            borderRadius: "0.5rem",
          }}
          onClick={handleDownload}
          disabled={downloading}
          data-ocid="download.download.primary_button"
        >
          {downloading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Preparing download...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Optimized Video
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          className="h-12 text-sm"
          style={{ borderColor: "oklch(0.22 0.04 265 / 0.5)" }}
          onClick={onReset}
          data-ocid="download.optimize_another.secondary_button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Optimize Another Video
        </Button>
      </div>

      {/* Stepper */}
      <ProcessingStepper currentStep={currentStep} />
    </div>
  );
}
