import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FDFBF7",
        surface: "#FFFFFF",
        "surface-warm": "#F9F6F0",
        "surface-card": "#FFFFFF",
        primary: {
          DEFAULT: "#7A1C28", // Maroon / රතු-දුඹුරු
          dark: "#58121B",
          light: "#9A2737",
          50: "#FCF5F6",
          100: "#F7E6E8",
          200: "#EFCFD3",
          500: "#7A1C28",
          600: "#691722",
          700: "#58121B",
          800: "#470E15",
          900: "#360A0F",
        },
        accent: {
          DEFAULT: "#D97706", // Saffron Gold / රන්වන්
          dark: "#B45309",
          light: "#F59E0B",
          50: "#FEF9EE",
          100: "#FDF0D4",
          200: "#FBE0A7",
          500: "#D97706",
          600: "#B45309",
        },
        success: {
          DEFAULT: "#15803D", // Deep Green / පිරිසිදු කොළ
          dark: "#166534",
          light: "#22C55E",
          50: "#F0FDF4",
        },
        tealAccent: {
          DEFAULT: "#0F766E",
          light: "#14B8A6",
          dark: "#115E59",
        },
        border: {
          DEFAULT: "#E5DEC9",
          light: "#F0EBE0",
          dark: "#D4CBB5",
        },
        text: {
          DEFAULT: "#262220",
          secondary: "#57514D",
          muted: "#78716C",
        }
      },
      fontFamily: {
        sinhala: ["'Noto Sans Sinhala'", "'Iskoola Pota'", "sans-serif"],
        serifSinhala: ["'Noto Serif Sinhala'", "serif"],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(122, 28, 40, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'warm-md': '0 4px 6px -1px rgba(122, 28, 40, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'warm-lg': '0 10px 15px -3px rgba(122, 28, 40, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'warm-xl': '0 20px 25px -5px rgba(122, 28, 40, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
export default config;
