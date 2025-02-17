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
        outfit: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#2D5BFF',
        background: '#F5F7FA',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInScale: {
          '0%': { 
            opacity: '0',
            transform: 'translate(-50%, -50%) scale(0.95)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(1)'
          },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        fadeInScale: 'fadeInScale 0.3s ease-out',
      },
    },
  },
  plugins: [],
}