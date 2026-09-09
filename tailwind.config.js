/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
    './context/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand backgrounds
        background: '#FAF7F3',
        'background-card': '#FFFFFF',
        'background-subtle': '#FAF6F0',
        'background-hover': '#F5F2EC',
        'background-secondary': '#F1ECE5',

        // Brand dark & text
        dark: '#241E1A',
        'text-primary': '#241E1A',
        'text-secondary': '#8A8177',
        'text-muted': '#A0988E',

        // Brand accent (terracotta)
        primary: '#C2410C',
        'primary-hover': '#A93A0C',
        'primary-light': '#FAF0E4',

        // Status colors
        success: '#5B8C6E',
        'success-light': '#E9F0EB',
        'success-text': '#3D6A50',

        warning: '#E4762B',
        'warning-light': '#FAF0E4',
        'warning-text': '#8A5210',

        error: '#B3261E',
        'error-light': '#FDF2F2',
        'error-text': '#8F1F19',

        // Borders
        border: '#E5E2DD',
        'border-light': '#F0EDE8',
        'border-dark': '#D4CECA',

        // Room / priority status
        'priority-vip': '#8A5210',
        'priority-vip-bg': '#FAF0E4',
        'status-dirty': '#8A8177',
        'status-cleaning': '#E4762B',
        'status-ready': '#5B8C6E',
        'status-problem': '#B3261E',
      },
      fontFamily: {
        // Serif display font (room numbers, headings)
        spectral: ['Spectral_500Medium'],
        // Body / UI sans font
        jost: ['Jost_400Regular'],
        'jost-medium': ['Jost_500Medium'],
        'jost-semibold': ['Jost_600SemiBold'],
      },
    },
  },
  plugins: [],
};
