/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        velocity: {
          bg: '#0B0E11',
          surface: '#14171C',
          surfaceHover: '#1A1E24',
          accent: '#00D1FF',
          accentHover: '#00B8E6',
          text: '#EAEEF1',
          textMuted: '#8A9199',
          border: '#262A30',
        }
      }
    },
  },
  plugins: [],
}
