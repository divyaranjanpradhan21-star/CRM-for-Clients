/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        login: {
          dark: '#0f1013',
          card: '#191a1e',
          border: '#2a2b32',
          input: '#121316',
          blue: '#2c6bf5',
          'blue-dark': '#1d4ed8',
          berry: '#f43f5e',
          leaf: '#10b981',
        },
        dash: {
          bg: '#f6ede3',
          espresso: '#1d1713',
          card: '#fffbf6',
          border: '#e4d3c1',
          amber: '#df7e26',
          'amber-dark': '#b95b16',
          terracotta: '#c9641f',
          caramel: '#e38d38',
          sand: '#efa85d',
          peach: '#f7caa0',
          wheat: '#fae8d4',
          cream: '#fff8f0',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
