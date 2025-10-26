module.exports = {
  content: [
    './**/*.php',
    './assets/js/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#121212',
        monte: '#222477',
        light: '#fcfaf7',
      },
      fontFamily: {
        sans: ['Overpass', 'sans-serif'],
        calligraphy: ['Tangerine', 'cursive'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
};
