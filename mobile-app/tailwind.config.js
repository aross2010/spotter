/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#807BCF',
        secondary: '#E6E7A3',

        dark: {
          text: '#FFFFFF',
          background: '#000000',
          grayPrimary: '#1F1F1F',
          graySecondary: '#2C2C2C',
          grayTertiary: '#3A3A3A',
          iconActive: '#FFFFFF',
          iconInactive: '#808080',
        },

        light: {
          text: '#000000',
          background: '#FFFFFF',
          grayPrimary: '#F5F5F5',
          graySecondary: '#E0E0E0',
          grayTertiary: '#CFCFCF',
          iconActive: '#E6E7A3',
          iconInactive: '#C7C7C7',
        },
      },
    },
  },
  plugins: [],
}
