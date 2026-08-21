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
          DEFAULT: 'hsl(var(--primary-raw))',
          dim: 'hsl(var(--primary-dim-raw))',
          glow: 'hsla(var(--primary-raw), 0.1)',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface-raw))',
          container: 'hsl(var(--surface-container-raw))',
          low: 'hsl(var(--surface-container-low-raw))',
          highest: 'hsl(var(--surface-container-highest-raw))',
        },
        'on-surface': 'hsl(var(--on-surface-raw))',
        'on-surface-variant': 'hsl(var(--on-surface-variant-raw))',
        'inverse-surface': 'hsl(var(--inverse-surface-raw))',
        success: 'hsl(161, 84%, 39%)',
        danger: 'hsl(351, 43%, 43%)',
        warning: 'hsl(38, 92%, 50%)',
        accent: {
          amber: 'hsl(38, 92%, 50%)',
        }
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'premium': '0 4px 12px rgba(0, 52, 94, 0.03), 0 1px 3px rgba(0, 52, 94, 0.02)',
        'soft': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.02)',
      },
      zIndex: {
        'dropdown': '30',
        'header':   '40',
        'modal':    '9000',
        'toast':    '9500',
        'tooltip':  '9600',
        'loader':   '9999',
      },
    },
  },
  plugins: [],
}
