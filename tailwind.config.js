/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fffaf0',
          100: '#feebc8',
          200: '#fbd38d',
          500: '#dd6b20',
          600: '#c05621',
          700: '#9c4221',
        },
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        }
      },
      fontFamily: {
        telugu: ['"Nirmala UI"', '"Noto Sans Telugu"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
