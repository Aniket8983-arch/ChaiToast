/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          750: '#283548',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#080e1a',
        },
        bio:    { DEFAULT: '#22c55e', light: '#bbf7d0', dark: '#15803d' },
        nonbio: { DEFAULT: '#f59e0b', light: '#fde68a', dark: '#b45309' },
        mixed:  { DEFAULT: '#6366f1', light: '#c7d2fe', dark: '#4338ca' },
        danger: { DEFAULT: '#ef4444', light: '#fecaca', dark: '#b91c1c' },
        warn:   { DEFAULT: '#f59e0b', light: '#fde68a', dark: '#b45309' },
        info:   { DEFAULT: '#3b82f6', light: '#bfdbfe', dark: '#1d4ed8' },
        sim:    { DEFAULT: '#a78bfa', light: '#ede9fe', dark: '#6d28d9' },
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':       { transform: 'scale(1.05)', opacity: '0.7' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.3s ease-out',
        'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
