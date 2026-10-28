/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        // Light theme
        canvas: '#F5F6F8',
        surface: '#FFFFFF',
        line: '#E4E6EB',
        ink: '#161A20',
        muted: '#6B7280',
        // Dark theme
        'canvas-dark': '#111111',
        'surface-dark': '#1B1B1B',
        'line-dark': '#303030',
        'ink-dark': '#FFFFFF',
        'muted-dark': '#A0A0A0',
        // Accent: single professional teal, used sparingly
        accent: {
          DEFAULT: '#0EA5A0',
          soft: '#E3F6F4',
          dark: '#3DD9C4'
        },
        danger: '#D14343',
        warn: '#B7791F'
      },
      borderRadius: {
        card: '10px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 20, 24, 0.06), 0 1px 1px rgba(16, 20, 24, 0.04)'
      }
    }
  },
  plugins: []
};
