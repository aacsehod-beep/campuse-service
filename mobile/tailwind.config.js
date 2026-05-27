/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#f0faf4',
        surface: '#ffffff',
        'surface-2': '#e6f4ec',
        border: '#d4e8da',
        foreground: '#182a1e',
        muted: '#73897a',
        primary: {
          DEFAULT: '#0c8a57',
          light: '#e0f5ec',
          foreground: '#ffffff',
        },
        accent: '#209e82',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
