/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: {
          100: "hsl(0, 0%, 97%)",
          200: "hsl(0, 0%, 83%)",
          300: "hsl(0, 0%, 70%)",
          400: "hsl(0, 0%, 58%)",
          500: "hsl(0, 0%, 47%)",
          600: "hsl(0, 0%, 37%)",
          700: "hsl(0, 0%, 26%)",
          800: "hsl(0, 0%, 18%)",
          900: "hsl(0, 0%, 11%)",
          950: "hsl(0, 0%, 9%)",
        },
      },
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
        mono: ["Source Code Pro", ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "normal", letterSpacing: "0.01em" }],
        sm: ["0.8125rem", "1rem"],
        base: ["0.9375rem", "1rem"],
        xl: ["1.125rem", "1"],
        "2xl": ["1.25rem", "1"],
        "3xl": ["1.5rem", "1"],
        "4xl": ["2.25rem", "1"],
      },
      screens: {
        xs: "425px",
      },
    },
  },
  plugins: [require("@tailwindcss/container-queries")],
};
