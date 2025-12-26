module.exports = {
  darkMode: 'class', // we'll control dark mode via a class on <html>
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'sidama-blue': {
          DEFAULT: '#0b3d91', // deep blue for dark theme accents
          50: '#e9f0fb',
          100: '#cfe0fb',
          200: '#9fb9f5',
        }
      }
    }
  },
  plugins: []
};
