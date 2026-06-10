import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.tsx",
    "./resources/**/*.jsx",
    "./resources/**/*.vue",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        // Brand tokens
        primary: '#00491e',   // dark green
        secondary: '#ffc600', // golden yellow

        // Dark-green scale centered on the brand color (#00491e at 700)
        green: {
          50: '#e6f0ea',
          100: '#c2dccb',
          200: '#9bc7ab',
          300: '#6fae86',
          400: '#3f8d5b',
          500: '#1a6e3a',
          600: '#0a5c2e',
          700: '#00491e',
          800: '#003a18',
          900: '#002b12',
          950: '#001b0b',
        },

        // Golden-yellow scale centered on the brand color (#ffc600 at 400)
        yellow: {
          50: '#fff9e6',
          100: '#fff0bf',
          200: '#ffe680',
          300: '#ffd633',
          400: '#ffc600',
          500: '#e6b300',
          600: '#cc9f00',
          700: '#a37e00',
          800: '#7a5e00',
          900: '#523f00',
          950: '#2e2300',
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: true,
  },
}
