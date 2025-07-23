// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
    
  theme: {
    extend: {
      animation: {
        "gradient-x": "gradient-x 15s ease infinite",
      },
          colors: {
        primary: "#2563EB", // blue-600
        secondary: "#FBBF24", // yellow-400
        accent: "#10B981", //
          },
      keyframes: {
        "gradient-x": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
      },
    },
  },
  plugins: [],
}