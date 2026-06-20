/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Egyetlen, kidolgozott téma — nincs sötét mód.
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Élénk gradiens-paletta (lila → magenta → narancs)
        grape:   { 400: '#a855f7', 500: '#9333ea', 600: '#7c3aed', 700: '#6d28d9' },
        candy:   { 400: '#f472b6', 500: '#ec4899', 600: '#db2777' },
        magenta: { 400: '#e879f9', 500: '#d946ef', 600: '#c026d3' },
        sunset:  { 400: '#fb923c', 500: '#f97316', 600: '#ea580c' },
        sky2:    { 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7' },
        ink:     { 700: '#3b2a5a', 800: '#2a1f45', 900: '#1d1235' },
        canvas:  '#f6f2ff',
      },
      boxShadow: {
        glow: '0 20px 45px -15px rgba(124, 58, 237, 0.45)',
        'glow-pink': '0 20px 45px -15px rgba(217, 70, 239, 0.45)',
        soft: '0 10px 40px -12px rgba(45, 27, 78, 0.18)',
        card: '0 8px 30px -10px rgba(45, 27, 78, 0.14)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7c3aed 0%, #d946ef 50%, #fb923c 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(217,70,239,0.12) 50%, rgba(251,146,60,0.12) 100%)',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 25px) scale(0.95)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        blob: 'blob 14s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
