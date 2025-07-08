/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        'background-primary': '#121212',
        'background-card': '#222222',
        'border-default': '#444444',
        'text-primary': '#E0E0E0',
        'text-secondary': '#B0B0B0',
        'text-muted': '#7A7A7A',
        'accent-primary': '#007DC6',
        'accent-secondary': '#0097A7',
        'hover-blue': '#005A9C',
        'status-success': '#76C143',
        'status-warning': '#FFC120',
        'status-alert': '#FF5722',
        'button-cta-text': '#FFFFFF',
        'background-input': '#1A1A1A',
        'border-input': '#333333',
        'border-input-focus': '#007DC6',
        'overlay-modal': 'rgba(0,0,0,0.75)',
        'shadow-custom': 'rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
} 