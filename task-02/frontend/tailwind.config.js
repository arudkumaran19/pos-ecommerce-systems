/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        app: {
          bg: '#080A0F',
          surface: '#10131A',
          'surface-elevated': '#151922',
          border: '#242A35',
          'border-subtle': '#1C222C',
          text: '#F5F3EE',
          'text-secondary': '#A5ABB5',
          'text-muted': '#6F7682',
          accent: '#4FB7A5',
          'accent-hover': '#429E8E',
          'accent-subtle': '#132824',
        },
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        'card': '0 4px 12px -2px rgba(0, 0, 0, 0.4)',
        'dropdown': '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
}
