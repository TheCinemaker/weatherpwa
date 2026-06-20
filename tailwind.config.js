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
        // Olajzöld + zsálya/eukaliptusz akcentek (magas kontraszt)
        teal2:   { 300: '#A7C0A8', 400: '#8AA892', 500: '#5E7A66', 600: '#43574A' },
        cyan2:   { 200: '#C2CBB8', 300: '#A2B29F', 400: '#8FA088', 500: '#7E9580', 600: '#6B8270' },
        sky2:    { 300: '#B3C2A6', 400: '#9DB7A6', 500: '#73876A', 600: '#566E63' },
        indigo2: { 300: '#9DB7A6', 400: '#6E8B7B', 500: '#4F6B5C' },
        emerald2:{ 300: '#A7C0A8', 400: '#8AA892', 500: '#5E7A66' },
        // Olajzöld háttér + törtfehér/kavics-szürke szövegek
        night:   { 50: '#fdfdfb', 100: '#EDEAE0', 200: '#D0C9BC', 300: '#A2B29F', 700: '#2A332A', 800: '#222A20', 900: '#141811' },
        canvas:  '#1E251C',
        cream:   '#F9F9F6',
        sage:    '#A2B29F',
        pebble:  '#D0C9BC',
      },
      boxShadow: {
        glow: '0 16px 40px -14px rgba(110, 139, 123, 0.5)',
        'glow-pink': '0 16px 40px -14px rgba(94, 122, 102, 0.5)',
        soft: '0 18px 50px -18px rgba(0, 0, 0, 0.75)',
        card: '0 12px 36px -14px rgba(0, 0, 0, 0.6)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #8AA892 0%, #6E8B7B 50%, #4F6B5C 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(162,178,159,0.16) 0%, rgba(110,139,123,0.16) 50%, rgba(79,107,92,0.16) 100%)',
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
