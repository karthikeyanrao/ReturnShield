/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark theme colors
        background: {
          primary: '#121212',
          card: '#222222',
          input: '#1A1A1A',
        },
        border: {
          default: '#444444',
          input: {
            idle: '#333333',
            focus: '#007DC6',
          },
        },
        text: {
          primary: '#E0E0E0',
          secondary: '#B0B0B0',
          muted: '#7A7A7A',
          cta: '#FFFFFF',
        },
        accent: {
          primary: '#007DC6',
          secondary: '#0097A7',
          hover: '#005A9C',
        },
        status: {
          success: '#76C143',
          warning: '#FFC120',
          alert: '#FF5722',
        },
        overlay: {
          modal: 'rgba(0, 0, 0, 0.75)',
          shadow: 'rgba(0, 0, 0, 0.6)',
        }
      }
    },
  },
  plugins: [],
} 