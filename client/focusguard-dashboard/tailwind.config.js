/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        brand: {
          primary: '#374151',    // gray-700 - main dark
          secondary: '#6b7280',  // gray-500 - secondary
          accent: '#f59e0b',     // amber-500 - accent/highlight
        },
        // Focus/Success States
        focus: {
          high: '#16a34a',       // green-600
          medium: '#ca8a04',     // yellow-600  
          low: '#ea580c',        // orange-600
          poor: '#dc2626',       // red-600
        },
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        nature: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        calm: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },
        // Dawn palette for new landing page
        sage: {
          50: "#f5f7f4",
          100: "#e8ebe6",
          200: "#d1d7cd",
          300: "#a8b5a0",
          400: "#7e9373",
          500: "#5e7757",
          600: "#4a5f44",
          700: "#3c4d38",
          800: "#323f2f",
          900: "#2a3428",
        },
        sand: {
          50: "#faf8f5",
          100: "#f5f1ea",
          200: "#ebe3d5",
          300: "#dccdb5",
          400: "#c8b094",
          500: "#b39677",
          600: "#9a7d5f",
          700: "#7e664e",
          800: "#685442",
          900: "#564639",
        },
        teal: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        // Modern/Productivity palette (blue + mint)
        ocean: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#b9e5fb",
          300: "#7dd0f7",
          400: "#3db3f0",
          500: "#2A6F97",  // Primary blue
          600: "#235a7a",
          700: "#1d4a63",
          800: "#183d52",
          900: "#143244",
        },
        mint: {
          50: "#f0fdf9",
          100: "#ccfbef",
          200: "#99f6e0",
          300: "#5feacb",
          400: "#52B69A",  // Accent mint
          500: "#3d9b80",
          600: "#2f7d67",
          700: "#266554",
          800: "#205145",
          900: "#1a4239",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        glow: "0 0 20px rgba(14, 165, 233, 0.3)",
        nature: "0 0 30px rgba(34, 197, 94, 0.2)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-calm": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "gradient-nature": "linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)",
        "gradient-focus": "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
      },
    },
  },
  plugins: [],
};
