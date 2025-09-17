import lineClamp from '@tailwindcss/line-clamp';
import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
      },
      colors: {
        warm: {
          500: '#f97316',
          600: '#ea580c',
        },
        chilly: {
          500: '#38bdf8',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [typography, lineClamp],
} satisfies Config;
