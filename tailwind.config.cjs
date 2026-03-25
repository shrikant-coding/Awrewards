module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primaryFrom: '#8B5CF6',
        primaryTo: '#EC4899',
        accent: '#06B6D4',
        background: '#0F172A',
        glass: 'rgba(30, 41, 59, 0.4)',
        textPrimary: '#F8FAFC',
        textSecondary: '#94A3B8',
        gold: '#FFD700'
      },
      animation: {
        'button-hover': 'scale 150ms ease',
        'card-flip': 'flip 600ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        'fragment-collect': 'collect 800ms spring',
        'code-reveal': 'reveal 1200ms ease',
        'page-transition': 'fade 300ms ease-in-out',
        'confetti': 'explode 3000ms ease-out'
      },
      keyframes: {
        scale: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' }
        },
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' }
        },
        collect: {
          '0%': { transform: 'scale(1) translateY(0)', opacity: '1' },
          '50%': { transform: 'scale(1.2) translateY(-20px)', opacity: '0.8' },
          '100%': { transform: 'scale(0.8) translateY(-40px)', opacity: '0' }
        },
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        explode: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        }
      },
      backdropBlur: {
        'xs': '2px',
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.1) 2px, transparent 0), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.1) 2px, transparent 0)",
      }
    }
  },
  plugins: []
};