/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        textFont: ["Inter", "serif"],
        textFont2: ["Lato", "serif"],
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".hide-scrollbar": {
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
      });
    },
  ],
};
