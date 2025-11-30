/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zylem: {
          primary: 'var(--zylem-color-primary)',
          'primary-hover': 'var(--zylem-color-primary-hover)',
          'primary-active': 'var(--zylem-color-primary-active)',
          secondary: 'var(--zylem-color-secondary)',
          background: 'var(--zylem-color-background)',
          'background-hover': 'var(--zylem-color-background-hover)',
          'background-active': 'var(--zylem-color-background-active)',
          'background-active-hover': 'var(--zylem-color-background-active-hover)',
          text: 'var(--zylem-color-text)',
          'console-bg': 'var(--zylem-color-console-background)',
          'console-text': 'var(--zylem-color-console-text)',
        },
      },
      fontFamily: {
        zylem: ['var(--zylem-font-family)'],
      },
      borderRadius: {
        zylem: 'var(--zylem-radius)',
      },
      borderWidth: {
        zylem: 'var(--zylem-border)',
      },
    },
  },
  plugins: [],
}
