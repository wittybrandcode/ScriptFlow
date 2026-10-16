/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        foreground: '#1e293b',
        card: '#ffffff',
        'card-foreground': '#334155',
        primary: '#171717',
        'primary-foreground': '#ffffff',
        secondary: '#f1f5f9',
        'secondary-foreground': '#475569',
        muted: '#f1f5f9',
        'muted-foreground': '#64748b',
        accent: '#f5f5f5',
        'accent-foreground': '#171717',
        destructive: '#ef4444',
        border: '#e2e8f0',
        input: '#e2e8f0',
        ring: '#171717',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        'sm': 'calc(var(--app-radius) * 0.5)',
        'md': 'var(--app-radius)',
        'lg': 'calc(var(--app-radius) * 1.5)',
        'xl': 'calc(var(--app-radius) * 2)',
        '2xl': 'calc(var(--app-radius) * 2.5)',
        '3xl': 'calc(var(--app-radius) * 3)',
        'full': '9999px',
      },
      spacing: {
        'layout-p': 'var(--app-padding)',
        'card-p': 'var(--app-card-p)',
        'form-gap': 'var(--app-gap)',
      },
      fontFamily: {
        sans: ['IBM Plex Sans Arabic', 'Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Courier New', 'Courier', 'monospace'],
      }
    }
  },
  plugins: []
}
