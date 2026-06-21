/** @type {import('tailwindcss').Config} */
import tailwindScrollbar from 'tailwind-scrollbar';
import typography from '@tailwindcss/typography';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,astro,html}",
  ],
  theme: {
    extend: {
      fontFamily:{
        'sans': ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [tailwindScrollbar, typography],
};  