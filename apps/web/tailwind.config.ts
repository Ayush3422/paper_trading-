import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}','./lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand:  { DEFAULT: '#00d4a0', dark: '#00b388' },
        gain:   { DEFAULT: '#00d4a0', light: '#00d4a020' },
        loss:   { DEFAULT: '#ff4d4d', light: '#ff4d4d20' },
        surface: { DEFAULT: '#0f0f0f', card: '#161616', border: '#262626' },
      },
      fontFamily: { sans: ['Inter','system-ui','sans-serif'], mono: ['JetBrains Mono','monospace'] },
    },
  },
  plugins: [],
};
export default config;
