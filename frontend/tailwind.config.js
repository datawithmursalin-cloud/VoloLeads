module.exports = {
  darkMode: 'class',
  content: {
    relative: true,
    files: [
      './*.html',
      './*.js',
      './styles.css'
    ]
  },
  safelist: [
    'hidden',
    'is-flipped',
    'show',
    'opacity-75',
    'cursor-not-allowed',
    'fa-moon',
    'fa-sun',
    'fa-bars',
    'fa-xmark',
    'fa-play',
    'fa-pause',
    'fa-exclamation-triangle'
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        brand: {
          navy: '#0f172a',
          light: '#f8fafc',
          orange: '#f97316',
          orangeHover: '#ea580c',
        }
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        blob: {
          '0%': { transform: 'translate(-50%, -50%) scale(1)' },
          '33%': { transform: 'translate(-50%, -50%) scale(1.1) translate(20px, -30px)' },
          '66%': { transform: 'translate(-50%, -50%) scale(0.9) translate(-20px, 20px)' },
          '100%': { transform: 'translate(-50%, -50%) scale(1)' },
        }
      },
      animation: {
        fadeInUp: 'fadeInUp 0.6s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        blob: 'blob 10s infinite',
      }
    }
  }
};
