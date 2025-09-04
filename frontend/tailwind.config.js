/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff9e6",
          100: "#ffefb3",
          200: "#ffe380",
          300: "#ffd94d",
          400: "#ffd01a",
          500: "#e6b800",
          600: "#b38f00",
          700: "#806700",
          800: "#4d3e00",
          900: "#1a1600",
        }
      }
    },
  },
  plugins: [],
}
