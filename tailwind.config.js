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
        // True vibrant teals and cyans for dark-sky glassmorphism
        teal2:   { 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488' },
        cyan2:   { 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
        sky2:    { 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7' },
        indigo2: { 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1' },
        emerald2:{ 300: '#6ee7b7', 400: '#34d399', 500: '#10b981' },
        // Deep dark slate-cyan tones
        night:   { 50: '#f8fafc', 100: '#e2e8f0', 200: '#e2e8f0', 300: '#cbd5e1', 700: '#0f172a', 800: '#070c14', 900: '#020408' },
        canvas:  '#050d10',
        cream:   '#ffffff',
        sage:    '#06b6d4',
        pebble:  '#e2e8f0',
      },
      boxShadow: {
        glow: '0 16px 40px -14px rgba(6, 182, 212, 0.45)',
        'glow-pink': '0 16px 40px -14px rgba(20, 184, 166, 0.45)',
        soft: '0 18px 50px -18px rgba(0, 0, 0, 0.95)',
        card: '0 12px 36px -14px rgba(0, 0, 0, 0.8)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
        'apple-outer': '22px',
        'apple-card': '14px',
        'apple-inner': '10px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #06b6d4 0%, #14b8a6 50%, #0891b2 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(20,184,166,0.1) 50%, rgba(8,145,178,0.1) 100%)',
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
