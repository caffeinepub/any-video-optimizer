import type { ViewState } from "@/App";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface HeaderProps {
  currentView: ViewState;
  reachedView: Set<ViewState>;
  onNavigate: (view: ViewState) => void;
}

const NAV_LINKS: { label: string; view: ViewState }[] = [
  { label: "Home", view: "home" },
  { label: "Editor", view: "editor" },
  { label: "Processing", view: "processing" },
  { label: "Download", view: "download" },
];

export default function Header({
  currentView,
  reachedView,
  onNavigate,
}: HeaderProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center"
      style={{
        background: "oklch(0.09 0.02 265 / 0.95)",
        borderBottom: "1px solid oklch(0.22 0.04 265 / 0.4)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-[1280px] mx-auto w-full px-6 flex items-center gap-8">
        {/* Brand */}
        <button
          type="button"
          className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 bg-transparent border-0 p-0"
          onClick={() => onNavigate("home")}
          data-ocid="header.link"
          aria-label="Any Video Optimizer home"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.54 0.24 264), oklch(0.55 0.22 295))",
            }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-base font-bold font-display gradient-brand-text">
              AVO
            </span>
            <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
              Any Video Optimizer
            </span>
          </div>
        </button>

        {/* Nav */}
        <nav
          className="hidden md:flex items-center gap-1 flex-1 justify-center"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => {
            const isActive = currentView === link.view;
            const isReached = reachedView.has(link.view);
            return (
              <button
                key={link.view}
                type="button"
                onClick={() => onNavigate(link.view)}
                disabled={!isReached}
                data-ocid={`nav.${link.view}.link`}
                className={[
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-foreground bg-white/10"
                    : isReached
                      ? "text-muted-foreground hover:text-foreground hover:bg-white/5 cursor-pointer"
                      : "text-muted-foreground/40 cursor-not-allowed",
                ].join(" ")}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          <Button
            size="sm"
            className="text-sm font-semibold text-white border-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.54 0.24 264), oklch(0.55 0.22 295))",
              borderRadius: "9999px",
            }}
            onClick={() => onNavigate("home")}
            data-ocid="header.optimize_now.primary_button"
          >
            Optimize Now
          </Button>
        </div>
      </div>
    </header>
  );
}
