/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    borderRadius: {
      DEFAULT: '0px',
      'none': '0px',
      'sm': '0px',
      'md': '0px',
      'lg': '0px',
      'xl': '0px',
      '2xl': '0px',
      '3xl': '0px',
      'full': '9999px',
    },
    extend: {
      colors: {
        background: '#f8fafc',
        foreground: '#1e293b',
        card: '#ffffff',
        'card-foreground': '#334155',
        primary: {
          DEFAULT: '#171717',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#f1f5f9',
          foreground: '#475569',
        },
        muted: {
          DEFAULT: '#f1f5f9',
          foreground: '#64748b',
        },
        accent: {
          DEFAULT: '#f5f5f5',
          foreground: '#171717',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        border: '#e2e8f0',
        input: '#e2e8f0',
        ring: '#171717',
      },
      spacing: {
        'layout-p': 'var(--app-padding, 1.5rem)',
        'card-p': 'var(--app-card-p, 1.25rem)',
        'form-gap': 'var(--app-gap, 1rem)',
      },
      fontFamily: {
        sans: ['IBM Plex Sans Arabic', 'Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Courier New', 'Courier', 'monospace'],
      }
    }
  },
  plugins: []
}
