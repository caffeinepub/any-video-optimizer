import { Check, Cpu, Download, Settings, Upload } from "lucide-react";

interface ProcessingStepperProps {
  currentStep: number;
}

const STEPS = [
  { icon: Upload, label: "Upload" },
  { icon: Settings, label: "Configure" },
  { icon: Cpu, label: "Process" },
  { icon: Download, label: "Download" },
];

export default function ProcessingStepper({
  currentStep,
}: ProcessingStepperProps) {
  return (
    <div className="card-avo p-5" data-ocid="stepper.panel">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        Processing Steps
      </p>
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          return (
            <div
              key={step.label}
              className="flex items-center flex-1 last:flex-none"
            >
              {/* Step circle */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0"
                  style={{
                    background: isDone
                      ? "oklch(0.62 0.18 145)"
                      : isActive
                        ? "linear-gradient(135deg, oklch(0.54 0.24 264), oklch(0.55 0.22 295))"
                        : "oklch(0.16 0.024 265)",
                    border: isDone
                      ? "1px solid oklch(0.62 0.18 145)"
                      : isActive
                        ? "1px solid oklch(0.54 0.24 264 / 0.5)"
                        : "1px solid oklch(0.22 0.04 265 / 0.5)",
                    boxShadow: isActive
                      ? "0 0 16px oklch(0.54 0.24 264 / 0.3)"
                      : undefined,
                  }}
                  data-ocid={`stepper.step.item.${i + 1}`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <step.icon
                      className="w-4 h-4"
                      style={{
                        color: isActive ? "white" : "oklch(0.45 0.04 265)",
                      }}
                    />
                  )}
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: isDone
                      ? "oklch(0.62 0.18 145)"
                      : isActive
                        ? "oklch(0.7 0.2 264)"
                        : "oklch(0.45 0.04 265)",
                  }}
                >
                  {step.label}
                </span>
              </div>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-px mx-2 mb-5 transition-all duration-500"
                  style={{
                    background: isDone
                      ? "linear-gradient(90deg, oklch(0.62 0.18 145), oklch(0.54 0.24 264))"
                      : "oklch(0.22 0.04 265 / 0.5)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
