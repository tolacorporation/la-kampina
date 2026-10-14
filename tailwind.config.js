/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#cb6115', // Official signature brand color
          600: '#b44e0b',
          700: '#9a3412',
          800: '#7c2d12',
          900: '#431407',
          950: '#260a04',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        kampina: {
          black: '#12100e',
          dark: '#1a1614',
          charcoal: '#241e1b',
          orange: '#cb6115',
          'orange-vibrant': '#e05e0c',
          'orange-glow': '#f97316',
          'orange-hover': '#b44e0b',
          'amber-gold': '#f59e0b',
          'amber-light': '#fef3c7',
          white: '#ffffff',
          cream: '#faf7f2',
          'cream-soft': '#f5f0e8',
        },
      },
      fontFamily: {
        sans: ['Satoshi', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Clash Display', 'Cabinet Grotesk', 'sans-serif'],
        artisanal: ['Cabinet Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
