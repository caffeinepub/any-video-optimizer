import type { OptimizationSettings, VideoFile } from "@/App";
import ProcessingStepper from "@/components/ProcessingStepper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ChevronRight,
  Clock,
  FileVideo,
  Film,
  FolderOpen,
  HardDrive,
  Settings,
} from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

interface EditorViewProps {
  videoFile: VideoFile;
  settings: OptimizationSettings;
  onSettingsChange: (s: OptimizationSettings) => void;
  onStartProcessing: () => void;
  currentStep: number;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds === 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function EditorView({
  videoFile,
  settings,
  onSettingsChange,
  onStartProcessing,
  currentStep,
}: EditorViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const update = (patch: Partial<OptimizationSettings>) =>
    onSettingsChange({ ...settings, ...patch });

  const updateMeta = (
    key: keyof OptimizationSettings["metaCleaner"],
    val: boolean,
  ) =>
    onSettingsChange({
      ...settings,
      metaCleaner: { ...settings.metaCleaner, [key]: val },
    });

  const handleStartProcessing = () => {
    // Validate custom bitrate if selected
    if (settings.bitrate === "custom") {
      const val = Number(settings.customBitrate);
      if (!settings.customBitrate || Number.isNaN(val) || val <= 0) {
        toast.error("Please enter a valid custom bitrate (e.g. 4000 kbps).");
        return;
      }
    }
    onStartProcessing();
  };

  const resLabel =
    videoFile.width && videoFile.height
      ? `${videoFile.width}×${videoFile.height}`
      : "Unknown";

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      {/* 3-col main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px_56px] gap-5 mb-5">
        {/* LEFT: Video preview */}
        <div className="card-avo-glow flex flex-col overflow-hidden">
          <div
            className="px-5 py-4 flex items-center gap-2 border-b"
            style={{ borderColor: "oklch(0.22 0.04 265 / 0.4)" }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "oklch(0.54 0.24 264)" }}
            />
            <span className="text-sm font-semibold text-foreground">
              Video Preview
            </span>
          </div>
          <div
            className="relative flex-1 flex items-center justify-center"
            style={{ background: "oklch(0.07 0.015 265)" }}
          >
            {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded video, captions not applicable */}
            <video
              ref={videoRef}
              src={videoFile.objectUrl}
              controls
              className="w-full max-h-[380px] object-contain"
              data-ocid="editor.canvas_target"
            />
          </div>
          {/* Metadata strip */}
          <div
            className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t"
            style={{
              borderColor: "oklch(0.22 0.04 265 / 0.4)",
              background: "oklch(0.095 0.02 265)",
            }}
          >
            {[
              {
                icon: FileVideo,
                label: "File",
                value:
                  videoFile.name.length > 20
                    ? `${videoFile.name.slice(0, 20)}…`
                    : videoFile.name,
              },
              {
                icon: HardDrive,
                label: "Size",
                value: formatBytes(videoFile.sizeBytes),
              },
              { icon: Film, label: "Resolution", value: resLabel },
              {
                icon: Clock,
                label: "Duration",
                value: formatDuration(videoFile.duration),
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">
                    {item.label}
                  </p>
                  <p className="text-xs font-medium text-foreground truncate">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE: Settings */}
        <div className="card-avo flex flex-col">
          <div
            className="px-5 py-4 flex items-center gap-2 border-b"
            style={{ borderColor: "oklch(0.22 0.04 265 / 0.4)" }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "oklch(0.55 0.22 295)" }}
            />
            <span className="text-sm font-semibold text-foreground">
              Optimization Settings
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
            {/* Video settings */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Video
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Resolution
                    </Label>
                    <Select
                      value={settings.resolution}
                      onValueChange={(v) =>
                        update({
                          resolution: v as OptimizationSettings["resolution"],
                        })
                      }
                    >
                      <SelectTrigger
                        className="h-8 text-xs"
                        style={{
                          background: "oklch(0.095 0.02 265)",
                          border: "1px solid oklch(0.22 0.04 265 / 0.5)",
                        }}
                        data-ocid="editor.resolution.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="1080p">1080p</SelectItem>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="480p">480p</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Frame Rate
                    </Label>
                    <Select
                      value={settings.frameRate}
                      onValueChange={(v) =>
                        update({
                          frameRate: v as OptimizationSettings["frameRate"],
                        })
                      }
                    >
                      <SelectTrigger
                        className="h-8 text-xs"
                        style={{
                          background: "oklch(0.095 0.02 265)",
                          border: "1px solid oklch(0.22 0.04 265 / 0.5)",
                        }}
                        data-ocid="editor.framerate.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original">Original</SelectItem>
                        <SelectItem value="24fps">24 fps</SelectItem>
                        <SelectItem value="30fps">30 fps</SelectItem>
                        <SelectItem value="60fps">60 fps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Video Codec
                    </Label>
                    <Select
                      value={settings.videoCodec}
                      onValueChange={(v) =>
                        update({
                          videoCodec: v as OptimizationSettings["videoCodec"],
                        })
                      }
                    >
                      <SelectTrigger
                        className="h-8 text-xs"
                        style={{
                          background: "oklch(0.095 0.02 265)",
                          border: "1px solid oklch(0.22 0.04 265 / 0.5)",
                        }}
                        data-ocid="editor.codec.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="h264">H.264</SelectItem>
                        <SelectItem value="h265">H.265 HEVC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Bitrate
                    </Label>
                    <Select
                      value={settings.bitrate}
                      onValueChange={(v) =>
                        update({
                          bitrate: v as OptimizationSettings["bitrate"],
                        })
                      }
                    >
                      <SelectTrigger
                        className="h-8 text-xs"
                        style={{
                          background: "oklch(0.095 0.02 265)",
                          border: "1px solid oklch(0.22 0.04 265 / 0.5)",
                        }}
                        data-ocid="editor.bitrate.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adaptive">Adaptive</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {settings.bitrate === "custom" && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Custom Bitrate (kbps)
                    </Label>
                    <Input
                      type="number"
                      min={100}
                      max={50000}
                      placeholder="e.g. 4000"
                      value={settings.customBitrate}
                      onChange={(e) =>
                        update({ customBitrate: e.target.value })
                      }
                      className="h-8 text-xs"
                      style={{
                        background: "oklch(0.095 0.02 265)",
                        border: "1px solid oklch(0.22 0.04 265 / 0.5)",
                      }}
                      data-ocid="editor.custom_bitrate.input"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Audio */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Audio
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Audio Codec
                    </Label>
                    <Select
                      value={settings.audioCodec}
                      onValueChange={(v) =>
                        update({
                          audioCodec: v as OptimizationSettings["audioCodec"],
                        })
                      }
                    >
                      <SelectTrigger
                        className="h-8 text-xs"
                        style={{
                          background: "oklch(0.095 0.02 265)",
                          border: "1px solid oklch(0.22 0.04 265 / 0.5)",
                        }}
                        data-ocid="editor.audio_codec.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aac">AAC</SelectItem>
                        <SelectItem value="mp3">MP3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Audio Bitrate
                    </Label>
                    <Select
                      value={settings.audioBitrate}
                      onValueChange={(v) =>
                        update({
                          audioBitrate:
                            v as OptimizationSettings["audioBitrate"],
                        })
                      }
                    >
                      <SelectTrigger
                        className="h-8 text-xs"
                        style={{
                          background: "oklch(0.095 0.02 265)",
                          border: "1px solid oklch(0.22 0.04 265 / 0.5)",
                        }}
                        data-ocid="editor.audio_bitrate.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="128">128 kbps</SelectItem>
                        <SelectItem value="192">192 kbps</SelectItem>
                        <SelectItem value="320">320 kbps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <Label
                    className="text-xs text-muted-foreground cursor-pointer"
                    htmlFor="vol-norm"
                  >
                    Volume Normalization
                  </Label>
                  <Switch
                    id="vol-norm"
                    checked={settings.volumeNormalize}
                    onCheckedChange={(v) => update({ volumeNormalize: v })}
                    data-ocid="editor.volume_normalize.switch"
                  />
                </div>
              </div>
            </section>

            {/* Metadata cleaner */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Metadata Cleaner
              </p>
              <div className="space-y-2.5">
                {(
                  [
                    { key: "deviceInfo", label: "Device Information" },
                    { key: "gpsData", label: "GPS / Location Data" },
                    { key: "timestamps", label: "Timestamps" },
                    { key: "encodingHistory", label: "Encoding History" },
                  ] as const
                ).map((item) => (
                  <div key={item.key} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`meta-${item.key}`}
                      checked={settings.metaCleaner[item.key]}
                      onCheckedChange={(v) => updateMeta(item.key, !!v)}
                      data-ocid={`editor.meta_${item.key}.checkbox`}
                    />
                    <Label
                      htmlFor={`meta-${item.key}`}
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Start button */}
          <div
            className="p-5 border-t"
            style={{ borderColor: "oklch(0.22 0.04 265 / 0.4)" }}
          >
            <Button
              className="w-full h-10 text-sm font-semibold text-white border-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.54 0.24 264), oklch(0.55 0.22 295))",
                borderRadius: "0.5rem",
              }}
              onClick={handleStartProcessing}
              data-ocid="editor.start_optimization.primary_button"
            >
              <ChevronRight className="w-4 h-4 mr-1" />
              Start Optimization
            </Button>
          </div>
        </div>

        {/* RIGHT: Narrow sidebar */}
        <div className="card-avo flex flex-col items-center gap-3 py-5 px-2">
          {[
            {
              icon: Settings,
              label: "Metadata",
              active: true,
              ocid: "editor.metadata.button",
            },
            {
              icon: FolderOpen,
              label: "Assets",
              active: false,
              ocid: "editor.assets.button",
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              aria-label={item.label}
              data-ocid={item.ocid}
              className={[
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                item.active
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
              style={
                item.active
                  ? {
                      background:
                        "linear-gradient(135deg, oklch(0.54 0.24 264 / 0.3), oklch(0.55 0.22 295 / 0.3))",
                      border: "1px solid oklch(0.54 0.24 264 / 0.4)",
                    }
                  : undefined
              }
            >
              <item.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Lower section: stepper */}
      <ProcessingStepper currentStep={currentStep} />
    </div>
  );
}
