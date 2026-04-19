/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./thank-you.html",
    "./faqs.html",
    "./insights-intelligence.html",
    "./insights-kpi.html",
    "./insights-market.html",
    "./insights-deal.html",
    "./privacy-policy.html",
    "./terms-condition.html",
    "./app.js",
    // Include any other JS files that dynamically add Tailwind classes
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          navy: '#0f172a',      // slate-900 - Primary dark color
          light: '#f8fafc',     // slate-50 - Primary light background
          orange: '#f97316',    // orange-500 - Primary accent color
          orangeHover: '#ea580c', // orange-600 - Hover state
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
        'infinite-scroll': {
          'from': { transform: 'translateX(0)' },
          'to': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.6s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scroll': 'infinite-scroll 40s linear infinite',
      }
    }
  },
  plugins: [],
}
