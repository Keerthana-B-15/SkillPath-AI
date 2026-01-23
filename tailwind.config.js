/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          700: '#2B7A78',
          800: '#1f5a58',
          900: '#17403f',
        }
      }
    },
  },
  plugins: [],
}