export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          pitch: "#02040A",
          dark: "#050A14",
          surface: "#08101E",
          surfaceHover: "#0E1C33",
          border: "rgba(0, 242, 254, 0.22)",
          borderGlow: "rgba(0, 242, 254, 0.6)",
          neonCyan: "#00F2FE",
          neonGreen: "#00FF88",
          neonPurple: "#A855F7",
          alertRed: "#FF0055",
          warningAmber: "#FFB800",
          textMuted: "#64748B",
          textLight: "#94A3B8",
          textBright: "#F0FDF4",
        },
        navy: {
          950: "#02040A",
          900: "#050A14",
          800: "#08101E",
          700: "#0E1C33",
        },
        surface: {
          light: "#02040A",
          card: "#08101E",
          border: "rgba(0, 242, 254, 0.22)",
        },
        action: {
          blue: "#00F2FE",
          blueHover: "#00B4D8",
        },
        status: {
          success: "#00FF88",
          successBg: "rgba(0, 255, 136, 0.12)",
          successText: "#00FF88",
          failure: "#FF0055",
          failureBg: "rgba(255, 0, 85, 0.15)",
          failureText: "#FF4D88",
          warning: "#FFB800",
          warningBg: "rgba(255, 184, 0, 0.15)",
          warningText: "#FFC72C",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Courier New", "monospace"],
      },
      boxShadow: {
        "cyber-glow": "0 0 25px rgba(0, 242, 254, 0.35)",
        "cyber-green": "0 0 25px rgba(0, 255, 136, 0.35)",
        "cyber-red": "0 0 25px rgba(255, 0, 85, 0.35)",
        "cyber-card": "0 8px 32px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(0, 242, 254, 0.15)",
      }
    },
  },
  plugins: [],
}
