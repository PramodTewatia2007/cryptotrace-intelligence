/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#080D1A',
          card: '#0F172A',
          border: '#1E293B',
          hover: '#1E293B',
          accent: '#06B6D4', // cyan-500
          glow: '#38BDF8',   // sky-400
          gold: '#F59E0B',   // amber-500
          danger: '#EF4444', // red-500
          success: '#10B981',// emerald-500
          muted: '#94A3B8',  // slate-400
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
