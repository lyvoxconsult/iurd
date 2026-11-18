/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        md: '0 4px 12px -5px rgba(25, 49, 79, 0.16)',
        lg: '0 8px 20px -10px rgba(25, 49, 79, 0.18)',
        xl: '0 12px 28px -14px rgba(25, 49, 79, 0.16)',
        '2xl': '0 18px 38px -18px rgba(25, 49, 79, 0.18)',
      },
      colors: {
        dark: {
          950: '#f5f8fc',
          900: '#ffffff',
          850: '#f2f6fb',
          800: '#e8eff7',
          700: '#afc1d3',
          600: '#91a9c1',
        },
        slate: {
          100: '#19314f',
          200: '#25415f',
          300: '#385572',
          400: '#405d78',
          500: '#4c667d',
          600: '#556c82',
        },
        amber: {
          200: '#f6ecd4',
          300: '#eedcb0',
          400: '#e0c47c',
          500: '#d1aa52',
          600: '#b9923f',
          700: '#805d20',
          800: '#78591e',
          950: '#f7edda',
          glow: 'rgba(143, 107, 44, 0.12)',
        },
        gold: {
          400: '#e0c47c',
          500: '#d1aa52',
          600: '#b9923f',
          700: '#805d20',
        },
      },
    },
  },
  plugins: [],
};
