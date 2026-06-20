/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        wine: {
          50: '#fdf2f2',
          100: '#fce4e4',
          200: '#f9cccc',
          300: '#f3a5a5',
          400: '#eb7070',
          500: '#df4040',
          600: '#cc2424',
          700: '#ab1a1a',
          800: '#8B0000',
          900: '#740a0a',
          950: '#400202',
        },
        champagne: {
          50: '#fcf9ed',
          100: '#f8f0d4',
          200: '#f1dfa4',
          300: '#e9c86d',
          400: '#e0ad3e',
          500: '#D4AF37',
          600: '#b48c23',
          700: '#93691f',
           800: '#785520',
          900: '#65471f',
          950: '#3a260e',
        },
        ink: {
          50: '#f5f5f7',
          100: '#e8e8ec',
          200: '#c9c9d3',
          300: '#9c9cab',
          400: '#6a6a7d',
          500: '#4b4b5e',
          600: '#3a3a4a',
          700: '#2e2e3b',
          800: '#1A1A2E',
          900: '#0f0f1a',
          950: '#08080f',
        }
      },
      fontFamily: {
        sans: ['"Source Han Sans SC"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        serif: ['"Source Han Serif SC"', '"Noto Serif SC"', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'dashboard-gradient': 'linear-gradient(135deg, #0f0f1a 0%, #1A1A2E 50%, #1a0a0a 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(26,26,46,0.9) 0%, rgba(20,20,35,0.95) 100%)',
      },
      boxShadow: {
        'glow-wine': '0 0 20px rgba(139, 0, 0, 0.3)',
        'glow-gold': '0 0 20px rgba(212, 175, 55, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};
