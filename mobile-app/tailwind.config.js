/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './utils/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins_400Regular'],

        poppins: ['Poppins_400Regular'],
        poppinsThin: ['Poppins_100Thin'],
        poppinsExtraLight: ['Poppins_200ExtraLight'],
        poppinsLight: ['Poppins_300Light'],
        poppinsMedium: ['Poppins_500Medium'],
        poppinsSemiBold: ['Poppins_600SemiBold'],
        poppinsBold: ['Poppins_700Bold'],
        poppinsExtraBold: ['Poppins_800ExtraBold'],
        poppinsBlack: ['Poppins_900Black'],

        poppinsItalic: ['Poppins_400Regular_Italic'],
        poppinsBoldItalic: ['Poppins_700Bold_Italic'],

        geologica: ['Geologica_400Regular'],
        geologicaThin: ['Geologica_100Thin'],
        geologicaExtraLight: ['Geologica_200ExtraLight'],
        geologicaLight: ['Geologica_300Light'],
        geologicaMedium: ['Geologica_500Medium'],
        geologicaSemiBold: ['Geologica_600SemiBold'],
        geologicaBold: ['Geologica_700Bold'],
        geologicaExtraBold: ['Geologica_800ExtraBold'],
        geologicaBlack: ['Geologica_900Black'],
      },
      colors: {
        primary: '#807BCF',
        secondary: '#E6E7A3',
        warn: '#ca8a04',
        alert: '#dc2626',
        success: '#16a34a',

        dark: {
          text: '#FFFFFF',
          background: '#000000',
          grayPrimary: '#1F1F1F',
          graySecondary: '#2C2C2C',
          grayTertiary: '#3A3A3A',
          grayText: '#4F4F4F',
          iconActive: '#FFFFFF',
          iconInactive: '#808080',
        },

        light: {
          text: '#000000',
          background: '#FFFFFF',
          grayPrimary: '#E8E8E8',
          graySecondary: '#E0E0E0',
          grayTertiary: '#CFCFCF',
          grayText: '#4F4F4F',
          iconActive: '#E6E7A3',
          iconInactive: '#C7C7C7',
        },
      },
    },
  },
}
