import { Zap } from "lucide-react";
import { SiGithub, SiX, SiYoutube } from "react-icons/si";

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer
      className="mt-auto border-t py-8"
      style={{
        borderColor: "oklch(0.22 0.04 265 / 0.3)",
        background: "oklch(0.08 0.018 265)",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.54 0.24 264), oklch(0.55 0.22 295))",
              }}
            >
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold font-display gradient-brand-text">
              AVO
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-4" aria-label="Footer navigation">
            {["Features", "FAQ", "Blog", "Support", "Privacy", "Contact"].map(
              (link) => (
                <button
                  key={link}
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 bg-transparent border-0 p-0 cursor-pointer"
                  data-ocid={`footer.${link.toLowerCase()}.link`}
                >
                  {link}
                </button>
              ),
            )}
          </nav>

          {/* Social icons */}
          <div className="flex items-center gap-3 md:ml-auto">
            {[
              { Icon: SiGithub, href: "https://github.com", label: "GitHub" },
              { Icon: SiX, href: "https://x.com", label: "X (Twitter)" },
              {
                Icon: SiYoutube,
                href: "https://youtube.com",
                label: "YouTube",
              },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors duration-200"
                style={{ background: "oklch(0.16 0.024 265)" }}
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>

        <div
          className="mt-6 pt-5 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ borderColor: "oklch(0.22 0.04 265 / 0.2)" }}
        >
          <p className="text-xs text-muted-foreground">
            © {year} Any Video Optimizer. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ using{" "}
            <a
              href={caffeineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors duration-200 underline underline-offset-2"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
