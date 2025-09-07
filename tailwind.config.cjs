/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 4px 24px -4px rgba(0,0,0,0.4)'
      },
      fontFamily: {
        sans: ['system-ui','Avenir','Helvetica','Arial','sans-serif']
      }
    },
  },
  plugins: [],
};
