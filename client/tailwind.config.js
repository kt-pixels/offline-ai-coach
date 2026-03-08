/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'system-ui', 'sans-serif']
      },
      colors: {
        panel: {
          950: '#060d1a',
          900: '#0b1425',
          800: '#13213b'
        },
        accent: {
          500: '#28d8c4',
          600: '#1bb4a2'
        },
        linear: {
          500: '#4f8dff',
          600: '#3a6de3'
        }
      },
      boxShadow: {
        glow: '0 20px 45px rgba(2, 12, 30, 0.55)',
        card: '0 12px 30px rgba(4, 12, 24, 0.35)'
      },
      backgroundImage: {
        'shell-gradient':
          'radial-gradient(circle at 20% 10%, rgba(79,141,255,0.14), transparent 35%), radial-gradient(circle at 80% 0%, rgba(40,216,196,0.16), transparent 30%), radial-gradient(circle at 20% 85%, rgba(254,183,73,0.1), transparent 34%)'
      }
    }
  },
  plugins: []
};
