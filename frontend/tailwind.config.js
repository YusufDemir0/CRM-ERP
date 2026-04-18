/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4d44e3',
          dim: '#4034d7',
          glow: 'rgba(77, 68, 227, 0.1)',
        },
        surface: {
          DEFAULT: '#ffffff',
          container: '#eff4ff',
          low: '#f1f5f9',
          highest: '#d2e4ff',
        },
        'on-surface': '#00345e',
        'on-surface-variant': '#26619d',
        'inverse-surface': '#000f21',
        success: '#10b981',
        danger: '#9e3f4e',
        warning: '#f59e0b',
        accent: {
          amber: '#f59e0b',
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      boxShadow: {
        'premium': '0 4px 12px rgba(0, 52, 94, 0.03), 0 1px 3px rgba(0, 52, 94, 0.02)',
        'soft': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.02)',
      },
      zIndex: {
        'dropdown': '30',
        'header':   '40',
        'modal':    '50',
        'toast':    '60',
        'tooltip':  '70',
        'loader':   '9999',
      },
    },
  },
  plugins: [],
}
