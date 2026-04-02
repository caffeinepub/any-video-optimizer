import type { VideoFile } from "@/App";
import {
  CheckCircle,
  Cpu,
  Film,
  RefreshCw,
  Shield,
  Upload,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface UploadViewProps {
  onFileSelected: (vf: VideoFile) => void;
}

const ACCEPTED_TYPES = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
const ACCEPTED_MIME = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/webm",
  "video/avi",
];
const MAX_SIZE = 1024 * 1024 * 1024;
// Timeout for metadata loading (5 seconds)
const METADATA_TIMEOUT_MS = 5000;

const FEATURES = [
  {
    icon: Shield,
    title: "Metadata Cleaning",
    description:
      "Strip device info, GPS data, and encoding history for privacy-compliant output.",
    color: "oklch(0.54 0.24 264)",
  },
  {
    icon: Cpu,
    title: "Smart Optimization",
    description:
      "Adaptive bitrate and codec selection compress files up to 70% with no visible quality loss.",
    color: "oklch(0.55 0.22 295)",
  },
  {
    icon: RefreshCw,
    title: "Clean Re-Encoding",
    description:
      "Full H.264/H.265 re-encode generates a fresh, platform-compatible output file.",
    color: "oklch(0.62 0.18 145)",
  },
];

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function UploadView({ onFileSelected }: UploadViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (
        !ACCEPTED_MIME.includes(file.type) &&
        !ACCEPTED_TYPES.some((ext) => file.name.toLowerCase().endsWith(ext))
      ) {
        toast.error(
          `Unsupported format. Accepted: ${ACCEPTED_TYPES.join(", ")}`,
        );
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error(
          `File too large (${formatBytes(file.size)}). Max size is 1 GB.`,
        );
        return;
      }

      setIsLoading(true);
      const objectUrl = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = objectUrl;

      // Fallback timeout: if metadata never loads, proceed with zero dimensions
      const timeoutId = setTimeout(() => {
        video.onloadedmetadata = null;
        video.onerror = null;
        onFileSelected({
          file,
          objectUrl,
          name: file.name,
          sizeBytes: file.size,
          duration: 0,
          width: 0,
          height: 0,
        });
        setIsLoading(false);
      }, METADATA_TIMEOUT_MS);

      video.onloadedmetadata = () => {
        clearTimeout(timeoutId);
        onFileSelected({
          file,
          objectUrl,
          name: file.name,
          sizeBytes: file.size,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
        setIsLoading(false);
      };

      video.onerror = () => {
        clearTimeout(timeoutId);
        toast.error("Could not read video metadata. Try another file.");
        URL.revokeObjectURL(objectUrl);
        setIsLoading(false);
      };
    },
    [onFileSelected],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [processFile],
  );

  const handleClick = useCallback(() => {
    if (!isLoading) fileInputRef.current?.click();
  }, [isLoading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !isLoading)
        fileInputRef.current?.click();
    },
    [isLoading],
  );

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-16">
      {/* Hero section */}
      <div className="text-center mb-14">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border mb-6"
          style={{ background: "oklch(0.54 0.24 264 / 0.1)" }}
        >
          <Film
            className="w-3.5 h-3.5"
            style={{ color: "oklch(0.7 0.2 264)" }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: "oklch(0.7 0.2 264)" }}
          >
            Browser-powered video optimization
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-4 leading-tight">
          Optimize Any Video,{" "}
          <span className="gradient-brand-text">Instantly</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          Clean metadata, compress size, and re-encode for any platform — all in
          your browser. No uploads to external servers.
        </p>
      </div>

      {/* Upload zone */}
      <div className="max-w-2xl mx-auto mb-16">
        <button
          type="button"
          aria-label="Upload video file"
          data-ocid="upload.dropzone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={[
            "relative w-full rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer",
            "flex flex-col items-center justify-center gap-4 py-20 px-8",
            isDragging
              ? "border-primary/60 scale-[1.01]"
              : "border-border/60 hover:border-border",
            isLoading ? "pointer-events-none opacity-60" : "",
          ].join(" ")}
          style={{
            background: isDragging
              ? "oklch(0.54 0.24 264 / 0.07)"
              : "oklch(0.115 0.022 265 / 0.6)",
            boxShadow: isDragging
              ? "0 0 40px oklch(0.54 0.24 264 / 0.15)"
              : undefined,
          }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2 transition-all duration-300"
            style={{
              background: isDragging
                ? "linear-gradient(135deg, oklch(0.54 0.24 264 / 0.3), oklch(0.55 0.22 295 / 0.3))"
                : "linear-gradient(135deg, oklch(0.54 0.24 264 / 0.15), oklch(0.55 0.22 295 / 0.15))",
              border: "1px solid oklch(0.22 0.04 265 / 0.5)",
            }}
          >
            {isLoading ? (
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{
                  borderColor:
                    "oklch(0.7 0.2 264) transparent oklch(0.7 0.2 264) oklch(0.7 0.2 264)",
                }}
              />
            ) : (
              <Upload
                className="w-9 h-9 transition-transform duration-300"
                style={{
                  color: isDragging
                    ? "oklch(0.7 0.2 264)"
                    : "oklch(0.6 0.15 264)",
                }}
              />
            )}
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold text-foreground mb-1">
              {isLoading
                ? "Reading video..."
                : isDragging
                  ? "Drop to upload"
                  : "Drop your video here"}
            </p>
            <p className="text-sm text-muted-foreground">
              or{" "}
              <span
                className="underline underline-offset-2"
                style={{ color: "oklch(0.7 0.2 264)" }}
              >
                browse to upload
              </span>
            </p>
          </div>

          {/* Format badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            {ACCEPTED_TYPES.map((ext) => (
              <span
                key={ext}
                className="px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide"
                style={{
                  background: "oklch(0.16 0.024 265)",
                  color: "oklch(0.65 0.08 265)",
                  border: "1px solid oklch(0.22 0.04 265 / 0.5)",
                }}
              >
                {ext}
              </span>
            ))}
          </div>

          <p className="text-xs text-muted-foreground/60">
            Max file size: 1 GB
          </p>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={handleFileChange}
          data-ocid="upload.upload_button"
        />
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {FEATURES.map((feature, i) => (
          <div
            key={feature.title}
            className="card-avo p-6 transition-transform duration-300 hover:-translate-y-0.5"
            data-ocid={`feature.item.${i + 1}`}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{
                background: feature.color.replace(")", " / 0.15)"),
                border: `1px solid ${feature.color.replace(")", " / 0.3)")}`,
              }}
            >
              <feature.icon
                className="w-5 h-5"
                style={{ color: feature.color }}
              />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              {feature.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap gap-6 justify-center mt-12">
        {[
          { icon: CheckCircle, text: "No server uploads" },
          { icon: Shield, text: "Privacy compliant" },
          { icon: Film, text: "MP4, MOV, AVI, MKV, WebM" },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-2">
            <item.icon
              className="w-4 h-4"
              style={{ color: "oklch(0.62 0.18 145)" }}
            />
            <span className="text-xs text-muted-foreground">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
