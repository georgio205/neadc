/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dc-blue': '#1e3a8a',
        'dc-red': '#dc2626',
        'dc-green': '#059669',
        'dc-yellow': '#d97706',
        'dc-gray': '#374151',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}