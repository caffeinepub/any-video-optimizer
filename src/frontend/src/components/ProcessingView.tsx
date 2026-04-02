import type { OptimizationSettings, VideoFile } from "@/App";
import ProcessingStepper from "@/components/ProcessingStepper";
import { Progress } from "@/components/ui/progress";
import { Cpu, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ProcessingViewProps {
  videoFile: VideoFile;
  settings: OptimizationSettings;
  currentStep: number;
  onDone: () => void;
}

const STAGES = [
  { label: "Ingesting File", durationRange: [1500, 2500] as [number, number] },
  {
    label: "Cleaning Metadata",
    durationRange: [1000, 2000] as [number, number],
  },
  {
    label: "Compressing Video",
    durationRange: [2000, 3500] as [number, number],
  },
  {
    label: "Processing Audio",
    durationRange: [1000, 2000] as [number, number],
  },
  { label: "Re-Encoding", durationRange: [2000, 3000] as [number, number] },
  { label: "Finalizing", durationRange: [800, 1500] as [number, number] },
];

function makeFfmpegLogs(
  filename: string,
  codec: string,
  resolution: string,
): string[] {
  const codecStr = codec === "h265" ? "hevc" : "h264";
  const resMap: Record<string, string> = {
    auto: "1920x1080",
    "1080p": "1920x1080",
    "720p": "1280x720",
    "480p": "854x480",
  };
  const resStr = resMap[resolution] ?? "1920x1080";
  const mins = Math.floor(Math.random() * 9 + 1);
  const secs = String(Math.floor(Math.random() * 60)).padStart(2, "0");
  return [
    "ffmpeg version 6.0 Copyright (c) 2000-2023 the FFmpeg developers",
    "  built with gcc 12.2.0 (GCC)",
    "  libavcodec    60.3.100",
    "  libavformat   60.3.100",
    "  libswscale    7.1.100",
    `Input #0, mov,mp4,m4a,3gp,3g2,mj2, from '${filename}':`,
    "  Metadata:",
    "    creation_time: [scrubbing...]",
    "    encoder: [scrubbing...]",
    `  Duration: 00:0${mins}:${secs}.00`,
    `    Stream #0:0(und): Video: h264 (High), yuv420p, ${resStr}, 30 fps`,
    "    Stream #0:1(und): Audio: aac, 44100 Hz, stereo, 192 kb/s",
    "[metadata] Stripping EXIF and container metadata...",
    "[metadata] GPS data removed.",
    "[metadata] Device tags cleared.",
    `[scale] Applying resolution filter: scale=${resStr}`,
    `[vf] fps=30, scale=${resStr}:flags=lanczos`,
    `Output #0, mp4, to 'optimized_${filename}':`,
    `    Stream #0:0: Video: ${codecStr}, yuv420p, ${resStr}, 30 fps`,
    "    Stream #0:1: Audio: aac, 44100 Hz, stereo, 192 kb/s",
    "frame=  120 fps= 24.0 q=28.0 size=    512kB time=00:00:04.00 bitrate= 1048.6kbits/s speed=0.80x",
    "frame=  342 fps= 28.0 q=23.0 size=   1536kB time=00:00:11.40 bitrate= 1103.2kbits/s speed=0.93x",
    "frame=  681 fps= 31.2 q=22.5 size=   3072kB time=00:00:22.70 bitrate= 1109.4kbits/s speed=1.04x",
    "frame= 1024 fps= 29.7 q=23.1 size=   4608kB time=00:00:34.13 bitrate= 1107.1kbits/s speed=0.99x",
    "frame= 1440 fps= 30.1 q=22.8 size=   6400kB time=00:00:48.00 bitrate= 1096.0kbits/s speed=1.00x",
    "[audio] Volume normalization pass 1...",
    "[audio] Mean volume: -18.3 dB  Max volume: -1.2 dB",
    "[audio] Applying normalization gain: +2.3 dB",
    "frame= 1800 fps= 30.0 q=22.0 size=   8012kB time=01:00:00.00 bitrate= 1098.2kbits/s speed=1.00x",
    "video:7892kB audio:654kB subtitle:0kB other streams:0kB global headers:0kB muxing overhead: 0.05%",
    `[encode] ${codec === "h265" ? "H.265 HEVC" : "H.264"} encoding complete. CRF=23`,
    "[output] Writing moov atom...",
    `[output] File finalized: optimized_${filename}`,
  ];
}

export default function ProcessingView({
  videoFile,
  settings,
  currentStep,
  onDone,
}: ProcessingViewProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(12);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Stable ref to onDone so the interval closure always has the latest callback
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Generate log lines once using initial prop values stored in a ref.
  // Using a ref avoids biome exhaustive-deps complaints while guaranteeing
  // the array is only created on the first render.
  const ffmpegLogsRef = useRef<string[]>([]);
  if (ffmpegLogsRef.current.length === 0) {
    ffmpegLogsRef.current = makeFfmpegLogs(
      videoFile.name,
      settings.videoCodec,
      settings.resolution,
    );
  }

  useEffect(() => {
    const ffmpegLogs = ffmpegLogsRef.current;
    // Each effect invocation gets its own cancel flag
    let cancelled = false;
    let logIndex = 0;

    const addLogLine = () => {
      if (logIndex < ffmpegLogs.length) {
        const line = ffmpegLogs[logIndex];
        logIndex += 1;
        setLogLines((prev) => [...prev, line]);
      }
    };

    const flushRemainingLogs = () => {
      const remaining = ffmpegLogs.slice(logIndex);
      if (remaining.length > 0) {
        setLogLines((prev) => [...prev, ...remaining]);
        logIndex = ffmpegLogs.length;
      }
    };

    const runStage = (idx: number) => {
      if (cancelled) return;
      if (idx >= STAGES.length) {
        flushRemainingLogs();
        setDone(true);
        setOverallProgress(100);
        setTimeRemaining(0);
        setTimeout(() => {
          if (!cancelled) onDoneRef.current();
        }, 800);
        return;
      }

      setStageIndex(idx);
      setStageProgress(0);

      const [min, max] = STAGES[idx].durationRange;
      const duration = min + Math.random() * (max - min);
      const stepMs = 80;
      const totalSteps = Math.ceil(duration / stepMs);
      let step = 0;
      // Spread log output evenly across the stage
      const logEvery = Math.max(1, Math.floor(totalSteps / 5));

      const interval = setInterval(() => {
        if (cancelled) {
          clearInterval(interval);
          return;
        }
        step += 1;
        const pct = Math.min(100, (step / totalSteps) * 100);
        setStageProgress(pct);

        const newOverall = Math.min(
          100,
          ((idx + pct / 100) / STAGES.length) * 100,
        );
        setOverallProgress(newOverall);

        const pctDone = (idx + pct / 100) / STAGES.length;
        setTimeRemaining(Math.max(0, Math.round(12 * (1 - pctDone))));

        if (step % logEvery === 0) addLogLine();

        if (pct >= 100) {
          clearInterval(interval);
          setTimeout(() => runStage(idx + 1), 300);
        }
      }, stepMs);
    };

    runStage(0);

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll the terminal log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  });

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      {/* Stage header */}
      <div className="card-avo-glow p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.54 0.24 264 / 0.2), oklch(0.55 0.22 295 / 0.2))",
              border: "1px solid oklch(0.54 0.24 264 / 0.4)",
            }}
          >
            <Cpu className="w-5 h-5" style={{ color: "oklch(0.7 0.2 264)" }} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Processing Video
            </h2>
            <p className="text-xs text-muted-foreground">{videoFile.name}</p>
          </div>
          <div className="ml-auto text-right">
            <span className="text-2xl font-bold font-display gradient-brand-text">
              {Math.round(overallProgress)}%
            </span>
            <p className="text-xs text-muted-foreground">
              {done ? "Complete!" : `~${timeRemaining}s remaining`}
            </p>
          </div>
        </div>

        {/* Overall progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Overall Progress
            </span>
            <span className="text-xs font-medium text-foreground">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <Progress
            value={overallProgress}
            className="h-2"
            data-ocid="processing.overall_progress.loading_state"
          />
        </div>

        {/* Stage pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {STAGES.map((stageItem, i) => {
            const isActive = i === stageIndex && !done;
            const isDoneStage = i < stageIndex || done;
            return (
              <div
                key={stageItem.label}
                data-ocid={`processing.stage.item.${i + 1}`}
                className="rounded-lg p-2.5 text-center transition-all duration-300"
                style={{
                  background: isDoneStage
                    ? "oklch(0.62 0.18 145 / 0.1)"
                    : isActive
                      ? "oklch(0.54 0.24 264 / 0.1)"
                      : "oklch(0.095 0.02 265)",
                  border: isDoneStage
                    ? "1px solid oklch(0.62 0.18 145 / 0.3)"
                    : isActive
                      ? "1px solid oklch(0.54 0.24 264 / 0.4)"
                      : "1px solid oklch(0.22 0.04 265 / 0.3)",
                }}
              >
                <p
                  className="text-[10px] font-medium"
                  style={{
                    color: isDoneStage
                      ? "oklch(0.62 0.18 145)"
                      : isActive
                        ? "oklch(0.7 0.2 264)"
                        : "oklch(0.45 0.04 265)",
                  }}
                >
                  {isDoneStage ? "✓ " : isActive ? "⟳ " : ""}
                  {stageItem.label}
                </p>
                {isActive && (
                  <div
                    className="mt-1.5 h-1 rounded-full overflow-hidden"
                    style={{ background: "oklch(0.16 0.024 265)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${stageProgress}%`,
                        background:
                          "linear-gradient(90deg, oklch(0.54 0.24 264), oklch(0.55 0.22 295))",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal log */}
      <div className="card-avo mb-5">
        <div
          className="px-5 py-3 flex items-center gap-2 border-b"
          style={{ borderColor: "oklch(0.22 0.04 265 / 0.4)" }}
        >
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            FFmpeg Output
          </span>
          <div className="ml-auto flex gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "oklch(0.62 0.18 145)" }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse-glow"
              style={{
                background: done
                  ? "oklch(0.62 0.18 145)"
                  : "oklch(0.7 0.2 264)",
              }}
            />
          </div>
        </div>
        <div
          ref={logRef}
          className="p-4 h-64 overflow-y-auto scrollbar-thin font-mono text-xs"
          style={{ background: "oklch(0.065 0.015 265)" }}
          data-ocid="processing.terminal.panel"
        >
          {logLines.map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: log lines are append-only, index is stable
            <div key={i} className="leading-relaxed">
              <span
                style={{
                  color: line.startsWith("frame=")
                    ? "oklch(0.7 0.2 264)"
                    : line.startsWith("[metadata]")
                      ? "oklch(0.72 0.18 145)"
                      : line.startsWith("[audio]")
                        ? "oklch(0.7 0.18 295)"
                        : line.startsWith("[output]")
                          ? "oklch(0.72 0.18 145)"
                          : line.startsWith("  ")
                            ? "oklch(0.45 0.04 265)"
                            : "oklch(0.65 0.04 265)",
                }}
              >
                {line}
              </span>
            </div>
          ))}
          {!done && (
            <span
              className="inline-block w-2 h-3 ml-0.5 align-middle animate-terminal-blink"
              style={{ background: "oklch(0.7 0.2 264)" }}
            />
          )}
        </div>
      </div>

      {/* Stepper */}
      <ProcessingStepper currentStep={currentStep} />
    </div>
  );
}
