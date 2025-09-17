import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
      },
      boxShadow: {
        leaf: '0 0 20px -10px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};

export default config;
