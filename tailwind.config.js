/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#79BDE9',
          50: '#EBF7FC',
          100: '#D6EFF9',
          200: '#AEDFF3',
          400: '#4AA8E0',
        },
        background: '#FFFFFF',
        border: '#E2E8F0',
        gray: {
          850: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
