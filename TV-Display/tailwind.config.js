/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'medical-blue': '#0A84FF',
        'medical-blue-dark': '#0061D5',
        'medical-turquoise': '#00E0C3',
        'medical-turquoise-dark': '#00A88F',
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#008B8B',
          900: '#134E4A',
        },
        navy: {
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      backgroundImage: {
        'medical-gradient': 'linear-gradient(135deg, #0061D5 0%, #0A84FF 50%, #00E0C3 100%)',
      }
    },
  },
  plugins: [],
}
