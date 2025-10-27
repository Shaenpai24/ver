/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Checks index.html in the root
    "./src/**/*.{js,ts,jsx,tsx}", // Checks all JS/JSX/TS/TSX files in the src folder and subfolders
  ],
  theme: {
    extend: {
      colors: {
        // Color Hunt Palette - Beautiful Dark Theme
        "dark-navy": "#19183B", // Deep navy background
        "steel-blue": "#708993", // Steel blue for accents
        "mint-green": "#A1C2BD", // Mint green for highlights
        "soft-white": "#E7F2EF", // Soft white for text
        // Theme variations
        "circuit-dark": "#19183B", // Deep navy background
        "navy": "#19183B", // Primary dark background
        "electric-blue": "#708993", // Primary accent - steel blue
        "cyan-accent": "#708993", // Steel blue accent
        "circuit-green": "#A1C2BD", // Mint green for success/highlights
        "neon-green": "#A1C2BD", // Mint green
        "electric-yellow": "#A1C2BD", // Using mint for warnings
        "yellow-accent": "#A1C2BD", // Mint accent
        "soft-text": "#E7F2EF", // Soft white text
        "circuit-gray": "#708993", // Steel blue for surfaces
        "muted-blue": "#708993", // Steel blue surface
        "electric-red": "#FF6B6B", // Error red
        "voltage-purple": "#8B5CF6", // High voltage purple
        "resistor-orange": "#FF6B35", // Resistor orange
        "capacitor-blue": "#3B82F6", // Capacitor blue
        // Enhanced grays for better contrast
        "gray-100": "#f8fafc",
        "gray-200": "#e2e8f0",
        "gray-300": "#cbd5e1",
        "gray-400": "#94a3b8",
        "gray-500": "#64748b",
        "gray-600": "#475569",
        "gray-700": "#334155",
        "gray-800": "#1e293b",
        "gray-900": "#0f172a",
      },
      fontFamily: {
        // Define 'sans' to use Inter as the default sans-serif font
        sans: ["Inter", "sans-serif"],
        mono: ["Source Code Pro", "monospace"], // Keep your code font
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"), // For styling HTML injected via dangerouslySetInnerHTML
  ],
};
